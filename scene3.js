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
  Scene.select(".reset").classed("hidden", true);
  Scene.selectAll(".scene3row").classed("selected", false);
}

const rivalryHtml = (d1, d2) => {
  const p1 = `<span class='champion'>&nbsp</span>`;
  const p2 = `<span class='runnerup'>&nbsp</span>`;
  return `${p1} <span class="bright">${nameFn(d1)}</span> vs ${p2} <span class="bright">${nameFn(
    d2
  )}</span>`;
};

function rivalryHtmlForYear(year) {
  const [d1, d2] = rivalsForYear(year);
  return rivalryHtml(d1, d2);
}

function rivalsForYear(year) {
  const d1 = computeDriverForYearAtPosition(year, 1);
  const d2 = computeDriverForYearAtPosition(year, 2);

  return [d1, d2];
}

function showYear(year) {
  resetAll();
  clear();
  showHeader(year);

  console.log("Show ", year);

  const [driver1, driver2] = rivalsForYear(year);

  const subtitle = rivalryHtml(driver1, driver2);
  showSubtitle(subtitle);

  const drivers = [driver1, driver2];
  showHeaderForYear();
  showTableForYear(year, drivers);
  showLegendForYear(year, drivers);
  showDescriptionForYear(year);

  const Scene = d3.select("#Scene3");
  Scene.select(".reset").classed("hidden", false);

  Scene.selectAll(".scene3row").classed("selected", (d) => d === year);
}

function showHeaderForYear() {
  const Sidebar = d3.select("#Sidebar");
  const Header = Sidebar.select(".header");

  const headerData = ["Round", "Race", "Points total"];
  Header.append("div")
    .attr("class", "row scene3")
    .selectAll("div")
    .data(headerData)
    .enter()
    .append("div")
    .text(String);
}

function showDescriptionForYear(year) {
  const Sidebar = d3.select("#Sidebar");
  const Description = Sidebar.select(".description");

  const defaultText = `${year} Formula 1 Season`;
  const text = Descriptions.Scene3.years[year]?.description ?? "";

  // Description.text(text || defaultText);
}

function showTableForYear(year, drivers) {
  const [driver1, driver2] = drivers;
  const races = Index.RacesByYear.get(year).sort((a, b) => a.round - b.round);

  const raceIds = races.map((r) => r.raceId);

  const points1 = computePointsForDriverAtRaces(driver1.driverId, raceIds);
  const points2 = computePointsForDriverAtRaces(driver2.driverId, raceIds);

  const Sidebar = d3.select("#Sidebar");
  const Content = Sidebar.select(".content");

  Content.selectAll(".row").data(races).enter().append("div").attr("class", "row scene3");

  const winnersByRound = computeWinnersByRoundForYear(year);
  const raceColorFn = (d) => {
    const driverId = winnersByRound.get(d.round).driverId;
    const color =
      driverId === driver1.driverId ? "gold" : driverId === driver2.driverId ? "silver" : "other";
    return `race ${color}`;
  };

  Content.selectAll(".row").append("div").attr("class", raceColorFn);

  Content.selectAll(".row")
    .append("div")
    .attr("class", "year")
    .text((d) => d.round);

  Content.selectAll(".row")
    .append("div")
    .attr("class", "name")
    .text((d) => d.name);

  // Content.selectAll(".row").append("div").attr("class", "place1");
  // Content.selectAll(".row").append("div").attr("class", "place2");
  // Content.selectAll(".place1").data(points1).text(String);
  // Content.selectAll(".place2").data(points2).text(String);

  Content.selectAll(".row").append("div").attr("class", "pointsChart");

  const max = d3.max(points1);
  const pointsData = d3.zip(points1, points2).map((points) => ({ points, max }));
  Content.selectAll(".pointsChart").data(pointsData).each(showPointsChart);
}

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

  const Footer = d3.select("#Sidebar .footer");
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

const indexToColor = (i) => (i === 0 ? "gold" : i === 1 ? "silver" : "other");

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
