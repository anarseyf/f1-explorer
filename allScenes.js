function clear() {
  console.log("Clear");
  detachOverlayScroll();
  document.getElementById("SidebarFooter")?.classList.add("hidden");

  const Sidebar = d3.select("#Sidebar");
  Sidebar.selectAll(".sidebarItem").text("");

  const inlineSidebars = d3.selectAll(".inlineSidebar");
  inlineSidebars.selectAll(".sidebarItem").text("");
  inlineSidebars.classed("hidden", true);
  inlineSidebars.classed("mobile-overlay-active", false);

  d3.selectAll(".portrait-wrapper").html("");
  document.getElementById("PointsHint")?.classList.add("app-tooltip-hidden");

  const sidebarHint = Descriptions.Sidebar.hint;
  Sidebar.select(".subtitle").html(sidebarHint);
}

let _overlayEl = null;
let _overlayScrollFn = null;
let _overlayScrollLastY = 0;
let _overlayOffset = 0;
let _overlayClosing = false;

function attachOverlayScroll(overlayEl) {
  detachOverlayScroll();
  _overlayEl = overlayEl;
  _overlayOffset = 0;
  _overlayClosing = false;

  // Force off-screen before first paint, then slide in
  overlayEl.style.transition = "none";
  overlayEl.style.bottom = "-100vh";
  overlayEl.getBoundingClientRect(); // force reflow
  overlayEl.style.transition = "bottom 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)";
  overlayEl.style.bottom = "0px";

  const bd = _getOrCreateBackdrop();
  bd.style.display = "block";
  requestAnimationFrame(() => { bd.style.opacity = "1"; });
}

function closeMobileOverlay() {
  if (_overlayClosing) return;
  const overlayEl = _overlayEl;
  if (!overlayEl) { resetAll(); return; }

  _overlayClosing = true;
  _overlayEl = null;
  _overlayOffset = 0;

  if (_overlayScrollFn) {
    window.removeEventListener("scroll", _overlayScrollFn);
    _overlayScrollFn = null;
  }

  // Fade backdrop, animate overlay out
  const bd = document.getElementById("OverlayBackdrop");
  if (bd) bd.style.opacity = "0";
  overlayEl.style.transition = "bottom 0.3s ease-in";
  overlayEl.style.bottom = "-100vh";

  setTimeout(() => {
    _overlayClosing = false;
    overlayEl.style.transition = "";
    overlayEl.style.bottom = "";
    _hideBackdrop();
    resetAll();
  }, 320);
}

function detachOverlayScroll() {
  if (_overlayScrollFn) {
    window.removeEventListener("scroll", _overlayScrollFn);
    _overlayScrollFn = null;
  }
  if (_overlayEl) {
    _overlayEl.style.transition = "";
    _overlayEl.style.bottom = "";
    _overlayEl = null;
    _overlayOffset = 0;
  }
  _overlayClosing = false;
  _hideBackdrop();
}

function _getOrCreateBackdrop() {
  let bd = document.getElementById("OverlayBackdrop");
  if (!bd) {
    bd = document.createElement("div");
    bd.id = "OverlayBackdrop";
    bd.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;display:none;background:rgba(0,0,0,0.3);opacity:0;transition:opacity 0.25s ease;";
    document.body.appendChild(bd);
    bd.addEventListener("click", closeMobileOverlay);
    bd.addEventListener("touchstart", (e) => {
      e.preventDefault();
      closeMobileOverlay();
    }, { passive: false });
    bd.addEventListener("touchmove", (e) => { e.preventDefault(); }, { passive: false });
  }
  return bd;
}

function _hideBackdrop() {
  const bd = document.getElementById("OverlayBackdrop");
  if (bd) bd.style.display = "none";
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
  if (!State.isMobile) document.getElementById("SidebarFooter")?.classList.remove("hidden");
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
    Scene1 = d3.select("#Scene1"),
    Scene2 = d3.select("#Scene2"),
    Scene3 = d3.select("#Scene3");
  Credits = d3.select("#Credits");

  const Desc0 = Intro.select(".description"),
    Desc1 = Scene1.select(".description"),
    Legend1 = Scene1.select(".legend"),
    Desc2 = Scene2.select(".description"),
    Legend2 = Scene2.select(".legend"),
    Desc3 = Scene3.select(".description"),
    Legend3 = Scene3.select(".legend"),
    DataNotes = Credits.select(".dataNotes"),
    Author = Credits.select(".author");

  Desc0.html(Descriptions.Intro.description);
  Desc1.html(Descriptions.Scene1.description());
  Legend1.html(Descriptions.Scene1.legend);
  Desc2.html(Descriptions.Scene2.description());
  Legend2.html(Descriptions.Scene2.legend);
  Desc3.html(Descriptions.Scene3.description());
  Legend3.html(Descriptions.Scene3.legend);
  DataNotes.html(Descriptions.Credits.dataNotes);
  Author.html(Descriptions.Credits.author);
}

function getOrCreateTooltip() {
  let tip = document.getElementById("AppTooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "AppTooltip";
    tip.className = "app-tooltip app-tooltip-hidden";
    document.body.appendChild(tip);
    document.addEventListener("click", () => hideTooltip());
  }
  return tip;
}

function showTooltip(anchorEl, html, { side = "auto", clinch = false, fill = false } = {}) {
  const tip = getOrCreateTooltip();
  tip.innerHTML = html;
  tip.style.visibility = "hidden";
  tip.classList.remove("app-tooltip-hidden");
  tip.classList.toggle("app-tooltip-clinch", clinch);

  const rect = anchorEl.getBoundingClientRect();
  const margin = 8;
  const gap = 10;

  if (side === "left") {
    tip.dataset.direction = "right";
    tip.style.transform = "";
    tip.style.bottom = "";

    if (fill) {
      tip.style.width = `${Math.max(80, rect.left - 6 - margin)}px`;
      const tipH = tip.offsetHeight;
      const top = Math.max(margin, Math.min(
        rect.top + rect.height / 2 - tipH / 2,
        window.innerHeight - tipH - margin
      ));
      tip.style.top = `${top}px`;
      tip.style.left = `${margin}px`;
    } else {
      const sidebar = document.getElementById("Sidebar");
      const sidebarW = sidebar ? sidebar.offsetWidth : window.innerWidth * 0.45;
      tip.style.width = `${Math.round(0.4 * sidebarW)}px`;

      const tipW = tip.offsetWidth;
      const tipH = tip.offsetHeight;
      const top = Math.max(margin, Math.min(
        rect.top + rect.height / 2 - tipH / 2,
        window.innerHeight - tipH - margin
      ));
      const left = Math.max(margin, rect.left - tipW - gap);
      tip.style.top = `${top}px`;
      tip.style.left = `${left}px`;
    }
  } else {
    tip.dataset.direction = (window.innerHeight - rect.bottom) >= rect.top ? "down" : "up";
    tip.style.transform = "";
    tip.style.bottom = "";
    tip.style.width = "";

    if (tip.dataset.direction === "down") {
      tip.style.top = `${rect.bottom + gap}px`;
    } else {
      tip.style.top = `${rect.top - tip.offsetHeight - gap}px`;
    }
    const anchorCx = rect.left + rect.width / 2;
    const halfWidth = 110;
    const left = Math.max(margin, Math.min(anchorCx - halfWidth, window.innerWidth - halfWidth * 2 - margin));
    tip.style.left = `${left}px`;
  }

  tip.style.visibility = "";
}

function hideTooltip() {
  const tip = document.getElementById("AppTooltip");
  if (tip) tip.classList.add("app-tooltip-hidden");
}

function addClickHandlers() {
  d3.select("#NextSection").on("click", () => {
    d3.select("#Scene2").node().scrollIntoView({ behavior: "smooth" });
  });

  const sf = document.getElementById("SidebarFooter");
  if (sf) {
    const resetBtn = document.createElement("div");
    resetBtn.className = "clickable";
    resetBtn.textContent = "reset";
    resetBtn.addEventListener("click", resetAll);
    const hint = document.createElement("div");
    hint.className = "sidebar-footer-hint";
    hint.innerHTML = `<kbd class="sidebar-key">↑</kbd><kbd class="sidebar-key">↓</kbd> navigate &nbsp;<kbd class="sidebar-key">Esc</kbd> clear`;
    sf.appendChild(resetBtn);
    sf.appendChild(hint);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { resetAll(); return; }
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const dir = e.key === "ArrowDown" ? 1 : -1;
    if (_keyNavScene1(dir) || _keyNavScene2(dir) || _keyNavScene3(dir)) e.preventDefault();
  });
}

function _keyNavScene1(dir) {
  const sel = document.querySelector("#Scene1 .content .row.selected");
  if (!sel) return false;
  const rows = [...document.querySelectorAll("#Scene1 .content .row")];
  const idx = rows.indexOf(sel);
  const next = idx + dir;
  if (next >= 0 && next < rows.length) {
    const d = d3.select(rows[next]).datum();
    if (d) { nameClick(null, d, rows[next]); rows[next].scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }
  return true;
}

function _keyNavScene2(dir) {
  const sel = document.querySelector("#Scene2 .driver.selected");
  if (!sel) return false;
  const all = [...document.querySelectorAll("#Scene2 .driver")];
  const idx = all.indexOf(sel);
  const next = idx + dir;
  if (next >= 0 && next < all.length) {
    const d = d3.select(all[next]).datum();
    if (d) { showDriverCareer(d.driver); all[next].scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }
  return true;
}

function _keyNavScene3(dir) {
  const sel = document.querySelector("#Scene3 .content .scene3row.selected");
  if (!sel) return false;
  const rows = [...document.querySelectorAll("#Scene3 .content .scene3row")];
  const idx = rows.indexOf(sel);
  const next = idx + dir;
  if (next >= 0 && next < rows.length) {
    const year = d3.select(rows[next]).datum();
    if (year) { showYear(year); rows[next].scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }
  return true;
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

function selectTimeline(driverRef) {
  const driver = Index.DriverByRef.get(driverRef);
  if (!driver) return;
  showDriverCareer(driver);
  d3.select("#Scene2 .driver.selected").node()?.scrollIntoView({ behavior: "smooth" });
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
      d3.select("#Scene1 .content .row.selected").node()?.scrollIntoView({ behavior: "smooth" });
      return true;
    }
  }

  if (timelineRef) {
    const driver = Index.DriverByRef.get(timelineRef);
    if (driver) {
      showDriverCareer(driver);
      d3.select("#Scene2 .driver.selected").node()?.scrollIntoView({ behavior: "smooth" });
      return true;
    }
  }

  if (seasonStr) {
    const year = +seasonStr;
    if (Index.RacesByYear.has(year)) {
      showYear(year);
      d3.select("#Scene3 .scene3row.selected").node()?.scrollIntoView({ behavior: "smooth" });
      return true;
    }
  }

  return false;
}
