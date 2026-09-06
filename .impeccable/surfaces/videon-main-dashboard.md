---
version: 1
slug: "videon-main-dashboard"
primary_target: "videon/main-dashboard"
related_targets: ["videon/landing"]
---

# Surface brief — main-dashboard (Videon console)

Scope: authenticated console — layout shell, sidebar nav, overview page (metrics, ranked videos, learn cards). Visitor mode: Operate (frequent task use).

Audience: logged-in developers/managers running video workloads. Job: understand state at a glance (storage, minutes, videos), reach any task fast. Action: navigate via sidebar, read metrics, open videos. Proof/content: real SDK data via react-query (metrics, per-day minutes, video list, usage) — all bindings must keep working. Constraints: keep all data logic and routes intact; dark-first theme (`ThemeProvider defaultTheme="dark"`); remove emoji-as-icon and multi-color accents; logo asset; Clerk user menu.

Chosen direction: SIGNAL — calibrated instrument world (inherits landing, locked by user, concept-seed 10d8b3a0). Memorable moment: sidebar as a channel bank with tally-rule active state; usage meter as a graticuled readout in Martian Mono.

Unresolved decisions: none blocking.

## Direction contract

THESIS: the console is a broadcast instrument rack, not a generic admin sidebar. It refuses the scattered blue/green/purple accent + emoji default; state is conveyed by mono numerals, tally rules, and hairline instrument panels.

OWN-WORLD: ink ground already set; sidebar = channel bank with grouped nav, active = signal-green tally rule + inverted cell, mono labels; metric cards = frosted instrument panels with corner ticks and graticule hairlines; usage meter = horizontal graticule with signal-green fill; Martian Mono for every numeral.

STORY: "Read the state at a glance, act fast." Operators trust the readings.

FIRST VIEWPORT: shell — dark ink sidebar (channel bank, usage readout bottom-anchored, plan badge), main area = overview: mono kicker, greeting + date, 4 instrument-panel metric cards (signal numerals), daily-minutes bar chart re-styled in trace vocabulary (signal-green line/bars, hairline axes), ranked video table with mono rank numerals and encode-state tags, learn cards restyled as quiet instrument modules.

FORM: instrument rack / channel bank, same world as landing; seed 10d8b3a0; signature interaction = active channel tally + hover sweep on nav.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
