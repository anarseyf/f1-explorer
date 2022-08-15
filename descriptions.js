const Descriptions = {
  Intro: {
    description:
      "<p>Learn about the history of the <a target='_blank' href='https://www.formula1.com/'>Formula 1 World Championship</a>, the drivers who have reached the top in the sport, and what makes up a season of racing with this interactive document.</p>" +
      "<p>The explorer consists of three sections: <a href='#Scene1'>Drivers' Champions 1950-2021</a>, <a href='#Scene2'>Modern Era Champions</a>, and <a href='#Scene3'>Epic Seasons</a>.</p>" +
      "<p>As you explore each section, details will be shown in the sidebar.</p>",
    legend:
      "<p>Legend:</p>" +
      "<p></span> Grand Prix (an individual race): <span class='race'></span><br>" +
      "Season (a year of races): <span class='championship'>&nbsp;</span><br>" +
      "Gold color indicates a title win: <span class='champion'>&nbsp;</span><br>" +
      "or a race win: <span class='race gold'></span></p>",
  },
  Sidebar: {
    hint: "<em>Select a name or a year in each section. Details will be revealed here.</em>",
  },
  Scene1: {
    description:
      "<p>The F1 Drivers' Championship started in 1950 with only 7 races. The seasons have grown steadily over the years, and today the Formula 1 championship features over 20 races each year.</p>" +
      "<p>Start by exploring the timeline of all completed championships between 1950 and today. Notice that some years (like <span class='bright'>2012</span>) are highly competitive, while others (like <span class='bright'>2013</span>) are dominated by a single driver.</p>" +
      "<p><span class='bright'>Click on the name</span> of a world champion to reveal their win pattern over the years, as well as career statistics in the sidebar.</p>" +
      "<p>In the <a href='#Scene2'>next section</a> we'll take a closer look at the World Champions of the last three decades.</p>",
    legend: "<span class='race highlight thatyear'></span> races won by that year's champion",
  },
  Scene2: {
    description: () =>
      "<p>These are the drivers who have won at least one World title from 1994 to today. Their careers are summarized in this interactive timeline. The two most successful drivers of all time are <span class='bright'>Michael Schumacher</span> and <span class='bright'>Lewis Hamilton</span>, with 7 titles each.</p>" +
      "<p>A rare few find ultimate success early, while others take years to achieve their first (and sometimes only) title. Compare Hamilton and <span class='bright'>Nico Rosberg</span>: the former came within one point of winning in his rookie season (2007) and did become champion the following year, while the latter took over a decade (and quit immediately after reaching his goal in 2016).</p>" +
      `<p><span class='bright'>${
        State.isMobile ? "Tap" : "Mouse-over"
      } on the timeline</span> to see where each driver placed in a given season.</p>` +
      `<p><span class='bright'>${
        State.isMobile ? "Tap" : "Click"
      } on a driver's name</span> to take a closer look at their career.</p>`,
    legend: "Championship won: <span class='champion'>&nbsp;</span>",
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
    description:
      "<p>These were some of the most memorable seasons in recent years. Each title was contested all the way to the last race.</p>" +
      "<p>The driver with the most points at the end of a season is that year's World Champion. The points system has changed over the years, with the current scheme awarding <span class='bright'>25 points for a race win</span>, 18 points for second place, and on down to a single point for 10<sup>th</sup>.</p>" +
      "<p><span class='bright'>Click on a year</span> to see the race-by-race rivalry between the eventual champion and the runner-up.</p>",
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
      "<a target='_blank' href='https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020'>Source dataset</a>; <a target='_blank' href='https://github.com/anarseyf/f1-explorer'>source code</a>.",
    author:
      "<p>Created by <a target='_blank' href='https://www.linkedin.com/in/anarseyf/'>Anar Seyf</a> in 2022.</p>",
  },
};
