// Fetches portraits for:
// 1. Champions still missing (using originalimage URL to avoid thumbnail 429s)
// 2. All drivers who appear in portrait circles across sections:
//    - 2nd and 3rd place in any race won by a champion (Scene 1 sidebar)
//    - Year-end top-4 contenders per season (Scene 3)
// Run with: node fetch-more-portraits.js

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "images", "drivers");
const ATTR_FILE = path.join(__dirname, "images", "attribution.json");
const DELAY_MS = 8000;

fs.mkdirSync(OUT_DIR, { recursive: true });

function parseCSV(file) {
  const lines = fs.readFileSync(file, "utf8").trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const vals = line.match(/(?:"[^"]*"|[^,])+/g) || [];
    const obj = {};
    headers.forEach((h, i) => (obj[h] = (vals[i] || "").replace(/"/g, "")));
    return obj;
  });
}

function getSubjectDrivers() {
  const races = parseCSV("./data/races.csv");
  const standings = parseCSV("./data/driver_standings.csv");
  const results = parseCSV("./data/results.csv");
  const drivers = parseCSV("./data/drivers.csv");

  const driverById = {};
  drivers.forEach((d) => (driverById[d.driverId] = d));

  // Last race per year
  const racesByYear = {};
  races.forEach((r) => {
    if (!racesByYear[r.year]) racesByYear[r.year] = [];
    racesByYear[r.year].push(r);
  });
  const lastRaceIds = new Set(
    Object.values(racesByYear).map(
      (yr) => yr.sort((a, b) => +b.round - +a.round)[0].raceId
    )
  );

  // Champion driverIds
  const championIds = new Set(
    standings
      .filter((s) => lastRaceIds.has(s.raceId) && +s.position === 1)
      .map((s) => s.driverId)
  );

  const subjectIds = new Set(championIds);

  // Races won by champions
  const championWinRaceIds = new Set(
    results
      .filter((r) => +r.position === 1 && championIds.has(r.driverId))
      .map((r) => r.raceId)
  );

  // 2nd and 3rd in champion-won races (Scene 1 sidebar podiums)
  results
    .filter((r) => championWinRaceIds.has(r.raceId) && (+r.position === 2 || +r.position === 3))
    .forEach((r) => subjectIds.add(r.driverId));

  // Year-end top-4 per season (Scene 3 contenders)
  standings
    .filter((s) => lastRaceIds.has(s.raceId) && +s.position >= 1 && +s.position <= 4)
    .forEach((s) => subjectIds.add(s.driverId));

  console.log(`Subject drivers: ${subjectIds.size} total (${championIds.size} champions + podium/contender drivers)`);

  return [...subjectIds].map((id) => driverById[id]).filter((d) => d && d.url && !d.url.startsWith("\\"));
}

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod
      .get(url, { headers: { "User-Agent": "f1-explorer/1.0 (educational project; github.com/anarseyf/f1-explorer)" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchRaw(res.headers.location).then(resolve).catch(reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      })
      .on("error", reject);
  });
}

async function fetchWithRetry(url, retries = 5) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetchRaw(url);
    if (res.status === 429) {
      const wait = 5000 * (i + 1);
      console.log(`    rate limited, waiting ${wait}ms...`);
      await sleep(wait);
      continue;
    }
    return res;
  }
  return { status: 429, body: Buffer.from("") };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pageTitle(wikipediaUrl) {
  return wikipediaUrl.replace(/.*\/wiki\//, "");
}

function filenameFromImageUrl(url) {
  const m = url.match(/\/([^/]+\.(?:jpg|jpeg|png|webp))(?:\/|$)/i);
  return m ? decodeURIComponent(m[1].replace(/^\d+px-/, "")) : null;
}

async function fetchAttribution(imageUrl) {
  const filename = filenameFromImageUrl(imageUrl);
  if (!filename) return null;

  const apiUrl =
    `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}` +
    `&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;

  const { status, body } = await fetchWithRetry(apiUrl);
  if (status !== 200) return null;

  try {
    const data = JSON.parse(body.toString());
    const pages = data.query?.pages || {};
    const page = Object.values(pages)[0];
    const meta = page?.imageinfo?.[0]?.extmetadata || {};
    return {
      artist: meta.Artist?.value?.replace(/<[^>]+>/g, "").trim() || null,
      license: meta.LicenseShortName?.value || null,
      licenseUrl: meta.LicenseUrl?.value || null,
      source: `https://en.wikipedia.org/wiki/File:${filename}`,
    };
  } catch {
    return null;
  }
}

async function processDriver(driver, attribution, useOriginal = false) {
  const title = decodeURIComponent(pageTitle(driver.url));
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  const { status, body } = await fetchWithRetry(summaryUrl);
  if (status !== 200) {
    console.warn(`  ✗ summary failed (${status}): ${driver.forename} ${driver.surname}`);
    return false;
  }

  const data = JSON.parse(body.toString());
  // Use originalimage for stubborn drivers, thumbnail otherwise
  const imageUrl = useOriginal
    ? (data.originalimage?.source || data.thumbnail?.source)
    : (data.thumbnail?.source || data.originalimage?.source);

  if (!imageUrl) {
    console.warn(`  ✗ no image: ${driver.forename} ${driver.surname}`);
    return false;
  }

  const imgResp = await fetchWithRetry(imageUrl);
  if (imgResp.status !== 200) {
    console.warn(`  ✗ image download failed (${imgResp.status}): ${driver.forename} ${driver.surname}`);
    return false;
  }

  const ext = imageUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
  const outFile = path.join(OUT_DIR, `${driver.driverRef}.${ext}`);
  fs.writeFileSync(outFile, imgResp.body);

  const attr = await fetchAttribution(imageUrl);
  attribution[driver.driverRef] = {
    name: `${driver.forename} ${driver.surname}`,
    file: `images/drivers/${driver.driverRef}.${ext}`,
    wikipediaUrl: driver.url,
    ...(attr || {}),
  };

  console.log(`  ✓ ${driver.forename} ${driver.surname}${attr?.license ? ` (${attr.license})` : ""}`);
  return true;
}

const STUBBORN = new Set(["jones", "scheckter", "hunt", "stewart", "rindt", "hulme", "farina"]);

async function main() {
  const subjects = getSubjectDrivers();

  const attribution = fs.existsSync(ATTR_FILE)
    ? JSON.parse(fs.readFileSync(ATTR_FILE, "utf8"))
    : {};

  let fetched = 0, skipped = 0, failed = 0;

  for (const driver of subjects) {
    const existing = path.join(OUT_DIR, driver.driverRef);
    const alreadyDone = ["jpg", "jpeg", "png", "webp"].some((e) =>
      fs.existsSync(`${existing}.${e}`)
    );
    if (alreadyDone) {
      skipped++;
      continue;
    }

    const useOriginal = STUBBORN.has(driver.driverRef);
    if (useOriginal) console.log(`  [originalimage] ${driver.forename} ${driver.surname}`);

    const ok = await processDriver(driver, attribution, useOriginal);
    if (ok) fetched++; else failed++;

    fs.writeFileSync(ATTR_FILE, JSON.stringify(attribution, null, 2));
    await sleep(DELAY_MS);
  }

  console.log(`\nDone: ${fetched} fetched, ${skipped} skipped, ${failed} failed`);
  console.log(`Attribution saved to images/attribution.json`);
}

main().catch(console.error);
