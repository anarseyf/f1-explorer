// const YearLimit = 2019;
const MinYear = 0;

function prepareScene1(champions) {
  const filtered = champions.filter((d) => d.year >= MinYear);

  const Scene = d3.select("#Scene1");
  const Header = Scene.select(".header");
  const Content = Scene.select(".content");

  const headerData = ["Year", "Champion", "Races"];
  Header.append("div")
    .attr("class", "row scene1")
    .selectAll("div")
    .data(headerData)
    .enter()
    .append("div")
    .text(String);

  Content.selectAll(".row").data(filtered).enter().append("div").attr("class", "row");

  Content.selectAll(".row")
    .append("div")
    .attr("class", "year")
    .text((d) => d.year);

  const nameEl = Content.selectAll(".row")
    .append("div")
    .attr("class", "name clickable")
    .classed("has-portrait", (d) => !!Data.Attribution[Index.Driver.get(d.driverId)?.driverRef])
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "0.4em")
    .on("click", nameClick);

  nameEl.append("div").attr("class", "portrait-sm")
    .each(function (d) {
      const driverRef = Index.Driver.get(d.driverId)?.driverRef;
      if (!driverRef) return;
      const el = d3.select(this);
      const img = new Image();
      img.onload = () => el.style("background-image", `url('images/drivers/${driverRef}.jpg')`);
      img.src = `images/drivers/${driverRef}.jpg`;
    });

  nameEl.append("span").text((d) => nameFn(d, State.isMobile));

  showDefaultHighlights();
  showLegendForDriver(undefined);

  Scene.select(".reset").on("click", resetAll);
}

function nameClick(e, d) {
  resetAll();
  clearHighlights();
  d3.select("#Scene1 .content").selectAll(".name")
    .classed("selected", (row) => row.driverId === d.driverId);
  showDriverStats(d.driverId);
  highlightRacesWonBy(d.driverId);
  showLegendForDriver(d);
  setUrlParam("driver", d.driverRef);
}

function showDefaultHighlights() {
  const Content = d3.select("#Scene1 .content");
  Content.selectAll(".races").remove();

  Content.selectAll(".row").append("div").attr("class", "races").each(showRacesForYear);
}

function resetScene1() {
  const Scene = d3.select("#Scene1");
  Scene.select(".reset").classed("invisible", true);
  d3.select("#Scene1 .content").selectAll(".name").classed("selected", false);
  showLegendForDriver(undefined);
  showDefaultHighlights();
}

function showLegendForDriver(driverMaybe) {
  let html = Descriptions.Scene1.legend;
  if (driverMaybe) {
    const name = nameFn(driverMaybe);
    html = `<span class='race gold'></span> races won by <span class="bright">${name}</span>`;
  }

  const Scene = d3.select("#Scene1");
  const Legends = Scene.selectAll(".legend.eitherside");
  Legends.html(html);

  Scene.select(".reset").classed("invisible", !driverMaybe);
}

function clearHighlights() {
  d3.select("#Scene1 .content").selectAll(".race").classed("highlight", false);
}

function showDriverStats(driverId) {
  clear();

  const driver = Index.Driver.get(driverId);
  showHeadline(nameFn(driver), 1);

  const html = computeDriverSummaryHtml(driverId);
  d3.select("#Sidebar .subtitle").html(html);

  const wrapper = d3.select("#Sidebar .portrait-wrapper").html("");
  showPortrait(wrapper, driver.driverRef);

  showRaceWinsTable(driverId);
}

function showRaceWinsTable(driverId) {
  const wins = computeRaceWins(driverId);
  const Content = d3.select("#Sidebar .content");

  const entries = Content.selectAll(".race-entry")
    .data(wins)
    .enter()
    .append("div")
    .attr("class", "race-entry");

  const podiumColors = ["var(--gold)", "var(--silver)", "var(--bronze)"];

  entries.each(function (d, i) {
    const el = d3.select(this);

    // Row 1: win number + race name (linked to Wikipedia)
    el.append("div").attr("class", "win-num").text(`#${i + 1}`);
    const header = el.append("div").attr("class", "race-header");
    header.append("a")
      .attr("href", d.raceUrl || null)
      .attr("target", d.raceUrl ? "_blank" : null)
      .text(`${d.year} ${d.raceName}`);

    // Row 2: empty spacer + p1/p2/p3 podium cells
    el.append("div");
    ["p1", "p2", "p3"].forEach((key, idx) => {
      const cell = el.append("div").attr("class", "podium-cell");
      const entry = d[key];
      if (!entry) return;
      const sm = cell.append("div").attr("class", "portrait-sm").style("border-color", podiumColors[idx]);
      const img = new Image();
      img.onload = () => sm.style("background-image", `url('images/drivers/${entry.driver.driverRef}.jpg')`);
      img.src = `images/drivers/${entry.driver.driverRef}.jpg`;
      const text = cell.append("div");
      const colorClass = ["gold", "silver", "bronze"][idx];
      text.append("div").attr("class", `podium-name ${colorClass}`).text(nameFn(entry.driver, true));
      text.append("div").attr("class", "podium-team").text(entry.team);
    });
  });
}

function highlightRacesWonBy(driverId, yearMaybe) {
  const racesMap = computeRaceIdsWonBy(driverId, yearMaybe);

  // console.log(`highlightRacesWonBy ${driverId} ${yearMaybe || ""}`, racesMap);

  d3.select("#Scene1 .content")
    .selectAll(".race")
    .filter((d) => racesMap[d.raceId])
    .classed("highlight", true)
    .classed("thatyear", !!yearMaybe);
}

function showRacesForYear(d) {
  const { year, driverId } = d;
  const races = Index.RacesByYear.get(year);
  races.sort((a, b) => a.round - b.round);

  d3.select(this).selectAll(".race").data(races).enter().append("div").attr("class", "race small");
  // .text("/");

  highlightRacesWonBy(driverId, year);
}

function driverClick(e, d) {
  const driver = Index.Driver.get(d.driverId);
  console.log("Driver:", driver.surname);
  showDriverCareer(driver);
}
