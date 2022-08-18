const TimelineMin = 1991,
  TimelineMax = 2021;

function prepareScene2(drivers) {
  const dr1 = drivers.slice(0, 12),
    dr2 = drivers.slice(12, 23),
    dr3 = drivers.slice(23);

  const y1 = [1950, 1950 + 30],
    y2 = [1968, 1968 + 30],
    y3 = [1990, 1991 + 31];

  const s1 = d3.select("#SubScene2-1"),
    s2 = d3.select("#SubScene2-2"),
    s3 = d3.select("#SubScene2-3");

  prepareSubscene2(s1, dr1, y1);
  prepareSubscene2(s2, dr2, y2);
  prepareSubscene2(s3, dr3, y3);
}

function prepareSubscene2(container, drivers, yearRange) {
  const [minYear, maxYear] = yearRange;

  const Content = container.select(".content");
  const Header = container.select(".header");

  const timelines = drivers
    .map((d) => d.driverId)
    .map((driverId) => computeDriver(driverId, [minYear, maxYear]));

  const data = d3.zip(drivers, timelines).map(([driver, timeline]) => ({ driver, timeline }));

  // console.log("drivers + timelines", drivers, timelines, data);

  const headerData = ["World Champion", "Career timeline"];
  Header.append("div")
    .attr("class", "row scene2row")
    .selectAll("div")
    .data(headerData)
    .enter()
    .append("div")
    .text(String);

  const rows = Content.selectAll(".champion")
    .data(data)
    .enter()
    .append("div")
    .attr("class", "scene2row");

  rows
    .append("div")
    .attr("class", "driver clickable")
    .text((d) => nameFn(d.driver))
    .on("click", (e, d) => {
      showDriverCareer(d.driver);
    })
    .on("mouseenter", (e, d) => {
      highlightTimeline(d.driver.driverId, container);
    })
    .on("mouseleave", (e, d) => {
      highlightTimeline(undefined, container);
    });

  rows
    .append("div")
    .attr("class", "timeline")
    .each(function (d) {
      showTimeline(this, d.timeline, container);
    });

  d3.select("#Scene2 .reset").on("click", resetAll);

  showYearAxis(container, minYear, maxYear);
  showIntersectionTooltip(undefined, container);
}

function showTimeline(_this, timeline, container) {
  // console.log(">> timeline:", timeline[0]);

  d3.select(_this)
    .selectAll(".timelineYear")
    .data(timeline)
    .enter()
    .append("div")
    .attr("class", "timelineYear")
    .classed("champion", (d) => d.position === 1)
    .classed("missing", (d) => d.position === 0)
    .style("opacity", opacityFn)
    .on("mouseenter", (e, d) => {
      highlightIntersection(d, container);
    })
    .on("mouseleave", () => highlightIntersection(undefined, container))
    .on("click", (e, d) => {
      highlightIntersection(d, container);
    });
}

function showYearAxis(container, minYear, maxYear) {
  const years = d3.range(minYear, maxYear + 1);
  const Content = container.select(".content");
  const row = Content.append("div").attr("class", "scene2row");

  row.append("div");

  row
    .append("div")
    .attr("class", "timeline axis")
    .selectAll(".tick")
    .data(years)
    .enter()
    .append("div")
    .attr("class", "tick")
    .text(tickFn)
    // .text(String)
    .on("mouseenter", (e, d) => highlightYear(d, container))
    .on("mouseleave", () => highlightYear(undefined, container));
}

function tickFn(d) {
  return d % 10 === 0 ? d : "";
}

function highlightIntersection(dMaybe, container) {
  const { year: yearMaybe, driverId: driverIdMaybe } = dMaybe || {};
  highlightAxis(yearMaybe, container);
  highlightDriver(driverIdMaybe, container);
  highlightEither(yearMaybe, driverIdMaybe, container);
  showIntersectionTooltip(dMaybe, container);
}

function highlightEither(yearMaybe, driverIdMaybe, container) {
  const Content = container.select(".content");
  Content.selectAll(".timelineYear").classed(
    "highlighted",
    (d) => d.driverId === driverIdMaybe || d.year === yearMaybe
  );
}

function highlightYear(yearMaybe, container) {
  const Content = container.select(".content");
  Content.selectAll(".timelineYear").classed("highlighted", (d) => d.year === yearMaybe);
}

function highlightAxis(yearMaybe, container) {
  // console.log("highlightAxis:", yearMaybe);
  const Content = container.select(".content");
  // Content.selectAll(".tick").classed("highlighted", (d) => d === yearMaybe);
  const Ticks = Content.selectAll(".tick");
  if (yearMaybe) {
    Ticks.text((d) => (d === yearMaybe ? d : ""));
  } else {
    Ticks.text(tickFn);
  }
}

function highlightDriver(driverIdMaybe, container) {
  const Content = container.select(".content");
  Content.selectAll(".driver").classed("highlighted", (d) => d.driver.driverId === driverIdMaybe);
}

function highlightTimeline(driverIdMaybe, container) {
  const Content = container.select(".content");
  Content.selectAll(".timelineYear").classed("highlighted", (d) => d.driverId === driverIdMaybe);
}

function showIntersectionTooltip(dMaybe, container) {
  const Tooltip = container.select(".tooltip");

  let html = "";
  if (dMaybe) {
    // console.log("tooltip:", dMaybe);
    const { year, driverId, position } = dMaybe;
    html = computeIntersectionHtml(year, driverId, position);
  }

  Tooltip.html(html);
}

const opacityFn = (d) => {
  if (d.position === 0) {
    return 1.0;
  }
  const deficit = Math.min(7, d.position - 1);
  return 1.0 - deficit * 0.1;
};

function resetScene2() {
  d3.select("#Scene2 .reset").classed("invisible", true);
  highlightChampionRow(undefined);
}

function highlightChampionRow(driver) {
  const { driverId } = driver || {};
  const Scene2 = d3.select("#Scene2");
  Scene2.selectAll(".scene2row").classed("highlighted", (d) => d && d.driver.driverId === driverId);
}

function showDriverCareer(driver) {
  resetAll();

  d3.select("#Scene2 .reset").classed("invisible", false);

  const Container = d3.select(State.isMobile ? "#InlineSidebar2" : "#Sidebar");

  Container.classed("hidden", false);

  highlightChampionRow(driver);

  const Subtitle = Container.select(".subtitle");
  const Header = Container.select(".header");
  const Content = Container.select(".content");

  const standings = computeDriver(driver.driverId);

  const html = computeDriverSummaryHtml(driver.driverId);
  Subtitle.html(html);

  const headerData = ["Year", "Team", "Result", "Races won"];
  Header.append("div")
    .attr("class", "row scene2")
    .selectAll("div")
    .data(headerData)
    .enter()
    .append("div")
    .text(String);

  Content.selectAll(".row")
    .data(standings)
    .enter()
    .append("div")
    .attr("class", "row scene2")
    // .classed("champion", (d) => d.position === 1)
    .classed("missing", (d) => d.position === 0);

  Content.selectAll(".row")
    .append("div")
    .attr("class", "year")
    .text((d) => d.year);

  Content.selectAll(".row").append("div").attr("class", "name").text(teamFn);

  Content.selectAll(".row")
    .append("div")
    .attr("class", "name right")
    .classed("champion", (d) => d.position === 1)
    .html((d) => (d.position === 0 ? "" : withSuffux(d.position)));

  Content.selectAll(".row").append("div").attr("class", "pointsChart").each(showPosition);

  Content.selectAll(".row")
    .append("div")
    .attr("class", "name right")
    .text((d) => (d.position === 0 ? "" : d.wins || "-"));

  // console.log(`>> raceWinsByYear: `, raceWinsByYear);

  Content.selectAll(".row").append("div").attr("class", "wins").each(showWins);

  d3.select("#InlineSidebar2").node().scrollIntoView({ behavior: "smooth" });
}

function showDriverDescription(driver) {
  const name = nameFn(driver);

  const Description = d3.select("#Sidebar .description");
  const text = Descriptions.Scene2.drivers[name] || "";
  Description.text(text);
}

const positionWidthFn = (position) => {
  const fraction = Math.max(0, 11 - position) / 10;
  return `${100 * fraction}%`;
};

function showPosition(d) {
  if (!d.position) {
    return;
  }

  const width = positionWidthFn(d.position);
  d3.select(this).append("div").attr("class", "points").style("width", width);
}

function showWins(d) {
  const data = d3.range(d.wins);
  d3.select(this)
    .selectAll(".race")
    .data(data)
    .enter()
    .append("div")
    .attr("class", "race small gold");
}

const teamFn = (d) => {
  const constructor = Index.Constructor.get(d.constructorId);
  return constructor?.name ?? "";
};
