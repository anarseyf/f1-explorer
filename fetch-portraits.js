// One-off script: downloads Wikipedia portrait thumbnails for all F1 champions.
// Run with: node fetch-portraits.js
// Saves images to images/drivers/{driverRef}.jpg and attribution to images/attribution.json

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "images", "drivers");
const ATTR_FILE = path.join(__dirname, "images", "attribution.json");

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

function getChampions() {
  const races = parseCSV("./data/races.csv");
  const standings = parseCSV("./data/driver_standings.csv");
  const drivers = parseCSV("./data/drivers.csv");

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

  const championIds = new Set(
    standings
      .filter((s) => lastRaceIds.has(s.raceId) && +s.position === 1)
      .map((s) => s.driverId)
  );

  const driverById = {};
  drivers.forEach((d) => (driverById[d.driverId] = d));

  return [...championIds].map((id) => driverById[id]).filter(Boolean);
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

async function fetch(url, retries = 4) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetchRaw(url);
    if (res.status === 429) {
      const wait = 3000 * (i + 1);
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
  // e.g. .../thumb/a/ab/Foo.jpg/320px-Foo.jpg -> Foo.jpg
  const m = url.match(/\/([^/]+\.(?:jpg|jpeg|png|webp))(?:\/|$)/i);
  return m ? decodeURIComponent(m[1].replace(/^\d+px-/, "")) : null;
}

async function fetchAttribution(imageUrl) {
  const filename = filenameFromImageUrl(imageUrl);
  if (!filename) return null;

  const apiUrl =
    `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}` +
    `&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;

  const { status, body } = await fetch(apiUrl);
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

async function processDriver(driver, attribution) {
  const title = pageTitle(driver.url);
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  const { status, body } = await fetch(summaryUrl);
  if (status !== 200) {
    console.warn(`  ✗ summary fetch failed (${status}): ${driver.forename} ${driver.surname}`);
    return;
  }

  const data = JSON.parse(body.toString());
  const imageUrl = data.originalimage?.source || data.thumbnail?.source;
  if (!imageUrl) {
    console.warn(`  ✗ no image found: ${driver.forename} ${driver.surname}`);
    return;
  }

  const imgResp = await fetch(imageUrl);
  if (imgResp.status !== 200) {
    console.warn(`  ✗ image download failed (${imgResp.status}): ${driver.forename} ${driver.surname}`);
    return;
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
}

async function main() {
  const champions = getChampions();
  console.log(`Found ${champions.length} unique champions\n`);

  const attribution = fs.existsSync(ATTR_FILE)
    ? JSON.parse(fs.readFileSync(ATTR_FILE, "utf8"))
    : {};

  for (const driver of champions) {
    const existing = path.join(OUT_DIR, driver.driverRef);
    const alreadyDone = ["jpg", "jpeg", "png", "webp"].some((e) =>
      fs.existsSync(`${existing}.${e}`)
    );
    if (alreadyDone) {
      console.log(`  – skipping ${driver.forename} ${driver.surname} (already downloaded)`);
      continue;
    }

    await processDriver(driver, attribution);
    await sleep(2000);
  }

  fs.writeFileSync(ATTR_FILE, JSON.stringify(attribution, null, 2));
  console.log(`\nAttribution saved to images/attribution.json`);
}

main().catch(console.error);
