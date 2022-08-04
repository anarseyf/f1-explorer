const TextRows = {
  code: true,
  date: true,
  dob: true,
  driverRef: true,
  fastestLapTime: true,
  firstname: true,
  lastname: true,
  name: true,
  nationality: true,
  number: true,
  positionText: true,
  time: true,
  url: true,
};

const Data = {};
const State = {};
const Index = {};

window.onload = async () => {
  await readData();
  computeIndexes();

  const champions = computeChampions();

  const index = Index.DriverByName;
  const drivers = [
    index.get("Michael").get("Schumacher"),
    index.get("Damon").get("Hill"),
    index.get("Jacques").get("Villeneuve"),
    index.get("Mika").get("Häkkinen"),
    index.get("Fernando").get("Alonso"),
    index.get("Kimi").get("Räikkönen"),
    index.get("Lewis").get("Hamilton"),
    index.get("Jenson").get("Button"),
    index.get("Sebastian").get("Vettel"),
    index.get("Nico").get("Rosberg"),
    index.get("Max").get("Verstappen"),
  ];

  const years = [2007, 2008, 2012, 2016, 2021];

  showSceneDescriptions();
  prepareScene1(champions);
  prepareScene2(drivers);
  prepareScene3(years);
  clear();
  // showClearButton();

  const Alonso = Index.DriverByName.get("Fernando").get("Alonso");
  // showDriverCareer(Alonso);

  // showYear(2012);
};

function parseRow(d) {
  const r = {};
  Object.entries(d).forEach(([k, v]) => {
    r[k] = TextRows[k] ? v : +v;
  });
  return r;
}

async function readData() {
  Data.Races = await d3.csv("./data/races.csv", parseRow);
  Data.Drivers = await d3.csv("./data/drivers.csv", parseRow);
  Data.Standings = await d3.csv("./data/driver_standings.csv", parseRow);
  Data.Results = await d3.csv("./data/results.csv", parseRow);
  Data.Constructors = await d3.csv("./data/constructors.csv", parseRow);
}

function computeIndexes() {
  // indexed
  Index.Race = d3.index(Data.Races, (r) => r.raceId);
  Index.Driver = d3.index(Data.Drivers, (d) => d.driverId);
  Index.DriverByName = d3.index(
    Data.Drivers,
    (d) => d.firstname,
    (d) => d.lastname
  );
  Index.Constructor = d3.index(Data.Constructors, (c) => c.constructorId);

  // grouped
  Index.RacesByYear = d3.group(Data.Races, (r) => r.year);
  Index.StandingsByRace = d3.group(Data.Standings, (s) => s.raceId);
  Index.ResultsByRaceByDriver = d3.group(
    Data.Results,
    (r) => r.raceId,
    (r) => r.driverId
  );
}

function computeLastRaceIds() {
  const lastRacesRollup = d3.rollup(Data.Races, lastRace, (d) => d.year);
  const lastRaces = [...lastRacesRollup.values()];

  const lastRaceIds = lastRaces.map((r) => r.raceId);
  return lastRaceIds;
}
function computeYearEndListAtPosition(position) {
  const lastRaceIds = computeLastRaceIds();

  const leaderStandings = Data.Standings.filter((s) => lastRaceIds.includes(s.raceId))
    .filter((s) => s.position === position)
    .map((s) => ({
      ...s,
      year: Index.Race.get(s.raceId).year,
    }));

  const list = leaderStandings.map(({ driverId, year, wins }) => {
    const { firstname, lastname } = Index.Driver.get(driverId);
    return {
      year,
      driverId,
      firstname,
      lastname,
      wins,
    };
  });

  list.sort((a, b) => a.year - b.year);

  // console.log(`Position ${position}:`, list);

  return list;
}

function computeChampions() {
  return computeYearEndListAtPosition(1);
}

function computeDriverForYearAtPosition(year, position) {
  // console.log(`computeDriverForYearAtPosition: ${year}, ${position}`);

  const list = computeYearEndListAtPosition(position);
  const entry = list.find((e) => e.year === year);
  return Index.Driver.get(entry.driverId);
}

function computeWinnersForYear(year) {
  const races = Data.Races.filter((r) => r.year === year);
  const raceIds = races.map((r) => r.raceId);

  // console.log(`${races.length} races in ${year};\n`, races[0]);

  const winners = Data.Results.filter((r) => raceIds.includes(r.raceId))
    .filter((r) => r.position === 1)
    .map(({ raceId, driverId }) => ({
      round: Index.Race.get(raceId).round,
      firstname: Index.Driver.get(driverId).firstname,
      lastname: Index.Driver.get(driverId).lastname,
      raceId,
      driverId,
    }));

  winners.sort((a, b) => a.round - b.round);

  return winners;
}

function computeWinnersByRoundForYear(year) {
  const list = computeWinnersForYear(year);
  return d3.index(list, (e) => e.round);
}

function computeRaceIdsWonBy(driverId, yearMaybe) {
  let list = Data.Results.filter((r) => r.driverId === driverId)
    .filter((r) => r.position === 1)
    .map((r) => r.raceId);

  if (yearMaybe) {
    const raceIdsInYear = Data.Races.filter((r) => r.year === yearMaybe).map((r) => r.raceId);
    list = list.filter((raceId) => raceIdsInYear.includes(raceId));
  }

  const map = {};
  list.forEach((raceId) => {
    map[raceId] = true;
  });
  return map;
}

function computeDriver(driverId, yearRangeMaybe) {
  const lastRaceIds = computeLastRaceIds();

  const driverStandings = Data.Standings.filter((s) => lastRaceIds.includes(s.raceId))
    .filter((s) => s.driverId === driverId)
    .map(({ position, wins, raceId }) => {
      const year = Index.Race.get(raceId).year;

      const constructor = Index.ResultsByRaceByDriver.get(raceId).get(driverId);
      let constructorId = constructor?.[0].constructorId ?? -1;

      if (constructorId === -1) {
        const race = Index.Race.get(raceId);

        constructorId = computeLastResultForDriverInYear(driverId, year)?.constructorId ?? -1;

        console.warn(
          `constructorId for ${nameFn(Index.Driver.get(driverId))} @ ${race.year}/${race.name}:)`,
          constructorId
        );
      }
      return {
        year,
        position,
        wins,
        constructorId,
      };
    });

  driverStandings.sort((a, b) => a.year - b.year);

  const allStandings = fillInMissingYears(driverStandings, yearRangeMaybe);
  // console.log(`driverStandings for ${driverId}:`, driverStandings);

  return allStandings.map((s) => ({ ...s, driverId }));
}

function fillInMissingYears(standings, yearRangeMaybe) {
  const years = standings.map((s) => s.year);
  const [min, max] = yearRangeMaybe || d3.extent(years);
  const allYears = d3.range(min, max + 1);
  const allStandings = allYears.map((year) => {
    const entry = standings.find((s) => s.year === year);
    return entry || { year, position: 0, wins: 0 };
  });
  return allStandings;
}

function computeWinsForDriver(driverId) {
  const wins = Data.Results.filter((r) => r.driverId === driverId)
    .filter((r) => r.position === 1)
    .map((r) => r.raceId);

  return wins;
}

function lastRace(races) {
  const maxRound = Math.max(...races.map((r) => r.round));
  return races.find((r) => r.round === maxRound);
}

function computePointsForDriverAtRace(driverId, raceId) {
  const standing = Index.StandingsByRace.get(raceId).filter((s) => s.driverId === driverId)[0];

  return standing?.points ?? 0;
}

function computePointsForDriverAtRaces(driverId, raceIds) {
  return raceIds.map((raceId) => computePointsForDriverAtRace(driverId, raceId));
}

function computeLastResultForDriverInYear(driverId, year) {
  // In a few cases drivers did not compete in the season's last race. We then look at their results in the last race they competed in to find out their team (constructor).

  const raceIds = Index.RacesByYear.get(year)
    .sort((a, b) => a.round - b.round)
    .map((r) => r.raceId);

  const results = raceIds.map((raceId) => Index.ResultsByRaceByDriver.get(raceId).get(driverId));

  // console.log(
  //   `Results for ${driverId} in ${year}:\n`,
  //   results.map((r) => (r ? r.constructorId : "MISSING"))
  // );

  const known = results.filter(Boolean).map((rr) => (rr.length ? rr[0] : undefined));
  return known[known.length - 1];
}

function computeIntersectionHtml(year, driverId, position) {
  const driver = Index.Driver.get(driverId);
  const name = nameFn(driver);
  const pos = positionHtml(position);

  return `<span class="bright">${name}</span> ${pos} the ${year} championship.`;
}

function computeDriverSummaryHtml(driverId) {
  const driver = Index.Driver.get(driverId);
  const name = nameFn(driver);

  const standings = computeDriver(driverId);
  const raceWinsByYear = standings.map((s) => s.wins);

  const numTitles = standings.filter((s) => s.position === 1).length;
  const numWins = d3.sum(raceWinsByYear);
  const numSeasons = standings.filter((s) => s.position !== 0).length;

  const titlesStr = `&nbsp;${numTitles} ${numTitles === 1 ? "title" : "titles"}&nbsp;`;

  const racesStr = `${numWins} ${numWins === 1 ? "race" : "races"}`;
  const seasonsStr = `${numSeasons} ${numSeasons === 1 ? "season" : "seasons"}`;

  return `${name} won <span class='champion'>${titlesStr}</span> and <span class='race gold'></span> ${racesStr} across ${seasonsStr}.`;
}

function positionHtml(position) {
  return position === 0
    ? "did not participate in"
    : position === 1
    ? "won"
    : `placed ${position}${suffix(position)} in`;
}

function suffix(n) {
  const r = n % 10;
  const specialCases = {
    11: "th",
    12: "th",
    13: "th",
  };
  const suffixes = {
    1: "st",
    2: "nd",
    3: "rd",
  };
  return specialCases[n] || suffixes[r] || "th";
}

function withSuffux(n) {
  return `${n}<sup>${suffix(n)}</sup>`;
}
