function prepareScene3(years) {
  const Header = d3.select("#Scene3 .header");
  const Content = d3.select("#Scene3 .content");

  const headerData = ["Season", "Main rivalry"];
  Header.append("div")
    .attr("class", "row scene3row")
    .selectAll("div")
    .data(headerData)
    .enter()
    .append("div")
    .text(String);

  Content.selectAll(".row")
    .data(years)
    .enter()
    .append("div")
    .attr("class", "row scene3row")
    .on("click", (e, d) => showYear(d));

  Content.selectAll(".row").append("div").attr("class", "year clickable").text(String);

  Content.selectAll(".row").append("div").attr("class", "name").html(rivalryHtmlForYear);

  d3.select("#Scene3 .reset").on("click", resetAll);
}

function resetScene3() {
  // console.log("resetScene3");
  const Scene = d3.select("#Scene3");
  Scene.select(".reset").classed("invisible", true);
  Scene.selectAll(".scene3row").classed("selected", false);
}

const rivalBorderColors = ["var(--gold)", "var(--silver)", "var(--bronze)", "var(--darkline)"];

const rivalryHtml = (drivers, excludedRef = null) => {
  return Array.from({ length: 4 }, (_, i) => {
    const d = drivers[i];
    if (!d) return `<span class='rival'></span>`;
    const color = rivalBorderColors[i] || "var(--darkline)";
    const circle = `<div class="portrait-sm" style="border-color:${color};background-image:url('images/drivers/${d.driverRef}.jpg')"></div>`;
    const marker = excludedRef && d.driverRef === excludedRef ? `<span class="dsq-marker">(*)</span>` : "";
    return `<span class='rival'>${circle}<span class="clickable">${nameFn(d, true)}</span>${marker}</span>`;
  }).join("");
};

function rivalryHtmlForYear(year) {
  const excludedRef = Descriptions.Scene3.years[year]?.excludedDriverRef ?? null;
  return rivalryHtml(rivalsForYear(year), excludedRef);
}

function rivalsForYear(year) {
  return computeContendersForYear(year);
}

function showDsqNoteForYear(Container, year) {
  const dsq = Descriptions.Scene3.years[year]?.dsq;
  if (!dsq) return;
  Container.select(".subtitle").append("p").attr("class", "dsq-note").text(dsq);
}

function showRivalryGrid(Container, drivers, year) {
  const Subtitle = Container.select(".subtitle").html("");
  const grid = Subtitle.append("div").attr("class", "driver-grid");
  const borderColors = ["var(--gold)", "var(--silver)", "var(--bronze)", "var(--darkline)"];

  drivers.forEach((driver, i) => {
    const borderColor = borderColors[i] || "var(--darkline)";
    const teams = getTeamsForDriverInYear(driver.driverId, year);
    const card = grid.append("div").attr("class", "driver-card");
    showPortrait(card, driver.driverRef, borderColor);
    const info = card.append("div").attr("class", "driver-card-info");
    info.append("div").attr("class", "emphasis").style("color", borderColor).text(nameFn(driver));
    info.append("div").attr("class", "podium-team").text(teams.join(", "));
  });
}

function showYear(year) {
  console.log("Show ", year);

  resetAll();
  clear();

  const Container = d3.select(State.isMobile ? "#InlineSidebar3" : "#Sidebar");
  Container.classed("hidden", false);

  showHeadline(year, 3);

  const drivers = rivalsForYear(year);

  showRivalryGrid(Container, drivers, year);
  showDsqNoteForYear(Container, year);
  showHeaderForYear();
  showTableForYear(year, drivers);
  showLegendForYear(year, drivers);
  showDescriptionForYear(year);

  const Scene = d3.select("#Scene3");
  Scene.select(".reset").classed("invisible", false);

  Scene.selectAll(".scene3row").classed("selected", (d) => d === year);

  setUrlParam("season", year);
}

function showHeaderForYear() {
  const Container = d3.select(State.isMobile ? "#InlineSidebar3" : "#Sidebar");
  const Header = Container.select(".header");

  const headerData = [
    "Round",
    State.isMobile ? "Grand Prix" : "Race",
    State.isMobile ? "Points" : "Season points",
  ];
  Header.append("div")
    .attr("class", "row scene3")
    .selectAll("div")
    .data(headerData)
    .enter()
    .append("div")
    .text(String);
}

function showDescriptionForYear(year) {
  const Container = d3.select(State.isMobile ? "#InlineSidebar3" : "#Sidebar");
  const Description = Container.select(".description");

  const defaultText = `${year} Formula 1 Season`;
  const text = Descriptions.Scene3.years[year]?.description ?? "";

  Description.text(text || defaultText);
}

function showTableForYear(year, drivers) {
  const races = Index.RacesByYear.get(year).sort((a, b) => a.round - b.round);
  const raceIds = races.map((r) => r.raceId);

  const clinch = drivers[0] ? computeTitleClinch(year, drivers[0].driverId) : null;
  const clinchRaceId = clinch?.raceId ?? null;
  const clinchRemainingMax = clinch?.remainingMax ?? 0;
  const winnersByRound = computeWinnersByRoundForYear(year);

  // Cumulative GP points per driver per race (from standings, includes prior sprint pts)
  const gpPointsArrays = drivers.map((d) => computePointsForDriverAtRaces(d.driverId, raceIds));
  const gpMax = d3.max(gpPointsArrays[0]) || 0;

  // Sprint raw points per driver per sprint race
  const sprintRaces = races.filter((r) => Index.SprintResultsByRace.has(r.raceId));
  const sprintRawByRace = new Map();
  sprintRaces.forEach((r) => {
    sprintRawByRace.set(r.raceId, drivers.map((d) => {
      const entry = (Index.SprintResultsByRace.get(r.raceId) || []).find((sr) => sr.driverId === d.driverId);
      return entry ? +entry.points : 0;
    }));
  });

  // Build ordered table items (sprint before its GP), with cumulative points on same scale as GP
  const items = [];
  for (let ri = 0; ri < races.length; ri++) {
    const race = races[ri];

    if (sprintRawByRace.has(race.raceId)) {
      // Sprint cumulative = previous GP standings + sprint pts (sprint happens before GP)
      const prevRaceId = ri > 0 ? races[ri - 1].raceId : null;
      const prevStandings = prevRaceId ? (Index.StandingsByRace.get(prevRaceId) || []) : [];
      const sprintRaw = sprintRawByRace.get(race.raceId);
      const sprintWinnerId = (Index.SprintResultsByRace.get(race.raceId) || []).find((r) => +r.position === 1)?.driverId;

      items.push({
        type: "sprint",
        race,
        points: drivers.map((d, di) => {
          const prevEntry = prevStandings.find((s) => s.driverId === d.driverId);
          return (prevEntry ? +prevEntry.points : 0) + sprintRaw[di];
        }),
        max: gpMax,
        winnerDriverId: sprintWinnerId,
        isCliching: false,
        remainingMax: 0,
      });
    }

    items.push({
      type: "gp",
      race,
      points: drivers.map((_, di) => gpPointsArrays[di][ri]),
      max: gpMax,
      winnerDriverId: winnersByRound.get(race.round)?.driverId,
      isCliching: race.raceId === clinchRaceId,
      remainingMax: race.raceId === clinchRaceId ? clinchRemainingMax : 0,
    });
  }

  const Container = d3.select(State.isMobile ? "#InlineSidebar3" : "#Sidebar");
  const Content = Container.select(".content");

  const rows = Content.selectAll(".row").data(items).enter().append("div")
    .attr("class", (d) => `row scene3${d.type === "sprint" ? " sprint-row" : ""}`)
    .on("mouseenter", function (event, d) { showRaceRowTooltip(this, d, drivers, year); })
    .on("mouseleave", hideTooltip);

  rows.append("div").attr("class", (d) => {
    const idx = drivers.findIndex((dr) => dr.driverId === d.winnerDriverId);
    return `race ${indexToColor(idx)}`;
  });

  rows.append("div").attr("class", (d) => d.type === "sprint" ? "year sprint-label" : "year")
    .text((d) => d.type === "sprint" ? "S" : d.race.round);

  const nameDivs = rows.append("div").attr("class", "name");
  nameDivs.append("a")
    .attr("href", (d) => d.race.url || null)
    .attr("target", (d) => d.race.url ? "_blank" : null)
    .text((d) => grandPrixNameFn(d.race.name, State.isMobile));
  nameDivs.filter((d) => d.type === "sprint").append("span").attr("class", "sprint-label").text(" (sprint)");
  nameDivs.filter((d) => d.type === "gp" && d.race.raceId === clinchRaceId)
    .append("span").attr("class", "clinch-trophy").text(" 🏆");

  rows.append("div").attr("class", "pointsChart").each(function (d) {
    showPointsChart.call(this, d);
  });
}

function showRaceRowTooltip(anchorEl, item, drivers, year) {
  const raceName = grandPrixNameFn(item.race.name, false);
  const suffix = item.type === "sprint" ? " (sprint)" : "";
  const colors = ["gold", "silver", "bronze"];

  let html = `<div class="tt-label">Points after</div><div class="tt-race-name">${raceName}${suffix}</div>`;

  drivers.forEach((driver, i) => {
    const driverObj = Index.Driver.get(driver.driverId) || driver;
    const driverRef = driverObj.driverRef || "";
    const pts = item.points[i];
    const teamResult = Index.ResultsByRaceByDriver.get(item.race.raceId)?.get(driver.driverId)?.[0];
    const team = teamResult ? (Index.Constructor.get(teamResult.constructorId)?.name || "") : "";
    const portraitStyle = driverRef ? `background-image:url('images/drivers/${driverRef}.jpg')` : "";
    const nameClass = colors[i] ? ` ${colors[i]}` : "";
    html += `<div class="tt-driver">` +
      `<div class="portrait-sm" style="${portraitStyle}"></div>` +
      `<div class="tt-info"><span class="tt-name${nameClass}">${driverObj.surname}</span><span class="tt-team">${team}</span></div>` +
      `<span class="tt-pts">${pts}</span>` +
      `</div>`;
  });

  if (item.isCliching && drivers.length >= 2) {
    const d0 = (Index.Driver.get(drivers[0].driverId) || drivers[0]).surname;
    const d1 = (Index.Driver.get(drivers[1].driverId) || drivers[1]).surname;
    const gap = item.points[0] - item.points[1];
    html += `<div class="tt-note">${d0} is ahead of ${d1} by ${gap} pts, with ${item.remainingMax} max pts remaining</div>`;
  }

  const anchor = anchorEl.querySelector(".pointsChart") || anchorEl;
  showTooltip(anchor, html, { side: "left" });
}

const grandPrixNameFn = (fullName, abbreviate) =>
  abbreviate ? fullName.replace(/Grand Prix/, "G.P.") : fullName;

function showLegendForYear(year, drivers) {
  const races = Index.RacesByYear.get(year).sort((a, b) => a.round - b.round);

  const winnersByRound = computeWinnersByRoundForYear(year);

  const numWonBy = (driverId) =>
    races
      .map((r) => winnersByRound.get(r.round))
      .map((w) => w.driverId)
      .filter((id) => id === driverId).length;

  const list = drivers.map((d, i) => ({
    // driverId: d.driverId,
    name: nameFn(d),
    wins: numWonBy(d.driverId),
    color: indexToColor(i),
  }));

  const totalWins = d3.sum(list, (d) => d.wins);

  const others = {
    name: "others",
    wins: races.length - totalWins,
    color: "other",
  };
  list.push(others);

  const Container = d3.select(State.isMobile ? "#InlineSidebar3" : "#Sidebar");

  const Footer = Container.select(".footer");
  Footer.selectAll(".row")
    .data(list)
    .enter()
    .append("div")
    .attr("class", "row legend")
    .each(showLegendRow);
}

function showLegendRow(d) {
  const { name, wins, color } = d;
  const nameHtml = d.name === "others" ? d.name : `<span class='emphasis'>${d.name}</span>`;
  const html = `won by ${nameHtml}`;

  d3.select(this)
    .append("div")
    .text((d) => d.wins);
  d3.select(this)
    .append("div")
    .attr("class", (d) => `race ${d.color}`);
  d3.select(this).append("div").html(html);
}

const indexToColor = (i) => (i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "other");

const pointsClassFn = (d, i) => `points ${indexToColor(i)}`;

const pointsWidthFn = (p, max) => `${Math.round((100 * p) / max)}%`;

function showPointsChart(d) {
  const { points, max } = d;

  d3.select(this)
    .selectAll(".points")
    .data(points)
    .enter()
    .append("div")
    .attr("class", pointsClassFn)
    .style("width", (d) => pointsWidthFn(d, max));
}

function yearClick(e, d) {
  showYear(d.year);
}
