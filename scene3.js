function prepareScene3(years) {
  const Header = d3.select("#Scene3 .header");
  const Content = d3.select("#Scene3 .content");

  const headerData = ["Year", "Main rivalry"];
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

const rivalryHtml = (drivers) => {
  return drivers.map((d, i) => {
    const color = rivalBorderColors[i] || "var(--darkline)";
    const circle = `<div class="portrait-sm" style="border-color:${color};background-image:url('images/drivers/${d.driverRef}.jpg')"></div>`;
    const vs = i < drivers.length - 1 ? `<span> vs </span>` : "";
    return `<span class='rival'>${circle}<span class="bright">${nameFn(d)}</span>${vs}</span>`;
  }).join("");
};

function rivalryHtmlForYear(year) {
  return rivalryHtml(rivalsForYear(year));
}

function rivalsForYear(year) {
  return computeContendersForYear(year);
}

function showYear(year) {
  console.log("Show ", year);

  resetAll();
  clear();

  const Container = d3.select(State.isMobile ? "#InlineSidebar3" : "#Sidebar");
  Container.classed("hidden", false);

  showHeadline(year, 3);

  const drivers = rivalsForYear(year);

  const borderColors = ["var(--gold)", "var(--silver)", "var(--bronze)", "var(--darkline)"];
  const wrapper = Container.select(".portrait-wrapper").html("");
  drivers.forEach((driver, i) => showPortrait(wrapper, driver.driverRef, borderColors[i]));

  const subtitle = rivalryHtml(drivers);
  showSubtitle(subtitle, 3);
  showHeaderForYear();
  showTableForYear(year, drivers);
  showLegendForYear(year, drivers);
  showDescriptionForYear(year);

  const Scene = d3.select("#Scene3");
  Scene.select(".reset").classed("invisible", false);

  Scene.selectAll(".scene3row").classed("selected", (d) => d === year);

  d3.select("#InlineSidebar3").node().scrollIntoView({ behavior: "smooth" });
}

function showHeaderForYear() {
  const Container = d3.select(State.isMobile ? "#InlineSidebar3" : "#Sidebar");
  const Header = Container.select(".header");

  const headerData = [
    "Round",
    State.isMobile ? "Grand Prix" : "Race",
    State.isMobile ? "Points" : "Points total",
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

  const pointsArrays = drivers.map((d) => computePointsForDriverAtRaces(d.driverId, raceIds));

  const Container = d3.select(State.isMobile ? "#InlineSidebar3" : "#Sidebar");
  const Content = Container.select(".content");

  Content.selectAll(".row").data(races).enter().append("div").attr("class", "row scene3");

  const winnersByRound = computeWinnersByRoundForYear(year);
  const raceColorFn = (d) => {
    const driverId = winnersByRound.get(d.round).driverId;
    const idx = drivers.findIndex((dr) => dr.driverId === driverId);
    return `race ${indexToColor(idx)}`;
  };

  Content.selectAll(".row").append("div").attr("class", raceColorFn);

  Content.selectAll(".row")
    .append("div")
    .attr("class", "year")
    .text((d) => d.round);

  Content.selectAll(".row")
    .append("div")
    .attr("class", "name")
    .text((d) => grandPrixNameFn(d.name, State.isMobile));

  // Content.selectAll(".row").append("div").attr("class", "place1");
  // Content.selectAll(".row").append("div").attr("class", "place2");
  // Content.selectAll(".place1").data(points1).text(String);
  // Content.selectAll(".place2").data(points2).text(String);

  Content.selectAll(".row").append("div").attr("class", "pointsChart");

  const max = d3.max(pointsArrays[0]);
  const pointsData = d3.zip(...pointsArrays).map((points) => ({ points, max }));
  Content.selectAll(".pointsChart").data(pointsData).each(showPointsChart);
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
  const html = `won by <span class='bright'>${d.name}</span>`;

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
