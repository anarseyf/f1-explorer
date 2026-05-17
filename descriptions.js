const Descriptions = {
  Intro: {
    description:
      "<p>Take a brief tour of the <a target='_blank' href='https://www.formula1.com/'>Formula 1 World Championship</a> history, the drivers who have reached the top in the sport, and a few standout seasons of racing with this interactive document.</p>",
    legend:
      // "<p>Legend</p>" +
      "<p></span> Grand Prix (an individual race): <span class='race silver'></span><br>" +
      "Season (a year of races): <span class='championship'>&nbsp;</span><br>" +
      "Gold color indicates a race win: <span class='race gold'></span><br>" +
      "or a title win: <span class='champion'>&nbsp;</span></p>",
  },
  Sidebar: {
    hint: "<em>Select a name or a year in each section. Details will be revealed here.</em>",
  },
  Scene1: {
    description: () =>
      "<p>The F1 Drivers' Championship started in 1950 with only 7 races. The seasons have grown steadily over the years, and today the Formula 1 championship features over 20 races each year.</p>" +
      "<p>Start by exploring the timeline of all completed championships between 1950 and today. Notice that some years (like <span class='bright'>2007</span> or <span class='bright'>2012</span>) are highly competitive with many drivers winning races, while others (like <span class='bright'>2004</span> or <span class='bright'>2013</span>) are dominated by a single driver.</p>" +
      `<p><span class='bright'>${
        State.isMobile ? "Tap" : "Click"
      } on the name</span> of a world champion to reveal their win pattern over the years.</p>` +
      "<p>In the <span id='NextSection' class='clickable'>next section</span> we'll take a closer look at each world champion's career.</p>",
    legend: "<span class='race highlight thatyear'></span> races won by that year's champion",
  },
  Scene2: {
    description: () =>
      `<p>Only <span class='bright'>${
        computeUniqueDrivers(computeChampions()).length
      } different drivers</span> have won a world title as of ${
        d3.max([...Index.RacesByYear.keys()])
      }. Their careers are summarized in these interactive timelines.</p>` +
      `<p>The two most successful drivers of all time are <span class='bright'>Michael Schumacher</span> and <span class='bright'>Lewis Hamilton</span>, with 7 titles each. The only period of domination by a single driver before the modern era dates back to the 1950's with <span class='bright'>Juan Manuel Fangio</span> winning a total of 5 titles.</p>` +
      "<p>A rare few find ultimate success early, while others take years to achieve their first (and sometimes only) title. Compare Hamilton and <span class='bright'>Nico Rosberg</span>: the former came within one point of winning in his rookie season (2007) and did become champion the following year, while it took the latter over a decade.</p>" +
      `<p><span class='bright'>${
        State.isMobile ? "Tap" : "Mouse-over"
      } on a timeline</span> to see where each driver placed in a given season.</p>` +
      `<p><span class='bright'>${
        State.isMobile ? "Tap" : "Click"
      } on a driver's name</span> to take a closer look at their career.</p>`,
    // legend: "Championship won: <span class='champion'>&nbsp;</span>",
    legend: "",
    drivers: {
      "Michael Schumacher": "*** *** ***",
      "Damon Hill": "*** *** ***",
      "Jacques Villeneuve": "*** *** ***",
      "Mika Häkkinen": "*** *** ***",
      "Fernando Alonso":
        "Fernando Alonso is a 2-time World Champion, winning for Renault in 2006 and 2007.",
      "Kimi Räikkönen": "*** *** ***",
      "Lewis Hamilton": "*** *** ***",
      "Jenson Button": "*** *** ***",
      "Sebastian Vettel": "*** *** ***",
      "Nico Rosberg": "*** *** ***",
      "Max Verstappen": "*** *** ***",
    },
  },
  Scene3: {
    description: () => {
      const threeWay = [1950, 1951, 1956, 1959, 1964, 1968, 1974, 1981, 1982, 1983, 1986, 2003, 2007];
      const yearLink = (y) => `<span class='clickable' onclick='showYear(${y})'>${y}</span>`;
      return (
        "<p>Every Formula 1 season from 1950 to 2024. " +
        `<span class='bright'>${State.isMobile ? "Tap" : "Click"} a year</span> to see the race-by-race points battle between the champion and the runner-up.</p>` +
        "<p>The driver with the most points at the end of the season is World Champion. The points system has changed many times — in the 1950s a win earned just 8 points, and only the best results counted toward the total. The modern scheme, in place since 2010, awards <span class='bright'>25 points for a win</span>, 18 for second, down to 1 point for 10<sup>th</sup>.</p>" +
        "<p>Most seasons come down to two drivers. Thirteen saw a genuine <span class='bright'>three-way fight</span> into the final race: " +
        threeWay.map(yearLink).join(", ") + ". " +
        `${yearLink(2010)} stands alone as the only <span class='bright'>four-way finale</span> in F1 history, with Vettel, Alonso, Webber, and Hamilton all in mathematical contention at Abu Dhabi.</p>` +
        `<p>In the early years of the sport, <span class='bright'>shared drives</span> were permitted: two drivers could take turns in the same car during a race and split the championship points. This occurred in ${yearLink(1951)}, ${yearLink(1956)}, and ${yearLink(1957)}.</p>`
      );
    },
    legend: "",
    years: {
      2012: {
        summary: "2012 season summary",
        description:
          "Vettel entered the final race of the season with a thirteen-point lead over Alonso. Alonso needed a podium finish to stand any chance of becoming World Drivers' Champion, but in a race of attrition that finished under the safety car, Vettel finished in sixth place, scoring enough points to win his third consecutive championship, becoming just the third driver in the sport's sixty-three-year history to do so.",
      },
      2016: {
        summary: "2016 season summary",
        description:
          "Nico Rosberg won his only World Drivers' Championship title in the final race of the season. With nine wins and seven other podiums, Rosberg beat teammate and defending World Champion Lewis Hamilton by five points. In doing so, Rosberg followed the success of his father in 1982 and became the second son of a champion to become champion himself, a feat previously achieved by Damon Hill in 1996. Rosberg announced his retirement from the sport shortly after winning the title.",
      },
      2021: {
        summary: "2021 season summary",
        description:
          "The season ended with a controversial finish, with the two title rivals for the drivers' crown entering the last race of the season with equal points. Verstappen sealed the title after winning the season-ending Abu Dhabi Grand Prix after a last-lap restart pass on Hamilton following a contentious conclusion of a safety car period.",
      },
    },
  },
  Credits: {
    dataNotes:
      "<a target='_blank' href='https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020'>Source dataset (1950–2024)</a>; <a target='_blank' href='https://github.com/anarseyf/f1-explorer'>source code</a>.",
    author:
      "<p>Created by <a target='_blank' href='https://www.linkedin.com/in/anarseyf/'>Anar Seyf</a> in 2022. Updated in 2026 using <a target='_blank' href='https://claude.ai/code'>Claude Code</a>.</p>",
  },
};
