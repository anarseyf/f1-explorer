function clear() {
  console.log("Clear");
  const Sidebar = d3.select("#Sidebar");
  Sidebar.selectAll(".sidebarItem").text("");

  const sidebarHint = Descriptions.Sidebar.hint;
  Sidebar.select(".subtitle").html(sidebarHint);
}

function resetAll() {
  resetScene1();
  resetScene2();
  resetScene3();
  clear();
}

const nameFn = (d) => `${d.firstname} ${d.lastname}`;

function showHeader(textOrHtml) {
  d3.select("#Sidebar .headline").html(textOrHtml);
}

function showSubtitle(textOrHtml) {
  d3.select("#Sidebar .subtitle").html(textOrHtml);
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
    Scene1 = d3.select("#Scene1"),
    Scene2 = d3.select("#Scene2"),
    Scene3 = d3.select("#Scene3");
  Credits = d3.select("#Credits");

  const Desc0 = Intro.select(".description"),
    Legend0 = Intro.select(".legend"),
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
  Desc1.html(Descriptions.Scene1.description);
  Legend1.html(Descriptions.Scene1.legend);
  Desc2.html(Descriptions.Scene2.description);
  Legend2.html(Descriptions.Scene2.legend);
  Desc3.html(Descriptions.Scene3.description);
  Legend3.html(Descriptions.Scene3.legend);
  DataNotes.html(Descriptions.Credits.dataNotes);
  Author.html(Descriptions.Credits.author);

  console.log("Legend: ", Descriptions.Scene1.legend);
}
