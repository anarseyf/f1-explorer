function clear() {
  console.log("Clear");
  const Sidebar = d3.select("#Sidebar");
  Sidebar.selectAll(".sidebarItem").text("");

  const inlineSidebars = d3.selectAll(".inlineSidebar");
  inlineSidebars.selectAll(".sidebarItem").text("");
  inlineSidebars.classed("hidden", true);

  d3.selectAll(".portrait-wrapper").html("");

  const sidebarHint = Descriptions.Sidebar.hint;
  Sidebar.select(".subtitle").html(sidebarHint);
}

function resetAll() {
  resetScene1();
  resetScene2();
  resetScene3();
  clear();
  clearUrlParams();
}

function showPortrait(wrapper, driverRef, borderColor = "var(--gold)") {
  const attr = Data.Attribution?.[driverRef];
  const wikiUrl = attr?.wikipediaUrl || Index.DriverByRef.get(driverRef)?.url || null;
  const item = wrapper.append("div").attr("class", "portrait-item");

  const portraitEl = item.append("a")
    .attr("class", "portrait")
    .attr("href", wikiUrl)
    .attr("target", wikiUrl ? "_blank" : null)
    .style("border-color", borderColor)
    .style("cursor", wikiUrl ? "pointer" : "default");

  const img = new Image();
  img.onload = () => portraitEl.style("background-image", `url('images/drivers/${driverRef}.jpg')`);
  img.src = `images/drivers/${driverRef}.jpg`;

  if (attr) {
    const attrEl = item.append("div").attr("class", "portrait-attribution");
    const parts = [attr.artist, attr.license].filter(Boolean);
    if (parts.length) attrEl.append("span").text(parts.join(" • "));
    if (attr.source) {
      if (parts.length) attrEl.append("span").text(" • ");
      attrEl.append("a").attr("href", attr.source).attr("target", "_blank").text("Wikipedia");
    }
  }
}

const nameOverrides = { "fangio": "Juan Manuel Fangio" };

const nameFn = (d, abbreviate) => {
  if (!abbreviate && d.driverRef && nameOverrides[d.driverRef]) return nameOverrides[d.driverRef];
  const first = abbreviate ? "" : `${d.forename} `;
  return `${first}${d.surname}`;
};

function showHeadline(textOrHtml, sceneNum) {
  const Container = d3.select(State.isMobile ? `#InlineSidebar${sceneNum}` : "#Sidebar");
  Container.select(".headline").html(textOrHtml);
}

function showSubtitle(textOrHtml, sceneNum) {
  const Container = d3.select(State.isMobile ? `#InlineSidebar${sceneNum}` : "#Sidebar");
  Container.select(".subtitle").html(textOrHtml);
}

function showClearButton() {
  d3.select("#Sidebar .button")
    .append("div")
    .attr("class", "clickable")
    .text("Clear")
    .on("click", clear);
}

function showSceneDescriptions() {
  const Intro = d3.select("#Intro"),
    Legend = d3.select("#Legend"),
    Scene1 = d3.select("#Scene1"),
    Scene2 = d3.select("#Scene2"),
    Scene3 = d3.select("#Scene3");
  Credits = d3.select("#Credits");

  const Desc0 = Intro.select(".description"),
    Legend0 = Legend.select(".legend"),
    Desc1 = Scene1.select(".description"),
    Legend1 = Scene1.select(".legend"),
    Desc2 = Scene2.select(".description"),
    Legend2 = Scene2.select(".legend"),
    Desc3 = Scene3.select(".description"),
    Legend3 = Scene3.select(".legend"),
    DataNotes = Credits.select(".dataNotes"),
    Author = Credits.select(".author");

  Desc0.html(Descriptions.Intro.description);
  Legend0.html(Descriptions.Intro.legend);
  Desc1.html(Descriptions.Scene1.description());
  Legend1.html(Descriptions.Scene1.legend);
  Desc2.html(Descriptions.Scene2.description());
  Legend2.html(Descriptions.Scene2.legend);
  Desc3.html(Descriptions.Scene3.description());
  Legend3.html(Descriptions.Scene3.legend);
  DataNotes.html(Descriptions.Credits.dataNotes);
  Author.html(Descriptions.Credits.author);

  console.log("Legend: ", Descriptions.Scene1.legend);
}

function addClickHandlers() {
  d3.select("#NextSection").on("click", () => {
    d3.select("#Scene2").node().scrollIntoView({ behavior: "smooth" });
  });
}

function setUrlParam(key, value) {
  const params = new URLSearchParams();
  if (key && value !== undefined) params.set(key, value);
  const search = params.toString();
  history.replaceState(null, "", search ? `?${search}` : location.pathname);
}

function clearUrlParams() {
  history.replaceState(null, "", location.pathname);
}

function handleUrlParams(champions) {
  const params = new URLSearchParams(location.search);
  const driverRef = params.get("driver");
  const timelineRef = params.get("timeline");
  const seasonStr = params.get("season");

  if (driverRef) {
    const champion = champions.find((c) => c.driverRef === driverRef);
    if (champion) {
      nameClick(null, champion);
      d3.select("#Scene1 .name.selected").node()?.scrollIntoView({ behavior: "smooth" });
      return true;
    }
  }

  if (timelineRef) {
    const driver = Index.DriverByRef.get(timelineRef);
    if (driver) {
      showDriverCareer(driver);
      return true;
    }
  }

  if (seasonStr) {
    const year = +seasonStr;
    if (Index.RacesByYear.has(year)) {
      showYear(year);
      return true;
    }
  }

  return false;
}
