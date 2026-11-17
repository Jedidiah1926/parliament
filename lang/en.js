// 기본 제공 언어 팩: English — 형식은 커뮤니티 언어 팩(.json)과 똑같고, 데스크톱 앱(file://)에서도
// fetch 없이 읽을 수 있도록 JS로 감싸 두었다. 형식 설명은 README의 "번역(언어 팩) 만들기" 참고.
// keys(키 → 글자)는 lang/kr.js와 같은 키를 쓴다. 아직 키로 옮기지 않은 화면은 dict · patterns(한국어 원문 → 번역)로 번역한다.
window.HemiLangPacks = window.HemiLangPacks || {};
window.HemiLangPacks.en = {
 "format": "hemicycle-lang@2",
 "code": "en",
 "name": "English",
 "author": "Hemicycle",
 "months": [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
 ],
 "ordinal": "en",
 "keys": {
  "common.cancel": "Cancel",
  "common.date.era.y": "{era}{y}",
  "common.date.era.ym": "{era}{y}, {month}",
  "common.date.era.ymd": "{era}{y}, {month} {d}",
  "common.date.y": "{era}{y}",
  "common.date.ym": "{month} {era}{y}",
  "common.date.ymd": "{month} {d}, {era}{y}",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.hide": "Hide",
  "common.loading": "Loading...",
  "common.noResults": "No results.",
  "common.ok": "OK",
  "common.show": "Show",
  "common.source.mods": "Mods folder",
  "common.source.workshop": "Workshop",
  "home.lang": "Language",
  "home.lang.import": "Import Language Pack (.json)",
  "home.lang.importFailed": "Could not load the language pack: {error}",
  "home.lang.imported": "Loaded the language pack \"{name}\". Switch to this language now?",
  "home.lang.modsFolder": "Open mods folder",
  "home.lang.readFailed": "Could not read the language pack. (Not a valid JSON file)",
  "home.lang.remove": "Delete language pack",
  "home.lang.removeConfirm": "Delete the language pack \"{name}\"?",
  "home.lang.templateBlocked": "After the official release, translation templates can't be downloaded from this version — please use the Steam version.",
  "home.lang.templateEn": "Translation template (EN · English-based)",
  "home.lang.templateFailed": "Could not create the translation template.",
  "home.lang.templateKr": "Translation template (KR · Korean-based)",
  "home.menu": "Main menu",
  "home.menu.maker": "Create",
  "home.menu.makerDesc": "Make and manage maps · scenarios · challenges",
  "home.menu.settings": "Settings",
  "home.menu.settingsDesc": "Display · Theme",
  "home.menu.start": "Start",
  "home.menu.startDesc": "New game or continue",
  "home.news": "News",
  "home.news.steam": "Hemicycle on Steam",
  "home.news.steamDesc": "Wishlist · Workshop · Reviews",
  "home.news.trailer": "Hemicycle Trailer",
  "home.news.trailerDesc": "New video · Official trailer",
  "home.news.youtube": "Hemicycle on YouTube",
  "home.news.youtubeDesc": "@Hemicycles · updates and announcements",
  "home.stage.demo": "STEAM DEMO",
  "home.stage.demoTip": "This is the demo — the full game has more features",
  "home.stage.tip": "This is an open beta test — features and the save format may change",
  "home.subtitle": "Give me liberty, or give me death! : The invisible hand",
  "saveSelect.badge.fullOnly": "🔒 Full game",
  "saveSelect.badge.new": "New!",
  "saveSelect.badge.soon": "Coming soon",
  "saveSelect.badge.updated": "Updated!",
  "saveSelect.blank": "Blank Save",
  "saveSelect.blank.note": "Build your own country from scratch",
  "saveSelect.blank.placeholder": "e.g. Right after the 2nd general election",
  "saveSelect.blank.start": "Create & Start",
  "saveSelect.deleteConfirm": "Really delete \"{name}\"?\n\nThis can't be undone. (Shift+click to delete without this prompt)",
  "saveSelect.deleteFailed": "Couldn't delete. (storage error)",
  "saveSelect.deleteTip": "Delete (Shift+click: delete without confirming)",
  "saveSelect.deleteTitle": "Delete save",
  "saveSelect.demoImport": "Loading save files isn't available in the demo. (Available in the full game)",
  "saveSelect.demoTitle": "Demo",
  "saveSelect.districtFile": "This is a district preset (.hemimap). Open a save, then upload it with \"Upload district map\" in Country › District map to replace only that save's districts.",
  "saveSelect.empty.favorites": "Click ☆ to keep saves you open often here.",
  "saveSelect.empty.first": "No saves yet. Start one from \"Start New\".",
  "saveSelect.empty.rest": "No other saves.",
  "saveSelect.empty.saves": "No saves yet.",
  "saveSelect.fav.add": "Favorite",
  "saveSelect.fav.remove": "Remove from favorites",
  "saveSelect.favorites": "★ Favorites",
  "saveSelect.importFailed": "Couldn't load the save file. (Invalid format or corrupted file)",
  "saveSelect.importFile": "📁 Load save file (.hemi)",
  "saveSelect.importTooBig": "This file is too large to open here. Start the game and open it from Save › File › Load.",
  "saveSelect.maxSlots": "You can have up to {max} saves. Delete an existing save and try again.",
  "saveSelect.nameRequired": "Enter a save name.",
  "saveSelect.nameTaken": "A save named \"{name}\" already exists. Please enter a different name.",
  "saveSelect.presets": "Presets",
  "saveSelect.presets.empty": "No presets available.",
  "saveSelect.presets.note": "Picking one makes a copy as a new save",
  "saveSelect.saves": "Other saves",
  "saveSelect.search": "Search saves",
  "saveSelect.stories.campaigns": "Scenarios",
  "saveSelect.stories.challenges": "Challenges",
  "saveSelect.stories.makerList": "Creations ↗",
  "saveSelect.stories.note": "New plays start from a copy of the save. Deleting a creation keeps saves already in progress.",
  "saveSelect.stories.search": "Search scenarios · challenges",
  "saveSelect.tab.continue": "Continue",
  "saveSelect.tab.new": "Start New",
  "saveSelect.tab.stories": "Scenarios · Challenges",
  "saveSelect.tab.tutorial": "Tutorial",
  "saveSelect.tut.basic": "Basic lessons",
  "saveSelect.tut.basicNote": "New here? Go in order from #1",
  "saveSelect.tut.detail": "Advanced lessons",
  "saveSelect.tut.detailNote": "Pick just the features you need",
  "saveSelect.tut.doneTip": "Completed lesson",
  "saveSelect.tut.loadFailed": "Couldn't load the tutorial.",
  "stories.chooseStart.label": "Choose a starting country",
  "stories.chooseStart.title": "Which country do you want to start as?",
  "stories.deleteConfirm.campaign": "Delete the scenario “{title}”? This can't be undone. Saves of plays in progress are kept.",
  "stories.deleteConfirm.challenge": "Delete the challenge “{title}”? This can't be undone. Saves of plays in progress are kept.",
  "stories.deleteFailed": "Couldn't delete: {error}",
  "stories.deleteLabel": "Delete {title}",
  "stories.empty.campaign": "No saved scenarios. Make one in the maker or load a file.",
  "stories.empty.challenge": "No saved challenges. Make one in the maker or load a file.",
  "stories.err.badCondition": "A condition can't be read. Check it in the challenge maker.",
  "stories.err.noStartSave": "There is no starting save file. Choose one in the maker.",
  "stories.err.notChallenge": "This is not a challenge file.",
  "stories.kind.campaign": "Scenario",
  "stories.kind.challenge": "Challenge",
  "stories.listFailed": "Couldn't read the list. Please open the tab again.",
  "stories.noAuthor": "Unknown author",
  "stories.noDescription": "No description.",
  "stories.play": "▶ New play",
  "stories.untitled": "(untitled)",
  "settings.back": "← Main menu",
  "settings.display": "Display",
  "settings.display.borderless": "Borderless fullscreen",
  "settings.display.borderlessLocked": "🔒 Borderless fullscreen (app only)",
  "settings.display.count": "COUNT",
  "settings.display.countHint": "While counting, fill the hemicycle party by party from the left, or light up seats of the final layout in random order (also in Elections › Settings).",
  "settings.display.countRandom": "Random seat reveal",
  "settings.display.countSeq": "Fill in order",
  "settings.display.desc": "Choose how the window and screen elements are shown.",
  "settings.display.desktopOnly": "Only available in the desktop app",
  "settings.display.exec": "EXECUTE",
  "settings.display.execHint": "The \"PROTOCOL EXECUTE\" button under the edit panel. The seat view redraws by itself when you change settings, so it is hidden by default. Even when hidden, press Enter outside an input to redraw.",
  "settings.display.f11": "Press F11 to switch between fullscreen and windowed",
  "settings.display.f11Web": "F11 also switches between fullscreen and windowed · borderless fullscreen is desktop app only",
  "settings.display.fullscreen": "Fullscreen",
  "settings.display.noFullscreen": "Fullscreen isn't available in this browser (or screen) — try pressing F11",
  "settings.display.resBrowser": "The browser version uses the browser window size as it is — resolution can be chosen in the desktop app.",
  "settings.display.resCurrent": "Current window size {w} × {h}",
  "settings.display.resCurrentMax": "Current window size {w} × {h} (maximized)",
  "settings.display.resDesktopOnly": "🔒 Desktop app only",
  "settings.display.resFullHint": "Fullscreen and borderless fullscreen use the monitor resolution ({w} × {h}) — the chosen resolution applies when you go back to windowed mode.",
  "settings.display.resMonitor": "monitor resolution",
  "settings.display.resPick": "Choose a resolution",
  "settings.display.resScale": "scale {pct}%",
  "settings.display.resTooBig": "doesn't fit this monitor",
  "settings.display.resWindowedHint": "The screen size in windowed mode (monitor {w} × {h}{scale}). You can also drag the window border to resize it.",
  "settings.display.resolution": "RESOLUTION",
  "settings.display.tipGray": "Keep it grey",
  "settings.display.tipHint": "The colour of the tooltip that appears when you hover grey buttons or text in the Neon theme. Tooltips of coloured buttons (Legislation, Elections and so on) always follow the button's colour.",
  "settings.display.tipNeon": "Neon default colour",
  "settings.display.tooltip": "TOOLTIP",
  "settings.display.vote": "VOTE",
  "settings.display.voteClassic": "Classic",
  "settings.display.voteHint": "Classic: click yea · nay · abstain straight onto seats and finish with \"Confirm Vote\". Revamped: plan votes with seats and party lines, press \"Start Vote\" and members vote one by one at random moments, then the seats regroup into yea · nay · abstain.",
  "settings.display.voteNew": "Revamped",
  "settings.display.window": "WINDOW",
  "settings.display.windowed": "Windowed",
  "settings.etc": "Other settings",
  "settings.etc.available": "New version {latest} is out — download the new installer from the releases page to keep using the app.",
  "settings.etc.checkUpdate": "Check for updates",
  "settings.etc.checking": "Checking…",
  "settings.etc.chooseFolder": "Change location…",
  "settings.etc.debug": "DEBUG MODE",
  "settings.etc.defaultDir": "(default location)",
  "settings.etc.desc": "Other settings.",
  "settings.etc.dev": "DEVELOPER MODE",
  "settings.etc.devCode": "Developer code",
  "settings.etc.devHint": "Enter the developer code to open the next-update preview (teaser) screens.",
  "settings.etc.devIsOn": "Developer mode is on.",
  "settings.etc.devLocked": "The Teaser {id} screen can only be opened in developer mode.",
  "settings.etc.devOff": "Turn off",
  "settings.etc.devTurnedOff": "Turned off.",
  "settings.etc.devTurnedOn": "Developer mode turned on.",
  "settings.etc.devWrong": "Wrong code.",
  "settings.etc.downloaded": "Downloaded new version {latest} — the game will save, restart and install it.",
  "settings.etc.downloading": "Downloading new version {latest}… {percent}%",
  "settings.etc.hiddenGov": "Hidden forms of government",
  "settings.etc.hiddenGovHint": "Choosing Show lists the hidden forms of government that were only reachable through coups, revolutions or restorations (1.6.2 military government · 1.6.3 party-state · 1.6.6 absolute monarchy) under Cabinet › Government · Powers, so you can switch to them directly. Absolute monarchy only appears on the preview (teaser) screen that includes it.",
  "settings.etc.hiddenGovShow": "Show",
  "settings.etc.installUpdate": "Restart now to install",
  "settings.etc.installing": "Restarting to install new version {latest}…",
  "settings.etc.modeNotify": "Portable version — new versions are only announced (install with the installer for automatic updates)",
  "settings.etc.modeOff": "Development run — no update checks",
  "settings.etc.modeSteam": "Steam version — Steam handles updates",
  "settings.etc.movedDefault": "Moved the saves to the default location.",
  "settings.etc.movedNew": "Moved the saves to the new folder.",
  "settings.etc.openFolder": "Open folder",
  "settings.etc.realtime": "Real-time",
  "settings.etc.releases": "Releases page",
  "settings.etc.resetFolder": "Back to default",
  "settings.etc.saveDir": "SAVE FOLDER",
  "settings.etc.saveDirHint": "Saves are not kept inside the app but in this folder, one \"name.hemi\" file per save — back them up or copy them as they are, or open them on another device with \"Load\". .hemi files you put here in the file explorer show up as saves the next time you open the start screen, and saves deleted in the game go to the recycle bin. Changing the location moves your current saves to the new folder. (Folders that need administrator rights, like Program Files, can't be used)",
  "settings.etc.timeMode": "Time mode",
  "settings.etc.timeModeHint": "In turn-based mode you advance the date with the buttons on the date line. In real-time mode, set the date and then use play/pause and speeds 1–5 (Space toggles). Time stops while an event or settings check is open and pauses after loading. Scenarios follow the time mode their author chose.",
  "settings.etc.turn": "Turn-based",
  "settings.etc.unknownError": "unknown error",
  "settings.etc.upToDate": "You are up to date.",
  "settings.etc.upToDateV": "You are up to date ({latest}).",
  "settings.etc.update": "UPDATE",
  "settings.etc.updateError": "Couldn't check for updates ({error}).",
  "settings.etc.updateHint": "When a new version is posted on GitHub Releases you must update — the installed version downloads it automatically, saves, restarts and installs it, and the app can't be used until it is updated.",
  "settings.etc.version": "Current version {version}",
  "settings.nav": "Settings categories",
  "settings.theme": "Theme",
  "settings.theme.color": "THEME COLOR",
  "settings.theme.colorHint": "Applies to the accent colour of Neon mode (borders, text and so on)",
  "settings.theme.colorReset": "Reset to default",
  "settings.theme.dark": "Dark mode",
  "settings.theme.desc": "Light/Dark are clean screens without CRT effects; Neon is the original retro terminal look.",
  "settings.theme.light": "Light mode",
  "settings.theme.mode": "THEME MODE",
  "settings.theme.mods": "MOD THEMES",
  "settings.theme.neon": "Neon mode",
  "settings.theme.neonOnly": "(can only be changed in Neon mode)",
  "settings.theme.template": "THEME TEMPLATE",
  "settings.theme.templateBtn": "Download theme template (.json)",
  "settings.theme.templateHelp": "Set the id (lowercase letters · digits · - · _) and name, then change the colours in colors. base is one of light · dark · neon. Put this file in a folder and put that folder where the desktop app's main screen 🌐 > Open mods folder opens, and it appears in Settings > Theme > Mod themes.",
  "settings.theme.templateHint": "Downloads a theme file filled with the current theme's colours. Change the id, name and colours, then put it in its own folder inside the desktop app's mods folder and it shows up under \"Mod themes\".",
  "settings.theme.templateName": "My theme",
  "econ.budget.1": "Quantitative tightening",
  "econ.budget.2": "Temporary tax cut",
  "econ.budget.3": "Temporary tax hike",
  "econ.budget.4": "FY{y}",
  "econ.budget.5": "Turn {turn}",
  "econ.budget.6": "A budget bill is still being voted on — settle it in Legislation › Vote, then submit again.",
  "econ.budget.7": "Nothing has changed — adjust spending or tax rates in the Fiscal tab, then submit a budget.",
  "econ.budget.8": "in effect for {to}",
  "econ.budget.9": "(of GDP)",
  "econ.budget.10": "Article {v}. {label}: {GDP}",
  "econ.budget.11": "· tax law changes",
  "econ.budget.12": "{yearLabel} budget (No. {budgetNo}){taxChanged}",
  "econ.budget.13": "Budget",
  "econ.budget.14": "Tax law",
  "econ.budget.15": "There is no legislation screen, so the budget bill could not be submitted.",
  "econ.budget.16": "{title} submitted",
  "econ.budget.17": "“{title}” was put into Legislation › Submit. Once it passes it takes effect from the next {unit}; until then the previous budget (provisional budget) is used.\n\nIn the Fiscal tab, “Predicted vote” shows each party's expected vote so you can fill them in at once.",
  "econ.budget.19": "[Economy] {title} passed",
  "econ.budget.20": "vetoed",
  "econ.budget.21": "Rejected",
  "econ.budget.22": "{title} {vetoed} — provisional budget (previous budget) in effect",
  "econ.budget.23": "No budget bill is being voted on — submit a budget first.",
  "econ.budget.24": "Filled in each party's vote as predicted. Adjust any parties you want to change and confirm the vote.",
  "econ.budget.25": "Could not fill in the vote screen — please enter the votes in Legislation › Vote yourself.",
  "econ.budget.passed": "{title} passed — new budget in effect",
  "econ.budget.voteTip": "In government {gov} · spending preference {tag} · tax burden {tax}",
  "econ.chart.1": "Forecast 90% range",
  "econ.chart.2": "Choose a period — drag to pick the period to zoom into",
  "econ.chart.3": "Stacked bars",
  "econ.chart.4": "Spending {ts} · revenue {tr}",
  "econ.chart.5": "Spending",
  "econ.chart.6": "Spending {ts}{unit}",
  "econ.chart.7": "Revenue {tr}{unit}",
  "econ.chart.8": "← lower · raise →",
  "econ.chart.9": "Economic path — unemployment and inflation",
  "econ.chart.10": "Stagflation",
  "econ.chart.11": "Overheating",
  "econ.chart.12": "Slump",
  "econ.chart.13": "Stable",
  "econ.chart.14": "Now ({label})",
  "econ.currency.dollar": "dollars",
  "econ.currency.mark": "marks",
  "econ.date.1": "Turning the date back keeps the economy history — calculation continues from the current date",
  "econ.date.2": "(Only the most recent {RUN_MAX} is calculated at once; anything before that is skipped)",
  "econ.date.3": "The date moved forward by {gap}. Calculate the economy for that period?{RUN_MAX}\n\nIf you cancel, the economy stays as it is and calculation continues from the current date.",
  "econ.date.6": "months",
  "econ.date.9": "yr",
  "econ.def.1": "Army",
  "econ.def.2": "Navy · Air force",
  "econ.def.3": "Science",
  "econ.def.4": "Education",
  "econ.def.5": "Infrastructure",
  "econ.def.6": "Administration",
  "econ.def.7": "Policing",
  "econ.def.8": "Farm subsidies",
  "econ.def.9": "Welfare",
  "econ.def.10": "Health care",
  "econ.def.11": "Royal household",
  "econ.def.12": "Technology",
  "econ.def.13": "Human capital",
  "econ.def.14": "Military strength",
  "econ.def.15": "Public health",
  "econ.def.16": "Public order",
  "econ.def.17": "Income tax",
  "econ.def.18": "Corporate tax",
  "econ.def.19": "VAT",
  "econ.def.20": "Social insurance",
  "econ.def.21": "Tariffs",
  "econ.def.22": "Property tax",
  "econ.def.23": "Potential growth",
  "econ.def.24": "Natural unemployment",
  "econ.def.25": "Inflation",
  "econ.def.26": "Public mood",
  "econ.def.27": "Confidence",
  "econ.def.28": "1 month",
  "econ.def.29": "1 quarter",
  "econ.def.30": "1 year",
  "econ.disp.1": "Economy",
  "econ.disp.2": "Tag preferences",
  "econ.disp.3": "−2 dislike · 0 neutral · +2 like — empty cells come from the ideology (faded numbers). Members vote on budgets by the tags of the spending items.",
  "econ.disp.4": "Reset this party to ideology defaults",
  "econ.disp.5": "All",
  "econ.disp.6": "10 yrs",
  "econ.disp.7": "5 yrs",
  "econ.disp.8": "2 yrs",
  "econ.disp.9": "World › Economic regions — economic areas made of map zones",
  "econ.disp.10": "Economic regions ↗",
  "econ.disp.11": "Custom layout",
  "econ.disp.12": "Reset zoom",
  "econ.disp.13": "Save the whole economy view as a picture (PNG · JPG · SVG) — or right-click the view",
  "econ.disp.14": "Every point in time · indicator as CSV",
  "econ.disp.15": "Show large (Esc to return)",
  "econ.disp.16": "📷 Photo",
  "econ.disp.17": "⤡ Smaller",
  "econ.disp.18": "⛶ Larger",
  "econ.disp.19": "Could not draw the chart:",
  "econ.disp.20": "Economic warning signs",
  "econ.disp.21": "Off",
  "econ.disp.22": "Click for the {go} tab on the left · Shift + click for {v} details",
  "econ.disp.23": "Click a gauge to go to its tab on the left ·",
  "econ.disp.24": "Shift + click",
  "econ.disp.25": " for that indicator's details (forecast · related warnings · package policies)",
  "econ.disp.26": "Growth {growth} (year on year)",
  "econ.disp.27": "{debt} of GDP",
  "econ.disp.28": "{reserves} of GDP",
  "econ.disp.29": "Empty",
  "econ.disp.30": "Revenue (annual)",
  "econ.disp.31": "{rev} of GDP",
  "econ.disp.32": "Spending (annual)",
  "econ.disp.33": "{spend} of GDP",
  "econ.disp.34": "Fiscal deficit (annual)",
  "econ.disp.35": "Fiscal surplus (annual)",
  "econ.disp.36": "{balance} of GDP",
  "econ.disp.37": "Debt interest (annual)",
  "econ.disp.38": "Bond yield {yield}",
  "econ.disp.39": "Fiscal amounts",
  "econ.disp.40": "Trends",
  "econ.disp.41": "— click chips to choose indicators to overlay (same % scale) · dotted lines are forecasts",
  "econ.disp.42": "{label} forecast",
  "econ.disp.43": "Budget (annual · {unit})",
  "econ.disp.44": "— spending on top · revenue below, thickness = spending vs revenue gap",
  "econ.disp.45": "— spending and revenue on the same axis",
  "econ.disp.46": "of GDP",
  "econ.disp.47": "Show as budget hemicycle",
  "econ.disp.48": "Show as horizontal bars",
  "econ.disp.49": "The safe range widens with the growth trend (about the last 3 years), and prices swing harder the faster or hotter growth is — with the current growth trend of {v}, the safe ceiling is {hyper}",
  "econ.disp.50": "← Overview",
  "econ.disp.51": "Now {label}",
  "econ.disp.52": "If nothing changes, next 1 {unit}",
  "econ.disp.53": "{next} {next2}{dunit} · 50% range {nextLo} – {nextHi}",
  "econ.disp.54": "If nothing changes, in {yr}",
  "econ.disp.55": "unchanged",
  "econ.disp.56": "higher",
  "econ.disp.57": "lower",
  "econ.disp.58": "{yv} {yv2}{dunit} · vs now: {yv3}",
  "econ.disp.59": "{label} trend",
  "econ.disp.60": "— dotted line is the forecast if current policy is kept (dark band 50% · light band 90%)",
  "econ.disp.61": "Warning signs related to {label}",
  "econ.disp.62": "No related warning signs.",
  "econ.disp.63": "What moves it",
  "econ.disp.64": "— change in {label} after {yr} when changing one thing at a time",
  "econ.disp.65": "No policy moves it noticeably.",
  "econ.disp.66": "— this {unit} {used}/{lim} · numbers are {label} after {yr} (without it: {base})",
  "econ.disp.67": "later",
  "econ.disp.68": "tab — adjust directly →",
  "econ.disp.69": "Debt interest",
  "econ.disp.70": "Pensions · unemployment benefits",
  "econ.disp.71": "Other revenue",
  "econ.disp.72": "{label} forecast (median)",
  "econ.disp.73": "— shared crosshair · grey = recession (a stretch of negative growth) · drag the minimap below to zoom in",
  "econ.disp.74": "Growth (year on year, %)",
  "econ.disp.75": "Unemployment (%)",
  "econ.disp.76": "Inflation (%)",
  "econ.disp.77": "Policy rate · Bond yield (%)",
  "econ.disp.78": "— each {unit}'s growth (annualized) split by cause · line = growth in that period",
  "econ.disp.79": "Growth in that period (annualized)",
  "econ.disp.80": "Potential growth (technology · human capital · infrastructure)",
  "econ.disp.81": "Fiscal (spending · tax changes)",
  "econ.disp.82": "Monetary (real rate · QE)",
  "econ.disp.83": "Money supply",
  "econ.disp.84": "Exchange rate (exports)",
  "econ.disp.85": "Tax side effects",
  "econ.disp.86": "Unexpected shocks",
  "econ.disp.87": "Events (crisis · boom)",
  "econ.disp.88": "— log scale is in the Analysis tab",
  "econ.disp.89": "Annual money growth (%)",
  "econ.disp.90": "Money growth",
  "econ.disp.91": "Currency value (index, start = 100)",
  "econ.disp.92": "— expected + overheating + money + import prices + taxes · other + adjustment lag = actual inflation",
  "econ.disp.93": "Expected inflation",
  "econ.disp.94": "Demand pull (aggregate demand)",
  "econ.disp.95": "Excess money",
  "econ.disp.96": "Import prices (currency value)",
  "econ.disp.97": "Taxes · other",
  "econ.disp.98": "Adjustment lag",
  "econ.disp.99": "Economic path",
  "econ.disp.100": "— path joining the unemployment × inflation point of each {unit} (top right = stagflation)",
  "econ.disp.101": "Debt dynamics",
  "econ.disp.102": "— if r − g is positive, the debt ratio grows even with a primary balance of 0",
  "econ.disp.103": "National debt (% of GDP)",
  "econ.disp.104": "r − g (bond yield − nominal growth, %p)",
  "econ.disp.105": "Primary balance (excluding interest, % of GDP)",
  "econ.disp.106": "Primary balance",
  "econ.disp.107": "Rate spreads",
  "econ.disp.108": "— a growing risk premium means markets don't trust the bonds",
  "econ.disp.109": "Risk premium (bond − policy, %p)",
  "econ.disp.110": "Risk premium",
  "econ.disp.111": "Budget flow (annual · {unit})",
  "econ.disp.112": "— taxes → treasury → spending groups → items · width = amount",
  "econ.disp.113": "— spending (% of GDP) by group · line = revenue",
  "econ.disp.114": "— one circle = one district · size = population · color = public mood (blue good · red bad) · linked with the map",
  "econ.disp.115": "District Map — {mapBy}",
  "econ.disp.116": "Policy sensitivity — {label}",
  "econ.disp.117": "— change in {label} after {hz} when changing one lever (compared without noise)",
  "econ.disp.118": "Forecast fan — {label}",
  "econ.disp.119": "— if current policy is kept, dark band 50% · light band 90% range",
  "econ.disp.120": "— baseline 50 · built by spending and decays every year",
  "econ.disp.121": "— every point in time · indicator (CSV via the button above)",
  "econ.disp.122": "Choose charts to show in Economy › Analysis on the left.",
  "econ.disp.123": "Bond issuance",
  "econ.disp.124": "Treasury",
  "econ.disp.125": "Added to treasury",
  "econ.disp.126": "Pensions",
  "econ.disp.127": "Unemployment benefits",
  "econ.disp.128": "No district map — upload a map in Country › District map.",
  "econ.disp.129": "GDP per capita {v} (nationwide = 100)",
  "econ.disp.130": "Income level {v}",
  "econ.disp.131": "Bad",
  "econ.disp.132": "Good",
  "econ.disp.133": "No districts.",
  "econ.disp.134": "Nationwide 100",
  "econ.disp.135": "Population",
  "econ.disp.136": "Public mood bad",
  "econ.disp.137": "— coloring is set in Economy › Districts",
  "econ.disp.138": "— click a circle to edit that district",
  "econ.disp.139": "District table",
  "econ.disp.140": "District",
  "econ.disp.141": "Income",
  "econ.disp.142": "Agri · Manuf · Serv",
  "econ.disp.143": "Time",
  "econ.disp.144": "Growth%",
  "econ.disp.145": "Inflation%",
  "econ.disp.146": "Unemployment%",
  "econ.disp.147": "Policy rate%",
  "econ.disp.148": "Bond yield%",
  "econ.disp.149": "Debt%",
  "econ.disp.150": "Fiscal balance%",
  "econ.elect.1": "General election results applied",
  "econ.event.1": "Great Depression",
  "econ.event.2": "Financial crisis",
  "econ.event.3": "Oil shock",
  "econ.event.4": "Hyperinflation",
  "econ.event.5": "Sovereign default",
  "econ.event.6": "Economic collapse",
  "econ.event.7": "Disaster · war damage",
  "econ.event.8": "Boom",
  "econ.event.9": "Custom",
  "econ.event.10": "Weak",
  "econ.event.11": "Normal",
  "econ.event.12": "Strong",
  "econ.event.13": "Extreme",
  "econ.event.14": "Growth {fx}%/yr",
  "econ.event.15": "GDP {lvl}% at once",
  "econ.event.16": "Inflation {fx}%p",
  "econ.event.17": "Unemployment {u}%p",
  "econ.event.18": "Confidence {conf}",
  "econ.event.19": "Currency value {cur}%",
  "econ.event.20": "{pw}% of debt written off",
  "econ.event.21": "No effect",
  "econ.event.nowTip": "Start in the next {unit} calculation, regardless of the date",
  "econ.forecast.1": "Growth",
  "econ.forecast.2": "Unemployment",
  "econ.forecast.3": "Policy rate",
  "econ.forecast.4": "Bond yield",
  "econ.forecast.5": "Debt ratio",
  "econ.forecast.6": "Fiscal balance",
  "econ.forecast.7": "Currency value",
  "econ.forecast.8": "Policy rate +1%p",
  "econ.forecast.9": "Money printing rate +1%p",
  "econ.forecast.10": "Spending (% of GDP)",
  "econ.forecast.11": "Tax rates",
  "econ.forecast.12": "Quantitative easing",
  "econ.forecast.13": "Devaluation",
  "econ.group.civil": "Civil",
  "econ.group.defense": "Defense",
  "econ.group.welfare": "Welfare",
  "econ.log.1": "{keyNow} Q{keyNow2}",
  "econ.preset.1": "West Germany 1983",
  "econ.preset.2": "Federal Republic of Germany, 1983 — growth 1.6%, inflation 3.3%, unemployment about 9%, discount rate 4%, national debt about 39%, social market economy",
  "econ.preset.3": "Stable times",
  "econ.preset.4": "Inflation 2% · unemployment 4% · debt 50%",
  "econ.preset.5": "Postwar reconstruction",
  "econ.preset.6": "Inflation fixed at 40% for 4 turns, debt 180%, confidence 20",
  "econ.preset.7": "Bailout",
  "econ.preset.8": "Policy rate fixed at 15% for 8 turns, income tax 20% → 35% (4 turns)",
  "econ.preset.9": "War economy",
  "econ.preset.10": "Defense (army) spending fixed at 8% for 6 turns",
  "econ.rating.1": "Prime",
  "econ.rating.2": "High grade",
  "econ.rating.3": "Investment grade",
  "econ.rating.4": "Lower investment grade",
  "econ.rating.5": "Speculative",
  "econ.rating.6": "Default risk",
  "econ.rating.7": "Default",
  "econ.rating.8": "Negative real growth",
  "econ.rating.9": "Excessive deficit",
  "econ.rating.10": "Bloated reserves",
  "econ.rating.11": "Currency collapse risk",
  "econ.rating.12": "Near debt ceiling",
  "econ.rating.13": "Sovereign default",
  "econ.rating.14": "Capital flight",
  "econ.rating.15": "Withdrawing money",
  "econ.rating.16": "Almost none printed",
  "econ.rating.17": "High",
  "econ.rating.18": "Very high",
  "econ.region.1": "Nationwide",
  "econ.region.2": "and more",
  "econ.region.3": "New territory joined ({nameOf}{fresh2}) — unification cost adds +{cost}%p to national debt",
  "econ.rule.1": "Independent central bank — the rate is set automatically by the Taylor rule",
  "econ.rule.2": "Fixed by a scenario rule — {left} left",
  "econ.rule.nowAt": "Rules now at {unit} {n}",
  "econ.rule.periodTip": "Period ({unit})",
  "econ.rule.segsTip": "{unit} range:value, separated by commas",
  "econ.scale.eok": "×100M",
  "econ.scale.jo": "×1T",
  "econ.scale.man": "×10K",
  "econ.span.months": {"one": "{count} month", "other": "{count} months"},
  "econ.span.quarters": {"one": "{count} quarter", "other": "{count} quarters"},
  "econ.span.years": {"one": "{count} year", "other": "{count} years"},
  "econ.span.yearsAnd": "{years} {rest}",
  "econ.state.1": "Spending \"{name}\": asset ({asset}) does not exist, so asset building was turned off",
  "econ.state.2": "Tax \"{name}\": unknown side effect ({v}) was ignored",
  "econ.state.3": "Asset \"{name}\": unknown effect target ({v}) was ignored",
  "econ.state.4": "Circular asset references ({name}) — effects between these assets are off",
  "econ.tag.agriculture": "Agriculture",
  "econ.tag.education": "Education",
  "econ.tag.environment": "Environment",
  "econ.tag.industry": "Industry",
  "econ.tag.prestige": "Prestige",
  "econ.tag.science": "Science",
  "econ.tag.security": "Security",
  "econ.tag.welfare": "Welfare",
  "econ.turn.1": "Hyperinflation — inflation {infl}",
  "econ.turn.2": "Sovereign default crisis — debt {debt} (of GDP)",
  "econ.turn.3": "Great Depression — unemployment {unemp}",
  "econ.turn.4": "Capital flight — confidence {conf}, currency value plunges 15%",
  "econ.turn.5": "Currency collapse — money printing {print}/quarter",
  "econ.turn.6": "Public mood collapse ({mood}) — risk of coup · revolution",
  "econ.turn.7": "Credit rating {rating} → {rt} ({rt2})",
  "econ.turn.8": "{evName} ended",
  "econ.turn.9": "[Economy] {label}",
  "econ.turn.10": "Economy News",
  "econ.turn.11": "When public mood collapses, a coup or revolution can happen (jump there from the warnings in Economy › Overview).",
  "econ.ui.1": "Safe",
  "econ.ui.2": "Warning",
  "econ.ui.3": "Danger",
  "econ.ui.4": "Crisis",
  "econ.ui.5": "💹 Economy",
  "econ.ui.6": "Overview",
  "econ.ui.7": "Analysis",
  "econ.ui.8": "Monetary",
  "econ.ui.9": "Fiscal",
  "econ.ui.10": "Regions",
  "econ.ui.11": "Scenario",
  "econ.ui.12": "Events",
  "econ.ui.13": "Items",
  "econ.ui.14": "{print}%/quarter · {print2}",
  "econ.ui.15": "Planned economy",
  "econ.ui.16": "Mixed (planned side)",
  "econ.ui.17": "Mixed economy",
  "econ.ui.18": "Social market economy",
  "econ.ui.19": "Free market economy",
  "econ.ui.20": "If nothing changes, next",
  "econ.ui.21": "Now",
  "econ.ui.22": "Next",
  "econ.ui.23": "forecast (no noise)",
  "econ.ui.24": "Growth (year on year)",
  "econ.ui.25": "National debt (% of GDP)",
  "econ.ui.26": "The invisible hand — monetary and fiscal policy work differently in each district, and the results come back as public mood and in parliament. Every number can be edited directly, and the calculation only runs when the date (Country › Date) moves to the next",
  "econ.ui.27": ".",
  "econ.ui.28": "Credit rating — set by confidence and national debt",
  "econ.ui.29": "Recorded since {label}",
  "econ.ui.30": "Start",
  "econ.ui.31": "{label} · Follows the date",
  "econ.ui.32": "{turn} elapsed · set a date to follow it",
  "econ.ui.33": "Calculation step",
  "econ.ui.34": "▶ Next",
  "econ.ui.35": "Planned",
  "econ.ui.36": "Economic system",
  "econ.ui.37": "Market",
  "econ.ui.38": "Economic system — the planned side has low unemployment but low growth and efficiency; the market side has higher growth and bigger business cycles (default comes from the ruling party's ideology).",
  "econ.ui.39": "Public mood collapse (",
  "econ.ui.40": "— a coup or revolution can happen.",
  "econ.ui.41": "Coup tab",
  "econ.ui.42": "Revolution tab",
  "econ.ui.43": "No warning signs",
  "econ.ui.44": "Forecast",
  "econ.ui.45": "(no noise)",
  "econ.ui.46": "Debt",
  "econ.ui.47": "Budget",
  "econ.ui.48": "— applied through a budget bill",
  "econ.ui.49": "— applied immediately",
  "econ.ui.50": "Settings",
  "econ.ui.51": "Change budget · tax rates through a budget bill",
  "econ.ui.52": "— applied immediately under military rule · party-state",
  "econ.ui.53": "Reflect economic performance in support · district leanings",
  "econ.ui.54": "Open the Coup · Revolution tab right away when public mood collapses",
  "econ.ui.55": "World › Our country's ranking score follows GDP",
  "econ.ui.56": " package policy limit:",
  "econ.ui.57": "",
  "econ.ui.58": "Budget chart",
  "econ.ui.59": "Budget hemicycle",
  "econ.ui.60": "Two horizontal bars",
  "econ.ui.61": "📈 Show the economy view large",
  "econ.ui.62": "Open analysis",
  "econ.ui.63": "“{title}” is being voted on — the previous budget (provisional budget) applies until it passes",
  "econ.ui.64": "“{title}” rejected — running on the provisional (previous) budget. You can fix it in the Fiscal tab and submit again",
  "econ.ui.65": "{draftChanges} changes in the budget draft — \"Submit budget\" in the Fiscal tab",
  "econ.ui.66": "Budget No. {budgetNo} in effect · revenue {rev} · spending {spend} (of GDP)",
  "econ.ui.67": "Business cycle panel (growth · unemployment · inflation · rates)",
  "econ.ui.68": "Growth decomposition",
  "econ.ui.69": "Inflation panel (inflation · money growth · currency value)",
  "econ.ui.70": "Inflation decomposition",
  "econ.ui.71": "Economic path (unemployment × inflation)",
  "econ.ui.72": "Debt dynamics (debt · r − g · primary balance)",
  "econ.ui.73": "Rate spreads (policy · bond · risk premium)",
  "econ.ui.74": "Budget flow",
  "econ.ui.75": "Budget composition over time",
  "econ.ui.76": "Regional scatter",
  "econ.ui.77": "District Map",
  "econ.ui.78": "Policy sensitivity",
  "econ.ui.79": "Forecast fan (chosen indicator)",
  "econ.ui.80": "Asset trends",
  "econ.ui.81": "Data table",
  "econ.ui.82": "Business cycle",
  "econ.ui.83": "Inflation analysis",
  "econ.ui.84": "Fiscal health",
  "econ.ui.85": "Regional gaps",
  "econ.ui.86": "Policy lab",
  "econ.ui.87": "Assets",
  "econ.ui.88": "Expert analysis — drawn large in the right-hand view. All charts share the same period and crosshair; hover to see values at that point, drag the minimap to zoom into a period. Right-click to export a picture.",
  "econ.ui.89": "Custom",
  "econ.ui.90": "Pick and arrange charts below",
  "econ.ui.91": "Choose charts",
  "econ.ui.92": "Period",
  "econ.ui.93": "Log scale for inflation · money growth (for hyperinflation)",
  "econ.ui.94": "Sensitivity · forecast indicator",
  "econ.ui.95": "Sensitivity horizon",
  "econ.ui.96": "⛶ Full screen",
  "econ.ui.97": "Export CSV",
  "econ.ui.98": "Terms — r − g: bond yield − nominal growth (if positive, debt grows by itself) · risk premium: bond yield − policy rate · primary balance: fiscal balance excluding interest · real rate: policy rate − expected inflation",
  "econ.ui.99": "Monetary policy belongs to the central bank, so it takes effect immediately without a bill. Raising rates tames inflation but cuts investment and jobs; printing lots of money lifts the economy for now but wrecks prices and the currency.",
  "econ.ui.100": "Real rate",
  "econ.ui.101": "% (expected inflation",
  "econ.ui.102": "%) · bond yield",
  "econ.ui.103": "Independent central bank — the rate is set automatically by the Taylor rule (2 + inflation + ½(inflation − 2) + ½ output gap), confidence ↑",
  "econ.ui.104": "Money printing rate",
  "econ.ui.105": "%/quarter ·",
  "econ.ui.106": "Annual money growth",
  "econ.ui.107": "% · above 30%/quarter triggers a currency collapse crisis",
  "econ.ui.108": "Package policies",
  "econ.ui.109": "This",
  "econ.ui.110": ": printing +3%p, rates · bond yields ↓",
  "econ.ui.111": ": printing −2%p, rates ↑",
  "econ.ui.112": "Currency value −12%, exports (manufacturing regions) ↑ · import prices ↑ · confidence ↓",
  "econ.ui.113": "In progress:",
  "econ.ui.114": "{type} ({left} left)",
  "econ.ui.115": "You can use up to {pkgLimit} package policies this {unit}.",
  "econ.ui.116": "Devaluation — currency value −12%",
  "econ.ui.117": "Other",
  "econ.ui.118": "Spending is set as a % of GDP.",
  "econ.ui.119": "Edited values gather in the",
  "econ.ui.120": "budget draft",
  "econ.ui.121": " and take effect once the budget passes in parliament (until then, the previous budget).",
  "econ.ui.122": "Edited values take effect immediately (you can switch to the budget bill method in Settings).",
  "econ.ui.123": "Fiscal deficit",
  "econ.ui.124": "Fiscal surplus",
  "econ.ui.125": "of GDP ·",
  "econ.ui.126": "Revenue",
  "econ.ui.127": "· spending",
  "econ.ui.128": "(mandatory spending",
  "econ.ui.129": "· balance under the draft {totalSpend}%",
  "econ.ui.130": "Submit budget",
  "econ.ui.131": "({changes} items)",
  "econ.ui.132": "Discard draft",
  "econ.ui.133": "Fill Legislation › Vote with predicted votes",
  "econ.ui.134": "Predicted vote",
  "econ.ui.135": "— House: about",
  "econ.ui.136": " seats yea · about",
  "econ.ui.137": " seats",
  "econ.ui.138": "Party",
  "econ.ui.139": "Prediction",
  "econ.ui.140": "Score",
  "econ.ui.141": "Expected defections",
  "econ.ui.142": "Yea",
  "econ.ui.143": "Nay",
  "econ.ui.144": "Abstain",
  "econ.ui.147": "{defect}/{members}",
  "econ.ui.148": "Score = in government (ruling +1 · confidence and supply +0.6 · opposition −0.5) + spending tag preferences + tax burden. District members can break with the party line over local interests (industry · income). Edit preferences in the Items tab.",
  "econ.ui.149": "Cut this group's spending by 15%",
  "econ.ui.150": "Austerity −15%",
  "econ.ui.151": "In effect",
  "econ.ui.152": "% → Draft",
  "econ.ui.153": "Mandatory spending",
  "econ.ui.154": "Calculated automatically · rules change only by law",
  "econ.ui.155": "Debt interest (debt × bond yield)",
  "econ.ui.156": "Pensions (elderly population)",
  "econ.ui.157": "Unemployment benefits (unemployed)",
  "econ.ui.158": "Too high and revenue actually falls (Laffer curve)",
  "econ.ui.159": "Revenue",
  "econ.ui.160": "Temporary tax cut (",
  "econ.ui.161": "Temporary tax hike (",
  "econ.ui.162": "Tribute from dependencies",
  "econ.ui.163": "Treasury · debt",
  "econ.ui.164": "Treasury (reserves)",
  "econ.ui.165": "· of GDP",
  "econ.ui.166": "National debt",
  "econ.ui.167": "Fiscal balance (annual)",
  "econ.ui.168": "Deficit",
  "econ.ui.169": "Surplus",
  "econ.ui.170": "Repay debt",
  "econ.ui.171": "Invest in infrastructure",
  "econ.ui.172": "Surpluses repay debt automatically",
  "econ.ui.173": "Debt ceiling",
  "econ.ui.174": "None",
  "econ.ui.175": "Above it, bond issuance stops — forced austerity · shutdown",
  "econ.ui.176": "{v} austerity −15%",
  "econ.ui.177": "Repaid {v}%p of debt from the treasury",
  "econ.ui.178": "Invested {v}%p of the treasury in infrastructure",
  "econ.ui.179": "GDP per capita",
  "econ.ui.180": "Income level",
  "econ.ui.181": "Main industry",
  "econ.ui.182": "Each district has its own industry mix, age structure and income level, so the same policy works differently (rate hikes hit manufacturing, welfare cuts hit low incomes, devaluation helps export manufacturing regions). Unrecovered territory and dependency land are left out of national totals.",
  "econ.ui.183": "Map coloring",
  "econ.ui.184": "There are no districts, so the country is calculated as one — upload a map in Country › District map to calculate each district.",
  "econ.ui.185": "Per capita",
  "econ.ui.186": "· unemployment",
  "econ.ui.187": "% · public mood",
  "econ.ui.188": "· income",
  "econ.ui.189": "Agriculture",
  "econ.ui.190": "Manufacturing",
  "econ.ui.191": "Services",
  "econ.ui.192": "Youth",
  "econ.ui.193": "Working age",
  "econ.ui.194": "Elderly",
  "econ.ui.195": "Unemployment %",
  "econ.ui.196": "Industry and age shares are adjusted to add up to 1 · population comes from \"Citizens / population\" in Country › District map",
  "econ.ui.197": "Spending · {name}",
  "econ.ui.198": "Tax rate · {name}",
  "econ.ui.199": "Build a scenario from \"value + duration\", not just starting values — fixed (locked) holds the value for the period, transition goes gradually from A → B, schedule (segments) uses a different value per",
  "econ.ui.200": ". When the period ends, values go back to being calculated. Policies tied to fixed values are locked.",
  "econ.ui.201": "Presets",
  "econ.ui.202": "Choosing one restarts the economy from scratch",
  "econ.ui.203": "Default",
  "econ.ui.204": "Basic economy with no rules",
  "econ.ui.205": "Rules",
  "econ.ui.208": "Fixed",
  "econ.ui.209": "Transition",
  "econ.ui.210": "Schedule",
  "econ.ui.211": "Start value only",
  "econ.ui.212": "End",
  "econ.ui.213": "{rule} left",
  "econ.ui.214": "Ended",
  "econ.ui.215": "Delete rule",
  "econ.ui.216": "No rules.",
  "econ.ui.217": "Restart the rules' periods from now",
  "econ.ui.218": "+ Add rule",
  "econ.ui.219": "Restart count from now",
  "econ.ui.220": "Crisis thresholds",
  "econ.ui.221": "Hyperinflation (inflation above %/yr)",
  "econ.ui.222": "Sovereign default crisis (debt above %)",
  "econ.ui.223": "Great Depression (unemployment above %)",
  "econ.ui.224": "Capital flight (confidence below)",
  "econ.ui.225": "Currency collapse (printing above %/quarter)",
  "econ.ui.226": "Coup · revolution risk (public mood below)",
  "econ.ui.227": "Display",
  "econ.ui.228": "Currency",
  "econ.ui.229": "Scale",
  "econ.ui.230": "(None)",
  "econ.ui.231": "Changing it scales district GDP by the same ratio",
  "econ.ui.232": "Restart economy (clears history)",
  "econ.ui.233": "Restart the economy from scratch as \"{v}\". The economy history will be cleared. Continue?",
  "econ.ui.234": "Clear all economy history and start over. Continue?",
  "econ.ui.235": "In progress",
  "econ.ui.236": "Past",
  "econ.ui.237": "Planned",
  "econ.ui.238": "This time",
  "econ.ui.239": "{left} yr",
  "econ.ui.240": "{left} mo",
  "econ.ui.241": "in {left}{left2}",
  "econ.ui.242": "On the chosen date an economic crisis or boom happens — it starts when the date (Country › Date) passes that month and lasts for the chosen period. At the start, confidence and currency value take a one-time hit; during the period it pushes growth, inflation and unemployment. (Separate from crises that come on their own when thresholds are crossed)",
  "econ.ui.243": "Set Country › Date first — events happen by date.",
  "econ.ui.244": "New event",
  "econ.ui.245": "Set the name and effects yourself",
  "econ.ui.246": "Name",
  "econ.ui.247": "e.g. Great famine",
  "econ.ui.248": "Growth (%/yr, during the period)",
  "econ.ui.249": "Inflation (%p, during the period)",
  "econ.ui.250": "Unemployment (%p, during the period)",
  "econ.ui.251": "Confidence (at the start)",
  "econ.ui.252": "Currency value (%, at the start)",
  "econ.ui.253": "Start year",
  "econ.ui.254": "Start month",
  "econ.ui.255": "Month",
  "econ.ui.256": "Duration (months)",
  "econ.ui.257": "Intensity",
  "econ.ui.258": "+ Add event",
  "econ.ui.259": " right away",
  "econ.ui.260": "Event list",
  "econ.ui.261": "By date · before it happens you can change date · duration · intensity",
  "econ.ui.262": "Delete — stops here if in progress",
  "econ.ui.263": "Delete",
  "econ.ui.264": "No events yet.",
  "econ.ui.265": "Event",
  "econ.ui.266": "That date has already passed — set it after the next calculation period. (To trigger it right away, use \"Next … right away\")",
  "econ.ui.267": "Spending items",
  "econ.ui.268": "Taxes",
  "econ.ui.269": "Built-in items are hidden and can be restored under \"Hidden built-ins\" below.",
  "econ.ui.270": "Delete {kind} \"{name}\"?{kind2}",
  "econ.ui.271": "Manufacturing regions",
  "econ.ui.272": "Industrial regions",
  "econ.ui.273": "High-income regions",
  "econ.ui.274": "The wealthy",
  "econ.ui.275": "All regions equally",
  "econ.ui.276": "Imports",
  "econ.ui.277": "Group",
  "econ.ui.278": "Tags",
  "econ.ui.279": "Base spending %",
  "econ.ui.280": "Cap %",
  "econ.ui.281": "Unemployment effect",
  "econ.ui.282": "Public mood effect",
  "econ.ui.283": "Diminishing returns",
  "econ.ui.284": "Builds asset",
  "econ.ui.285": "Base tax rate %",
  "econ.ui.286": "Tax base (share of GDP)",
  "econ.ui.287": "Regional burden",
  "econ.ui.288": "Growth side effect /%p",
  "econ.ui.289": "Inflation /%p",
  "econ.ui.290": "Remove effect",
  "econ.ui.291": "Depreciation /yr",
  "econ.ui.292": "Effects (per point above the baseline of 50)",
  "econ.ui.293": "+ Effect",
  "econ.ui.294": "Reset to default",
  "econ.ui.295": "Save",
  "econ.ui.296": "Cancel",
  "econ.ui.297": "Edited",
  "econ.ui.298": "Edit",
  "econ.ui.299": "Hidden built-ins",
  "econ.ui.300": "Restore",
  "econ.ui.301": "You can create your own spending items, taxes and assets. They are calculated by the same rules as the built-ins (diminishing returns · depreciation), and their definitions are stored in the save. Members react not to an item's name but to its",
  "econ.ui.302": ".",
  "econ.ui.303": "No tags",
  "econ.ui.304": "{group} · {tags} · base {s0}%{asset}",
  "econ.ui.305": "Space program",
  "econ.ui.306": "Civil",
  "econ.ui.307": "Science, Prestige",
  "econ.ui.308": "+ New spending item",
  "econ.ui.309": "Unemployment change in %p per extra 1%p of spending above base (negative = falls)",
  "econ.ui.310": "Space technology",
  "econ.ui.311": "+ New asset",
  "econ.ui.312": "New asset name",
  "econ.ui.313": "Effect target",
  "econ.ui.314": "per point above the baseline (50)",
  "econ.ui.315": "Effect coefficient",
  "econ.ui.316": "Add item",
  "econ.ui.317": "Base {rate0}% · base {base}% of GDP · {weight}",
  "econ.ui.318": "Carbon tax",
  "econ.ui.319": "+ New tax",
  "econ.ui.320": "Add tax",
  "econ.ui.321": "{assets} pts · depreciation {decay}%/yr · {name}",
  "econ.ui.322": "Baseline is 50 — the higher, the stronger the effect",
  "econ.ui.323": "Starting value",
  "econ.ui.324": "Built by spending item",
  "econ.ui.325": "(now: {asset})",
  "econ.ui.326": "Add asset",
  "econ.ui.327": "Party tag preferences",
  "econ.ui.328": "How much each party likes each tag (",
  "econ.ui.329": ") — used for the budget bill's predicted vote. The table is wide, so edit it in the \"Tag preferences\" tab of the right-hand view.",
  "econ.ui.330": "Open tag preferences →",
  "econ.ui.331": "Please enter an item name.",
  "econ.ui.332": "{name} asset",
  "econ.ui.333": "Please enter an asset name.",
  "econ.ui.334": "Please enter a tax name.",
  "econ.ui.335": "Please enter a name.",
  "econ.ui.tagsTip": "Separated by commas — built-in tags: {tags}",
  "econ.unit": "{scale} {cur}",
  "econ.unit.month": "month",
  "econ.unit.quarter": "quarter",
  "econ.unit.year": "year",
  "tut.assembly.1": "Chambers and coalitions",
  "tut.assembly.2": "Unicameral · bicameral · tricameral · presiding officers · hemicycle center · coalition government",
  "tut.assembly.3": "Chambers",
  "tut.assembly.4": "In Parliament › Seats · Chambers choose unicameral, bicameral or tricameral. Added chambers appear across seats · chambers, voting, elections and the visual views. Chamber names (e.g. National Assembly · Senate) are changed in Parliament › Seats · Chambers.",
  "tut.assembly.5": "Speakers",
  "tut.assembly.6": "Set the names and photos of each chamber's speaker and deputy speakers. You can have several deputies, and presiding officers appear below the chamber overview on the visual screen.",
  "tut.assembly.7": "Hemicycle center",
  "tut.assembly.8": "For each chamber, choose whether the center of the hemicycle shows the total seat count or the chamber's logo image. Click the logo box to upload an image, then choose \"Logo\".",
  "tut.assembly.9": "Government & Coalitions",
  "tut.assembly.10": "In Parliament › Government & Coalitions you group parties into a coalition government. Set the ruling coalition (★) and its lead party, plus parties supporting it from outside (confidence and supply), or leave it as single-party or no government. The governing side gets a gold outline in the hemicycle (\"Highlight government\" in Parliament › Speakers · Display).",
  "tut.assembly.11": "District members · list members",
  "tut.assembly.12": "Fill in each member's name and photo in Parliament › District Members and List Members. Mark a district member as vacant and you can hold a by-election for just that seat in Elections › General.",
  "tut.cabinet.1": "Cabinet",
  "tut.cabinet.2": "PM and leaders · cabinet members · cabinet view",
  "tut.cabinet.3": "Who becomes PM?",
  "tut.cabinet.4": "In Cabinet › Government · Powers you choose the form of government — presidential, semi-presidential, parliamentary and so on. West Germany is parliamentary, so the leader of the largest party automatically becomes prime minister (👑). In West Germany this post is called \"Federal Chancellor\" — post titles can be set per country.",
  "tut.cabinet.5": "Choosing the majority leader",
  "tut.cabinet.6": "Party leaders are set in Parliament › Party › Leader. Enter the name of the leader of the largest party{name}. (The Federal Chancellor in 1983 was Helmut Kohl)",
  "tut.cabinet.7": "Leader set. They now appear as PM in Cabinet › PM too.",
  "tut.cabinet.8": "Adding a cabinet member",
  "tut.cabinet.9": "Add cabinet members such as ministers in Cabinet › Cabinet Members. Press \"[+] Add Cabinet Member\".",
  "tut.cabinet.10": "A cabinet seat was added. You can fill in the name, position and party.",
  "tut.cabinet.11": "Cabinet view",
  "tut.cabinet.12": "The \"Cabinet\" tab of the seat screen shows the PM and cabinet at a glance. Export it as an image with right-click (long-press).",
  "tut.citizens.1": "Citizens · immigrants",
  "tut.citizens.2": "Citizens / population per district · immigrant voting rights per election · immigrant lean",
  "tut.citizens.3": "Citizens and immigrants",
  "tut.citizens.4": "The district list in Country › District map has a \"Citizens\" field before population — write \"citizens / population\" and the rest are immigrants. Leave it blank and the whole district population is citizens.",
  "tut.citizens.5": "Entering citizens",
  "tut.citizens.6": "Enter a number smaller than the population in any district's \"Citizens\" field (e.g. 900,000 for a population of 1 million). If population is empty, enter the population first.",
  "tut.citizens.7": "That district now has immigrants. The total row above the list and the top of Country › People show citizens · population · immigrants.",
  "tut.citizens.8": "Immigrant voting rights",
  "tut.citizens.9": "Citizens vote in every election. For immigrants, whether they vote is set per election — presidential · direct PM / general / local / referendum — at the bottom of Elections › Electoral system. Turn one on.",
  "tut.citizens.10": "Changed. In the elections you turned on, citizens and immigrants vote together.",
  "tut.citizens.11": "Immigrant lean",
  "tut.citizens.12": "With \"Set citizen / immigrant lean separately\" in Opinion › Overview on (on by default), you set immigrant lean in the Immigrant lean · Immigrant support tabs on the same screens as citizens. In elections where immigrants vote, each district counts citizens and immigrants mixed by their numbers (general election lists and presidential use national numbers), and local elections · referendums change their voter counts too. Turn it off and the immigrant tabs merge with the citizen tabs, so immigrants vote with the same lean as citizens.",
  "tut.coup.1": "Military and coups",
  "tut.coup.2": "Military command · loyalty · coups · military rule · return to civilian rule",
  "tut.coup.3": "Military",
  "tut.coup.4": "Cabinet › Military sets the military command — defense minister · chairman of the joint chiefs · army, navy and air force chiefs of staff. Each commander has a loyalty to the government (0–100), and the lower it is, the easier a military coup succeeds.",
  "tut.coup.5": "Creating the military command",
  "tut.coup.6": "Press \"Create default military command\" to fill it. (If it already exists, just move on)",
  "tut.coup.7": "The military command was created. Names · titles · loyalty can be changed any time.",
  "tut.coup.8": "Coup",
  "tut.coup.9": "Cabinet › Coup chooses who leads it — the military (led by commanders) · a party (the opposition teaming up with the army) · a self-coup (the president seizing more power). The chance of success depends on the ruling side's seats · support · martial law · the army's loyalty, shown factor by factor.",
  "tut.coup.10": "Launching a coup",
  "tut.coup.11": "Try launching a coup. Success or failure, it's fine — this country is a copy.",
  "tut.coup.12": "The result is in. Success brings martial law · a suspended parliament · banned opposition parties; failure brings punishment of the plotters and falling support.",
  "tut.coup.13": "Military rule and after",
  "tut.coup.14": "A successful military coup leads to the hidden form of government \"military rule\" — the head of the military council is both president and PM, and elections stop. Military rule can end through a return to civilian rule (elections resume) · a counter-coup · a revolution.",
  "tut.date.1": "Advancing the date · next session · settings panel · automatic progression",
  "tut.date.2": "Advancing the date",
  "tut.date.3": "On the date line, ▶ advances a day, ▶▶ a week and ▶▶▶ a month, following the real calendar including month ends and leap years. Try pressing one now.",
  "tut.date.4": "The date moved forward.",
  "tut.date.5": "Next session",
  "tut.date.6": "Use the \"Next: Regular / Next: Extraordinary\" button to choose what kind the next session will be (the current one stays as is), and \"Next session\" raises the session number and applies the chosen kind.",
  "tut.date.7": "Date & session settings",
  "tut.date.8": "⚙ opens this panel. Set the date by year · month · day, and optionally put an era name in front (e.g. Reiwa → \"Reiwa 1, April 20\") — leave it blank to show just the year. For the session, set the term, name, session number and the current session type.",
  "tut.date.9": "Automatic progression",
  "tut.date.10": "With \"Automatic progression\" on, passing the regular-session start date (Sep 1 by default) while advancing the date opens the next session as a regular session, and applying a lower-house general election raises the term by one. Both can be switched on or off.",
  "tut.economy.1": "Economy",
  "tut.economy.2": "An economy that follows the date · credit rating and warning signs · gauges and amounts · trends · monetary · fiscal and budget bills · events · expert analysis · regions · scenarios",
  "tut.economy.3": "The invisible hand",
  "tut.economy.4": "Menu › Economy runs the country's economy. The West Germany tutorial starts with the 1983 West German economy (growth 1.6% · inflation 3.3% · unemployment about 9%). The badge at the top left is the credit rating (AAA – D).",
  "tut.economy.5": "Follows the date",
  "tut.economy.6": "The economy is calculated along the game date — when the date moves into the next quarter, the past quarter is run (the step can be 1 month · 1 quarter · 1 year). It's the same whether you advance with ▶ at the top right or edit the Country › Date fields; turning the date back leaves the economy as it is and continues from that date. Press \"▶ Next 1 quarter\" — the date moves forward 3 months.",
  "tut.economy.7": "A quarter has passed! The date moved forward too.",
  "tut.economy.8": "Credit rating and warning signs",
  "tut.economy.9": "The first row of the economy view on the right shows the credit rating and the economic warning signs — from negative real growth · excessive deficit · financial crisis to sovereign default · hyperinflation · Great Depression · capital flight · economic collapse. Near a crisis threshold (set in Economy › Scenario) a sign lights up as ◆ danger, past it as ✖ crisis; signs that are off are dimmed.",
  "tut.economy.10": "Gauges and amounts",
  "tut.economy.11": "The hemicycle gauges in the second row show each indicator's safe · warning · danger · crisis ranges; the small line below is the trend over the last 8 periods and ▲▼ is the change since the last period (these appear after the date moves). Click a gauge to go to the tab that moves it. The third row shows GDP · national debt · treasury · revenue · spending · fiscal balance · debt interest as amounts, and growth is year on year, as in official statistics.",
  "tut.economy.12": "Trend chart",
  "tut.economy.13": "In the large chart, click chips to overlay indicators; dotted lines are forecasts. Cell widths follow real time, so the time axis stays right even when 1-month · 1-quarter · 1-year cells are mixed, and 10 yrs · 5 yrs · 2 yrs at the top narrow the period. Flags mark crises · general elections · budgets · events, and grey bands are recessions. Right-click to export the picture.",
  "tut.economy.14": "Monetary",
  "tut.economy.15": "Monetary policy such as the policy rate, money printing and QE belongs to the central bank, so it takes effect immediately. Raising rates tames inflation but raises unemployment; printing a lot of money feels good for now but wrecks prices and the currency. The bars below show \"If nothing changes, next quarter\".",
  "tut.economy.16": "Public finance and the budget",
  "tut.economy.17": "Changes to spending (% of GDP) and tax rates gather in the budget draft, and \"Submit budget\" sends it to Legislation › Submit. It only takes effect once parliament passes it; until then the previous budget (provisional budget) is used. You can look at each party's predicted vote and fill them in at once. Spending · revenue · mandatory spending · treasury · national debt show amounts next to the percentages.",
  "tut.economy.18": "Events",
  "tut.economy.19": "Economy › Events triggers a Great Depression · financial crisis · oil shock · hyperinflation · sovereign default · economic collapse · disaster · boom on a chosen date (or an event with your own name and effects via \"Custom\"). Pick a type, set the start year · month, duration (months) and intensity, and press \"+ Add event\".",
  "tut.economy.20": "The event is scheduled! When the date reaches that month, confidence and currency value take a one-time hit, and growth · inflation · unemployment move during the period. Before it happens, you can change its date · duration · intensity or delete it in the list below.",
  "tut.economy.21": "Expert analysis",
  "tut.economy.22": "For a deeper look, pick business cycle · inflation · fiscal health · regional gaps · policy lab in Analysis. The right side draws linked panels sharing one crosshair, growth decomposition (including events), debt dynamics (r − g), budget flow and policy sensitivity. \"Show large\" spreads it over the whole screen.",
  "tut.economy.23": "Regions · scenarios · items",
  "tut.economy.24": "Setting each state's industry mix · age structure · income level in Regions makes the same policy work differently per region (rate hikes hit manufacturing harder, welfare cuts hit low-income regions harder). In Scenario you can set \"value + duration\" rules, presets and crisis thresholds, and in Items you can create your own spending items · taxes · assets.",
  "tut.election.1": "Opinion & Elections",
  "tut.election.2": "Enter support · count · apply to parliament",
  "tut.election.3": "Setting support",
  "tut.election.4": "In Opinion › Citizen support, set each party's expected support (%). Elections are held based on these numbers. Enter support for at least one party (e.g. 40).",
  "tut.election.5": "Support entered.",
  "tut.election.6": "Holding an election",
  "tut.election.7": "In Election › General, press \"Start count\" to count votes based on support. Press it now.",
  "tut.election.8": "The count has started!",
  "tut.election.9": "Watching the count",
  "tut.election.10": "The count is in progress. Watch the seats fill the hemicycle one by one.",
  "tut.election.11": "The count is finished.",
  "tut.election.12": "After checking the result, press \"✔ Apply to Parliament\" in Elections › General to change the seats to match it. You can export the result as an image with right-click (long-press), and adjust the counting speed in the election settings.",
  "tut.election.13": "Apply to parliament",
  "tut.election.14": "Counting alone doesn't change parliament. When the count finishes, press \"✔ Apply to Parliament\" to change the seats to match the result. (If you don't like it, \"Recount\" counts again)",
  "tut.election.15": "A new parliament is formed! The hemicycle now matches the election result.",
  "tut.electionAdv.1": "Elections in depth",
  "tut.electionAdv.2": "Election methods · list allocation · manual count · by-elections · presidential · election records",
  "tut.electionAdv.3": "General election method",
  "tut.electionAdv.4": "Elections › General election chooses the chamber and method. Choose list only · districts only · both (mixed); districts are decided by Opinion › Citizen lean and lists by Opinion › Citizen support.",
  "tut.electionAdv.5": "Automatic and manual count",
  "tut.electionAdv.6": "Elections with a district map let you choose how to count (it appears once a map is uploaded). Automatic counting opens districts one by one in random order, while manual counting lets you open each district yourself by clicking it on the result map. The slider below changes the counting speed.",
  "tut.electionAdv.7": "By-elections",
  "tut.electionAdv.8": "Turn on \"By-election\" and count to re-elect only the vacant districts and apply the result right away. Mark seats vacant in Parliament › District Members.",
  "tut.electionAdv.9": "List allocation method",
  "tut.electionAdv.10": "Opinion › Citizen support sets how list seats are divided per chamber. Choose national allocation or allocation per region, and give each support figure a margin of error.",
  "tut.electionAdv.11": "Presidential",
  "tut.electionAdv.12": "Elections › Presidential counts the presidential election (or the PM election with a directly elected PM). The method (plurality · runoff · electoral college) is set in Elections › Electoral system, and candidates in Elections › Candidates.",
  "tut.electionAdv.13": "Election Records",
  "tut.electionAdv.14": "Past elections are kept in Elections › Election Records, and clicking one shows its result screen again.",
  "tut.electoral.1": "Electoral college",
  "tut.electoral.2": "Electoral college · number of electors · winner-take-all and proportional · no majority",
  "tut.electoral.3": "Choosing the electoral college",
  "tut.electoral.4": "The presidential election can be decided by an electoral college instead of the popular vote. Press \"Electoral college\" under presidential method in Elections › Electoral system.",
  "tut.electoral.5": "It's an electoral college now. The electoral college settings appear right below.",
  "tut.electoral.6": "Electoral college settings",
  "tut.electoral.7": "Electors are chosen per region or per district. The number of electors is by population · seats + bonus (US-style: House seats + 2) · manual, and either the winner in that unit takes all its electors or they're split in proportion to votes. You can also set a share of faithless electors.",
  "tut.electoral.8": "Majority and parliament's decision",
  "tut.electoral.9": "A majority of electors is needed to win. If no one has a majority, parliament can choose among the top 3 (US-style), or the candidate with the most electors wins. West Germany is split into three regions — North, West and South Germany — and each chooses its electors.",
  "tut.electoral.10": "Holding an electoral college election",
  "tut.electoral.11": "Hold the election in Elections › Presidential. Votes come out per region according to lean, and that region's electors are decided.",
  "tut.electoral.12": "Votes and electors",
  "tut.electoral.13": "Each candidate shows electors and vote share together, with a map colored by winner and a list of electors per region. Under winner-take-all a candidate can have 0 electors despite a high vote share if they win no region — losing the vote but winning the electoral college can happen too.",
  "tut.fraud.1": "Election fraud",
  "tut.fraud.2": "Turn on an attempt · inflation and district rigging · chance of being caught · outcome",
  "tut.fraud.3": "Election fraud (⚠)",
  "tut.fraud.4": "Elections › ⚠ lets each party plot election fraud (pressing ⚠ in the menu warns you off a few times; go all the way in and it unlocks and shows its name, \"Election fraud\"). An attempt applies only to the next general election count, and getting caught has a heavy price.",
  "tut.fraud.5": "Turn on an attempt",
  "tut.fraud.6": "Tick \"⚠ Attempt election fraud\" for any party. Its settings will open.",
  "tut.fraud.7": "The fraud plan is set.",
  "tut.fraud.8": "What to rig",
  "tut.fraud.9": "Pick the target chamber and how many points to inflate the list vote by. Districts chosen under district rigging go to this party no matter the real result (when there is a district map). The chance of being caught is worked out from the scale of the fraud, or set it yourself with \"Manual\".",
  "tut.fraud.10": "What if they get caught",
  "tut.fraud.11": "Whether it's caught comes out during the count. If not caught, the rigging goes straight into the result; if caught, counting stops at a random point, the party is banned (you'll get a notice) and the rigged votes are voided and counted again from the start. Either way the attempt is used up after one count. Untick it to call it off.",
  "tut.government.1": "Government and powers",
  "tut.government.2": "Form of government · titles · emergency powers · dissolution · no-confidence",
  "tut.government.3": "Form of government",
  "tut.government.4": "Choose presidential, semi-presidential, parliamentary, constitutional monarchy or collective leadership. Depending on the form, the president, prime minister and chair tabs appear or hide, and titles can be renamed (President → King, etc.).",
  "tut.government.5": "Emergency powers and dissolution",
  "tut.government.6": "Decide who holds the state of emergency, dissolution and martial law powers, and declare them from that person's tab. Dissolution can cover all of parliament or one chamber, and a dissolved chamber is restored when the next general election is applied. Under martial law that suspends parliament, bills pass only in the cabinet council.",
  "tut.government.7": "Prime minister and no-confidence",
  "tut.government.8": "In Cabinet › Prime Minister choose how the PM is selected (majority leader automatically · direct election), pin the current PM or add deputy PMs. You can move a motion of no confidence, and with constructive no-confidence (German · Israeli style) the motion must name a successor.",
  "tut.government.9": "President",
  "tut.government.10": "Cabinet › President sets the name, photo and party. Loading a member from the hemicycle links them, so changes follow that member.",
  "tut.history.1": "Power shifts",
  "tut.history.2": "Seat records · seat change chart · party changes · party succession",
  "tut.history.3": "Recording seats",
  "tut.history.4": "Parliament › Power shifts keeps a record of party seats at each point in time. Applying general election results records one automatically, and \"📸 Record current seats\" saves one any time. Press it now.",
  "tut.history.5": "The current seats were recorded.",
  "tut.history.6": "Seat changes",
  "tut.history.7": "Records pile up in the \"Power shifts\" tab of the right-hand view. \"Seat changes\" draws each record's party seats as bars (share · seats) and compares them with the previous record using ▲▼. The government side is marked ★, and the dotted line in the middle is the majority.",
  "tut.history.8": "Party changes",
  "tut.history.9": "Switch to \"Party changes\" to see, as vertical lines, when parties appeared, were renamed and disappeared. Parties that took over others merge in with curves, and parties that disappeared end with ✕.",
  "tut.history.10": "Party succession",
  "tut.history.11": "Changing a party's name or color in 🔁 Party succession (e.g. Grand National Party → Saenuri Party) records it as the same party continuing. Two different parties can be joined with \"Link succession\" to show a merger or successor; linked parties are merged in the chart from the next record.",
  "tut.history.12": "Record table",
  "tut.history.13": "The table compares party seats across records side by side. Rename or delete records under \"N records\" below, and if you have Elections › Election records, bring them in at once with \"Import from election records\".",
  "tut.ideology.1": "Ideologies and sub-ideologies",
  "tut.ideology.2": "Add ideologies · sub-ideologies · seat order",
  "tut.ideology.3": "Ideology list",
  "tut.ideology.4": "Create the ideologies parties belong to in Parliament › Ideology. Top-to-bottom order is the hemicycle's left-to-right order. Reordering also moves the seats of parties with \"auto sort\" on.",
  "tut.ideology.5": "Adding ideologies and sub-ideologies",
  "tut.ideology.6": "\"Add Ideology\" creates a new ideology, and the sub-ideology button next to an ideology creates a sub-ideology (e.g. Conservatism › Moderate conservatism). Picking a sub-ideology in a party's ideology field places it more precisely.",
  "tut.ideology.7": "Ordering party seats",
  "tut.ideology.8": "The order of the party list is the order of seats on the hemicycle. Auto sort lines parties up again in ideology order. You can also drag them or move them with the order buttons.",
  "tut.law.1": "Legislation",
  "tut.law.2": "Submitting bills · committees · tabling · voting · vote records · statutes",
  "tut.law.3": "Submitting a bill",
  "tut.law.4": "Draft bills in Legislation › Submit. Enter a bill title and press \"[+] Register bill\". (Articles, tags and threshold can be left empty — articles are written one by one, Article 1, Article 2 …)",
  "tut.law.5": "Bill registered!",
  "tut.law.6": "Standing committees",
  "tut.law.7": "Create standing committees in Legislation › Committees and bills are reviewed by the responsible committee before the floor. Members are allotted by party seat share, and a majority must vote yes for the bill to reach the floor. Without committees, bills go straight to the floor.",
  "tut.law.8": "Tabling",
  "tut.law.9": "Registered bills gather in Legislation › Floor. For each bill choose whether it goes to the legislature or the cabinet council and which committee reviews it, then press \"Select for deliberation\" to move on to the vote. Search and tags help you find them.",
  "tut.law.10": "Voting",
  "tut.law.11": "In Legislation › Vote, pick a bill, then set each party's line or click seats to plan each member's yea · nay · abstain. Press \"Start Vote\" for a chamber and members vote one by one; when it ends the seats regroup into yea · nay · abstain and the bill passes or fails. In a bicameral system the bill moves to the Senate after passing the House.",
  "tut.law.12": "Vote Records",
  "tut.law.13": "Legislation › Vote records keeps passed, failed and vetoed bills. Filter by status or tag, and propose amendments from passed bills. Pick a chamber or committee in the chips at the top to see only its votes or reviews, one by one.",
  "tut.law.14": "Statutes",
  "tut.law.15": "Legislation › Statutes collects passed laws article by article. Each amendment line shows its latest version, and you can propose amendments here.",
  "tut.law.16": "Constitution",
  "tut.law.17": "Enact and change the constitution in Legislation › Constitution. Passing a constitutional amendment (2/3 to pass) changes the constitution and adds to its amendment history.",
  "tut.lawAdv.1": "Legislation in depth",
  "tut.lawAdv.2": "Passing threshold · tags · amendments · veto · cabinet council",
  "tut.lawAdv.3": "Passage Threshold",
  "tut.lawAdv.4": "Each bill has a passing threshold — a preset one such as majority, 3/5 or 2/3, or your own fraction. Tags make bills easy to filter in tabling and records.",
  "tut.lawAdv.5": "Amendment",
  "tut.lawAdv.6": "Pressing \"Propose amendment\" on a passed bill submits a new amendment (2nd · 3rd edition …) based on it. Records keep which edition it is.",
  "tut.lawAdv.7": "Veto",
  "tut.lawAdv.8": "Cabinet › Government · Powers sets who holds the veto over bills (president · PM · cabinet · none). With a veto, bills passed in Legislation › Vote can be vetoed.",
  "tut.lawAdv.9": "Cabinet Council",
  "tut.lawAdv.10": "Bills sent to the \"Cabinet council\" in tabling are voted on by cabinet members in Cabinet › Cabinet Council. You can set the quorum, and while martial law suspends parliament, bills pass here. Results are kept in Cabinet › Council Records.",
  "tut.map.1": "Districts and maps",
  "tut.map.2": "Map maker · upload a map · per-chamber maps · edit districts · set winners · leanings · regions",
  "tut.map.3": "Pick a map with map presets",
  "tut.map.4": "Making a map with Map Maker",
  "tut.map.5": "Districts are made in the shape of a real map. In the demo, use \"Pick from map presets\" in Country › District map to choose the administrative map of one of South Korea · Japan · USA · Germany · France · UK · Italy · Spain · Canada · Brazil and use it as districts right away. (The map maker for your own maps is in the full game)",
  "tut.map.6": "Districts take the shape of a real map. Open an SVG map in Main screen › Map Maker, and its shapes are sorted into line · area · rectangle · circle; pick the shapes to use as districts (usually \"area\"), name them, and export a district map file (.jsx). Scroll to zoom the preview and middle-drag to pan.",
  "tut.map.7": "Picking a map preset",
  "tut.map.8": "Uploading the district map",
  "tut.map.9": "Press \"🗺 Pick from map presets\" in Country › District map to see country map cards. Picking one turns each administrative region into a district (with name and short name), and by default the lower, upper and third chambers share the same map. (Picking a new map replaces the existing district data)",
  "tut.map.10": "In Country › District map, upload a .jsx file made in the map maker, or pick a country map (10 including South Korea · Japan · USA · Germany) with \"🗺 Pick from map presets\". Each shape becomes a district, and by default the lower, upper and third chambers share the same map. (Uploading a new map replaces the existing district data)",
  "tut.map.11": "A different map per chamber",
  "tut.map.12": "With more than one chamber you can pick a chamber at the top. For the Senate or Third chamber, \"Share the House map / Separate map\" appears. Separate map copies the current map so everything carries on (seats, winners, leanings), and then you can upload a map just for that chamber. Switching back to shared restores values only for districts on the House map.",
  "tut.map.13": "Editing districts",
  "tut.map.14": "Click a district on the map or in the list to open its editor. Set the name, abbreviation, population, and how many seats each chamber elects there (0 seats means that chamber has no such district). Middle-drag to pan the map, Shift+scroll to zoom, and ↺ to reset.",
  "tut.map.15": "Assign winners manually",
  "tut.map.16": "You can also set a district's result without running an election. Pick a party for each seat under \"Set winners manually\" in the district editor, and party seat counts, district members and map colours all follow. Running an election later overwrites it.",
  "tut.map.17": "Seat number boxes",
  "tut.map.18": "When several parties split a multi-member district, the map shows number boxes with each party's seats (if one party takes them all, only the colour is shown). Turn the boxes on or off in Nation › Nation settings.",
  "tut.map.19": "Tendency",
  "tut.map.20": "In Opinion › Citizen lean, set each party's lean (%) per district. This decides who wins district races. The visual view shows both the combined map and a map per party.",
  "tut.map.21": "Region",
  "tut.map.22": "When using regional list seats, group districts into regions in Nation › Regions. Pick a region and click districts on the map (drag for several) to paint them. Regional vote shares come either from averaging tendencies automatically or from your own input.",
  "tut.map.23": "Region seats",
  "tut.map.24": "Regions can hold seats of their own (e.g. a constituency that elects several members across grouped districts). Set each region's seats and winners per party — those seats come out of the list seats and stay put when you run an election.",
  "tut.map.25": "Map label size",
  "tut.map.26": "Nation › Nation Settings adjusts the size of district labels and seat badges on the map all at once.",
  "tut.parties.1": "Parties & Seats",
  "tut.parties.2": "Create a party · name it · assign seats · recalculate",
  "tut.parties.3": "Creating a party",
  "tut.parties.4": "Parliament › Parties › Info is where you add parties and set their name, color and ideology. Press \"[+] Add party\" to create a new one.",
  "tut.parties.5": "The new party \"New Party\" appeared in the list.",
  "tut.parties.6": "Naming the party",
  "tut.parties.7": "Type a name in the new party's name box. You can also change its color with the color box next to it.",
  "tut.parties.8": "Nice name!",
  "tut.parties.9": "Making room",
  "tut.parties.10": "\"Assigned total\" in Parliament › Seats · Chambers is the sum of all party seats and can't exceed the total number of seats. If the existing parties already take all {totalBase} seats, there's no room for the new party. Raise the total (e.g. {totalBase2}) or cut another party's seats to make room.",
  "tut.parties.11": "{freeHouseSeats} seats are free.",
  "tut.parties.12": "Assigning seats",
  "tut.parties.13": "New Party",
  "tut.parties.14": "Now enter a number in {name}'s seat box. You can fill up to the free seats ({seatsHouse}).",
  "tut.parties.15": "Seats assigned.",
  "tut.parties.16": "Recalculating",
  "tut.parties.17": "The seat view updates right away",
  "tut.parties.18": "Changing settings like seat counts redraws the seat view right away — the new party's seats should be there. If the view looks off, press Enter outside an input to redraw, or turn on the execute button in Settings › Display.",
  "tut.parties.19": "After changing settings, press this button to redraw the seat screen. Press it now. (Pressing Enter outside a text field does the same.)",
  "tut.parties.20": "The seat screen was redrawn. The new party should have seats now.",
  "tut.partyAdv.1": "Parties in depth",
  "tut.partyAdv.2": "Duplicate · status · factions · merging · leaders and floor leaders",
  "tut.partyAdv.3": "Party card",
  "tut.partyAdv.4": "On a party card set the name, abbreviation, color, ideology and logo, and choose which chambers (lower · upper · third) it sits in. Setting the status to \"Banned\" removes the party from votes and elections. The duplicate button copies a party as is.",
  "tut.partyAdv.5": "Factions",
  "tut.partyAdv.6": "You can create factions inside a party. Give each faction a name, color and seats, and the hemicycle shows the party split by faction color; in votes each faction can vote separately. You also choose whether factions are split when election results are applied (by pre-election shares, or by their districts' votes for a regional faction) or merged into the party.",
  "tut.partyAdv.7": "Merge",
  "tut.partyAdv.8": "The merge dialog combines several parties into one. An absorbing merger has one party absorb the others, while a new merger creates a party with a new name and ideology. Merged parties can be kept as factions of the new party, and you can pick parties' factions to merge too.",
  "tut.partyAdv.9": "Leaders and floor leaders",
  "tut.partyAdv.10": "Party › Leaders sets the name and photo of party and faction leaders. You can also have a floor leader, and \"Pick seat → paste\" copies the name and photo of a member chosen on the hemicycle.",
  "tut.people.1": "People",
  "tut.people.2": "Creating people · seats · party posts · cabinet posts · district candidates · people who stay when their post is gone",
  "tut.people.3": "Country › People lets you create people in advance — name · photo · ideology · party · faction. Instead of writing a name and photo for each seat, you assign these people to posts.",
  "tut.people.4": "Creating a person",
  "tut.people.5": "Press \"Import from all posts\" to create and link people from every post with a name — members, leaders, faction leaders, speakers, president (monarch), cabinet and local heads (the same name is one person). You can also create them directly with \"＋ Add person\".",
  "tut.people.6": "A person was created. Click ▾ on the card to change ideology · party · faction and assign posts.",
  "tut.people.7": "Posts · district candidates",
  "tut.people.8": "\"＋ Assign post\" seats them in a district or list seat, as party leader or floor leader, or as president · PM · cabinet member — people who aren't members can be ministers too. Changing the name or photo updates every post they hold. Put them forward with \"＋ As district candidate\" and they take the seat their party wins in a general election or by-election.",
  "tut.people.9": "When a post is gone",
  "tut.people.10": "Even if a seat is lost in an election or through a party switch or vacancy, the person stays in the People tab (filter with \"No post\"). Put them forward again in the next election or give them another post.",
  "tut.revolution.1": "Revolution",
  "tut.revolution.2": "Democratic · communist revolution · party-state · new constitution · new country name",
  "tut.revolution.3": "Cabinet › Revolution is started by the people. Distrust of the government · military rule or martial law · banned parties · the revolutionary party's support and the population of regions where it leads decide the chance of success.",
  "tut.revolution.4": "Leading ideology",
  "tut.revolution.5": "A successful democratic revolution topples dictatorship · military rule, returns to a normal form of government and sets up a new constitution. A successful communist revolution leads to the hidden form of government \"party-state\" — the revolutionary party rules alone, parliament becomes the Supreme People's Assembly, and elections become yes/no votes on a single candidate.",
  "tut.revolution.6": "Starting a revolution",
  "tut.revolution.7": "Choose an ideology and a revolutionary party, then start a revolution. You can also set the new country name · flag for after the revolution in advance.",
  "tut.revolution.8": "The result is in. If it fails, the revolutionary party is banned and the government declares martial law.",
  "tut.revolution.9": "After the revolution",
  "tut.revolution.10": "Under the party-state, \"Hold yes/no election\" elects the deputies of the Supreme People's Assembly, and it only falls to another democratic revolution. Once the revolution is over, hold a new general election.",
  "tut.royal.1": "Royal house · Restoration",
  "tut.royal.2": "Royal houses and claimants · Succession rule · Restoration · Absolute monarchy · Succession dispute · Self-coup · republican revolution",
  "tut.royal.3": "Royal house",
  "tut.royal.4": "Cabinet › Royal house handles monarchy — restoring a king to a republic, the hidden form of government \"absolute monarchy\" where the king holds real power, succession and its disputes, and the republican revolution that abolishes the monarchy.",
  "tut.royal.5": "Royal houses and claimants",
  "tut.royal.6": "Each royal house has a succession rule (male line only · male preference · absolute) and claimants. The order of claimants (drag ⋮⋮) is the order of birth, and each party can choose a claimant to back. Press \"Create example royal houses\" or add a house yourself.",
  "tut.royal.7": "For West Germany, the Houses of Hohenzollern and Wittelsbach are created. The more parties back a claimant, the better their chances in a restoration or succession dispute.",
  "tut.royal.8": "Restoration",
  "tut.royal.9": "If the parties backing a claimant hold a majority in the lower house, parliament can set up a constitutional monarchy by resolution; otherwise it takes a royalist coup — which can choose constitutional or absolute monarchy. If it succeeds, the country becomes \"Kingdom of …\" and gets a new constitution.",
  "tut.royal.10": "The result is in. If the coup fails, royalist parties are banned and the claimant goes into exile.",
  "tut.royal.11": "Under the monarchy",
  "tut.royal.12": "Under absolute monarchy the king appoints the PM and holds the veto and emergency powers, and constitutional reform can return to constitutional monarchy. Under constitutional monarchy a self-coup can aim for absolute monarchy. When the king dies or abdicates, the next heir takes the throne by the succession rule, and if another claimant asserts legitimacy a succession dispute breaks out (like the Carlists). A successful republican revolution abolishes the monarchy.",
  "tut.save.1": "Saving and the main screen",
  "tut.save.2": "Save panel · closing and reopening tabs · help · main screen",
  "tut.save.3": "Open the save panel",
  "tut.save.4": "Press the \"Save\" button at the right end of the top tab bar. Everything about saving is gathered in this panel.",
  "tut.save.5": "The save panel is open.",
  "tut.save.6": "A look around the save panel",
  "tut.save.7": "At the top are the current save and \"Save now\" (same as Ctrl+S), then autosave and its interval. In the save list you can star favorites, rename and delete, and \"Save as\" copies the current state into a new save. Saving to a file (.hemi) lets you load it on another device.",
  "tut.save.8": "Closing and reopening tabs",
  "tut.save.9": "A tab's × closes only the tab without deleting the save. If you close every tab, the screen below goes blank. Bring closed tabs back with + › \"Reopen closed tab\". To really delete a save, use the save list in the save panel or 🗑 on the start screen.",
  "tut.save.10": "Help",
  "tut.save.11": "The grey \"Help\" group at the bottom of the menu explains what every tab does as cards, and \"Open →\" takes you straight to that tab. Look there first when something is unclear.",
  "tut.save.12": "Main screen",
  "tut.save.13": "⌂ saves and takes you to the main screen. There you choose Start (pick a save · preset · load a file), Create (maps · scenarios · challenges) and Settings (light · dark · neon theme), and change the language with 🌐. You can replay this tutorial any time with the \"West Germany\" preset under Start.",
  "tut.siege.1": "Parliament siege",
  "tut.siege.2": "Breaking the martial-law blockade · occupying the speaker's chair · injured members absent · Assembly Advancement Act",
  "tut.siege.3": "Legislation › Siege has two parts — \"Break the blockade\", fighting through the martial-law troops' blockade into the chamber to lift martial law, and \"Occupy the speaker's chair\", to block a vote on a bill you oppose.",
  "tut.siege.4": "Declaring martial law",
  "tut.siege.5": "Breaking the blockade is only possible under martial law. Martial law is already declared, so go straight on to the next step.",
  "tut.siege.6": "Breaking the blockade is only possible under martial law. Martial law is declared under \"Emergency powers\" in the tab of whoever holds the powers — press \"! Declare martial law !\".",
  "tut.siege.7": "Martial law is in effect.",
  "tut.siege.8": "Who gets in?",
  "tut.siege.9": "Set each party's turnout, and each member's attempt to break through is decided one by one. Blockade strength (loyalty of the military command) · civilian support · party cohesion change the chance of getting in. Only members inside vote, but passage needs a majority of all members, so if the opposition alone falls short, ruling-party members have to get in too. A party trying to block the vote can also physically hold the chamber entrance with \"Block the entrance\".",
  "tut.siege.10": "Breaking the blockade",
  "tut.siege.11": "Press \"Break the blockade · vote to lift martial law\". In the hemicycle view beside it, members go from the blockade line → the entrance → the aisles to their seats. If they fall short of a majority, the troops drag them back out (click to skip, speed 0.5× – 4×).",
  "tut.siege.12": "The vote is over. If a majority got in, martial law is lifted.",
  "tut.siege.13": "Occupying the speaker's chair",
  "tut.siege.14": "Regardless of martial law, you can pick a bill awaiting a vote and occupy the speaker's chair. The number of members taking part · the other side · cohesion · the speaker's security powers · the speaker tabling the bill decide the chance of success, and if it succeeds the vote is called off. In the hemicycle view the occupying members rush to the chair, and if security powers are used, guards come in and clash with them.",
  "tut.siege.15": "The price of violence",
  "tut.siege.16": "The occupying party's support drops, and injured members miss the next few votes (left out of votes and shown in seat info). Turning on the \"Assembly Advancement Act\" blocks the speaker from tabling bills directly and doubles the penalties.",
  "tut.tour.1": "Screen Tour",
  "tut.tour.2": "Menus · seat view · date line · save tabs",
  "tut.tour.3": "Welcome to West Germany",
  "tut.tour.4": "You'll learn by doing in West Germany (the Federal Republic of Germany) in March 1983, just after a federal election. The Bundestag has the CDU/CSU, the SPD, the FDP and the Greens, and the CDU/CSU and FDP govern together in a coalition. There are two kinds of tutorials — the basic tutorial (#1 – #6) walks newcomers through the core flow, and the detailed tutorials cover features like ideologies, factions, maps, election systems and government powers so you can pick just what you need. Some steps only move on once you've actually done the highlighted thing. This country is a copy (a new save), so feel free to change anything.",
  "tut.tour.5": "Using the menu",
  "tut.tour.6": "Features are grouped into Parliament, Legislation, Opinion, Election, Cabinet and Nation, and the gray \"Help\" at the bottom explains every tab. Click Parliament › Parties in the left menu.",
  "tut.tour.7": "The Parties screen is open.",
  "tut.tour.8": "Exploring the seats",
  "tut.tour.9": "Seats are drawn as a hemicycle. Click a seat (dot).",
  "tut.tour.10": "That seat's party and member info appeared. Right-click (long-press) a seat to export an image.",
  "tut.tour.11": "Date and session",
  "tut.tour.12": "The top line of the visual screen shows the country's current date and session. ▶ · ▶▶ · ▶▶▶ advance a day, a week or a month, and \"Next session\" moves the session on. ⚙ opens the date & session settings. (More in the detailed tutorial \"Date and session\")",
  "tut.tour.13": "Save tabs",
  "tut.tour.14": "Each tab at the top is a save (one country). Click one to switch to it instantly; progress is autosaved straight into that save. A ● next to the name means there are unsaved changes. + opens a new tab (new · preset · reopen closed tab), double-click a tab name to rename it, and × only closes the tab (the save stays). ⌂ on the far left saves and returns to the main screen.",
  "tut.ui.1": "Lessons",
  "tut.ui.2": "Quit",
  "tut.ui.3": "Back",
  "tut.ui.4": "Next",
  "tut.ui.5": "Try it yourself — \"Next\" unlocks when you do",
  "tut.ui.6": "Tutorial lessons",
  "tut.ui.7": "({locked} preview)",
  "tut.ui.8": "· hands-on",
  "tut.ui.9": "Finish #{lessonIdx}",
  "tut.ui.10": "West Germany ({locked} preview)",
  "tut.ui.11": "Done",
  "tut.ui.12": "#{lessonIdx} {title} complete!",
  "tut.ui.13": "You've finished the detailed tutorials too. Now reshape this country however you like, or create a new save from the start screen and build your own. Any feature you're curious about is explained under \"Help\" at the bottom of the menu.",
  "tut.ui.14": "You've finished the basic tutorial (#1 – #{basicCount})! You know the basic flow now. Continue with detailed tutorial #{nextNo} \"{title}\", or pick just the features you need from the lesson list.",
  "tut.ui.15": "It's a preview feature, so it continues on the {nextLesson} screen.",
  "tut.ui.16": "Next up is #{nextNo} \"{title}\" ({summary}).{nextLesson} Continue right away, or pick it from the lesson list later.",
  "tut.ui.17": "Finish",
  "tut.ui.18": "Start #{nextNo} →",
  "tut.ui.19": "Close",
  "tut.ui.20": "Later",
  "tut.ui.21": "{size} / {avail} done",
  "tut.ui.22": "You've finished every lesson",
  "tut.ui.23": "Ready to pick up where you left off?",
  "tut.ui.24": "What would you like to learn?",
  "tut.ui.25": "Pick any lesson to go over it again.",
  "tut.ui.26": "New here? Do the basic lessons in order, then pick only the detailed lessons you need. Each lesson is just a few steps.",
  "tut.ui.27": "Basic tutorial",
  "tut.ui.28": "The core flow for newcomers — best in order",
  "tut.ui.29": "Detailed tutorials",
  "tut.ui.30": "Feature by feature — pick what you need",
  "tut.ui.31": "Continue",
  "tut.ui.32": "Opens with the {locked} update",
  "tut.ui.33": "· {locked} preview",
  "tut.ui.34": "{summary} · {steps} steps{locked}",
  "tut.union.1": "Candidate unification",
  "tut.union.2": "Several parties, one candidate · applies to presidential and district races separately",
  "tut.union.3": "What is candidate unification?",
  "tut.union.4": "Before an election, several parties can merge behind one candidate. The member with the highest support fields the candidate and receives the combined support of the others. List votes are still counted for each party separately.",
  "tut.union.5": "Create a unification",
  "tut.union.6": "Press \"+ Add unification\".",
  "tut.union.7": "An empty unification was created.",
  "tut.union.8": "Choose the parties",
  "tut.union.9": "Tick two or more parties to join. A party can only be in one unification, and if you leave the name blank the party names are joined together.",
  "tut.union.10": "The unification is in effect.",
  "tut.union.11": "Where it applies",
  "tut.union.12": "With \"Presidential · PM elections\" on, the member with the highest support in the base chamber runs as the joint candidate, shown in results as \"(Party A · Party B joint candidate)\". With \"General election districts\" on, the member with the strongest leaning runs in each district. Press \"Dissolve unification\" when you no longer need it.",
  "tut.unrecovered.1": "Unrecovered territory and unification",
  "tut.unrecovered.2": "Unrecovered territory types · painting · excluded from elections · merging by type · unification",
  "tut.unrecovered.3": "Unrecovered territory",
  "tut.unrecovered.4": "Country › Unrecovered sets land the country claims but doesn't actually govern (unrecovered territory). The West Germany tutorial has the East German states as \"East Germany\" unrecovered territory.",
  "tut.unrecovered.5": "On the map and in elections",
  "tut.unrecovered.6": "Unrecovered territory is shown on every map with hatching in its type's color, and is left out of general election districts, local elections and referendums. Its district seats are left out of the district seat count too.",
  "tut.unrecovered.7": "Types and painting",
  "tut.unrecovered.8": "You can have several types of unrecovered territory (e.g. Austria · Eastern territories · Northern territories). Give each type a name and hatching color, then turn on \"Paint\" and click districts on the map one after another. The eraser turns them back into normal districts.",
  "tut.unrecovered.9": "Territorial unification",
  "tut.unrecovered.10": "\"Merge\" recovers just that type, and \"Unify territory (all)\" recovers all unrecovered territory as normal districts. Press \"Unify territory (all)\" now to reunify Germany.",
  "tut.unrecovered.11": "\"Merge\" recovers just that type, and \"Unify territory (all)\" recovers all unrecovered territory as normal districts. There is no unrecovered territory right now — go on to the next step.",
  "tut.unrecovered.12": "Reunified! The recovered districts are normal districts now.",
  "tut.unrecovered.13": "After unification",
  "tut.unrecovered.14": "Recovered districts elect seats from the next general election (for West Germany, Bundestag districts go from 259 to 331). Raise the total seats to match in Parliament › Seats · Chambers, and set party leans for the new regions in Opinion › Citizen lean.",
  "tut.vassals.1": "Dependencies",
  "tut.vassals.2": "Creating dependencies · painting · dependency parliaments and elections · annexation · release",
  "tut.vassals.3": "Country › Dependencies sets countries attached to yours (protectorates · puppet states · dominions …). Dependency land is on the map like your own territory, but it's left out of your elections and seats and has its own parliament.",
  "tut.vassals.4": "Creating a dependency",
  "tut.vassals.5": "There's a dependency. In its card you can change the name · dot pattern color · type of dependency (protectorate · protected territory · personal union …). Add types as you like with \"＋ New type…\" or the \"Dependency types\" list above.",
  "tut.vassals.6": "Enter a name and press \"+ Add dependency\" to create one (e.g. West Berlin).",
  "tut.vassals.7": "A dependency was created!",
  "tut.vassals.8": "Painting and the map",
  "tut.vassals.9": "With \"Paint\" on, click districts one after another on the map to the right of Country › Dependencies to make them that country's land. Dependency land shows with that country's dot pattern on every map (unlike the hatching of unrecovered territory) and is left out of your general elections · local elections · referendums.",
  "tut.vassals.10": "Dependency parliaments",
  "tut.vassals.11": "Each dependency has its own parliament — set its name · seats · threshold · parties (support · seats) and redistribute seats with \"Hold election\".",
  "tut.vassals.12": "Each dependency has its own parliament — set its name · seats · threshold · parties (support · seats). Add parties with \"Import home parties\" or \"+ Party\" and press \"Hold election\".",
  "tut.vassals.13": "The election is done! The hemicycle shows the new seats.",
  "tut.vassals.14": "Annexation and release",
  "tut.vassals.15": "\"Annex\" merges the dependency into your country and turns its land into normal districts (it joins your elections and seats, and its parliament is dissolved). \"Release\" makes it independent and separates it from your country — it shows on the map as an independent country, stays out of your elections, and appears in World › Country ranking.",
  "tut.view.1": "Working the screen and exporting",
  "tut.view.2": "Visual tabs · image export · sidebar · resizing · shortcuts",
  "tut.view.3": "Visual tabs",
  "tut.view.4": "The tabs above the visual screen switch between the lower house, upper house and cabinet; opening Polls' districts, tendency or regions, or counting a general election, adds those map and result tabs (close with ×). \"Hemicycle / Districts\" at the top right of a chamber switches to the district map view.",
  "tut.view.5": "Exporting images",
  "tut.view.6": "· Economy charts",
  "tut.view.7": "The wiki box · country ranking · power shifts{econApi} on preview screens are exported the same way.",
  "tut.view.8": "On the hemicycle, maps, election results or cabinet, right-click (long-press on mobile) → \"Export...\" saves a PNG · JPG · SVG image. You can include party statistics and a header with the flag, nation name and date.{econApi}",
  "tut.view.9": "Sidebar and resizing",
  "tut.view.10": "The collapse button in the sidebar header leaves only icons so the editing area gets wider. Drag the border between the editing panel and the visual screen to resize, and double-click it to restore the default width.",
  "tut.view.11": "Shortcuts",
  "tut.view.12": "Enter (outside input fields) — recalculate · Ctrl+S — save now · Ctrl+Z — undo · Ctrl+Shift+Z — redo · Esc — close open panels. In the tutorial, ← · → move between steps and Esc stops.",
  "tut.wiki.1": "Wiki box",
  "tut.wiki.2": "Composition box · seats of both chambers · cabinet · parliamentary groups · copy wiki markup",
  "tut.wiki.3": "Composition box",
  "tut.wiki.4": "Parliament › Wiki box gathers the governing and opposition parties and their seats in one box, like the \"composition\" box in wiki articles. It fills itself from parties, the ruling coalition and seats, and party logos (Parliament › Party › Logo) appear above the names. The preview is in the \"Wiki box\" tab on the right.",
  "tut.wiki.5": "Both chambers together",
  "tut.wiki.6": "Choose which chamber goes in the box. \"Both\" puts each party's [upper | lower] seats side by side in one cell. Press \"Both\" now.",
  "tut.wiki.7": "Choose which chamber goes in the box. With two chambers, choose \"Both\" to put each party's [upper | lower] seats side by side in one cell.",
  "tut.wiki.8": "Each party now shows the seats of both chambers side by side.",
  "tut.wiki.9": "Styling the box",
  "tut.wiki.10": "Set the box header (title · color), the cabinet name and term (blank means \"current\"), the parliamentary group threshold (parties with fewer seats are grouped as non-negotiating), and your own footnotes. Parties with two or more factions (e.g. CDU/CSU) are noted in the footnotes as joint parliamentary groups.",
  "tut.wiki.11": "Copy wiki markup",
  "tut.wiki.12": "\"Copy wiki markup\" copies the table markup for Namuwiki. Parties with a logo are inserted as [[파일:party name 로고.png]], so uploading the logo image under that name on the wiki shows it as is. \"Save hemicycle image\" downloads the hemicycle picture too.",
  "tut.world.1": "World",
  "tut.world.2": "Country ranking · ranking table · scores · flags · blocs and sub-ideologies",
  "tut.world.3": "The World menu",
  "tut.world.4": "It's the 1.6.9 economy system (tutorial \"Economy\" lesson).",
  "tut.world.5": "It's a locked menu that opens with the 1.6.9 update (economy system).",
  "tut.world.6": "The 🌐 World menu under Country has the country ranking and blocs (decorative — they don't affect gameplay). 💹 Economy just above {econApi}",
  "tut.world.7": "Ranking table",
  "tut.world.8": "The \"Country ranking\" tab of the right-hand view shows the ranking table large. Countries are lined up with bloc color strips · flags · score bars, and your country's row is highlighted — the name and flag come from Country › Symbols.",
  "tut.world.9": "Changing scores",
  "tut.world.10": "Change any country's score in the list on the left with the ± buttons or by typing. The ranking on the right changes right away, and when you let go the list on the left re-sorts by rank too.",
  "tut.world.11": "The ranking changed.",
  "tut.world.12": "Flags · blocs · sub-ideologies",
  "tut.world.13": "Click the flag box to upload a picture (major countries have default flags). Choose the bloc and sub-ideology in the two boxes below, press \"Save ranking baseline\", then change scores to see ▲▼ changes in the ranking.",
  "tut.world.14": "Blocs",
  "tut.world.15": "World › Blocs adds and deletes blocs and sets their color · description · sub-ideologies (e.g. Western bloc › Christian democracy). Deleting a bloc leaves its countries unassigned, and the bar at the top shows the balance of blocs at a glance.",
  "sim.auto.1": "Regular session opened — {formatNationSession}",
  "sim.auto.2": "{orgName} term {value} begins",
  "sim.auto.3": "{era}{y}-{m}-{v}",
  "sim.auto.4": "Auto if empty: {nd}",
  "sim.auto.5": "Auto: {y}",
  "sim.auto.6": "{orgName} term {term}, session {num} ({typeLabel})",
  "sim.auto.7": "Next: Extraordinary",
  "sim.auto.8": "Revolutionary Socialism",
  "sim.auto.9": "Socialism",
  "sim.auto.10": "Progressivism",
  "sim.auto.11": "Liberalism",
  "sim.auto.12": "Conservatism",
  "sim.auto.13": "Authoritarianism",
  "sim.auto.14": "National Socialism",
  "sim.auto.15": "Ideology not set",
  "sim.auto.16": "Sub-ideology — leave empty to use the ideology",
  "sim.auto.17": "No sub-ideology",
  "sim.auto.18": "National Reconstruction Party",
  "sim.auto.19": "Reform Group",
  "sim.auto.20": "Democratic Party",
  "sim.auto.21": "Socialist Party",
  "sim.auto.22": "National Front",
  "sim.auto.23": "External Support",
  "sim.bill.1": "National Reconstruction Special Act, Article 1",
  "sim.bill.2": "Reconstruction",
  "sim.bill.3": "Emergency",
  "sim.bill.4": "All measures necessary for national reconstruction may be taken.\nThe executive may issue emergency decrees without the consent of the legislature.",
  "sim.bill.5": "Same ratio for every chamber",
  "sim.bill.6": "· {seats} seats",
  "sim.bill.7": "Majority",
  "sim.bill.8": "Supermajority (2/3)",
  "sim.bill.9": "Enter a bill title.",
  "sim.bill.10": "Only passed bills can have amendments proposed.",
  "sim.bill.11": "Amendment",
  "sim.bill.12": "📝 Amending:",
  "sim.bill.13": "(v{v})",
  "sim.bill.15": "Bills cannot be sent to parliament while it is suspended under martial law.",
  "sim.bill.16": "(in committee)",
  "sim.bill.17": "The bill has been updated.",
  "sim.bill.18": "House✔",
  "sim.bill.19": "House✘",
  "sim.bill.20": "Senate✔",
  "sim.bill.21": "Senate✘",
  "sim.bill.22": "Third✔",
  "sim.bill.23": "Third✘",
  "sim.bill.24": "Use the {vetoHolderLabel}'s veto to finally reject this bill. Continue?",
  "sim.bill.25": "✔ Finally Passed",
  "sim.bill.26": "✘ Finally Rejected",
  "sim.bill.27": "🛑 {vetoHolderLabel} veto",
  "sim.bill.28": "⏳ Awaiting {vetoHolderLabel} signature",
  "sim.bill.29": "Pending",
  "sim.bill.30": "✔Passed",
  "sim.bill.31": "✘Rejected",
  "sim.bill.32": "In committee",
  "sim.bill.33": "(Yea",
  "sim.bill.34": "/Nay",
  "sim.bill.35": "/Abs",
  "sim.bill.36": "✔Passed",
  "sim.bill.37": "Not Tabled",
  "sim.bill.38": "v{v}",
  "sim.bill.40": "Bill to amend",
  "sim.bill.41": "↩ Amendment:",
  "sim.bill.42": "(deleted bill)",
  "sim.bill.43": "Standing committees",
  "sim.bill.44": "committee",
  "sim.bill.45": "result ]",
  "sim.bill.46": " seats)",
  "sim.bill.47": "✔ Passed",
  "sim.bill.48": "✘ Rejected",
  "sim.bill.49": "No vote record",
  "sim.bill.50": "Amendment (",
  "sim.bill.51": " items)",
  "sim.bill.52": "v{v} —",
  "sim.bill.53": "✘ Rejected/vetoed",
  "sim.bill.54": "⏳ Awaiting signature",
  "sim.bill.55": "No pending bills",
  "sim.bill.56": "No search results",
  "sim.bill.57": "Not available while parliament is suspended by martial law",
  "sim.bill.58": "Committee:",
  "sim.bill.59": "None (straight to the floor)",
  "sim.bill.60": "To committee review →",
  "sim.bill.61": "[Under review]",
  "sim.bill.62": "Floor:",
  "sim.bill.63": "▾ Detailed Records",
  "sim.bill.64": "In committee",
  "sim.bill.65": "Select for deliberation",
  "sim.bill.66": "No bills decided by the cabinet council",
  "sim.bill.67": "No completed bills",
  "sim.bill.68": "Sign or veto in Cabinet › Sign",
  "sim.bill.69": "✍ Go sign →",
  "sim.bill.70": "📜 View constitution",
  "sim.bill.71": "📝 Propose amendment",
  "sim.center.1": "Deputy speaker",
  "sim.center.2": "Deputy Speaker name",
  "sim.center.3": "[+] Add deputy speaker",
  "sim.center.4": "Unassigned",
  "sim.center.5": "Deputy Speaker {v}",
  "sim.contentArchive.1": "Search records...",
  "sim.contentAssembly.1": "Highlight Ruling Power (HIGHLIGHT GOV)",
  "sim.contentAssembly.2": "Speakers",
  "sim.contentAssembly.3": "Show in the center of the House hemicycle",
  "sim.contentAssembly.4": "Seat count",
  "sim.contentAssembly.5": "Click to upload a logo",
  "sim.contentAssembly.6": "Click to upload a logo, then choose [Logo] to show it in the middle of the hemicycle",
  "sim.contentAssembly.7": "✕ Remove logo",
  "sim.contentAssembly.8": "Senate hemicycle center",
  "sim.contentAssembly.9": "Logo shown in the hemicycle center",
  "sim.contentAssembly.10": "Third chamber hemicycle center",
  "sim.contentBill.1": "Draft New Bill (NEW BILL)",
  "sim.contentBill.2": "Bill",
  "sim.contentBill.3": "Constitutional amendment",
  "sim.contentBill.4": "Bill title...",
  "sim.contentBill.5": "— written article by article (Article 1, Article 2 …; can be left empty)",
  "sim.contentBill.6": "Articles",
  "sim.contentBill.7": "Tags (comma-separated, e.g. Economy, Security)",
  "sim.contentBill.8": "Passage Threshold",
  "sim.contentBill.9": "Majority (over half of members)",
  "sim.contentBill.10": "Supermajority (2/3 or more)",
  "sim.contentBill.11": "Unanimous",
  "sim.contentBill.12": "Set...",
  "sim.contentBill.13": "[+] Register Bill",
  "sim.contentBill.14": "Edit Existing Bill (EDIT BILL)",
  "sim.contentBill.15": "-- Select a bill to edit --",
  "sim.contentBill.16": "[✔] Save Changes",
  "sim.contentCabinetmembers.1": "Speaker name",
  "sim.contentCabinetmembers.2": "[+] Add cabinet member",
  "sim.contentCoalition.1": "[+] Form Coalition",
  "sim.contentCoalition.2": "[✕] No Ruling Power",
  "sim.contentCommittee.1": "Standing committees review bills before they reach the floor. Members are allotted by each party's share of seats in that chamber; a bill goes to the floor if a majority of members vote yes, and dies if rejected.",
  "sim.contentCouncil.1": "Select bill (COUNCIL BILL)",
  "sim.contentCouncil.2": "Resolution date",
  "sim.contentCouncil.3": "Cabinet Council quorum",
  "sim.contentCouncil.4": "Numerator",
  "sim.contentCouncil.5": "Denominator",
  "sim.contentCouncil.6": "! Martial law — bills pass through the Cabinet Council",
  "sim.contentCouncil.7": "While parliamentary voting is suspended, mark each minister's yea/nay/abstain in the cabinet display (the \"Cabinet\" tab on the right). The live tally appears below.",
  "sim.contentCouncil.8": "[ Cabinet Council vote result ]",
  "sim.contentCouncil.9": "▶ Resolve in the Cabinet Council",
  "sim.contentDate.1": "Current Date",
  "sim.contentDate.2": "This save runs on the scenario's own clock. Use real-time play/pause or the next-turn button.",
  "sim.contentDate.3": "Era name (optional — leave blank to show just the year)",
  "sim.contentDate.4": "e.g. Reiwa → Reiwa 1, April 20",
  "sim.contentDate.5": "Year",
  "sim.contentDate.6": "Month",
  "sim.contentDate.7": "Day",
  "sim.contentDate.8": "Use ▶ · ▶▶ · ▶▶▶ on the date line (top right) to advance a day, a week or a month",
  "sim.contentDate.9": "Session",
  "sim.contentDate.10": "Term",
  "sim.contentDate.11": "Name",
  "sim.contentDate.12": "National Assembly",
  "sim.contentDate.13": "Current session type (pick the next session's type with the \"Next:\" button on the date line, top right)",
  "sim.contentDate.14": "Regular Session",
  "sim.contentDate.15": "Extraordinary Session",
  "sim.contentDate.16": "▶ Next Session",
  "sim.contentDate.17": "Automatic progression",
  "sim.contentDate.18": "When the date passes the regular-session start date, open the next session as a regular session",
  "sim.contentDate.19": "Regular session starts on",
  "sim.contentDate.20": "Term +1 when a lower-house general election result is confirmed (not by-elections or recounts)",
  "sim.contentDate.21": "Works once a term and session number are set.",
  "sim.contentElecCandidates.1": "— Several parties field one joint candidate. The member with the highest support runs and receives the combined support of all members (list votes stay separate)",
  "sim.contentElecCandidates.2": "Candidate unification",
  "sim.contentElecCandidates.3": "+ Add unification",
  "sim.contentElecCandidates.4": "— defaults to the party leader; link a member or type a name to field someone else (shared by presidential/PM elections)",
  "sim.contentElecCandidates.5": "Candidates",
  "sim.contentElecGeneral.1": "Members Election",
  "sim.contentElecGeneral.2": "PM election",
  "sim.contentElecGeneral.3": "e.g. 1st General Election",
  "sim.contentElecGeneral.4": "Election Method",
  "sim.contentElecGeneral.5": "Proportional",
  "sim.contentElecGeneral.6": "Recount only vacated districts",
  "sim.contentElecGeneral.7": "By-election (re-vote vacated districts only)",
  "sim.contentElecGeneral.8": "Districts are decided by the Tendency tab's support levels; proportional seats by the support rate below",
  "sim.contentElecGeneral.9": "Counting method",
  "sim.contentElecGeneral.10": "Auto",
  "sim.contentElecGeneral.11": "Click districts on the map one by one to count them yourself",
  "sim.contentElecGeneral.12": "Count Speed",
  "sim.contentElecGeneral.13": "District Settings",
  "sim.contentElecGeneral.14": "District Seats",
  "sim.contentElecGeneral.15": "0 seats (active districts)",
  "sim.contentElecGeneral.16": "Noise (±%)",
  "sim.contentElecGeneral.17": "Random variation added to each district's result",
  "sim.contentElecGeneral.18": "Determines each district's winner based on the support levels set in the Tendency tab.",
  "sim.contentElecGeneral.19": "Districts without tendency data are assigned randomly.",
  "sim.contentElecGeneral.20": "⏸ Pause",
  "sim.contentElecGeneral.21": "⏩ Finish Instantly",
  "sim.contentElecGeneral.22": "✔ Apply to Parliament",
  "sim.contentElecGeneral.23": "↺ Recount",
  "sim.contentElecGeneral.24": "e.g. 1st Prime Minister Election",
  "sim.contentElecGeneral.25": "(change in Elections > Settings — shared with the presidential election)",
  "sim.contentElecPresidential.1": "Election Title",
  "sim.contentElecPresidential.2": "e.g. 1st Presidential Election",
  "sim.contentElecPresidential.3": "Year",
  "sim.contentElecPresidential.4": "First-past-the-post",
  "sim.contentElecPresidential.5": "(change in the Settings tab)",
  "sim.contentElecPresidential.6": "Election Method:",
  "sim.contentElecPresidential.7": "Base chamber:",
  "sim.contentElecPresidential.8": ">> Start Count <<",
  "sim.contentElecSettings.1": "— How the hemicycle fills while counting — in order: party by party from the left · random: seats of the final layout light up in random order, with the share counted",
  "sim.contentElecSettings.2": "Seat reveal",
  "sim.contentElecSettings.3": "Fill in order",
  "sim.contentElecSettings.4": "Random seat reveal",
  "sim.contentElecSettings.5": "— also used for PM elections when the PM is directly elected",
  "sim.contentElecSettings.6": "Presidential / PM election method",
  "sim.contentElecSettings.7": "First-past-",
  "sim.contentElecSettings.8": "the-post",
  "sim.contentElecSettings.9": "Two-round",
  "sim.contentElecSettings.10": "Electoral college",
  "sim.contentElecSettings.11": "The top candidate wins with the most votes even without a majority",
  "sim.contentElecSettings.12": "— the chamber whose support (district results for the electoral college) is used",
  "sim.contentElecSettings.13": "Base chamber",
  "sim.contentFraud.1": "> BLACK BALLOT // contract intake",
  "sim.contentFraud.2": "Each party can attempt election fraud once, in the next general election count. If caught, the party is banned.",
  "sim.contentHouse.1": "Parliament Name",
  "sim.contentHouse.2": "Total Seats",
  "sim.contentIdeology.1": "[+] Add Ideology",
  "sim.contentMembers.1": "Search (name / #seat number)",
  "sim.contentMembers.2": "Filter",
  "sim.contentNationSettings.1": "Map text/badge size",
  "sim.contentNationSettings.2": "Show district names on maps",
  "sim.contentNationSettings.3": "Show seat-count boxes on the map",
  "sim.contentParty.1": "Info",
  "sim.contentParty.2": "Leader",
  "sim.contentParty.3": "Logo",
  "sim.contentParty.4": "[+] Add Party",
  "sim.contentParty.5": "[⇄] Merge Parties (Absorption · New Party)",
  "sim.contentPm.1": "Direct PM election",
  "sim.contentPm.2": "PM name",
  "sim.contentPm.3": "🔒 Lock the current PM (unaffected by seat changes)",
  "sim.contentPm.4": "🔓 Unlock (follow the majority party leader again)",
  "sim.contentPm.5": "🔒 The PM is locked — they stay in office even if the majority changes, and the post becomes vacant if a no-confidence vote passes.",
  "sim.contentPm.6": "[+] Add deputy PM",
  "sim.contentPm.7": "Nominate PM (presidential appointment)",
  "sim.contentPm.8": "PM nominee",
  "sim.contentPm.9": "Candidate name",
  "sim.contentPm.10": "Nominate → send to parliament",
  "sim.contentPm.11": "No confidence",
  "sim.contentPm.12": "Constructive vote of no confidence (German/Israeli style) — name a successor in the motion",
  "sim.contentPm.13": "Successor PM name",
  "sim.contentPm.14": "No-confidence motion against the PM",
  "sim.contentPm.15": "file !",
  "sim.contentPm.16": "Shown in Nation > Legislation once filed; if it passes, the current PM is dismissed",
  "sim.contentPresident.1": "Click to upload a photo",
  "sim.contentPresident.2": "Upload Photo",
  "sim.contentPresident.3": "President name",
  "sim.contentPresident.4": "Unlink",
  "sim.contentPresident.5": "🔗 Linked to a member — party follows the member; name and photo stay in sync whichever side you edit",
  "sim.contentPresident.6": "✕ Remove photo",
  "sim.contentRegions.1": "Regions group districts for regional list PR. Set them separately per chamber. (Not needed if you use national lists.)",
  "sim.contentRegions.2": "▌ Regions (choose one to paint)",
  "sim.contentRegions.3": "[+] Add region",
  "sim.contentRegions.4": "▌ Regional constituency seats",
  "sim.contentRegions.5": "Use a region as one multi-member constituency (e.g. the prefectural districts of Japan's House of Councillors). Set its seats and each party's winners directly; they count toward party seats right away and are kept separate from list seats when an election runs.",
  "sim.contentRegions.6": "▌ Vote share by region",
  "sim.contentRegions.7": "Automatic",
  "sim.contentRegions.8": "Manual",
  "sim.contentRegions.9": "Automatic: averages the leanings (%) of the region's districts as its vote share. Manual: enter support for each region yourself.",
  "sim.contentSave.1": "Autosave",
  "sim.contentSave.2": "Autosave interval",
  "sim.contentSave.3": "15s",
  "sim.contentSave.4": "30s",
  "sim.contentSave.5": "1m",
  "sim.contentSave.6": "3m",
  "sim.contentSave.7": "5m",
  "sim.contentSave.8": "10m",
  "sim.contentSave.9": "Saves",
  "sim.contentSave.10": "+ New save",
  "sim.contentSave.11": "📦 From preset",
  "sim.contentSave.12": "Search saves",
  "sim.contentSave.13": "Save as new",
  "sim.contentSave.14": "Copies the current state into a new save and continues in that save. Use it when you want to keep this moment separately.",
  "sim.contentSave.15": "e.g. Right after the 2nd general election",
  "sim.contentSave.16": "Full preset (.hemi)",
  "sim.contentSave.17": "The whole save (parties · parliament · districts · cabinet · economy …) as one file. Use it to share full presets too.",
  "sim.contentSave.18": "Export full preset",
  "sim.contentSave.19": "Load full preset",
  "sim.contentSave.20": "District preset (.hemimap)",
  "sim.contentSave.21": "Districts only — map · names · abbreviations · seats per chamber · population · regions. Parties, tendencies and election results aren't included. Load it from the upload field in Country › District map.",
  "sim.contentSave.22": "Export districts only",
  "sim.contentSettings.1": "Chambers",
  "sim.contentSettings.2": "Unicameral",
  "sim.contentSettings.3": "Bicameral",
  "sim.contentSettings.4": "Tricameral",
  "sim.contentSettings.5": "House",
  "sim.contentSettings.6": "Senate",
  "sim.contentSettings.7": "Third",
  "sim.contentSymbol.1": "Nation Name",
  "sim.contentSymbol.2": "e.g. Greater Germania",
  "sim.contentSymbol.3": "Click to upload flag",
  "sim.contentSymbol.4": "✕ Remove Flag",
  "sim.contentSystem.1": "Form of government",
  "sim.contentSystem.2": "Presidential",
  "sim.contentSystem.3": "Semi-presidential",
  "sim.contentSystem.4": "Parliamentary",
  "sim.contentSystem.5": "Constitutional monarchy",
  "sim.contentSystem.6": "Collective leadership",
  "sim.contentSystem.7": "Cabinet & position titles (rename them as shown in the cabinet display — leave blank for defaults)",
  "sim.contentSystem.8": "Cabinet (name shown on the cabinet tab and its title, e.g. Bundeskabinett)",
  "sim.contentSystem.9": "Cabinet",
  "sim.contentSystem.10": "Prime Minister / Premier",
  "sim.contentSystem.11": "Deputy PM",
  "sim.contentSystem.12": "Chair (collective leadership)",
  "sim.contentSystem.13": "Speaker",
  "sim.contentSystem.14": "Minister / Cabinet member",
  "sim.contentSystem.15": "Cabinet member",
  "sim.contentSystem.16": "Bill veto holder",
  "sim.contentSystem.17": "With a veto, bills that pass a vote can be vetoed in Nation > Legislation",
  "sim.contentSystem.18": "State of emergency power holder",
  "sim.contentSystem.19": "Dissolution power holder",
  "sim.contentSystem.20": "Split dissolution —",
  "sim.contentSystem.21": "dissolution: President /",
  "sim.contentSystem.22": "dissolution: PM",
  "sim.contentSystem.23": "Martial law power holder",
  "sim.contentTable.1": "Search bills...",
  "sim.contentTable.2": "Reset",
  "sim.contentTerritory.1": "District",
  "sim.contentTerritory.2": "Edit Mode",
  "sim.contentTerritory.3": "Add",
  "sim.contentTerritory.4": "Remove",
  "sim.contentTerritory.5": "Deselect (pan/zoom only)",
  "sim.contentTerritory.6": "Click/drag to edit cells (Name mode: click only)  |  Wheel: zoom  |  Wheel-click+drag: pan",
  "sim.contentTerritory.7": "This chamber's district map",
  "sim.contentTerritory.8": "Share the House map",
  "sim.contentTerritory.9": "Separate map",
  "sim.contentTerritory.10": "Map Maker",
  "sim.contentTerritory.11": " — upload a .jsx file exported from it or a district preset (.hemimap — map · names · seats · population · regions), or",
  "sim.contentTerritory.12": "Map presets",
  "sim.contentTerritory.13": "replaces the existing district data with the new map",
  "sim.contentTerritory.14": ", to use real map-shaped districts instead of the grid.",
  "sim.contentTerritory.15": "By default the Senate and Third chamber share the House map; pick a chamber and press",
  "sim.contentTerritory.16": " to upload a map just for it. Click a district to set its seats per chamber and party leanings (%).",
  "sim.contentTerritory.17": "Uploading",
  "sim.contentTerritory.18": ".",
  "sim.contentTerritory.19": "🗺 Pick a map preset",
  "sim.contentTerritory.20": "⬆ Upload district map (.jsx · .hemimap)",
  "sim.contentTerritory.21": "No file",
  "sim.contentTerritory.22": "Border color",
  "sim.contentTerritory.23": "Custom",
  "sim.contentTerritory.24": "Relative to theme",
  "sim.contentTerritory.25": "Custom: exactly the color you pick · Relative to theme: follows the theme color in the same proportion when it changes",
  "sim.contentTerritory.26": "Sync with theme color",
  "sim.contentTerritory.27": "Fill is always transparent",
  "sim.contentTerritory.28": "Text outline color",
  "sim.contentTerritory.29": "Outline color for district abbreviations",
  "sim.contentTerritory.30": "Districts on map:",
  "sim.contentTerritory.31": " | click a district to edit its seats and leanings",
  "sim.contentTerritory.32": "▌ District List",
  "sim.contentVote.1": "Select Bill for Review (SELECT BILL)",
  "sim.contentVote.2": "Select a bill...",
  "sim.contentVote.3": "-- Select Bill --",
  "sim.contentVote.4": "Vote Date",
  "sim.contentVote.5": "e.g. March 5, 1952",
  "sim.contentVote.6": "Planned votes",
  "sim.contentVote.7": "Plan yea",
  "sim.contentVote.8": "▲ Yea",
  "sim.contentVote.9": "Plan nay",
  "sim.contentVote.10": "▼ Nay",
  "sim.contentVote.11": "Plan abstain",
  "sim.contentVote.12": "— Abstain",
  "sim.contentVote.13": "✕ Clear",
  "sim.contentVote.14": "🔍 View Info",
  "sim.contentVote.15": "Pick one, then click a seat to set that member's planned vote. Press \"Start Vote\" below and members vote one by one",
  "sim.contentVote.16": "None",
  "sim.contentVote.17": " | \n                        Current:",
  "sim.contentVote.18": "Reset All",
  "sim.contentVote.19": "Party Line (PARTY LINE)",
  "sim.contentVote.20": "Setting a party line changes the planned vote of every member of that party. Click seats afterwards to set individual defectors",
  "sim.contentVote.21": "All",
  "sim.contentVote.22": "[ House Vote Result ]",
  "sim.contentVote.23": "Yea",
  "sim.contentVote.24": "Nay",
  "sim.contentVote.25": "Abstain",
  "sim.contentVote.26": "Not Voted",
  "sim.contentVote.27": "-- Awaiting Vote --",
  "sim.contentVote.28": "▶ Start House Vote",
  "sim.contentVote.29": "[ Senate Vote Result ]",
  "sim.contentVote.30": "▶ Start Senate Vote",
  "sim.contentVote.31": "[ Third Vote Result ]",
  "sim.contentVote.32": "▶ Start Third Vote",
  "sim.core.1": "Minister",
  "sim.core.2": "Premier",
  "sim.core.3": "Monarch",
  "sim.core.4": "Independent",
  "sim.core.5": "Members",
  "sim.core.6": "-- Load from a member --",
  "sim.core.7": "(no name)",
  "sim.core.8": "Proportional]",
  "sim.core.9": "Proportional·Independent]",
  "sim.core.10": "[+] Add {cabinetMember}",
  "sim.core.11": "{label} name",
  "sim.core.12": "👑 Majority party ({name}) leader applied automatically",
  "sim.core.13": "{pm} Name (vacant)",
  "sim.core.14": "{pm} name",
  "sim.core.15": "Current selection: appointed by the {president} — the {president2} nominates a candidate, who becomes {pm} after parliament reviews the nomination",
  "sim.core.16": "Current method: majority — the majority party leader of the base chamber ({presElectionChamberBasis}) automatically becomes {pm}",
  "sim.core.17": "Current method: direct PM election — count it as a \"PM election\" in Election > General",
  "sim.core.18": "🔒 The PM post is vacant after a no-confidence vote — set one directly, or use \"Unlock\" below to make the current majority party leader PM.",
  "sim.core.19": "Title (e.g. Deputy PM for the Economy; leave blank to show as Deputy PM 1)",
  "sim.core.20": "“{title}” is under review in Nation > Legislation",
  "sim.core.21": "Choose a PM nominee first (a name or a linked member).",
  "sim.core.22": "{pm} confirmation motion ({nomineeName})",
  "sim.core.23": "Confirmation motion",
  "sim.core.24": "A confirmation motion for {nomineeName} as {pm} has been tabled in Nation > Legislation.",
  "sim.core.25": "Under a constructive vote of no confidence, a successor PM must be named.\nEnter the successor PM's name.",
  "sim.core.26": "Constructive no-confidence motion — successor {pmLabel}: {name}",
  "sim.core.27": "No-confidence motion",
  "sim.core.28": "Withdraws confidence from the current {pmLabel} and elects {name}{name2} as the next {pmLabel2}.",
  "sim.core.29": "No-confidence motion",
  "sim.core.30": "Constructive no-confidence",
  "sim.core.31": "A constructive no-confidence motion (successor {pmLabel}: {name}) has been tabled in Nation > Legislation.\nIf it passes, {name2} immediately becomes the new {pmLabel2}.",
  "sim.core.32": "A no-confidence motion against the cabinet has been tabled in Nation > Legislation.",
  "sim.core.33": "-- Successor {pmLabel}: party --",
  "sim.core.35": "Successor {pmLabel} name",
  "sim.core.36": "Constructive no-confidence motion",
  "sim.core.37": "If it passes, the nominated successor immediately becomes the new {pmLabel} and the old cabinet (deputy {pmLabel2}s and ministers) steps down — no vacancy is left",
  "sim.core.38": "If it passes you can see it in Nation > Legislation, and the current {pmLabel} is dismissed",
  "sim.core.39": "The constructive no-confidence motion passed and {name} is the new {pm}.\nThe previous cabinet has stepped down — fill in new ministers in Cabinet > Cabinet.",
  "sim.core.40": "Position (e.g. Minister of Foreign Affairs)",
  "sim.core.41": "Vacant",
  "sim.core.42": "Vacant — not voting",
  "sim.core.43": "Unnamed",
  "sim.core.44": "State of Emergency",
  "sim.core.45": "Dissolution",
  "sim.core.46": "Martial law",
  "sim.core.47": "Senate Dissolved",
  "sim.core.48": "House Dissolved",
  "sim.core.49": "Dissolution of {dissolutionScope}",
  "sim.core.50": "Dissolution of {senate}",
  "sim.core.51": "Dissolution of {house}",
  "sim.core.52": "The target of a dissolution already declared cannot be changed.\nApply a general election to lift it, then choose again.",
  "sim.core.53": "Choose who holds this power first.",
  "sim.core.54": "{key} cannot be lifted by itself.\nIt is lifted once a new general election is applied in Election > General.",
  "sim.core.55": "Declare {key}. Continue?",
  "sim.core.56": "The dissolution power cannot be split while the whole parliament is dissolved.\nApply a general election to lift it and try again.",
  "sim.core.57": "Splitting the dissolution power cannot be turned off while the Senate or the House is dissolved.\nApply a general election to lift it and try again.",
  "sim.core.58": "Resolution to lift martial law",
  "sim.core.59": "Lift martial law",
  "sim.core.60": "A resolution to lift martial law was automatically placed on the floor in Nation > Legislation.\nMartial law is lifted if parliament passes it.",
  "sim.core.61": "! MARTIAL LAW IN FORCE — PARLIAMENT SUSPENDED !",
  "sim.core.62": "! MARTIAL LAW IN FORCE — PARLIAMENTARY VOTES SUSPENDED !",
  "sim.core.63": "Handle bills in the [Cabinet] tab.",
  "sim.core.64": "{thLabel} ({required})",
  "sim.core.65": "Threshold: {thLabel}, {required} needed",
  "sim.core.66": "{yea} / {required} ({thLabel}, {yea2} short)",
  "sim.core.67": "✔ Expected to pass",
  "sim.core.68": "✘ Expected to fail",
  "sim.core.69": "Only available under martial law while parliament is suspended.",
  "sim.core.70": "Select a bill to review first.",
  "sim.core.71": "There is no one to take part in the cabinet meeting (all positions are vacant).",
  "sim.core.72": "No cabinet member has voted.\nMark each person's Yea · Nay · Abstain in the cabinet display first.",
  "sim.core.73": "Passed",
  "sim.core.74": "Rejected",
  "sim.core.75": "Cabinet vote — yes {yea} · no {nay} · abstain {v} (total {totalParticipants})\n\n“{title}” will be {pass}. Confirm?",
  "sim.core.76": "“{title}” was {pass} by cabinet resolution.",
  "sim.core.77": "Votes cannot be held while parliament is suspended under martial law.\nBills can be passed through the cabinet meeting instead.",
  "sim.core.78": "▌ Emergency powers",
  "sim.core.79": "! {lbl} declared (lifted only by a general election) !",
  "sim.core.80": "Lift",
  "sim.core.81": "Declare",
  "sim.core.82": "Whole parliament",
  "sim.core.83": "{ch} only",
  "sim.core.84": "Dissolve",
  "sim.core.85": "Dissolving one chamber empties only its seats; it's lifted once that chamber's general election is applied.",
  "sim.core.86": "Suspend parliament — if checked, parliament is suspended on declaration (screen dimmed, no votes). If unchecked, parliament keeps working and a resolution to lift martial law is tabled automatically.",
  "sim.dispDateControls.1": "Advance 1 day (+1 day)",
  "sim.dispDateControls.2": "Advance 1 day",
  "sim.dispDateControls.3": "Advance 1 week (+7 days)",
  "sim.dispDateControls.4": "Advance 1 week",
  "sim.dispDateControls.5": "Advance 1 month (+1 month)",
  "sim.dispDateControls.6": "Advance 1 month",
  "sim.dispInfoBar.1": "Game time controls",
  "sim.dispInfoBar.2": "Scenario time controls",
  "sim.dispInfoDate.1": "Date not set",
  "sim.dispInfoSession.1": "Session not set",
  "sim.dispNextSessionTypeBtn.1": "Whether the next session opens as regular or extraordinary — click to switch (the current session stays as is; change the current session's type in settings)",
  "sim.dispNextSessionTypeBtn.2": "Next: Regular",
  "sim.dispPanelCabinet.1": "! Cabinet Council voting",
  "sim.dispPanelCabinet.2": "All yea",
  "sim.dispPanelCabinet.3": "All nay",
  "sim.dispPanelDistrict.1": "District Map",
  "sim.dispPanelDistrict.2": "↺ Reset view",
  "sim.dispPanelDistrict.3": "House 0 cells · Senate 0 cells",
  "sim.dispPanelDistrict.4": "· Shift+scroll: zoom · middle-click drag: pan",
  "sim.dispPanelElecResultHouse.1": "Election Results",
  "sim.dispPanelHouse.1": "Arc",
  "sim.dispPanelRegion.1": "Region assignment map",
  "sim.dispPanelRegion.2": "Choose a \"Paint\" region below, then click a district on the map to assign it to that region or remove it.",
  "sim.dispPanelTendency.1": "Tendency Map",
  "sim.dispSessionControls.1": "Session number +1 (with the chosen type)",
  "sim.dispSessionControls.2": "Next session",
  "sim.dispTabElecResultHouse.1": "House Election Results",
  "sim.dispTabElecResultSenate.1": "Senate Election Results",
  "sim.dispTabElecResultThird.1": "Third Election Results",
  "sim.dispTabFraud.1": "Election fraud",
  "sim.dispTabPopVote.1": "Local election results",
  "sim.dispTabTendency.1": "Tendency",
  "sim.district.1": "{name} will use a district map separate from the House.\nThe current map is copied so nothing changes yet; you can then upload a map just for {name2}. Continue?",
  "sim.district.2": "{name} will share the House map again.\n{name2} districts that aren't on the House map lose their data (seats · leanings · winners). Continue?",
  "sim.district.3": "{districtChamber}'s district data will be replaced by the new map.\n(Including names, seat counts, leanings and winners) Continue?",
  "sim.district.4": "All existing district data will be replaced by the new map.\n(Including names, seat counts, tendencies and winners) Continue?",
  "sim.district.5": "Couldn't read the file.",
  "sim.district.6": "All current districts will be replaced by this district preset — map · names · seats · population · regions (all chambers).\nParties and cabinet stay; district tendencies, winners and election results are cleared. Continue?",
  "sim.district.7": "This is a full preset (.hemi).\nOpen it with \"Load full preset\" in the save window. This field takes district presets (.hemimap) and map maker maps (.jsx).",
  "sim.district.8": "This isn't a district preset (.hemimap) or a map maker map (.jsx).",
  "sim.district.9": "No shapes usable as districts were found in the .jsx file exported from Map Maker.",
  "sim.district.10": "Hue",
  "sim.district.11": "Saturation",
  "sim.district.12": "Brightness",
  "sim.district.13": "Same as theme color",
  "sim.district.14": "Clear the leanings set separately for {keys} districts in this region and make them follow the region?",
  "sim.district.15": "The shape \"{key}\" will be permanently removed from the map.\n(Use this to drop shapes such as backgrounds or frames that were included by mistake.) Continue?",
  "sim.district.16": "Selected district",
  "sim.district.17": "District name (e.g. Jongno)",
  "sim.district.18": "Short name (e.g. Downtown) — shown in the middle of the map if set",
  "sim.district.19": "Seats (per chamber; 0 means the district isn't in that chamber)",
  "sim.district.20": "No seats are assigned to this district — enter the seat count above first",
  "sim.district.21": "Edit party leanings (%) by clicking this map in the",
  "sim.district.22": "tab above",
  "sim.district.23": "Delete this shape from the map (for backgrounds/frames included by mistake)",
  "sim.district.24": "— empty —",
  "sim.district.25": "Assign winners manually",
  "sim.district.26": "— set this district's seats without an election (running an election replaces them)",
  "sim.district.27": "[No active districts]",
  "sim.district.28": "Total population: {totalPop}",
  "sim.district.29": "Population",
  "sim.district.30": "e.g. 150000",
  "sim.district.31": "House {cntH} cells",
  "sim.district.32": "· Senate {cntS} cells",
  "sim.district.33": "· Third chamber {cntT} cells",
  "sim.district.34": "Reset the names of all districts? (Map shapes, seat counts and tendencies are kept)",
  "sim.district.35": "Set up districts first",
  "sim.district.36": "{nm} (no seats in this chamber)",
  "sim.district.37": "(regional tendency: {name})",
  "sim.district.38": "{nm}: no tendency set",
  "sim.district.39": "{breakdown} · Undecided {undT}%",
  "sim.district.40": "{nm} (tossup){fromRegion}: {breakdownU}",
  "sim.district.41": " has no regions. Create regions in Nation › Regions and assign districts to set leanings for a whole region at once.",
  "sim.district.42": {"one": "— {count} district", "other": "— {count} districts"},
  "sim.district.44": "· {own} of them have their own leanings, which take priority",
  "sim.district.45": "· all use this region's tendency",
  "sim.district.46": "Support Rate(%)",
  "sim.district.47": {"one": "Clear own leanings of {count} district and follow the region", "other": "Clear own leanings of {count} districts and follow the region"},
  "sim.district.48": "Districts with no tendency of their own (all 0) use this region's tendency in district elections, local elections and referendums. Clicking a district on the map switches to its region.",
  "sim.district.49": "Undecided",
  "sim.district.50": "At each count, undecided votes are split among this area's parties (partly random, the rest by tendency · parties at 0 get none)",
  "sim.district.51": "· Total {sum}%",
  "sim.district.52": "Upload a map in the District tab first",
  "sim.district.53": "▌ Overview",
  "sim.district.54": "Max",
  "sim.district.55": "By district",
  "sim.district.56": "By region",
  "sim.district.57": "— Select district —",
  "sim.district.58": "Click the map above or pick a district from the list above",
  "sim.district.59": "Currently using region",
  "sim.district.60": "'s leanings (faded numbers). Enter a value here to set this district on its own.",
  "sim.district.61": "This district uses its own leanings (they take priority over region {region}). Clear them all to 0 to follow the region.",
  "sim.district.63": "{ch} is set to 0 seats in the District tab",
  "sim.district.65": "↳ Split factions",
  "sim.district.66": "Unaffiliated",
  "sim.district.67": "{chamberNames} support distribution",
  "sim.district.68": "Parallel",
  "sim.district.69": "Fully compensatory",
  "sim.district.70": "Semi-compensatory {compensationPct}%",
  "sim.district.71": "List PR method (",
  "sim.district.72": "National",
  "sim.district.73": "Regional",
  "sim.district.74": "Compensation (%)",
  "sim.district.75": "Parallel (0%)",
  "sim.district.76": "Fully compensatory (100%)",
  "sim.district.77": "Threshold (%)",
  "sim.district.78": "Exempt: districts",
  "sim.district.79": "Win this many districts to be exempt from the threshold (0 = no exemption)",
  "sim.district.80": "or more",
  "sim.district.81": "Threshold: parties below this vote share get no list seats (district wins stay) · 0 = none",
  "sim.district.82": "· now",
  "sim.district.83": ", waived with {thresholdSeats}+ district seats",
  "sim.district.84": "· Regional lists need regions set up first in",
  "sim.district.85": "Opinion > Regions",
  "sim.district.86": ".",
  "sim.district.87": "Support Rate Distribution",
  "sim.district.88": "Set list vote separately",
  "sim.district.89": "This chamber's list seats and threshold are allocated by the \"List(%)\" values (regional lists use regional votes). Districts (tendency), presidential and local elections and opinion keep using support. Satellite party example: parent party list 0%, satellite support 0% · list N%.",
  "sim.district.90": "List vote (%)",
  "sim.district.91": "List(%)",
  "sim.district.92": "Margin (±%)",
  "sim.district.93": "Banned parties' support is not counted",
  "sim.district.94": "When on, part of the undecided vote also goes to independents (even at 0% support). When off, undecided votes go to parties only.",
  "sim.district.95": "Include independents",
  "sim.district.96": "▶ Resume",
  "sim.district.97": "By-election results ({chamberName})\n\n{summary}\n\nEnter the winners' names in Parliament > Members.",
  "sim.district.98": "There's no new count to apply. (It has already been applied to parliament.)",
  "sim.district.99": "Election results have been applied.\n\nFaction-level seats for parties whose factions are merged in elections have been reset to 0, since the pre-election distribution no longer applies.\nPlease redistribute faction seats in the Party tab.",
  "sim.district.100": "(Parties set to \"Split factions\" had their new seats divided among their factions.)",
  "sim.district.101": "The new general election was applied — {dissolvedLabel} has been lifted.",
  "sim.district.102": "The new general election was applied — the dissolution of both the Senate and the House has been lifted.",
  "sim.district.103": "The new general election was applied — the Dissolution of the Senate has been lifted.",
  "sim.district.104": "The new general election was applied — the Dissolution of the House has been lifted.",
  "sim.district.105": "Untitled Election",
  "sim.district.106": "{president} Election",
  "sim.district.107": "{pm} Election",
  "sim.district.108": "Delete this record?",
  "sim.district.109": "— seats",
  "sim.district.110": " seats · vote share",
  "sim.district.111": "No per-party detail data",
  "sim.district.112": "▾ Detailed Records (Total",
  "sim.district.113": "↻ Apply to Parliament",
  "sim.district.114": "👁 View",
  "sim.district.115": "Elected:",
  "sim.district.116": "{count}",
  "sim.district.117": "% · turnout",
  "sim.district.118": "No saved election records",
  "sim.district.119": "No records match",
  "sim.district.120": "{chamber} Election Results",
  "sim.district.121": "+ Region",
  "sim.district.122": "+ Proportional",
  "sim.district.123": "Region {ch}",
  "sim.district.124": "No regions yet. Add one with the [+] button below.",
  "sim.district.125": "Currently painting with this region",
  "sim.district.126": "Click to paint with this region",
  "sim.district.127": "🖌 Painting",
  "sim.district.128": {"one": "{count} district", "other": "{count} districts"},
  "sim.district.129": "{nm} (district not in this chamber)",
  "sim.district.130": "— Unassigned",
  "sim.district.131": "{nm} (tossup): {breakdownText}",
  "sim.district.132": "{nm} — click to count",
  "sim.district.133": "{key} — Counting Pending",
  "sim.district.134": "This has 0 seats. Check the seat count in Parliament › Seats · Chambers.",
  "sim.district.135": "No vacated districts.\nVacate a district first in the Parliament > Members tab.",
  "sim.district.136": "Please enter list votes.\nType a number in each party's List(%) field.",
  "sim.district.137": "Please enter support rates.\nEnter a number in each party's support rate (%) field.",
  "sim.district.138": "There are no regional vote shares.\nCreate regions in Nation > Regions and assign districts (automatic), or enter vote shares directly.",
  "sim.district.139": "No districts are active in the District tab.\nAdd a district first, or switch to Proportional mode.",
  "sim.district.140": ">> Counting... <<",
  "sim.district.141": "Counting...",
  "sim.district.142": "Start Count",
  "sim.district.143": "{chamberName} election results",
  "sim.district.144": "> {elecTitle} ({elecYear}) — {chamberName} counting...",
  "sim.district.145": "> {elecTitle} ({elecYear}) — {chamberName} counting... ({key})",
  "sim.district.146": "> {elecTitle} ({elecYear}) — {chamberName}: click districts on the map to count them",
  "sim.district.147": "> {elecTitle} ({elecYear}) — {chamberName} counting... {totalSeats}% counted",
  "sim.district.148": "> {elecTitle} ({elecYear}) — {chamberName} count halted: election fraud discovered! ({v}% counted)",
  "sim.district.149": "The parties caught ({names}) are banned.",
  "sim.district.150": "⚠ Election fraud by {names} was discovered during the count! ({v}% counted)\nAll rigged votes are voided and the count restarts from the beginning.\n{fateTxt}",
  "sim.district.151": "⚠ Election fraud by {names} was discovered during the count!",
  "sim.district.152": "> {elecTitle} ({elecYear}) — {chamberName} recounting...",
  "sim.district.153": "> {elecTitle} ({elecYear}) — {chamberName} result confirmed",
  "sim.district.154": "and {thNames} more",
  "sim.district.155": "· Below the {thPct}% threshold: {thNames}",
  "sim.district.156": "[Ruling GOV]",
  "sim.district.157": "[Majority MAJ]",
  "sim.district.158": "[Minority MIN]",
  "sim.district.159": " seats = effective",
  "sim.district.160": " seats (",
  "sim.district.161": "[Divided Government]",
  "sim.district.162": "No details",
  "sim.district.163": "Ruling Party",
  "sim.district.164": "Opposition",
  "sim.district.mixHint": "0% = parallel (districts and lists allocated independently) · 100% = fully compensatory (all seats match vote share) · in between is a semi-compensatory mix",
  "sim.districtPreset.1": "There are no districts to export.\nUpload a map or pick a map preset in Nation › District map, then try again.",
  "sim.districtPreset.2": "The district preset has no districts.",
  "sim.districtPreset.3": "Couldn't load the district preset: the file is damaged or in a different format.",
  "sim.districtPreset.4": "District preset loaded{name} · {v} districts",
  "sim.districtPreset.5": "Loading save files isn't available in the demo. (Available in the full game)",
  "sim.districtPreset.6": "This is a district preset (.hemimap).\nUpload it with \"Upload district map\" in Nation › District map to replace only this save's districts.",
  "sim.districtPreset.7": "You can have at most {MAX_SAVE_SLOTS} save slots. Delete an existing save and try again.",
  "sim.districtPreset.8": "Opened \"{name}\"",
  "sim.export.1": "About {w} × {h} pixels (larger with stats · header)",
  "sim.export.2": "SVG rendering failed",
  "sim.export.3": "Dissolved",
  "sim.export.4": "Error while exporting:",
  "sim.export.5": "Seat info {seatLabel}",
  "sim.export.6": "Member: {name}",
  "sim.export.7": "District: {place}",
  "sim.export.8": "Party: {nameLabel}",
  "sim.export.9": "Faction: {factionName}",
  "sim.export.10": "Ideology: {ideology}",
  "sim.export.11": "Coalition: {coalitionName}",
  "sim.export.12": "Not formally in the coalition, but backs the government on confidence votes, budgets and the like",
  "sim.export.13": "Coalition:",
  "sim.export.14": "Status:",
  "sim.export.15": "Cabinet:",
  "sim.export.16": "Unlink from this post",
  "sim.export.17": "(now: {post})",
  "sim.export.18": "(vacant)",
  "sim.export.19": "+ New",
  "sim.export.20": "Appoint to cabinet…",
  "sim.extraParl.1": "Out-of-Parliament (",
  "sim.extraParl.2": "*Dissolved*",
  "sim.extraParl.3": "New Coalition",
  "sim.faction.1": "New Faction",
  "sim.faction.2": "Total {sum}/{key} seats {ok}",
  "sim.faction.3": "Split the “{name}” faction off as a new party?\n\nNew party: {name2}\nSeats: House {seatsHouse}, Senate {seatsSenate}",
  "sim.faction.4": "Regional base",
  "sim.faction.5": "— none (pre-election shares)",
  "sim.faction.6": "{name} (main body)",
  "sim.faction.7": "Using Party Color",
  "sim.faction.8": "Faction abbreviation (e.g. CSU)",
  "sim.faction.9": "Duplicate faction",
  "sim.faction.10": "Faction name",
  "sim.faction.11": "Use party color",
  "sim.faction.12": "↗ Split into New Party",
  "sim.faction.13": "▌ Factions",
  "sim.faction.14": "+ Add Faction",
  "sim.faction.15": "In elections",
  "sim.faction.16": "Split factions",
  "sim.faction.17": "Merged",
  "sim.faction.18": "When election results are applied, the new seats are divided by the factions' pre-election shares. A regional faction takes the share of the party's votes won in its districts.",
  "sim.faction.19": "When election results are applied, faction seats are merged into the party (factions stay, with 0 seats — reassign them afterwards).",
  "sim.fraud.1": "{v} selected",
  "sim.fraud.2": "None selected",
  "sim.fraud.3": "Automatic: scales with ballot stuffing and district rigging (now {catchChance}%)",
  "sim.fraud.4": "Deal struck",
  "sim.fraud.5": "Open a deal",
  "sim.fraud.6": "Applies to the next election count only",
  "sim.fraud.7": "Target office",
  "sim.fraud.8": "Vote-share inflation",
  "sim.fraud.9": "Chance of discovery",
  "sim.fraud.10": "Manual",
  "sim.fraud.12": "District count rigging (this party wins the selected districts whatever the real result)",
  "sim.fraud.13": "{riggedDistricts} selected",
  "sim.fraud.14": "Click to select · click again to clear",
  "sim.fraud.15": "Deselect all",
  "sim.fraud.16": "Fraud is uncovered at a random point during the count — counting stops, the rigged votes are voided, the count starts over and the party is banned. If not caught, the effect applies as is. Either way, the attempt is used up after one count.",
  "sim.fraud.17": "You'd better not open this tab.\nGo in anyway?",
  "sim.fraud.18": "Go in",
  "sim.fraud.19": "Back off",
  "sim.fraud.20": "Are you sure?\nWhat you do here changes the outcome of elections.",
  "sim.fraud.21": "I'm sure",
  "sim.fraud.22": "Go back",
  "sim.fraud.23": "This can't be undone.\nEvery single ballot was someone's voice.",
  "sim.fraud.24": "Go anyway",
  "sim.fraud.25": "One last time.\nDo you really want to go in?",
  "sim.fraud.26": "Unlock",
  "sim.fraud.27": "> No parties.",
  "sim.fraud.28": "⚠ Manual order",
  "sim.fraud.29": "✦ Auto-sorted by ideology",
  "sim.fraud.30": "↺ Auto-sort",
  "sim.fraud.31": "Party abbreviation (e.g. SPD)",
  "sim.fraud.32": "Duplicate party",
  "sim.fraud.33": "Party name",
  "sim.fraud.34": "Active",
  "sim.fraud.35": "The party lineage in Seat history starts at this date — if it's earlier than the party's first record, a founding point is added at that date",
  "sim.fraud.36": "Founded",
  "sim.fraud.37": "Show Stats",
  "sim.fraud.38": "Leader photo",
  "sim.fraud.39": "Party logo",
  "sim.fraud.40": "Enter a description for the party...",
  "sim.history.1": "Election applied",
  "sim.history.2": "{name} seat change",
  "sim.history.3": "Period: {snaps} → {snaps2}",
  "sim.history.4": "(no change)",
  "sim.history.5": "Seats: {s0} → {s1}{dd}",
  "sim.history.6": "Share: {total}% → {total2}%",
  "sim.history.7": "Renamed: {name} → {name2}",
  "sim.history.8": "Newly won seats",
  "sim.history.9": "Lost all seats",
  "sim.history.10": "Succession",
  "sim.history.11": "Seats: {fa} → {tb}",
  "sim.history.12": "Record: {date}{date2}",
  "sim.history.13": "Seats:",
  "sim.history.14": "Since previous record:",
  "sim.history.15": "(succeeded: {name})",
  "sim.history.16": "Since previous record: new entry",
  "sim.history.17": "Sole majority",
  "sim.history.18": "In government",
  "sim.history.19": "{total} seats{dTot}",
  "sim.history.20": "Click a bar · flow for details · ★ government · ┆",
  "sim.history.21": "half of the largest total ({maxTotal})",
  "sim.history.22": "· ▲▼ vs previous record",
  "sim.history.23": "Seat changes",
  "sim.history.24": "{y}-{m}-{v}",
  "sim.history.25": "Founded",
  "sim.history.26": "Period: {date} → {date2}",
  "sim.history.27": "Seats: {seats} → {seats2}",
  "sim.history.28": "· {seats} seats",
  "sim.history.29": "Seats: {seats}",
  "sim.history.30": "Merged at the next record",
  "sim.history.31": "At: {date}",
  "sim.history.32": "Dissolved",
  "sim.history.33": "● founded · renamed / curve = succession / ✕ dissolved · click a line or name for details",
  "sim.history.34": "Party lineage",
  "sim.history.35": "{tlChamber} seat changes",
  "sim.history.36": "Share",
  "sim.history.37": "No records yet.",
  "sim.history.38": "Press \"Record seats now\" in Parliament › Power shifts on the left, or apply a general election to parliament, and records stack up here.",
  "sim.history.39": "Bold cells are the government at that time · ▲▼ is the change from the previous record (latest 8)",
  "sim.history.40": "🔁 Party succession",
  "sim.history.41": "Rename · recolor (succession)",
  "sim.history.42": "The same party changes its name · color, like Grand National Party → Saenuri Party. Seats · members · coalitions carry over, and the moment is recorded and shown in \"Party lineage\".",
  "sim.history.43": "New name",
  "sim.history.44": "New color",
  "sim.history.45": "Link successions",
  "sim.history.46": "Links two different parties as predecessor → successor (successor after dissolution · merger · split). At the record right after the ones so far, the predecessor's line merges into the successor's — for a merger, dissolve the predecessor or set its seats to 0.",
  "sim.history.47": "Link",
  "sim.history.48": "Unlink",
  "sim.history.49": "Record party seats over time to see how power rose and fell (seat changes) and how parties were born, changed and carried on (party lineage). Applying a general election result to parliament records automatically.",
  "sim.history.50": "📸 Record seats now",
  "sim.history.51": "Import from election records",
  "sim.history.52": "📊 See the seat change · party lineage charts by scrolling down in the \"Power shifts\" tab of the visual screen on the right.",
  "sim.history.53": "View on the right",
  "sim.history.55": {"one": "{count} record — rename · delete", "other": "{count} records — rename · delete"},
  "sim.history.56": "No name",
  "sim.history.57": "· Election",
  "sim.history.58": "· Succession",
  "sim.history.59": "· Election records",
  "sim.history.60": "Delete",
  "sim.history.61": "Press \"Record seats now\" or apply a general election to parliament to add records.",
  "sim.history.62": "There are no seats to record.",
  "sim.history.63": "Imported {v} election records.",
  "sim.history.64": "No election records to import.",
  "sim.history.65": "Choose the party to succeed.",
  "sim.history.66": "Enter a new name.",
  "sim.history.67": "· color",
  "sim.history.68": "{name} → {name2}\nThe same party changes its name{color}. This moment will be recorded. Continue?",
  "sim.history.69": "Choose two different parties.",
  "sim.history.70": "Already linked.",
  "sim.history.71": "Both chambers ({senate} | {house})",
  "sim.history.72": "{pmn} cabinet",
  "sim.history.73": "present",
  "sim.history.74": "",
  "sim.history.75": "",
  "sim.history.76": "{chs} {v} seats",
  "sim.history.77": "{arr} seats",
  "sim.history.78": "{list} and {list2} act as the joint parliamentary group {name}{name2} in {where}.",
  "sim.history.79": "Non-negotiating groups",
  "sim.history.80": "Composition",
  "sim.history.81": "[ expand · collapse ]",
  "sim.history.82": "Ruling coalition",
  "sim.history.83": "Parliamentary parties",
  "sim.history.84": "Total",
  "sim.history.85": "(vacant",
  "sim.history.86": "Show the composition box",
  "sim.history.87": "Show the extra-parliamentary box",
  "sim.history.88": "Party status (",
  "sim.history.89": "in parliament",
  "sim.history.90": "extra-parliamentary",
  "sim.history.92": "Both chambers",
  "sim.history.93": "No parties without seats in {ch}.",
  "sim.history.94": "Create a party with 0 seats in Parliament › Parties, or take a party out of a chamber, and it gathers here.",
  "sim.history.95": "[[File:{name} logo.png|height=40]][br]",
  "sim.history.96": "Party status (in parliament · {B}extra-parliamentary{B2})",
  "sim.history.97": "[[File:{name} logo.png|height=40]]",
  "sim.history.99": "{chs} seats",
  "sim.history.100": "Party status ({B}in parliament{B2} · extra-parliamentary)",
  "sim.history.101": "e.g. Kohl cabinet",
  "sim.history.102": "Builds a wiki \"Composition\" box. It fills itself from parties · coalition (government) · seats, and the preview shows right away in the \"Wiki box\" tab of the visual screen on the right.",
  "sim.history.103": "Both chambers",
  "sim.history.104": "Extra-parliamentary parties",
  "sim.history.105": "Each party lists [",
  "sim.history.106": "] seats side by side.",
  "sim.history.107": "📋 Copy wiki markup",
  "sim.history.108": "🖼 Save hemicycle image",
  "sim.history.109": "Box header",
  "sim.history.110": "Title",
  "sim.history.111": "Header color",
  "sim.history.112": "Navy",
  "sim.history.113": "Period",
  "sim.history.114": "Start, e.g. 1982.10.01",
  "sim.history.115": "Blank = present",
  "sim.history.116": "Party status",
  "sim.history.117": "Negotiating-group threshold",
  "sim.history.118": "Fewer seats than this = non-negotiating group (0 = independents only)",
  "sim.history.119": "Footnotes",
  "sim.history.120": "Your own note (added with ※)",
  "sim.history.121": "Bottom \"Party status (in parliament · extra-parliamentary)\" row",
  "sim.history.122": "The emblem comes from the logo in Parliament › Speaker · Display (or the flag if none), and party logos from Parliament › Parties › Logo. Parties with two or more factions are footnoted as joint parliamentary groups.",
  "sim.history.123": "View wiki markup",
  "sim.history.124": "Parties with a logo are inserted as [[File:Party name logo.png]] — upload a logo image to the wiki under that name and it shows up as is.",
  "sim.history.125": "Copied the wiki markup.",
  "sim.history.126": "Couldn't copy — copy it yourself from \"View wiki markup\".",
  "sim.history.127": "Couldn't make the hemicycle image.",
  "sim.history.128": "Western bloc",
  "sim.history.129": "Free market · parliamentary democracy · North Atlantic alliance",
  "sim.history.130": "Liberal democracy",
  "sim.history.131": "Social democracy",
  "sim.history.132": "Christian democracy",
  "sim.history.133": "Eastern bloc",
  "sim.history.134": "Planned economy · one-party rule · Warsaw Pact",
  "sim.history.135": "Marxism–Leninism",
  "sim.history.136": "Stalinism",
  "sim.history.137": "Mao Zedong Thought",
  "sim.history.138": "Juche",
  "sim.history.139": "Non-aligned",
  "sim.history.140": "The Third World, belonging to neither bloc",
  "sim.history.141": "Titoism",
  "sim.history.142": "Arab socialism",
  "sim.history.143": "Third Worldism",
  "sim.history.144": "Other",
  "sim.history.145": "Unassigned",
  "sim.history.146": "Create blocs and set their color · description · sub-ideologies. In World › Country ranking each country can pick a bloc and sub-ideology. (Cosmetic — no effect on gameplay)",
  "sim.history.147": "Bloc layout",
  "sim.history.148": {"one": "{count} country", "other": "{count} countries"},
  "sim.history.149": "Bloc color",
  "sim.history.150": "Bloc name",
  "sim.history.151": "Delete bloc",
  "sim.history.152": "Description (e.g. planned economy · one-party rule)",
  "sim.history.153": "Sub-ideologies",
  "sim.history.154": "Add sub-ideology",
  "sim.history.155": "Member countries:",
  "sim.history.156": "+ Add bloc",
  "sim.history.157": "Reset blocs",
  "sim.history.158": "{v} member countries will become unassigned.",
  "sim.history.159": "Delete the \"{name}\" bloc?{v}",
  "sim.history.160": "New bloc {blocs}",
  "sim.history.161": "Reset blocs to the original list (West · East · Non-aligned · Other)?\nEdited blocs and sub-ideologies are lost, and countries in removed blocs become unassigned.",
  "sim.history.162": "United States",
  "sim.history.163": "Soviet Union",
  "sim.history.164": "West Germany",
  "sim.history.165": "Japan",
  "sim.history.166": "United Kingdom",
  "sim.history.167": "France",
  "sim.history.168": "People's Republic of China",
  "sim.history.169": "East Germany",
  "sim.history.170": "India",
  "sim.history.171": "Yugoslavia",
  "sim.history.172": "Cold War country ranking",
  "sim.history.173": "Our country",
  "sim.history.174": "No countries in the ranking.",
  "sim.history.175": "Try \"+ Add country\" in World › Country ranking on the left.",
  "sim.history.176": "Sub-ideology —",
  "sim.history.177": "A cosmetic screen — no effect on gameplay. Changes show right away in the \"Country ranking\" tab of the visual screen on the right.",
  "sim.history.178": "Save the current ranking as the baseline — when scores change, the table shows ▲▼ movement",
  "sim.history.179": "+ Add country",
  "sim.history.180": "Save ranking baseline",
  "sim.history.181": "Reset list",
  "sim.history.182": "Click a flag cell to upload an image · score with ± or type it in · changing the bloc clears the sub-ideology",
  "sim.history.183": "Flag from Nation › Symbols",
  "sim.history.184": "Click to choose a flag image",
  "sim.history.185": "Remove uploaded flag",
  "sim.history.186": "Country name from Nation › Symbols — our country",
  "sim.history.187": "Country name",
  "sim.history.188": "−1 point",
  "sim.history.189": "+1 point",
  "sim.history.190": "Our country — change the name · flag in Nation › Symbols",
  "sim.history.191": "Bloc",
  "sim.history.192": "(This country has territory on the world map.)",
  "sim.history.193": "Remove \"{r}\" from the ranking?",
  "sim.history.194": "New country",
  "sim.history.195": "Reset the country ranking to the original list?",
  "sim.history.196": "Power shifts",
  "sim.history.197": "Country ranking",
  "sim.history.198": "Wiki box",
  "sim.history.199": "Economy — opens in the 1.6.9 update",
  "sim.history.200": "💹 Economy 🔒",
  "sim.history.201": "🌐 World",
  "sim.history.202": "🔒 The Economy menu is still locked — it opens with the economy system in the 1.6.9 \"Invisible Hand\" update.",
  "sim.history.203": "Party status (in parliament · extra-parliamentary)",
  "sim.history.204": "Extra-parliamentary parties of {title}",
  "sim.history.205": "No parties without seats.",
  "sim.history.countries": {"one": "{count} country", "other": "{count} countries"},
  "sim.history.imgFail": "Couldn't make the image",
  "sim.history.seatsTip": "{seats} seats",
  "sim.history.unassignedTip": {"one": "Unassigned: {count} country", "other": "Unassigned: {count} countries"},
  "sim.indep.1": "Filter ({v})",
  "sim.indep.2": "No participating parties",
  "sim.indep.3": "No such ideology",
  "sim.indep.4": "No coalition — create one first in the Coalition tab",
  "sim.indep.5": "-- No affiliation --",
  "sim.indep.6": "— full member",
  "sim.indep.7": "Seat number",
  "sim.indep.8": "Member name",
  "sim.indep.9": "👑 Make leader",
  "sim.keys.1": "Load failed: the save file is corrupted or in an unrecognized format.",
  "sim.leader.1": "Faction leader name",
  "sim.leader.2": "Leader Name",
  "sim.leader.3": "Paste",
  "sim.leader.4": "◆ Pick a seat above and press \"Paste\" to copy the current leader's name and photo to that seat",
  "sim.list.1": "[No list seats — they show here when a party's total seats exceed its district winners]",
  "sim.list.2": "Showing {drawn} / {items} — show more",
  "sim.list.3": "If no one wins a majority, the top two face a runoff",
  "sim.list.4": "Counts the base chamber's district results as an electoral college (winner per district) to decide the winner",
  "sim.main.1": "Date & session settings",
  "sim.main.2": "Close",
  "sim.main.3": "Save",
  "sim.main.4": "⬇ Export...",
  "sim.main.5": "▌ Export",
  "sim.main.6": "Include at top",
  "sim.main.7": "Flag",
  "sim.main.8": "Nation Name",
  "sim.main.9": "Date",
  "sim.main.10": "Include stats below (seat counts, etc.)",
  "sim.main.11": "Include leader/logo photos",
  "sim.main.12": "Expand independents",
  "sim.main.13": "Include extra-parliamentary parties",
  "sim.main.14": "Format",
  "sim.main.15": "Resolution",
  "sim.main.16": "Export",
  "sim.main.17": "▌ Merge",
  "sim.main.18": "Absorption Merger",
  "sim.main.19": "New-Party Merger",
  "sim.main.20": "Surviving Party",
  "sim.main.21": "New Party Name",
  "sim.main.22": "e.g. United Democratic Party",
  "sim.main.23": "Abbr.",
  "sim.main.24": "Select",
  "sim.main.25": "Color",
  "sim.main.26": "Ideology",
  "sim.main.27": "Parties to Absorb",
  "sim.main.28": "Keep absorbed parties as factions",
  "sim.main.29": "Merge",
  "sim.main.30": "Seat Info",
  "sim.main.31": "Nation name not set",
  "sim.main.32": "⚙ Parliament",
  "sim.main.33": "⚖ Legislation",
  "sim.main.34": "📊 Opinion",
  "sim.main.35": "🗳 Election",
  "sim.main.36": "💼 Cabinet",
  "sim.main.37": "🏛 Nation",
  "sim.main.38": "ⓘ Help",
  "sim.main.39": "Drag to resize (double-click: reset to default)",
  "sim.mainContentCabinet.1": "Government · Powers",
  "sim.mainContentCabinet.2": "President",
  "sim.mainContentCabinet.3": "PM",
  "sim.mainContentCabinet.4": "Cabinet Members",
  "sim.mainContentCabinet.5": "Sign",
  "sim.mainContentCabinet.6": "Cabinet Council",
  "sim.mainContentCabinet.7": "Council Records",
  "sim.mainContentElection.1": "Overview",
  "sim.mainContentElection.2": "Citizen lean",
  "sim.mainContentElection.3": "Citizen support",
  "sim.mainContentElection.4": "Immigrant lean",
  "sim.mainContentElection.5": "Immigrant support",
  "sim.mainContentElection.6": "Apply to All",
  "sim.mainContentElection.7": "Strength",
  "sim.mainContentElection.8": "Check and edit the tendency map in the right panel",
  "sim.mainContentElection.9": "Count variation ±",
  "sim.mainContentElection.10": "General-election districts are counted from their leanings (incl. undecided) plus this much random variation per party — 0 gives the same result every time",
  "sim.mainContentElection.11": "Each chamber can have a different party makeup, so support rates are set independently.",
  "sim.mainContentHelp.1": "Parliament",
  "sim.mainContentHelp.2": "Legislation",
  "sim.mainContentHelp.3": "Opinion",
  "sim.mainContentHelp.4": "Election",
  "sim.mainContentHelp.5": "Nation",
  "sim.mainContentHelp.6": "Economy",
  "sim.mainContentHelp.7": "World",
  "sim.mainContentHelp.8": "Sidebar · Top Bar",
  "sim.mainContentHelp.9": "Visuals",
  "sim.mainContentLaw.1": "Submit",
  "sim.mainContentLaw.2": "Committees",
  "sim.mainContentLaw.3": "Floor",
  "sim.mainContentLaw.4": "Vote",
  "sim.mainContentLaw.5": "Vote Records",
  "sim.mainContentLaw.6": "Statutes",
  "sim.mainContentLaw.7": "Constitution",
  "sim.mainContentNation.1": "Symbols",
  "sim.mainContentNation.2": "District Map",
  "sim.mainContentNation.3": "Region",
  "sim.mainContentNation.4": "Nation Settings",
  "sim.mainContentSetup.1": "Speakers · Display",
  "sim.mainContentSetup.2": "Party",
  "sim.mainContentSetup.3": "Seats · Chambers",
  "sim.mainContentSetup.4": "Government & Coalitions",
  "sim.mainContentSetup.5": "District Members",
  "sim.mainContentSetup.6": "Proportional",
  "sim.mainContentVote.1": "Presidential",
  "sim.mainContentVote.2": "General",
  "sim.mainContentVote.3": "Local elections",
  "sim.mainContentVote.4": "Referendum",
  "sim.mainContentVote.5": "Electoral System",
  "sim.mainContentVote.6": "Candidates",
  "sim.mainContentVote.7": "Election Records",
  "sim.member.1": "[No elected district members — run an election in District+Proportional mode and apply it to Parliament to see them here]",
  "sim.member.2": "[No members match the search/filter]",
  "sim.member.3": "Fill by by-election",
  "sim.member.4": "Vacate seat (resigned/died)",
  "sim.member.5": "[Vacant]",
  "sim.member.6": "Arc Seat number",
  "sim.member.7": "No faction",
  "sim.member.8": "Vacate this district's seat?\n(The party loses 1 seat until it is refilled by a by-election)",
  "sim.member.9": "Select \"By-election\" in the district checkboxes on the Election tab and run the count —\nthis district ({key}) will be included automatically.",
  "sim.merge.1": "You need at least 2 parties to merge.",
  "sim.merge.2": "Parties / factions to merge (2 or more — you can also pick just some factions)",
  "sim.merge.3": "Parties / factions to absorb (you can also pick just some factions)",
  "sim.merge.4": "Keep merged parties as factions of the new party",
  "sim.merge.5": "All selected parties dissolve and merge into a new party. Seats, members, coalitions and support move to the new party.",
  "sim.merge.6": "The surviving party keeps its name, color and leader and absorbs the others. The absorbed parties' seats, members, coalitions and support move to it.",
  "sim.merge.7": "Pick at least two parties (or factions) to merge.",
  "sim.merge.8": "Enter a name for the new party.",
  "sim.merge.9": "A party named “{name}” already exists.",
  "sim.merge.10": "Choose the surviving party.",
  "sim.merge.11": "Pick at least one party (or faction) to absorb.",
  "sim.merge.12": "{ch} {ch2} seats",
  "sim.merge.13": "{srcNames} merged to found “{name}”.",
  "sim.merge.14": "“{name}” absorbed {srcNames}.",
  "sim.merge.15": "(copy)",
  "sim.merge.16": "Assigned total",
  "sim.merge.17": "{sum} seats left",
  "sim.merge.18": "✗ Over {total} seats — the excess isn't shown",
  "sim.merge.19": "No seats left — raise the total seats or cut another party's seats",
  "sim.merge.20": "Only {cap} seats were left, so it was set to {cap2}",
  "sim.nav.1": "[ {hName} vote result ]",
  "sim.nav.2": "[ {sName} vote result ]",
  "sim.nav.3": "[ {tName} vote result ]",
  "sim.nav.4": "Show {hName} in the hemicycle center",
  "sim.nav.5": "Show {sName} in the hemicycle center",
  "sim.nav.6": "Show {tName} in the hemicycle center",
  "sim.panels.1": "Close (Esc)",
  "sim.panels.2": "You have unsaved changes.\nSave and go to the main screen?",
  "sim.party.1": "Drag to reorder",
  "sim.party.2": "When off, independents are removed from every chamber (no elections, polling or seats). Turn it back on to restore them.",
  "sim.party.3": "Use",
  "sim.party.4": "Add sub-ideology",
  "sim.party.5": "+ Sub",
  "sim.party.6": "{held} independent seats remain, so this can't be turned off.\nSet independent seats to 0 in Parliament › Seats · Chambers and try again.",
  "sim.party.7": "[No parties assigned]",
  "sim.party.8": "Change logos in Parliament › Parties › Logo (click to open)",
  "sim.party.9": "Seats",
  "sim.party.10": "Total",
  "sim.party.11": "seats",
  "sim.party.12": "Managed in the Independents tab",
  "sim.party.13": "Parties that don't formally join the coalition but support the government in confidence votes, budgets, etc.",
  "sim.party.14": "▌ Name",
  "sim.party.15": "Customize the label (e.g. Confidence & Supply)",
  "sim.party.16": "No non-member parties",
  "sim.party.17": "Confidence-and-supply (backing the government on confidence votes, budgets, etc.) can only be set for the governing coalition.",
  "sim.party.18": "▌ Confidence-and-supply is only for the governing coalition",
  "sim.party.19": "-- No lead party --",
  "sim.party.20": "No members",
  "sim.party.21": "★ Ruling",
  "sim.party.22": "Set as government",
  "sim.party.23": "▌ Members (",
  "sim.party.24": "Single-Party Rule (SINGLE PARTY RULE)",
  "sim.party.25": "[No parties]",
  "sim.party.26": "Logo background — the color behind the logo in the wiki box, seat cards and elsewhere",
  "sim.party.27": "Background",
  "sim.party.28": "Party color",
  "sim.party.29": "White",
  "sim.party.30": "Transparent",
  "sim.party.31": "Click to upload a faction logo",
  "sim.party.32": "Click to upload a party logo",
  "sim.party.33": "Click the logo box to upload an image (square works best)",
  "sim.party.34": "▌ Faction logos",
  "sim.party.35": "{name} {v} seats",
  "sim.party.36": "No districts set",
  "sim.party.37": "No district election record — showing background only",
  "sim.party.38": "-- Select a seat (paste target) --",
  "sim.party.39": "New Ideology",
  "sim.party.40": "New sub-ideology",
  "sim.party.41": "New Party",
  "sim.preset.1": "No presets saved",
  "sim.preset.2": "Available in the full game",
  "sim.preset.3": "Coming soon",
  "sim.preset.4": "🔒 Full game",
  "sim.preset.5": "New!",
  "sim.preset.6": "Updated!",
  "sim.preset.7": "No closed tabs",
  "sim.preset.8": "The preset data format is invalid.",
  "sim.preset.9": "Could not create a new save.",
  "sim.preset.10": "You have unsaved changes.\nSave them to this save and switch?",
  "sim.result.1": "{thLabel} ({required} seats)",
  "sim.result.2": "Unanimous",
  "sim.result.3": "Planned ·",
  "sim.result.4": "Voting ·",
  "sim.result.5": "Threshold: {thLabel}, {required} seats needed",
  "sim.result.6": "{planTag}{yea} / {required} ({thLabel}, {yea2} seats short)",
  "sim.result.7": "Bill",
  "sim.result.8": "Voting in progress… ({nay} voted)",
  "sim.result.9": "Expected to pass ({billTitle})",
  "sim.result.10": "✔ Passed ({billTitle})",
  "sim.result.11": "Expected to fail ({billTitle})",
  "sim.result.12": "✘ Rejected ({billTitle})",
  "sim.run.1": "Imported save",
  "sim.run.2": "Couldn't load the save file. (Invalid format or corrupted file)",
  "sim.run.3": "Could not load the preset.",
  "sim.saveAs.1": "Save slots (localStorage) are not available in this browser/environment.",
  "sim.saveAs.2": "Enter a name for the save.",
  "sim.saveAs.3": "Saving failed. (The browser may be out of storage space)",
  "sim.saveAs.4": "A save named \"{name}\" already exists. Overwrite it?",
  "sim.saveAs.5": "You can have at most {MAX_SAVE_SLOTS} save slots. Delete an existing slot and try again.",
  "sim.saveAs.6": "Load the save \"{name}\"?\nUnsaved changes on the current screen will be lost.",
  "sim.saveAs.7": "Loaded the save \"{name}\".",
  "sim.saveAs.8": "Delete the save \"{name}\"?\nThis can't be undone.",
  "sim.saveList.1": "Browser storage is not available here. Use \"Export full preset\" below to save to a file.",
  "sim.saveList.2": "No save is open. Create one with \"+\" in the tab bar above, or open one from the list below.",
  "sim.saveList.3": "Not saved yet",
  "sim.saveList.4": "Storage full — not saved",
  "sim.saveList.5": "● Unsaved changes",
  "sim.saveList.6": "Current save",
  "sim.saveList.7": "Last saved:",
  "sim.saveList.8": "Discard unsaved changes and go back to the last save",
  "sim.saveList.9": "Rename",
  "sim.saveList.10": "💾 Save now",
  "sim.saveList.11": "✔ Saved",
  "sim.saveList.12": "No saves yet",
  "sim.saveList.13": "Remove from favorites",
  "sim.saveList.14": "Favorite",
  "sim.saveList.15": "Click to open this save point",
  "sim.saveList.16": "● Current",
  "sim.saveList.17": "A save named \"{name}\" already exists. Please enter a different name.",
  "sim.saveList.18": "Could not rename. (The browser may be out of storage space)",
  "sim.tabBar.1": "Close tab",
  "sim.tabBar.2": "Back to main screen",
  "sim.tabBar.3": "New tab",
  "sim.tabBar.4": "New save name",
  "sim.tabBar.5": "Save · Autosave · Save list · File",
  "sim.tabBar.6": "Settings (theme · display · other)",
  "sim.tabBar.7": "🆕 Create new",
  "sim.tabBar.8": "📦 Create from preset",
  "sim.tabBar.9": "📂 Reopen closed tab",
  "sim.tabBar.10": "Settings",
  "sim.tabBar.renameTip": "{name} — double-click to rename",
  "sim.tabs.1": "You have unsaved changes.\nSave and close the tab?",
  "sim.tabs.2": "{autosaveIntervalSec} min",
  "sim.tabs.3": "{autosaveIntervalSec} s",
  "sim.tabs.4": "Autosave (localStorage) is not available in this browser/environment.\n(e.g. the file was opened directly, or the browser blocks storage)",
  "sim.tabs.5": "Browser storage is full, so \"{name}\" could not be saved.\nDelete saves you no longer use, or keep them with \"Export full preset\" and then delete them.",
  "sim.tabs.6": "{v} saves · about {size} used",
  "sim.tabs.7": "Discard unsaved changes and go back to the last saved state?",
  "sim.tabs.8": "Could not load the save.",
  "sim.tabs.9": "Autosave is not available in this environment",
  "sim.tabs.10": "Off",
  "sim.tabs.11": "Every {autosaveIntervalLabel} · saves to “{name}” when you switch or close the tab",
  "sim.tabs.12": "No save open",
  "sim.union.1": "Top support",
  "sim.union.2": "In each district · and in the presidential race, the participating party with the highest support fields the candidate.",
  "sim.union.3": "Split by support",
  "sim.union.4": "General-election districts are shared out in proportion to the participating parties' overall support (each starting from its relatively strongest districts). Presidential · PM candidates are drawn by lot weighted by support.",
  "sim.union.5": "Regions · districts are shared out in proportion to the participating parties' overall support (each starting from where it is relatively strongest).",
  "sim.union.6": "Primary",
  "sim.union.7": "A primary in each district — that district's support for participating parties {mix}% + a poll of general voters (swing voters — national support × affinity) {mix2}%. Presidential · PM candidates are decided by the primary below. Holding a primary adds +5%p to the rally rate as losers concede.",
  "sim.union.8": "No parties have unified",
  "sim.union.9": "Unification name (blank joins the party names)",
  "sim.union.10": "Dissolve unification",
  "sim.union.11": "Moves it from another unification",
  "sim.union.12": "Presidential · PM elections",
  "sim.union.13": "General election districts",
  "sim.union.14": "Pick two or more parties for the unification to apply",
  "sim.union.15": "Hold primary again",
  "sim.union.16": "Hold primary",
  "sim.union.17": "Draw again",
  "sim.union.18": "Draw",
  "sim.union.19": "Choose again",
  "sim.union.20": "Choose",
  "sim.union.21": "Presidential/PM candidate: ",
  "sim.union.22": "Primary",
  "sim.union.23": "Draw odds",
  "sim.union.24": "Not decided yet — until then, the party with the highest support",
  "sim.union.25": "Choosing the candidate",
  "sim.union.26": "Swing-voter poll weight ",
  "sim.union.27": "Consolidation",
  "sim.union.28": "The rally rate is the share of votes from participating parties without a candidate that goes to the joint candidate.",
  "sim.union.29": "{u} joint candidate",
  "sim.union.30": "No parties take part in the base chamber.",
  "sim.union.31": "Leader",
  "sim.union.32": "Candidate name (blank = {label})",
  "sim.union.33": "Reset to {label}",
  "sim.union.34": "No parties take part in the base chamber. Check the base chamber in the Party tab or Elections › Electoral system.",
  "sim.union.35": "{electors} electors ({v}%)",
  "sim.union.36": "(Candidates None)",
  "sim.union.37": "★ Won",
  "sim.union.38": "First round",
  "sim.union.39": "Results",
  "sim.union.40": "Runoff (second round)",
  "sim.union.41": "Winner",
  "sim.union.42": "Apply {name} as {office}",
  "sim.union.44": "{name} took office as {president}.",
  "sim.union.45": "{name} took office as {pm}.",
  "sim.union.46": "Add a region first.",
  "sim.union.47": "Assigned",
  "sim.union.48": "— more than the seats",
  "sim.union.49": "Vacant",
  "sim.union.50": "(name not set)",
  "sim.union.51": "No SVG map — upload one in the District tab",
  "sim.union.52": "Shift+scroll: zoom · middle-click drag: pan",
  "sim.union.53": "Zoom in",
  "sim.union.54": "Zoom out",
  "sim.union.55": "Reset size",
  "sim.union.56": "· Population {key}",
  "sim.union.57": "{shapes} districts (SVG)",
  "sim.union.58": "Share the {house} map",
  "sim.union.59": "Uploaded",
  "sim.vote.1": "Vote Input Mode",
  "sim.vote.2": "Select a mode, then click a seat dot on the canvas (Info mode does not change the vote)",
  "sim.vote.3": "Bulk Party Vote (PARTY BULK)",
  "sim.vote.4": "Finalize the {hName} vote first.",
  "sim.vote.5": "A bill rejected in the {hName} is not sent to the {sName}.",
  "sim.vote.6": "Finalize the {prevName} vote first.",
  "sim.vote.7": "A bill rejected in the {prevName} is not sent to the Third chamber.",
  "sim.vote.8": "A bill rejected in the {hName} is not sent to the {value}.",
  "sim.vote.9": "✔ {hName} passage confirmed",
  "sim.vote.10": "✘ {hName} rejection confirmed",
  "sim.vote.11": "Start Vote",
  "sim.vote.12": "Vote Confirmed",
  "sim.vote.13": "✘ Rejected in {hName} — not sent to {sName}",
  "sim.vote.14": "✔ {sName} passage confirmed",
  "sim.vote.15": "✘ {sName} rejection confirmed",
  "sim.vote.16": "[##] Opens after {hName} passage",
  "sim.vote.17": "✘ Rejected in {prevName} — not sent to {tName}",
  "sim.vote.18": "✔ {tName} passage confirmed",
  "sim.vote.19": "✘ {tName} rejection confirmed",
  "sim.vote.20": "[##] Opens after {prevName} passage",
  "sim.vote.21": "⏩ Voting… (click to skip)",
  "sim.vote.22": "▲ Plan Yea (green)",
  "sim.vote.23": "▼ Plan Nay (red)",
  "sim.vote.24": "— Plan Abstain (gray)",
  "sim.vote.25": "✕ Clear plan",
  "sim.vote.26": "▲ Yea (green)",
  "sim.vote.27": "▼ Nay (red)",
  "sim.vote.28": "— Abstain (gray)",
  "sim.vote.29": "✕ Remove",
  "sim.vote.30": "Run the simulation first",
  "sim.vote.31": "Banned parties cannot vote",
  "sim.vote.32": "Banned",
  "sim.vote.33": "▲Yea",
  "sim.vote.34": "▼Nay",
  "sim.vote.35": "—Abs"
 },
 "patterns": [
    {"re": "^\\+ 새 (.+)$", "to": "+ New $1"},
    {"re": "^내각: $", "to": "Cabinet: "},
    {"re": "^ \\(지금: (.+)\\)$", "to": " (now: $1)"},
    {"re": "^ \\(공석\\)$", "to": " (vacant)"},
    {"re": "^이벤트 (\\d+) · 결정 (\\d+)$", "to": "Events $1 · Decisions $2"},
    {"re": "^(\\d+)번 일어남$", "to": "Fired $1×"},
    {"re": "^(\\d+)일 뒤 다시$", "to": "Again in $1 days"},
    {"re": "^제작자: (.+) · 이벤트 (\\d+) · 결정 (\\d+)(.*)$", "to": "By $1 · Events $2 · Decisions $3$4"},
  {"re": "^(\\s*)도형(\\s*)$", "to": "$1Shapes$2"},
  {"re": "^(\\s*)· 고름(\\s*)$", "to": "$1· selected$2"},
  {"re": "^합치기$", "to": "Merge"},
    {"re": "^지역구 (\\d+)$", "to": "District $1"},
  {"re": "^지하에서 활동하던 (.+) 복권$", "to": "$1, active underground, reinstated"},
  {"re": "^(.+) 해산된 채로 · 지지율 절반으로$", "to": "$1 stays dissolved · support halved"},
  {"re": "^정권 상태: 일반$", "to": "Regime: normal"},
  {"re": "^⚠ 개표 도중 (.+)의 부정선거가 발각되었습니다! \\(개표율 (\\d+)%\\)\\n조작된 표를 모두 무효 처리하고 처음부터 다시 개표합니다\\.\\n(?!발각된 정당)([\\s\\S]+)$", "to": "⚠ Election fraud by $1 was uncovered during the count! ($2% counted)\nThe rigged votes are voided and the count starts over.\n$3"},
  {"re": "^정권 상태: (.+)$", "to": "Regime: {{dict:$1}}"},
  {"re": "^(정부 · 여당|왕당파|군부 쪽 정당) 발각 확률 ×([\\d.]+) · 발각 시 (.+)$", "to": "{{dict:$1}}: detection ×$2 · if caught: {{dict:$3}}"},
  {"re": "^야당 발각 확률 ×([\\d.]+) · 발각 시 (.+)$", "to": "Opposition: detection ×$1 · if caught: {{dict:$2}}"},
  {"re": "^\\s*— 실제 발각 확률\\s*$", "to": " — actual detection chance "},
  {"re": "^\\s*\\(기본 (\\d+)%\\)\\s*$", "to": " (base $1%)"},
  {"re": "^\\s*— (?!예비선거 |연대 안 지지율 1위 )(.+) · 결집 (\\d+)%\\s*$", "to": " — {{dict:$1}} · consolidation $2%"},
  {"re": "^(\\d+)석으로$", "to": "Set to $1 seats"},
  {"re": "^교섭단체 현황 — (.+)$", "to": "Negotiating groups — $1"},
  {"re": "^✔ 교섭단체 성립 — (.+) (\\d+)석 \\(기준 (\\d+)석\\)$", "to": "✔ Negotiating group formed — $1, $2 seats (threshold $3)"},
  {"re": "^✘ 기준 미달 — (\\d+)석 / (\\d+)석$", "to": "✘ Below threshold — $1 / $2 seats"},
  {"re": "^공동교섭단체 · (\\d+)석$", "to": "joint negotiating group · $1 seats"},
  {"re": "^비교섭단체: (.+)$", "to": "Non-negotiating groups: $1"},
  {"re": "^지역구마다 경선 — 그 지역구의 참여 정당 지지 (\\d+)% \\+ 일반 유권자 여론조사\\(유동층 — 전국 지지율 × 친화도\\) (\\d+)%\\. 대선 · 총리 선거는 아래에서 경선을 치러 후보를 정해요\\. 경선을 치르면 승복 효과로 결집률 \\+5%p\\. 결집률은 후보를 내지 않는 참여 정당의 표가 단일후보에게 가는 비율이에요\\.$", "to": "A primary in each district — local support for the member parties $1% + a general-public poll (swing voters — national support × affinity) $2%. For presidential and PM elections, hold the primary below to pick the candidate. Holding a primary adds +5%p to consolidation as losers concede. Consolidation is the share of the non-running member parties' votes that go to the single candidate."},
  {"re": "^대선 · 총리 단일후보:\\s*$", "to": "Presidential/PM candidate: "},
  {"re": "^\\s*\\(경선 (.+)\\)\\s*$", "to": " (primary $1)"},
  {"re": "^\\s*\\(추첨 확률 (.+)\\)\\s*$", "to": " (draw odds $1)"},
  {"re": "^대선 · 총리 단일후보: 아직 정하지 않음 — 정하기 전에는 지지율 1위 정당$", "to": "Presidential/PM candidate: not chosen yet — until then, the party with the highest support"},
  {"re": "^유동층\\(여론조사\\) 반영\\s*$", "to": "Swing-voter poll weight "},
  {"re": "^결집률\\s*$", "to": "Consolidation "},
  {"re": "^종속 형태 (\\d+)가지\\s*$", "to": "$1 dependency types "},
  {"re": "^종속국 (\\d+)곳 · 땅 (\\d+)곳 · 독립국 (\\d+)곳$", "to": "$1 dependencies · $2 districts of land · $3 independent states"},
  {"re": "^종속국 (\\d+)곳 · 땅 (\\d+)곳$", "to": "$1 dependencies · $2 districts of land"},
  {"re": "^(\\d+)곳 · 지역구 의석 (\\d+)석$", "to": "$1 districts · $2 district seats"},
  {"re": "^(\\d+)곳 · 독립국$", "to": "$1 districts · independent"},
  {"re": "^\"(.+)\"을\\(를\\) 본국에 합병합니다\\. 그 땅 (\\d+)곳\\(지역구 의석 (\\d+)석\\)은 일반 지역구가 되어 본국 선거 · 의석에 들어가고, (.+)는 해산됩니다\\. 계속하시겠습니까\\?$", "to": "Annex \"$1\" into the homeland? Its $2 districts ($3 district seats) become regular districts that count in homeland elections and seats, and $4 is dissolved. Continue?"},
  {"re": "^\"(.+)\"을\\(를\\) 해방합니다\\. 독립국이 되어 본국에서 떨어져 나가고, 그 땅 (\\d+)곳은 계속 본국 선거에서 빠집니다\\.( 세계 › 국가 순위에도 올라갑니다\\.)? 계속하시겠습니까\\?$", "to": "Release \"$1\"? It becomes independent and breaks away from the homeland, and its $2 districts stay out of homeland elections.{{map:$3| 세계 › 국가 순위에도 올라갑니다.= It also joins World › Ranking.}} Continue?"},
  {"re": "^독립국 \"(.+)\"의 땅 (\\d+)곳을 본국 지역구에서 아예 뺍니다 \\(지도에는 지역구가 아닌 땅으로 남음\\)\\. 계속하시겠습니까\\?$", "to": "Remove the $2 districts of the independent state \"$1\" from the homeland's districts entirely (they stay on the map as non-district land)? Continue?"},
  {"re": "^\"(.+)\"을\\(를\\) 지웁니다\\. 칠한 땅 (\\d+)곳은 본국 지역구로 돌아가고 의회 정보도 사라집니다\\. 계속하시겠습니까\\?$", "to": "Delete \"$1\"? Its $2 painted districts go back to the homeland and its parliament is lost. Continue?"},
  {"re": "^\"(.+)\" (.+)에 지지율이 있는 정당이 없습니다\\. 정당을 추가하거나 \"본국 정당 가져오기\"를 눌러 주세요\\.$", "to": "No party in the $2 of \"$1\" has any support. Add parties or click \"Import homeland parties\"."},
  {"re": "^\"(.+)\" (.+)의 정당 (\\d+)개를 지우고 본국 하원 정당\\(지지율은 본국 의석 비율\\)으로 바꾼 뒤 선거를 치릅니다\\. 계속하시겠습니까\\?$", "to": "Replace the $3 parties in the $2 of \"$1\" with the homeland's lower-house parties (support = their homeland seat share) and hold an election? Continue?"},
  {"re": "^오른쪽 지도에서 지역구를 차례로 눌러 \"(.*)\" 땅으로 칠합니다 \\(같은 나라로 칠한 곳을 다시 누르면 지움\\)\\. 다시 \"칠하는 중\"을 누르면 끝납니다\\.$", "to": "Click districts on the map to the right to paint them as \"$1\" land (click one already painted for that country to erase it). Click \"Painting\" again to finish."},
  {"re": "^\\s*🤝 (.+) 단일후보:\\s*$", "to": "🤝 $1 single candidate: "},
  {"re": "^\\s*— 예비선거 (.+) · 결집 (\\d+)%\\s*$", "to": " — primary $1 · consolidation $2%"},
  {"re": "^\\s*— 연대 안 지지율 1위 · 결집 (\\d+)%\\s*$", "to": " — top support in the alliance · consolidation $1%"},
  {"re": "^경선 득표 = 그 지역의 연대 정당 지지 (\\d+)% \\+ 일반 유권자 여론조사\\(유동층 — 전국 지지율 × 친화도\\) (\\d+)%\\. 지금 무당파 ([\\d.]+)%\\. 경선을 치르면 승복 효과로 결집률 \\+5%p\\. 결집하지 않은 표는 다른 정당으로 흩어져요\\.\\s*$", "to": "Primary vote = local support for the alliance parties $1% + general-public poll (swing voters — national support × affinity) $2%. Undecided voters now $3%. Holding a primary adds +5%p to consolidation as losers concede. Votes that don't consolidate scatter to other parties. "},
  {"re": "^미수복 지역 (\\d+)종류 · (\\d+)곳$", "to": "Unrecovered territory: $1 kinds · $2 districts"},
  {"re": "^미수복 지역 (\\d+)곳 \\((\\d+)종류\\)$", "to": "Unrecovered territory: $1 districts ($2 kinds)"},
  {"re": "^미수복 지역 (\\d+)곳$", "to": "Unrecovered territory: $1 districts"},
  {"re": "^(\\d+)곳$", "to": "$1 districts"},
  {"re": "^(.+) \\(미수복 지역: (.+)\\)$", "to": "$1 (unrecovered: $2)"},
  {"re": "^(.+) — 눌러서 지우기$", "to": "$1 — click to erase"},
  {"re": "^(.+) — 눌러서 \"(.*)\"로 칠하기$", "to": "$1 — click to paint as \"$2\""},
  {"re": "^\"(.+)\"의 미수복 지역 (\\d+)곳을 되찾아 본국에 통합합니다 \\(일반 지역구로 편입 · 다른 미수복 지역은 그대로\\)\\. 계속하시겠습니까\\?$", "to": "Recover the $2 unrecovered districts of \"$1\" and integrate them into the homeland (they become regular districts · other unrecovered territory stays). Continue?"},
  {"re": "^\"(.+)\" 종류를 지웁니다\\. 이 종류로 칠한 지역구 (\\d+)곳은 일반 지역구로 돌아갑니다\\. 계속하시겠습니까\\?$", "to": "Delete the kind \"$1\"? The $2 districts painted with it go back to being regular districts. Continue?"},
  {"re": "^모든 종류의 미수복 지역 (\\d+)곳을 되찾아 일반 지역구로 편입합니다\\. 계속하시겠습니까\\?$", "to": "Recover all $1 unrecovered districts of every kind and make them regular districts. Continue?"},
  {"re": "^오른쪽 지도에서 지역구를 차례로 눌러 \"(.*)\"로 칠합니다 \\(같은 종류로 칠한 곳을 다시 누르면 지움\\)\\. 다시 \"칠하는 중\"을 누르면 끝납니다\\.$", "to": "Click districts on the map to the right to paint them as \"$1\" (click one already painted with this kind to erase it). Click \"Painting\" again to finish."},
    {"re": "^(.+) — 조작 불가$", "to": "$1 — can't be rigged"},
    {"re": "^⚠ (.+) — (.+) 조작$", "to": "⚠ $1 — rigged by $2"},
    {"re": "^(.+) — 눌러서 조작$", "to": "$1 — click to rig"},
    {"re": "^(\\d+)곳 선택$", "to": "$1 selected"},
    {"re": "^진행 중인 의뢰 $", "to": "Active contracts "},
    {"re": "^표적 지역구 — (.+)$", "to": "Target districts — $1"},
    {"re": "^\\[ 진행 중인 의뢰 $", "to": "[ Active contracts "},
    {"re": "^\\[ 표적 지역구 — (.+) \\]$", "to": "[ Target districts — $1 ]"},
    {"re": "^세션 (\\S+) · 로그는 접속을 끊으면 지워집니다 · 발각되면 그 정당은 활동 금지$", "to": "Session $1 · logs vanish on disconnect · an exposed party is banned"},
    {"re": "^(\\d+)% · 낮음$", "to": "$1% · low"},
    {"re": "^(\\d+)% · 보통$", "to": "$1% · medium"},
    {"re": "^(\\d+)% · 높음$", "to": "$1% · high"},
    {"re": "^(\\d+)% · 치명적$", "to": "$1% · critical"},
    {"re": "^외 (\\d+)곳$", "to": "+$1 more"},
  {"re": "^(.+) · (.+) · 지지 (\\d+)%$", "to": "$1 · $2 · backing $3%"},
  {"re": "^(\\d+)위$", "to": "#$1"},
  {"re": "^지지 정당 의석: $", "to": "Backing parties' seats: "},
  {"re": "^ — 50%를 넘으면 주사위 없이 입헌군주제로$", "to": " — above 50% it becomes a constitutional monarchy without dice"},
  {"re": "^지지 정당 지지율 \\((\\d+)%\\)$", "to": "Backing parties' support ($1%)"},
  {"re": "^지지 정당 의석 \\((\\d+)%\\)$", "to": "Backing parties' seats ($1%)"},
  {"re": "^왕당파 의석 \\((\\d+)%\\)$", "to": "Royalist seats ($1%)"},
  {"re": "^왕당파 지지율 \\((\\d+)%\\)$", "to": "Royalist support ($1%)"},
  {"re": "^군의 충성 \\(평균 (\\d+)\\)$", "to": "Military loyalty (average $1)"},
  {"re": "^👑 (입헌군주제|전제군주정)$", "to": "👑 {{map:$1|입헌군주제=constitutional monarchy;전제군주정=absolute monarchy}}"},
  {"re": "^👑 (입헌군주제|전제군주정) — (.+) $", "to": "👑 {{map:$1|입헌군주제=constitutional monarchy;전제군주정=absolute monarchy}} — $2 "},
  {"re": "^ · (.+)부터$", "to": " · since $1"},
  {"re": "^(.+) · (.+)부터$", "to": "$1 · since $2"},
  {"re": "^ · ⚔ 계승 분쟁 중$", "to": " · ⚔ succession dispute"},
  {"re": "^다음 계승자: $", "to": "Next heir: "},
  {"re": "^없음 — 다른 왕가에서$", "to": "None — from another house"},
  {"re": "^지지 의석 (\\d+)%$", "to": "backing seats $1%"},
  {"re": "^(.+) · 지지율 ([\\d.]+)%$", "to": "$1 · support $2%"},
  {"re": "^왕실 기록 \\((\\d+)\\)$", "to": "Royal records ($1)"},
  {"re": "^(.+) 지지율 \\(([\\d.]+)%\\)$", "to": "$1 support ($2%)"},
  {"re": "^의회 결의로 왕정을 되살리려면 (.+)을\\(를\\) 지지하는 정당이 하원 과반이어야 합니다 \\(지금 (\\d+)%\\)\\. 쿠데타로 해 보세요\\.$", "to": "To restore the monarchy by parliamentary resolution, the parties backing $1 need a lower-house majority (now $2%). Try a coup instead."},
  {"re": "^의회 결의로 (.+)을\\(를\\) 입헌군주로 모십니다 \\(지지 정당 의석 (\\d+)%\\)\\. 계속하시겠습니까\\?$", "to": "Crown $1 as constitutional monarch by parliamentary resolution (backing seats $2%). Continue?"},
  {"re": "^왕당파 쿠데타로 (.+)을\\(를\\) 왕위에 올립니다 \\((입헌군주제|전제군주정)\\), 성공 확률 (\\d+)%\\. 계속하시겠습니까\\?$", "to": "Crown $1 by a royalist coup ({{map:$2|입헌군주제=constitutional monarchy;전제군주정=absolute monarchy}}), chance of success $3%. Continue?"},
  {"re": "^왕정복고 — 입헌군주제, (.+)$", "to": "Restoration — constitutional monarchy, $1"},
  {"re": "^왕정복고 — 숨겨진 정부 형태: 전제군주정, (.+)$", "to": "Restoration — hidden form of government: absolute monarchy, $1"},
  {"re": "^숨겨진 정부 형태: 전제군주정, (.+)$", "to": "Hidden form of government: absolute monarchy, $1"},
  {"re": "^(.+) 망명$", "to": "$1 goes into exile"},
  {"re": "^(.+)이\\(가\\) 친위 쿠데타로 의회를 누르고 전제군주정을 세웁니다, 성공 확률 (\\d+)%\\. 계속하시겠습니까\\?$", "to": "$1 crushes parliament in a self-coup and sets up an absolute monarchy, chance of success $2%. Continue?"},
  {"re": "^반왕당 정당 (\\d+)곳 활동 금지$", "to": "$1 anti-royalist parties banned"},
  {"re": "^실패 — (.+) 퇴위$", "to": "Failed — $1 abdicates"},
  {"re": "^실패 — 왕 퇴위$", "to": "Failed — the monarch abdicates"},
  {"re": "^공화 혁명을 일으킵니다(.*) \\(성공하면 (.+)\\), 성공 확률 (\\d+)%\\. 계속하시겠습니까\\?$", "to": "Start a republican revolution$1 (if it succeeds: $2), chance of success $3%. Continue?"},
  {"re": "^ — 혁명 정당: (.+)$", "to": " — revolutionary party: $1"},
  {"re": "^국호 변경: (.+) → (.+)$", "to": "Country renamed: $1 → $2"},
  {"re": "^군주제 폐지 — (.+) 공화국$", "to": "Monarchy abolished — $1 republic"},
  {"re": "^(.+)은\\(는\\) 왕위 주장자로 남음$", "to": "$1 remains a claimant"},
  {"re": "^(.+) 공석 — 선거로 뽑으세요$", "to": "$1 vacant — hold an election"},
  {"re": "^(.+) 활동 금지 · 지지율 절반$", "to": "$1 banned · support halved"},
  {"re": "^(.+) 즉위 \\((.+)\\) — 왕가 교체$", "to": "$1 takes the throne ($2) — new house"},
  {"re": "^(.+) 즉위 \\((.+)\\)$", "to": "$1 takes the throne ($2)"},
  {"re": "^(.+)의 서거 · 퇴위 — 계승 규칙\\((.*)\\)대로 다음 계승자가 즉위합니다\\. 계속하시겠습니까\\?$", "to": "Death · abdication of $1 — the next heir takes the throne by the succession rule ($2). Continue?"},
  {"re": "^(.+) 서거 · 퇴위$", "to": "$1 dies · abdicates"},
  {"re": "^(.+)이\\(가\\) 정통 왕위를 주장 — 계승 분쟁 시작$", "to": "$1 claims the legitimate throne — succession dispute begins"},
  {"re": "^지지: (.+)$", "to": "Backed by: $1"},
  {"re": "^(.+) 승리 — (.+) 즉위 \\((.+)\\)$", "to": "$1 wins — crowned $2 ($3)"},
  {"re": "^(.+)의 지지 정당 지지율 하락$", "to": "Support falls for $1's backing parties"},
  {"re": "^(.+) 왕위 지킴$", "to": "$1 keeps the throne"},
  {"re": "^군주제에서는 국가원수\\((.+)\\)를 선거로 뽑지 않습니다 — 내각 › 왕실에서 계승 · 공화 혁명을 다룹니다\\.$", "to": "Under a monarchy the head of state ($1) is not elected — handle succession and republican revolution in Cabinet › Royal."},
  {"re": "^\\\"(.+)\\\" 왕가를 지울까요\\? 주장자 (\\d+)명도 함께 지워집니다\\.$", "to": "Delete the house \"$1\"? Its $2 claimants will be deleted too."},
  {"re": "^디버그 — 바로 전제군주정으로 바꿉니다 \\((.+)\\)\\. 계속하시겠습니까\\?$", "to": "Debug — switch straight to absolute monarchy ($1). Continue?"},
  {"re": "^최고 ([\\d.]+)%$", "to": "Max $1%"},
  {"re": "^군 지휘부 (\\d+)명 · 평균 충성도 $", "to": "Military command: $1 · average loyalty "},
  {"re": "^([✔✘🕊]) (성공|실패|민정 이양) — (군부 쿠데타|정당 쿠데타|친위 쿠데타|역쿠데타|민정 이양) $", "to": "$1 {{map:$2|성공=Success;실패=Failure;민정 이양=Handover}} — {{map:$3|군부 쿠데타=military coup;정당 쿠데타=party coup;친위 쿠데타=self-coup;역쿠데타=counter-coup;민정 이양=handover to civilians}} "},
  {"re": "^\\(확률 (\\d+)%\\)$", "to": "(chance $1%)"},
  {"re": "^ · (.+)부터 · 대통령 · 총리 겸임, 비상 권한 독점, 의회 정지 · 선거 중단$", "to": " · since $1 · also president and PM, sole emergency powers, parliament suspended · elections halted"},
  {"re": "^의장 (.+) $", "to": "Chair $1 "},
  {"re": "^군 지휘부 (\\d+)명 · 평균 충성도 (\\d+)$", "to": "Military command: $1 · average loyalty $2"},
  {"re": "^군 지휘부 (\\d+)명$", "to": "Military command: $1"},
  {"re": "^지도자 (.+)의 불만 \\(충성도 (\\d+)\\)$", "to": "Leader $1's discontent (loyalty $2)"},
  {"re": "^지휘 계통 장악 \\((.+)\\)$", "to": "Control of the chain of command ($1)"},
  {"re": "^주도: (.+) — 의회를 멈추고 반대 정당을 막습니다$", "to": "Led by: $1 — halts parliament and blocks opposition parties"},
  {"re": "^주도: (.+)$", "to": "Led by: $1"},
  {"re": "^의장 (.+) · (.+)부터 · 대통령 · 총리 겸임, 비상 권한 독점, 의회 정지 · 선거 중단$", "to": "Chair $1 · since $2 · also president and PM, sole emergency powers, parliament suspended · elections halted"},
  {"re": "^의장 (.+)이\\(가\\) 대통령 · 총리를 겸함$", "to": "Chair $1 also serves as president and PM"},
  {"re": "^([✔✘]) (성공|실패) — (군부 쿠데타|정당 쿠데타|친위 쿠데타|역쿠데타) \\(확률 (\\d+)%\\)$", "to": "$1 {{map:$2|성공=Success;실패=Failure}} — {{map:$3|군부 쿠데타=military coup;정당 쿠데타=party coup;친위 쿠데타=self-coup;역쿠데타=counter-coup}} (chance $4%)"},
  {"re": "^⚔ (군부 쿠데타|정당 쿠데타|친위 쿠데타|역쿠데타) 일으키기$", "to": "⚔ Launch {{map:$1|군부 쿠데타=military coup;정당 쿠데타=party coup;친위 쿠데타=self-coup;역쿠데타=counter-coup}}"},
  {"re": "^(군부 쿠데타|정당 쿠데타|친위 쿠데타|역쿠데타)를 일으킵니다 — 주도: (.+), 성공 확률 (\\d+)%\\. 계속하시겠습니까\\?$", "to": "Launch a {{map:$1|군부 쿠데타=military coup;정당 쿠데타=party coup;친위 쿠데타=self-coup;역쿠데타=counter-coup}} — led by $2, chance of success $3%. Continue?"},
  {"re": "^(.+) 숙청 \\(군 지휘부에서 빠짐\\)$", "to": "$1 purged (removed from the military command)"},
  {"re": "^남은 지휘부 충성도 \\+(\\d+)$", "to": "Remaining command loyalty +$1"},
  {"re": "^(.+) \\(친위\\)$", "to": "$1 (self-coup)"},
  {"re": "^(.+) \\((.+)\\) · 충성도 (\\d+)$", "to": "$1 ($2) · loyalty $3"},
  {"re": "^반대 정당 (\\d+)곳 활동 금지$", "to": "$1 opposition parties banned"},
  {"re": "^(.+) 활동 금지 · 지지율 절반으로$", "to": "$1 banned · support halved"},
  {"re": "^(.+) 지지율 30% 하락$", "to": "$1 support down 30%"},
  {"re": "^(.+) 축출 \\(공석\\)$", "to": "$1 removed (vacant)"},
  {"re": "^군사평의회 의장 교체 \\((.+)\\)$", "to": "Military council chair replaced ($1)"},
  {"re": "^(.+) 지지율 \\(([\\d.]+)%\\)$", "to": "$1 support ($2%)"},
  {"re": "^가까운 장성 (\\d+)명$", "to": "$1 allied generals"},
  {"re": "^(.+) 집권 · (.+): (.+)$", "to": "$1 takes power · $2: $3"},
  {"re": "^(.+) 대표$", "to": "$1 leader"},
  {"re": "^⚔ 군정 — 군사평의회 집권 중 · 의장 (.+)$", "to": "⚔ Military junta — the military council rules · chair $1"},
  {"re": "^(.+)이\\(가\\) 없어 친위 쿠데타를 일으킬 수 없습니다\\.$", "to": "There is no $1, so a self-coup is not possible."},
  {"re": "^이민자 투표권: (.+)$", "to": "Migrant voting: $1"},
  {"re": "^(.+) 부의장(\\d*)$", "to": "$1 Deputy Speaker $2"},
  {"re": "^(.+) 의장$", "to": "$1 Speaker"},
  {"re": "^(.+) · (.+) 대표$", "to": "$1 · $2 leader"},
  {"re": "^심사 (\\d+)건 · $", "to": "$1 reviews · "},
  {"re": "^표결 (\\d+)건 · $", "to": "$1 votes · "},
  {"re": "^가결 (\\d+)$", "to": "Passed $1"},
  {"re": "^부결 (\\d+)$", "to": "Failed $1"},
  {"re": " — 지금: (.+)$", "to": " — now: $1"},
  {"re": "^(.+) (\\d+)번$", "to": "$1 #$2"},
  {"re": "(\\S.*) 자리에 있던 (.+)은\\(는\\) 자리에서 물러났습니다 \\(사람 탭에는 그대로 남아요\\)\\.", "to": "$2 stepped down from $1 (they stay in the People tab)."},
  {"re": "인물 (\\d+)명을 새로 만들고, 자리 (\\d+)곳을 사람 탭의 인물과 연결했습니다\\.", "to": "Created $1 new people and linked $2 posts to people in the People tab."},
  {"re": "이민자 ([\\d,]+)명", "to": "$1 migrants"},
  {"re": "이민자 ([\\d,]+)", "to": "Migrants $1"},
  {"re": "^이민자 투표권: (.+) — 지역구별 시민 수는 국가 › 지역$", "to": "Migrant voting: $1 — citizens per district are set in Nation › Districts"},
  {"re": "^합 ([\\d.]+)%", "to": "Total $1%"},
  {"re": "^✔ 당선 · 배정: ", "to": "✔ Elected · assigned: "},
  {"re": "^✘ 낙선: ", "to": "✘ Lost: "},
  {"re": "^합계 ([\\d.]+)%$", "to": "Total $1%"},
  {"re": "^✔ (\\d+)개 받음 — 다시 받기$", "to": "✔ $1 downloaded — download again"},
  {"re": "^\\((\\d+)개\\)$", "to": "($1)"},
  {"re": "^지금 버전 (\\S+)(.*)$", "to": "Current version $1$2"},
  {"re": "^최신 버전입니다(.*)\\.$", "to": "You are up to date$1."},
  {"re": "^새 버전 (\\S*) 받는 중… (\\d+)%$", "to": "Downloading new version $1… $2%"},
  {"re": "^🔒 \"(.+)\"은\\(는\\) ([\\d.]+) 업데이트에서 열리는 기능입니다\\.", "to": "🔒 \"$1\" opens in the $2 update."},
  {"re": "^Teaser ([\\d.]+) 미리보기 화면으로 갈까요\\? \\(미리보기 화면의 저장 공간은 따로입니다\\)$", "to": "Go to the Teaser $1 preview? (the preview keeps its own save storage)"},
  {"re": "^(.+) — ([\\d.]+)에서 열림$", "to": "$1 — opens in $2"},
  {"re": "^⚠ 개표 도중 (.+)의 부정선거가 발각되었습니다! \\(개표율 (\\d+)%\\)\\n조작된 표를 모두 무효 처리하고 처음부터 다시 개표합니다\\.\\n발각된 정당\\((.+)\\)은 활동이 금지됩니다\\.$", "to": "⚠ Election fraud by $1 was uncovered during the count! ($2% counted)\nThe rigged votes are voided and the count starts over.\n$3 is banned."},
  {"re": "봉쇄조항 ([\\d.]+)% 미달: ", "to": "below the $1% threshold: "},
  {"re": "^비우면 자동: (.+)$", "to": "Auto if empty: $1"},
  {"re": "^자동: (.+)$", "to": "Auto: $1"},
  {"re": "개표 중단: 부정선거 발각! \\(개표율 (\\d+)%\\)", "to": "Count halted: election fraud uncovered! ($1% counted)"},
  {"re": "개표 중\\.\\.\\. 개표율 ([\\d.]+)%$", "to": "counting... $1% counted"},
  {"re": "^Teaser (\\w+) 화면은 개발자 모드에서만 열 수 있습니다\\.$", "to": "The Teaser $1 screen can only be opened in developer mode."},
  {"re": "그중 (\\d+)곳은 지역구 성향을 따로 정해 그 값이 우선", "to": "$1 of them have their own district tendency, which takes priority"},
  {"re": "^지역구 (\\d+)곳의 따로 정한 성향 지우고 권역 성향 따르기$", "to": "Clear the own tendency of $1 districts and follow the region"},
  {"re": "\\(권역 성향: (.+?)\\)", "to": "(regional tendency: $1)"},
  {"re": "정당 (\\d+)개$", "to": "$1 parties"},
  {"re": "^이 (권역|지역구)만의 직책 \\(비우면 기본 직책 (.+)\\)$", "to": "Title for this $1 only (blank = default title $2)"},
  {"re": "^\\s*당선:\\s*$", "to": "Elected:"},
  {"re": "^찬성 ([\\d.]+)% · 투표율 ([\\d.]+)%$", "to": "Yes $1% · Turnout $2%"},
  {"re": "^\\s*지역\\s*$", "to": "Districts"},
  {"re": "^\\s*원\\s*$", "to": "Chamber"},
  {"re": "^제(\\d+)조$", "to": "Art. $1"},
  {"re": "^기본 위원회 만들기 \\((\\d+)개\\)$", "to": "Create default committees ($1)"},
  {"re": "^심사 중 (\\d+)건 · 심사 끝 (\\d+)건$", "to": "Under review $1 · Reviewed $2"},
  {"re": "^(\\d+)명$", "to": "$1 members"},
  {"re": "^▶ 위원회 심사 확정 \\(위원 (\\d+)명 중 과반 (\\d+)명 찬성이면 통과\\)$", "to": "▶ Confirm committee review (passes with $2 of $1 members in favor)"},
  {"re": "^(.+) 심사 중$", "to": "$1: under review"},
  {"re": "^(.+) ✔통과$", "to": "$1 ✔ passed"},
  {"re": "^(.+) ✘부결$", "to": "$1 ✘ rejected"},
  {"re": "^\\[ (.+?) 심사 결과 \\]", "to": "[ $1 review result ]"},
  {"re": "^\\[ (.+?) (?:표결|Vote) 결과 \\]", "to": "[ $1 vote result ]"},
  {"re": "^제정 (.+)$", "to": "Enacted $1"},
  {"re": " · 개정 (\\d+)회", "to": " · amended $1×"},
  {"re": "\\(최근 (.+)\\)", "to": "(latest $1)"},
  {"re": "^개정 (\\d+)회 — ", "to": "Amended $1× — "},
  {"re": "^의원: ", "to": "Member: "},
  {"re": "^지역구: (.+)$", "to": "District: $1"},
  {"re": "^… 외 (\\d+)개 조$", "to": "… and $1 more articles"},
  {"re": "^위원 과반 (\\d+)명", "to": "majority of $1 members"},
  {"re": "(.+)에서 부결돼 폐기된 법안입니다\\.$", "to": "This bill died after being rejected in $1."},
  {"re": "^(.+) 심사가 끝나야 본회의에 올릴 수 있습니다\\.$", "to": "The bill can go to the floor only after $1 finishes its review."},
  {"re": "^✔ (.+) 통과 — 본회의에 올릴 수 있어요$", "to": "✔ Passed $1 — it can go to the floor"},
  {"re": "^✘ (.+)에서 부결 — 폐기$", "to": "✘ Rejected in $1 — the bill dies"},
  {"re": "^\\\"(.+)\\\"을\\(를\\) 삭제할까요\\?(\\n심사 중인 법안 (\\d+)건은 위원회 심사 없이 본회의로 넘어갑니다\\.)?$", "to": "Delete \"$1\"?"},
  {"re": "^지역구별 결과 \\((\\d+)\\)$", "to": "Results by district ($1)"},
  {"re": "^\\s*사용\\s*$", "to": "Use"},
  {"re": "^무소속 의석이 (\\d+)석 남아 있어 끌 수 없습니다\\.", "to": "Independents still hold $1 seats, so this can't be turned off."},
  {"re": "의회 › 의회 구성에서 무소속 의석을 0으로 만든 뒤 다시 시도하세요\\.", "to": "Set the independents' seats to 0 in Parliament › Composition and try again."},
  {"re": "^(\\d+) / (\\d+)명 표시 중 — 더 보기$", "to": "Showing $1 / $2 \u2014 show more"},
  {"re": "^세이브 (\\d+)개 · 약 ([\\d.]+)(MB|KB) 사용$", "to": "$1 save(s) · about $2 $3 used"},
  {"re": "^(\\d+)초마다 · 탭을 옮기거나 닫을 때 \"(.+)\"에 저장$", "to": "Every $1 s · and when switching or closing tabs, into \"$2\""},
  {"re": "^(\\d+)분마다 · 탭을 옮기거나 닫을 때 \"(.+)\"에 저장$", "to": "Every $1 min · and when switching or closing tabs, into \"$2\""},
  {"re": "브라우저 저장 공간이 가득 차서 \"(.+?)\"을\\(를\\) 저장하지 못했습니다\\.", "to": "Browser storage is full, so \"$1\" could not be saved."},
  {"re": "\"(.+?)\" 슬롯을 삭제할까요\\?\\n삭제하면 되돌릴 수 없습니다\\.", "to": "Delete the save \"$1\"?\nThis can't be undone."},
  {"re": "^이전 자동저장 \\((\\d+)\\)$", "to": "Previous autosave ($1)"},
  {"re": "^미수복 지역 (\\d+)곳$", "to": "Unrecovered territories: $1"},
  {"re": "^떨어진 땅 (\\d+)곳이 도형 하나로 묶여 있습니다 — 눌러서 따로따로 나누기$", "to": "$1 separate pieces of land are bundled into this one shape — click to split them"},
  {"re": "^미수복 지역 (\\d+)곳을 모두 되찾아 일반 지역구로 편입합니다\\. 계속하시겠습니까\\?$", "to": "Recover all $1 unrecovered districts and fold them back in as ordinary districts? Continue?"},
  {"re": "^(.+) \\(미수복 지역\\)$", "to": "$1 (unrecovered territory)"},
  {"re": "^종속국 (\\d+)곳 · 땅 (\\d+)곳$", "to": "Dependencies: $1 · land: $2"},
  {"re": "^시민 ([\\d,]+) / 인구 ([\\d,]+) · 이민자 ([\\d,]+)$", "to": "Citizens $1 / population $2 · immigrants $3"},
  {"re": "^(\\d+)×(\\d+) · 지역 (\\d+)곳 \\(픽셀 지도 — 색이 정확히 같은 화소끼리\\)$", "to": "$1×$2 · $3 regions (pixel map — pixels of exactly the same color)"},
  {"re": "^▶ 다음 (1분기|1개월|1년)$", "to": "▶ Next {{map:$1|1분기=quarter;1개월=month;1년=year}}"},
  {"re": "^종속 형태 (\\d+)가지$", "to": "Dependency forms: $1"},
  {"re": "^(.+) \\(종속국: (.+)\\)$", "to": "$1 (dependency: $2)"},
  {"re": "^(.+) \\(독립국: (.+)\\)$", "to": "$1 (independent: $2)"},
  {"re": " 외 (\\d+)곳$", "to": " and $1 more"},
  {"re": "^현직 단체장 \\((\\d+) / (\\d+)\\)$", "to": "Current officeholders ($1 / $2)"},
  {"re": "^\\((권역|지역구) (\\d+)곳\\)$", "to": "($2 {{map:$1|권역=regions;지역구=districts}})"},
  {"re": " \\(권역이 없어 권역 단체장은 뽑지 않아요\\)", "to": " (no regions, so no regional heads are elected)"},
  {"re": "투표율 기준 (\\d+(?:\\.\\d+)?)%", "to": "turnout threshold $1%"},
  {"re": "([\\d,]+)표\\(([\\d.]+)%\\)", "to": "$1 votes ($2%)"},
  {"re": "^표 \\(([\\d.]+)%\\)$", "to": " votes ($1%)"},
  {"re": "인구 미입력 (\\d+)곳은 ([\\d,]+)명으로 계산", "to": "$1 without population counted as $2"},
  {"re": "유권자 ([\\d,]+)명", "to": "$1 eligible voters"},
  {"re": "(^| )투표 ([\\d,]+)명", "to": "$1$2 voted"},
  {"re": "\\(([\\d,]+) / ([\\d,]+)명\\)", "to": "($1 / $2 voters)"},
  {"re": "^지역구 (\\d+)곳 · 인구 입력 (\\d+)곳 \\(합계 ([\\d,]+)명\\)", "to": "$1 districts · population set for $2 (total $3)"},
  {"re": " · 권역 (\\d+)개", "to": " · $1 regions"},
  {"re": " \\(권역이 없어 지역구 단위로 치러요\\)", "to": " (no regions, so each district elects one)"},
  {"re": "^지역구가 없어 전국 하나로 계산합니다 \\(유권자 ([\\d,]+)명, 지지율 탭의 전국 지지율 사용\\)\\.$", "to": "No districts, so the whole country votes as one ($1 voters, using national support from the Support tab)."},
  {"re": "^— (.+) (\\d+)명$", "to": "— $2 × {{dict:$1}}"},
  {"re": "^(\\d+)년 지방선거$", "to": "$1 local elections"},
  {"re": "^(권역|지역구)별 결과 \\((\\d+)\\)$", "to": "Results by {{map:$1|권역=region;지역구=district}} ($2)"},
  {"re": "^지난 기록 \\((\\d+)\\)$", "to": "Past results ($1)"},
  {"re": "^— 찬성 ([\\d.]+)%$", "to": "— $1% yes"},
  {"re": "^찬성 ([\\d,]+) · 반대 ([\\d,]+) · ", "to": "Yes $1 · No $2 · "},
  {"re": "투표율 ([\\d.]+)%", "to": "turnout $1%"},
  {"re": "^(.+) — (가결|부결)$", "to": "$1 — {{dict:$2}}"},
  {"re": "^#(\\d+) (.+)$", "to": "#$1 {{dict:$2}}"},
  {"re": "^(.+) 지도 공유$", "to": "Share the $1 map"},
  {"re": "^([\\s\\S]+)이\\(가\\) 하원과 다른 지역구 지도를 쓰도록 나눕니다\\.\\n지금 지도를 복사해 그대로 이어 쓰며, 이후 ([\\s\\S]+) 지도를 따로 올릴 수 있습니다\\. 계속하시겠습니까\\?$", "to": "$1 will use a district map separate from the House.\nThe current map is copied so nothing changes yet; you can then upload a map just for $2. Continue?"},
  {"re": "^([\\s\\S]+)이\\(가\\) 다시 하원 지도를 함께 쓰도록 합칩니다\\.\\n하원 지도에 없는 ([\\s\\S]+) 지역구의 데이터\\(의석 · 성향 · 당선자\\)는 사라집니다\\. 계속하시겠습니까\\?$", "to": "$1 will share the House map again.\n$2 districts that aren't on the House map lose their data (seats · leanings · winners). Continue?"},
  {"re": "^([\\s\\S]+)의 지역구 데이터가 새 지도로 대체됩니다\\.\\n\\(이름·의석 수·성향·당선자 정보 포함\\) 계속하시겠습니까\\?$", "to": "$1's district data will be replaced by the new map.\n(Including names, seat counts, leanings and winners) Continue?"},
  {"re": "^\\((.+) 단일 후보\\)$", "to": "($1 joint candidate)"},
  {"re": "^ 추가(\\s*)$", "to": " added$1"},
  {"re": "^약 (\\d+) × (\\d+) 픽셀 \\(통계 · 머리를 넣으면 그만큼 커짐\\)$", "to": "About $1 × $2 pixels (larger with stats or a header)"},
  {"re": "^\\- 날짜의 \"직접 입력\"과 회기의 \"단순형\" 삭제 — 날짜는 연호\\(선택\\) \\+ 연 · 월 · 일, 회기는 대수 · 이름 · 회기 번호로만 \\(예전 세이브의 글자는 불러올 때 칸으로 옮김, 예: \"레이와 1년 4월 20일\" → 연호 레이와 · 1 · 4 · 20\\), 연호 1년처럼 두 자리 이하 연도도 그대로 넘어감$", "to": "- Removed free-text dates and \"simple\" sessions — dates are an optional era name + year · month · day, sessions are term · name · number (old saves are converted on load, e.g. \"Reiwa 1, April 20\" → era Reiwa · 1 · 4 · 20); years of two digits or less (like era year 1) now advance correctly"},
  {"re": "^지도나 목록에서 지역구를 누르면 편집 칸이 열립니다\\. 이름 · 약칭 · 인구, 그리고 원마다 몇 석을 뽑을지\\(0석이면 그 원엔 없는 지역구\\) 정해요\\. 지도는 휠 클릭 드래그로 이동, Shift\\+스크롤로 확대하고 ↺로 되돌립니다\\.$", "to": "Click a district on the map or in the list to open its editor. Set the name, abbreviation, population, and how many seats each chamber elects there (0 seats means that chamber has no such district). Middle-drag to pan the map, Shift+scroll to zoom, and ↺ to reset."},
  {"re": "^가결된 법안의 \"개정안 발의\"를 누르면 그 법안을 바탕으로 개정안\\(제2판 · 제3판 …\\)을 새로 제출합니다\\. 기록에는 몇 판째인지 함께 남아요\\.$", "to": "Pressing \"Propose amendment\" on a passed bill submits a new amendment (2nd · 3rd edition …) based on it. Records keep which edition it is."},
  {"re": "^⚙를 누르면 이 창이 뜹니다\\. 날짜는 연 · 월 · 일로 정하고, 앞에 연호\\(예: 레이와 → \"레이와 1년 4월 20일\"\\)를 붙일 수 있어요 — 비워 두면 연도만 보입니다\\. 회기는 대수 · 이름 · 회기 번호와 지금 회기 종류를 정합니다\\.$", "to": "⚙ opens this panel. Set the date by year · month · day, and optionally put an era name in front (e.g. Reiwa → \"Reiwa 1, April 20\") — leave it blank to show just the year. For the session, set the term, name, session number and the current session type."},
  {"re": "^예: 레이와 → 레이와 1년 4월 20일$", "to": "e.g. Reiwa → Reiwa 1, April 20"},
  {"re": "^기본 튜토리얼\\(#1 ~ #(\\d+)\\)을 모두 마쳤습니다! 이제 기본 흐름은 다 알아요\\. 이어서 세부 튜토리얼 #(\\d+) \"(.+?)\"부터 해보거나, 목차에서 필요한 기능만 골라 배우세요\\.$", "to": "You've finished the basic tutorial (#1 – #$1)! You now know the core flow. Continue with detailed tutorial #$2 \"$3\", or pick just the features you need from the lesson list."},
  {"re": "^면$", "to": "Area"},
  {"re": "^선$", "to": "Line"},
  {"re": "^원$", "to": "Circle"},
  {"re": "^정기회 시작 — (.+)$", "to": "Regular session opened — $1"},
  {"re": "^제(\\d+)대 (.+) 시작$", "to": "The {{ordinal:$1}} $2 begins"},
  {"re": "^연$", "to": "Year"},
  {"re": "^월$", "to": "Month"},
  {"re": "^일$", "to": "Day"},
  {"re": "\"(.+?)\"을\\(를\\) 정말 삭제하시겠습니까\\?\\n연결된 \"(.+?)\"도 함께 삭제됩니다\\.\\n\\n삭제하면 되돌릴 수 없습니다\\. \\(Shift\\+클릭하면 이 확인 없이 바로 삭제\\)", "to": "Really delete \"$1\"?\nIts linked \"$2\" will be deleted too.\n\nThis can't be undone. (Shift+click to delete without this prompt)"},
  {"re": "\"(.+?)\"을\\(를\\) 정말 삭제하시겠습니까\\?\\n\\n삭제하면 되돌릴 수 없습니다\\. \\(Shift\\+클릭하면 이 확인 없이 바로 삭제\\)", "to": "Really delete \"$1\"?\n\nThis can't be undone. (Shift+click to delete without this prompt)"},
  {
   "re": "^\\s*테마\\s*$",
   "to": "Theme"
  },
  {
   "re": "^\\s*화면\\s*$",
   "to": "Display"
  },
  {
   "re": "^\\s*언어\\s*$",
   "to": "Language"
  },
  {
   "re": "^\"(.+?)\" 열림$",
   "to": "Opened \"$1\""
  },
  {
   "re": "^\\s*\\+ 서브\\s*$",
   "to": "+ Sub"
  },
  {
   "re": "^\\s*방식\\s*$",
   "to": "Method"
  },
  {
   "re": "\"(.+?)\" 슬롯을 삭제할까요\\?\\n\\(연결된 \"(.+?) 자동저장\"도 함께 삭제됩니다\\)",
   "to": "Delete the save \"$1\"?\n(Its linked \"$2 Autosave\" will be deleted too)"
  },
  {
   "re": "\"(.+?)\" 슬롯이 이미 있습니다\\. 덮어쓸까요\\?",
   "to": "A save named \"$1\" already exists. Overwrite it?"
  },
  {
   "re": "\"(.+?)\" 슬롯을 불러올까요\\?\\n현재 화면의 저장하지 않은 변경사항은 사라집니다\\.",
   "to": "Load the save \"$1\"?\nUnsaved changes on the current screen will be lost."
  },
  {
   "re": "\"(.+?)\" 슬롯을 불러왔습니다\\.",
   "to": "Loaded the save \"$1\"."
  },
  {
   "re": "\"(.+?)\"은\\(는\\) 예약된 이름입니다\\. 다른 이름을 입력하세요\\.",
   "to": "\"$1\" is a reserved name. Please enter a different name."
  },
  {
   "re": "\"(.+?)\" 세이브가 이미 있습니다\\. 다른 이름을 입력하세요\\.",
   "to": "A save named \"$1\" already exists. Please enter a different name."
  },
  {
   "re": "\"(.+?)\" 언어 팩을 삭제할까요\\?",
   "to": "Delete the language pack \"$1\"?"
  },
  {
   "re": "\"(.+?)\" 언어 팩을 불러왔습니다\\. 지금 이 언어로 바꿀까요\\?",
   "to": "Loaded the language pack \"$1\". Switch to this language now?"
  },
  {
   "re": "\"(.+?)\" 도형을 지도에서 완전히 삭제합니다\\.\\n\\(배경/틀처럼 잘못 포함된 도형을 뺄 때 사용\\) 계속하시겠습니까\\?",
   "to": "The shape \"$1\" will be permanently removed from the map.\n(Use this to drop shapes such as backgrounds or frames that were included by mistake.) Continue?"
  },
  {
   "re": "선거 탭 > 지역구 체크박스에서 \"보궐\"을 선택하고 개표하면\\n이 지역구\\((.+?)\\)가 자동으로 대상에 포함됩니다\\.",
   "to": "Select \"By-election\" in the district checkboxes on the Election tab and run the count —\nthis district ($1) will be included automatically."
  },
  {
   "re": "^이 지역구를 궐석 처리하시겠습니까\\?\\n\\(보궐선거로 다시 채울 때까지 소속 정당 의석에서 1석 감소합니다\\)$",
   "to": "Vacate this district's seat?\n(The party loses 1 seat until it is refilled by a by-election)"
  },
  {
   "re": "^보궐선거 결과 \\((.+?)\\)\\n\\n",
   "to": "By-election results ($1)\n\n"
  },
  {
   "re": "\\n\\n의회>의원 탭에서 당선자 이름을 입력해 주세요\\.$",
   "to": "\n\nEnter the winners' names in Parliament > Members."
  },
  {
   "re": "^(.+?)에 대한 (.+?) 임명동의안이 국가 > 입법 탭에 상정되었습니다\\.$",
   "to": "A confirmation motion for $1 as {{map:$2|총리=PM;국무총리=Premier;대통령=President;국왕=Monarch;내각=Cabinet}} has been placed on the floor in Nation > Legislation."
  },
  {
   "re": "^건설적 불신임안이 가결되어 (.+?)이\\(가\\) 새 (.+?)가 되었습니다\\.\\n기존 내각은 물러났으니 내각 > 내각에서 새 국무위원을 채워 주세요\\.$",
   "to": "The constructive no-confidence motion passed and $1 is the new {{map:$2|총리=PM;국무총리=Premier;대통령=President;국왕=Monarch;내각=Cabinet}}.\nThe previous cabinet has stepped down — fill in new ministers in Cabinet > Cabinet."
  },
  {
   "re": "^(.+?)이\\(가\\) (.+?)으로 취임했습니다\\.$",
   "to": "$1 took office as {{map:$2|총리=PM;국무총리=Premier;대통령=President;국왕=Monarch;내각=Cabinet}}."
  },
  {
   "re": "^(.+?)은 스스로 해제할 수 없습니다\\.\\n선거 > 총선에서 새 선거를 반영해야 해제됩니다\\.$",
   "to": "{{map:$1|국가 비상사태=A State of Emergency;의회 해산=The Dissolution of Parliament;상원 해산=The Dissolution of the Senate;하원 해산=The Dissolution of the House;계엄령=Martial Law}} cannot be lifted by itself.\nIt is lifted once a new general election is applied in Election > General."
  },
  {
   "re": "^(.+?)을\\(를\\) 선포합니다\\. 계속하시겠습니까\\?$",
   "to": "Declare {{map:$1|국가 비상사태=a State of Emergency;의회 해산=the Dissolution of Parliament;상원 해산=the Dissolution of the Senate;하원 해산=the Dissolution of the House;계엄령=Martial Law}}. Continue?"
  },
  {
   "re": "^국무회의 표결 결과 — 찬성 (\\d+) · 반대 (\\d+) · 기권 (\\d+) \\(총 (\\d+)인\\)\\n\\n『(.+?)』이\\(가\\) (가결|부결)됩니다\\. 확정하시겠습니까\\?$",
   "to": "Cabinet vote — Yea $1 · Nay $2 · Abstain $3 (total $4)\n\n\"$5\" will be {{map:$6|가결=passed;부결=rejected}}. Confirm?"
  },
  {
   "re": "^『(.+?)』이\\(가\\) 국무회의 의결로 (가결|부결)되었습니다\\.$",
   "to": "\"$1\" was {{map:$2|가결=passed;부결=rejected}} by cabinet resolution."
  },
  {
   "re": "^(.+?)의 거부권을 행사해 이 법안을 최종 부결시킵니다\\. 계속하시겠습니까\\?$",
   "to": "Use the {{map:$1|총리=PM;국무총리=Premier;대통령=President;국왕=Monarch;내각=Cabinet}}'s veto to finally reject this bill. Continue?"
  },
  {
   "re": "^(.+?) 표결을 먼저 확정하세요\\.$",
   "to": "Finalize the $1 vote first."
  },
  {
   "re": "^(.+?)에서 부결된 법안은 (.+?)에 상정되지 않습니다\\.$",
   "to": "A bill rejected in the $1 is not sent to the $2."
  },
  {
   "re": "^새 총선이 반영되어 상원·하원 해산 상태가 모두 해제되었습니다\\.$",
   "to": "The new general election was applied — the dissolution of both the Senate and the House has been lifted."
  },
  {
   "re": "^새 총선이 반영되어 (.+?) 상태가 해제되었습니다\\.$",
   "to": "The new general election was applied — {{map:$1|국가 비상사태=a State of Emergency;의회 해산=the Dissolution of Parliament;상원 해산=the Dissolution of the Senate;하원 해산=the Dissolution of the House;계엄령=Martial Law}} has been lifted."
  },
  {
   "re": "^\\s*완료\\s*$",
   "to": "Done"
  },
  {
   "re": "^\\s*날짜\\s*$",
   "to": "Date"
  },
  {
   "re": "^\\s*저장\\s*$",
   "to": "Save"
  },
  {
   "re": "개\\s*\\|\\s*지역구를 클릭하면 의석 수·성향을 편집할 수 있습니다",
   "to": " | click a district to edit its seats and leanings"
  },
  {
   "re": "(#\\d+) · 내각\\s*$",
   "to": "$1 · Cabinet"
  },
  {
   "re": "^\\s*연\\s*$",
   "to": "Year"
  },
  {
   "re": "^\\s*월\\s*$",
   "to": "Month"
  },
  {
   "re": "^\\s*일\\s*$",
   "to": "Day"
  },
  {
   "re": "^\\s*색\\s*$",
   "to": "Color"
  },
  {
   "re": "^\\s*석\\s*$",
   "to": "seats"
  },
  {
   "re": "^\\s*(국회|하원|상원|삼원)만\\s*$",
   "to": "$1 only"
  },
  {
   "re": "(\\d{4})\\. (\\d{1,2})\\. (\\d{1,2})\\. (오전|오후) (\\d{1,2}):(\\d{2}):(\\d{2})",
   "to": "$1-$2-$3 $5:$6:$7 {{map:$4|오전=AM;오후=PM}}"
  },
  {
   "re": "마지막 저장\\((.+?)\\):",
   "to": "Last saved ($1):"
  },
  {
   "re": "기준: (.+?), (\\d+)석 필요",
   "to": "Threshold: $1, $2 seats needed"
  },
  {
   "re": "👑 다수당\\((.+?)\\) 대표 자동 반영",
   "to": "👑 Majority party ($1) leader applied automatically"
  },
  {
   "re": "현재 선출 방식: 다수당 방식 — 기준 원\\((.+?)\\)의 다수당 대표가 자동으로 (.+?)이 됩니다",
   "to": "Current method: majority — the majority party leader of the base chamber ($1) automatically becomes {{map:$2|총리=PM;국무총리=Premier}}"
  },
  {
   "re": "현재 선출 방식: 대통령 임명제 — 대통령이 후보를 지명하면 의회 심의를 거쳐 (.+?)으로 확정됩니다",
   "to": "Current method: presidential appointment — the president nominates a candidate and parliament confirms them as {{map:$2|총리=PM;국무총리=Premier}}"
  },
  {
   "re": "! (.+?) 선포됨 \\(총선으로만 해제\\) !",
   "to": "! $1 declared (lifted only by a general election) !"
  },
  {
   "re": "! (.+?) (선포|해제) !",
   "to": "! {{map:$2|선포=Declare;해제=Lift}}: $1 !"
  },
  {
   "re": "(\\d+)개 지역구 \\(SVG\\)",
   "to": "$1 districts (SVG)"
  },
  {
   "re": "(\\d+)석 초과 — 초과분은 화면에 안 보임",
   "to": "$1 seats over — the excess isn't shown"
  },
  {
   "re": "(\\d+)석 남음",
   "to": "$1 seats left"
  },
  {
   "re": "(\\d+)석이 비었어요\\.",
   "to": "$1 seats are now free."
  },
  {
   "re": "(\\d+)단계",
   "to": "$1 steps"
  },
  {
   "re": "이제 \"(.+?)\"의 의석 칸에 숫자를 넣어보세요\\. 남은 자리\\((\\d+)석\\)까지만 넣을 수 있어요\\.",
   "to": "Now enter a number in \"$1\"'s seat box. You can enter up to the free seats ($2)."
  },
  {
   "re": "이제 새 정당의 의석 칸에 숫자를 넣어보세요\\. 남은 자리\\((\\d+)석\\)까지만 넣을 수 있어요\\.",
   "to": "Now enter a number in the new party's seat box. You can enter up to the free seats ($1)."
  },
  {
   "re": "의회 › 의회 구성의 \"배정 합계\"는 정당 의석을 모두 더한 값이고, 총 의석 수를 넘을 수 없습니다\\. 기존 정당들이 이미 (\\d+)석을 다 차지하고 있으면 새 정당이 앉을 자리가 없어요\\. 총 의석 수를 늘리거나\\(예: (\\d+)\\) 다른 정당 의석을 줄여 빈자리를 만들어 보세요\\.",
   "to": "\"Assigned total\" in Parliament › Composition is the sum of all party seats, and it can't exceed the total. If the existing parties already fill all $1 seats, there's no room for a new party. Raise the total (e.g. $2) or cut another party's seats to make room."
  },
  {
   "re": "의회 › 정당 › 당수에서 정당 대표를 정합니다\\. 다수당 \"(.+?)\"의 당수 이름을 적어보세요\\.( \\(1983년의 연방총리는 헬무트 콜이었어요\\))?",
   "to": "Party leaders are set in Parliament › Parties › Leaders. Enter a leader name for the majority party \"$1\". (In 1983 the Federal Chancellor was Helmut Kohl.)"
  },
  {
   "re": "의회 › 정당 › 당수에서 정당 대표를 정합니다\\. 다수당의 당수 이름을 적어보세요\\.( \\(1983년의 연방총리는 헬무트 콜이었어요\\))?",
   "to": "Party leaders are set in Parliament › Parties › Leaders. Enter a leader name for the majority party. (In 1983 the Federal Chancellor was Helmut Kohl.)"
  },
  {
   "re": "다음은 (#\\d+) \"(.+?)\" \\((.+?)\\)입니다\\. 바로 이어서 하거나, 나중에 목차에서 골라 할 수 있어요\\.",
   "to": "Next up is $1 \"$2\" ($3). Continue right away, or pick it later from the lesson list."
  },
  {
   "re": "(#\\d+) 시작 →",
   "to": "Start $1 →"
  },
  {
   "re": "(#\\d+) 마치기",
   "to": "Finish $1"
  },
  {
   "re": "(#\\d+) (.+) 완료!",
   "to": "$1 $2 complete!"
  },
  {
   "re": "(\\d+) / (\\d+) 완료",
   "to": "$1 / $2 done"
  },
  {
   "re": "^\\s*도움말\\s*$",
   "to": "Help"
  },
  {
   "re": "^\\s*시각\\s*$",
   "to": "Visuals"
  },
  {
   "re": "^\\s*형식\\s*$",
   "to": "Format"
  },
  {
   "re": "^\\s*내보내기\\s*$",
   "to": "Export"
  },
  {
   "re": "^\\s*확인\\s*$",
   "to": "OK"
  },
  {
   "re": "^\\s*약칭\\s*$",
   "to": "Abbr."
  },
  {
   "re": "^\\s*선택\\s*$",
   "to": "Select"
  },
  {
   "re": "^\\s*활동중\\s*$",
   "to": "Active"
  },
  {
   "re": "^\\s*붙여넣기\\s*$",
   "to": "Paste"
  },
  {
   "re": "^\\s*상징\\s*$",
   "to": "Symbols"
  },
  {
   "re": "^\\s*의장단\\s*$",
   "to": "Presiding officers"
  },
  {
   "re": "^\\s*그리드\\s*$",
   "to": "Grid"
  },
  {
   "re": "^\\s*의결일\\s*$",
   "to": "Resolution date"
  },
  {
   "re": "^\\s*국무회의\\s*$",
   "to": "Cabinet Council"
  },
  {
   "re": "^\\s*대선\\s*$",
   "to": "Presidential"
  },
  {
   "re": "^\\s*총선\\s*$",
   "to": "General"
  },
  {
   "re": "^\\s*자동\\s*$",
   "to": "Auto"
  },
  {
   "re": "^\\s*대표제\\s*$",
   "to": "the-post"
  },
  {
   "re": "^\\s*됩니다\\.\\s*$",
   "to": "."
  },
  {
   "re": "^\\s*전국형\\s*$",
   "to": "National"
  },
  {
   "re": "^\\s*권역형\\s*$",
   "to": "Regional"
  },
  {
   "re": "^\\s*권역\\s*$",
   "to": "Regions"
  },
  {
   "re": "^\\s*여론\\s*$",
   "to": "Opinion"
  },
  {
   "re": "^\\s*대통령제\\s*$",
   "to": "Presidential"
  },
  {
   "re": "^\\s*이원\\s*$",
   "to": "Semi-"
  },
  {
   "re": "^\\s*집정부제\\s*$",
   "to": "presidential"
  },
  {
   "re": "^\\s*입헌\\s*$",
   "to": "Constitutional"
  },
  {
   "re": "^\\s*군주제\\s*$",
   "to": "monarchy"
  },
  {
   "re": "^\\s*집단\\s*$",
   "to": "Collective"
  },
  {
   "re": "^\\s*지도체제\\s*$",
   "to": "leadership"
  },
  {
   "re": "^\\s*국무총리\\s*$",
   "to": "Premier"
  },
  {
   "re": "^\\s*국무위원\\s*$",
   "to": "Cabinet member"
  },
  {
   "re": "^\\s*부총리\\s*$",
   "to": "Deputy PM"
  },
  {
   "re": "^\\s*장관\\s*$",
   "to": "Minister"
  },
  {
   "re": "^\\s*의회\\s*$",
   "to": "Parliament"
  },
  {
   "re": "^\\s*내각\\s*$",
   "to": "Cabinet"
  },
  {
   "re": "^\\s*대통령\\s*$",
   "to": "President"
  },
  {
   "re": "^\\s*총리\\s*$",
   "to": "PM"
  },
  {
   "re": "^\\s*지도\\s*$",
   "to": "Map"
  },
  {
   "re": "^\\s*목록\\s*$",
   "to": "List"
  },
  {
   "re": "^\\s*의장\\s*$",
   "to": "Speaker"
  },
  {
   "re": "^\\s*남음\\s*$",
   "to": "left"
  },
  {
   "re": "^\\s*그만하기\\s*$",
   "to": "Quit"
  },
  {
   "re": "^\\s*끝내기\\s*$",
   "to": "Finish"
  },
  {
   "re": "^\\s*나중에\\s*$",
   "to": "Later"
  },
  {
   "re": "^\\s*목차\\s*$",
   "to": "Lessons"
  },
  {
   "re": "^\\s*이전\\s*$",
   "to": "Back"
  },
  {
   "re": "^\\s*다음\\s*$",
   "to": "Next"
  },
  {
   "re": "^\\s*건너뛰기\\s*$",
   "to": "Skip"
  },
  {
   "re": "^\\s*실행\\s*$",
   "to": "Run"
  },
  {
   "re": "^\\s*신당\\s*$",
   "to": "New Party"
  },
  {
   "re": "^\\s*세이브\\s*$",
   "to": "Save"
  },
  {
   "re": "^\\s*메뉴\\s*$",
   "to": "Menu"
  },
  {
   "re": "^\\s*왼쪽\\s*$",
   "to": "Left"
  },
  {
   "re": "^\\s*가운데\\s*$",
   "to": "Center"
  },
  {
   "re": "^\\s*공통\\s*$",
   "to": "General"
  },
  {
   "re": "^\\s*모바일\\s*$",
   "to": "Mobile"
  },
  {
   "re": "^\\s*됩니다\\.\\s*$",
   "to": "."
  },
  {
   "re": "^\\s*부의장\\s*$",
   "to": "Deputy speaker"
  },
  {
   "re": "(\\d+|\\?)년\\s*(\\d+|\\?)월\\s*(\\d+|\\?)일",
   "to": "{{month:$2}} $3, $1"
  },
  {
   "re": "제(\\d+|\\?)대\\s+(.+?)\\s+제(\\d+|\\?)회\\s+(정기회|임시회)",
   "to": "{{ordinal:$1}} $2, {{ordinal:$3}} {{map:$4|정기회=Regular Session;임시회=Extraordinary Session}}"
  },
  {
   "re": "(\\d+)석",
   "to": "$1 seats"
  },
  {
   "re": "(\\d+)칸",
   "to": "$1 cells"
  },
  {
   "re": "(\\d+)판",
   "to": "$1 round"
  },
  {
   "re": "예정된 점검: (.+?) ~ (.+?) \\(KST\\)",
   "to": "Scheduled maintenance: $1 – $2 (KST)"
  },
  {
   "re": "예정된 점검: (.+?) \\(KST\\)부터",
   "to": "Scheduled maintenance from $1 (KST)"
  },
  {
   "re": "저장 슬롯은 최대 (\\d+)개까지 만들 수 있습니다\\. 기존 (?:세이브를|슬롯을) 삭제한 뒤 다시 시도하세요\\.",
   "to": "You can have up to $1 saves. Delete an existing save and try again."
  }
 ],
 "dict": [
    ["제작자: ttorri", "By ttorri"],
    ["🔗 의원과 연결됨 — 당적은 의원을 따르고, 이름·사진은 어느 쪽에서 고쳐도 함께 바뀜", "🔗 Linked to a member — party follows the member; name and photo stay in sync whichever side you edit"],
    ["내각에 임명…", "Appoint to cabinet…"],
    ["이 자리와 연결 끊기", "Unlink from this post"],
    ["결정", "Decisions"],
    ["모드", "Mods"],
    ["결정하기", "Take decision"],
    ["이미 함", "Done"],
    ["조건 미충족", "Requirements not met"],
    ["확인", "OK"],
    ["켜 둔 모드가 없습니다. 결정 · 이벤트는 스크립트 모드가 넣습니다.", "No mods are on. Decisions and events come from script mods."],
    ["모드 보기 · 불러오기", "View · load mods"],
    ["지금 고를 수 있는 결정이 없습니다. 조건이 맞으면 여기에 나타납니다.", "No decisions available right now. They appear here when their conditions are met."],
    ["스크립트 모드는 이벤트 · 결정 · 국가 변수를 더합니다 (코드 없이 JSON으로). 켜고 끄기는 이 기기의 모든 세이브에 적용되고, 변수 · 일어난 이벤트는 세이브마다 따로 저장됩니다. 만드는 법은", "Script mods add events, decisions and national variables (JSON, no code). Turning mods on/off applies to every save on this device; variables and fired events are saved per save. How to make one:"],
    ["모드 파일 불러오기 (.json)", "Load mod file (.json)"],
    ["예제 모드 넣기", "Add example mod"],
    ["모드 폴더 열기", "Open mods folder"],
    ["모더 도구", "Modder tools"],
    ["모더 도구 닫기", "Close modder tools"],
    ["띄우기", "Fire"],
    ["이 세이브에서 모드 상태 초기화", "Reset mod state in this save"],
    ["모드가 없습니다.", "No mods."],
    ["불러오지 못한 모드:", "Mods that failed to load:"],
    ["창작마당", "Workshop"],
    ["모드 폴더", "Mods folder"],
    ["불러온 파일", "Loaded file"],
    ["조건 맞음", "Conditions met"],
    ["조건 안 맞음", "Conditions not met"],
    ["이벤트 없음", "No events"],
    ["결정 · 모드 — 스크립트 모드(코드 없이 JSON으로 만든 이벤트 · 결정 · 국가 변수)를 켜고 끄고, 모드가 넣은 결정을 실행합니다. 이벤트는 날짜를 넘길 때(또는 총선 결과를 반영할 때) 조건이 맞으면 창으로 뜹니다.", "Decisions · mods — turn script mods (events, decisions and national variables made in JSON, no code) on or off and take the decisions they add. Events pop up when the date advances (or election results are applied) and their conditions are met."],
    ["모드가 넣은 버튼 — 조건이 맞아야 실행할 수 있고, 한 번만 쓰거나 정한 날 수가 지나야 다시 쓸 수 있어요.", "Buttons added by mods — they work only when their conditions are met, and are single-use or have a cooldown in days."],
    ["모드 파일 불러오기(.json) · 예제 모드 · 켜고 끄기(이 기기의 모든 세이브), 모더 도구(변수 · 플래그 · 이벤트 바로 띄우기). 데스크톱 앱은 모드 폴더 · 창작마당 모드도 읽어요. 만드는 법은 docs/MODDING.md.", "Load mod files (.json) · example mod · on/off (all saves on this device), modder tools (variables, flags, fire events). The desktop app also reads the mods folder and Workshop mods. How to make one: docs/MODDING.md."],
    ["스코틀랜드 · 카탈루냐 같은 자치 지역 — 켜면 그 종속국은 자기 의회를 따로 두면서도 그 땅의 지역구가 본국 총선 · 지방선거 · 국민투표에 들어가고 본국 지역구 의석에 셉니다 (경제 집계 · 공납은 종속국 그대로).", "Autonomous regions like Scotland or Catalonia — when on, the dependency keeps its own parliament but its districts also vote in national, local elections and referendums and count toward national district seats (economy and tribute stay as a dependency)."],
    ["창당일", "Founded"],
    ["본국 총선에도 참여", "Also votes in national elections"],
    ["(자치 지역 — 스코틀랜드 · 카탈루냐처럼)", "(autonomous region — like Scotland or Catalonia)"],
    ["세력 변화의 당 변화(계보도)에 이 날짜로 창당이 표시됩니다 — 기록에 처음 나온 날보다 이르면 그 날짜에 창당 시점이 생겨요", "The party lineage in Seat history starts at this date — if it's earlier than the party's first record, a founding point is added at that date"],
    ["스코틀랜드 · 카탈루냐처럼 — 자기 의회는 따로 두되, 그 땅의 지역구도 본국 총선 · 지방선거 · 국민투표에 들어가고 본국 지역구 의석에 셈", "Like Scotland or Catalonia — keeps its own parliament, but its districts also vote in national, local elections and referendums and count toward national district seats"],
    ["지역구 정보 칸", "District info fields"],
    ["의석", "Seats"],
    ["인구", "Population"],
    ["제작자: 왕조명", "By 왕조명"],
    ["제작자", "Author"],
    ["지도 자료: Natural Earth (공개 도메인) · 제작자가 적힌 지도는 커뮤니티 제작", "Map data: Natural Earth (public domain) · maps with an author are community-made"],
    ["지금 보이는 경제 시각 화면 전체를 사진(PNG · JPG · SVG)으로 — 화면에서 우클릭해도 됨", "Save the whole economy view as a picture (PNG · JPG · SVG) — or right-click the view"],
    ["— 위 세출 · 아래 세입, 두께 = 세출 · 세입 차이", "— spending on top · revenue below, thickness = spending vs revenue gap"],
    ["📷 사진", "📷 Photo"],
    ["기사 (🔒 1.7.0)", "Articles (🔒 1.7.0)"],
    ["신문 · 방송 기사를 직접 작성하는 기능(언론사 · 제목 · 부제 · 날짜 · 본문 · 사진, 날짜순 기사 목록) — 1.7.0에서 열립니다.", "Write your own newspaper and broadcast articles (outlet · headline · subhead · date · body · photo, listed by date) — opens in 1.7.0."],
    ["여론 › 기사", "Opinion › Articles"],
    ["- 여론 › 기사 탭 신설 — 신문 · 방송 기사를 직접 작성 (언론사 · 제목 · 부제 · 날짜 · 본문 · 사진), 날짜순으로 쌓이는 기사 목록", "- New Opinion › Articles tab — write newspaper and broadcast articles (outlet · headline · subhead · date · body · photo), listed by date"],
    ["기사", "Articles"],
    ["조작 지역구 · 지역구를 누르면 ", "Rigged district · click a district to make it "],
    ["의 표적으로 · 다시 누르면 해제", "'s target · click again to clear"],
    ["선택 안 함", "None selected"],
    ["눌러서 선택 · 다시 누르면 해제", "Click to select · click again to clear"],
    ["선택 해제", "Clear"],
    ["전체", "All"],
    ["표 매수", "Vote buying"],
    ["개표 조정", "Count tuning"],
    ["흔적 정리", "Cleanup"],
    ["증인 관리", "Witness handling"],
    ["🔐 에스크로 예치됨", "🔐 Funds in escrow"],
    ["판매자 ghost_ballot · ★ 4.9", "Vendor ghost_ballot · ★ 4.9"],
    ["거래 기록", "Transaction log"],
    ["득표율 부풀리기", "Vote-share inflation"],
    ["거래 체결됨", "Deal struck"],
    ["거래 시작", "Open a deal"],
    ["다음 총선 개표 1회에 적용", "Applies to the next election count only"],
    ["> BLACK BALLOT // 의뢰 접수", "> BLACK BALLOT // contract intake"],
    ["검은 투표함 — 표 중개 · 개표 조정 · 흔적 정리", "Black Ballot — vote brokering · count adjustment · trace cleanup"],
    ["이 페이지는 존재하지 않습니다. 당신은 아무것도 보지 않았습니다.", "This page does not exist. You saw nothing."],
    ["🔒 3홉 회로 · 추적 불가", "🔒 3-hop circuit · untraceable"],
    ["● 대기 — 다음 총선 개표 때 실행", "● Pending — executes at the next election count"],
    ["득표 부풀리기", "Vote inflation"],
    ["조작 지역구", "Rigged districts"],
    ["발각 위험", "Detection risk"],
    ["✘ 발각", "✘ Exposed"],
    ["✔ 은폐됨", "✔ Covered up"],
    ["[ 거래 기록 ]", "[ Transaction log ]"],
    ["> 기록 없음", "> No records"],
    ["> 진행 중인 의뢰 없음. 왼쪽에서 정당을 골라 거래를 시작하세요", "> No active contracts. Pick a party on the left to open a deal"],
  ["세력 변화 — 정당 의석을 시점마다 기록해 오른쪽 \"세력 변화\" 시각 탭에 정당 역사 도표로 그립니다 (의석 띠 · 점유율 · ▲▼ · 정당별 흐름, 창당 · 당명 변경 · 합당 · 분당 계보도). 총선을 의회에 반영하면 자동으로 기록되고, \"지금 기록하기\"로 직접 남기거나 선거 기록에서 가져올 수 있어요.", "Power shifts — records party seats at each point in time and draws a party history chart in the \"Power shifts\" display tab (seat bands · share · ▲▼ · per-party flows, and a lineage of foundings · renamings · mergers · splits). Applying a general election records it automatically; you can also record now or import from election records."],
  ["정당 승계", "Party succession"],
  ["같은 정당의 당명 · 색 바꾸기(예: 한나라당 → 새누리당), 서로 다른 정당을 앞 → 뒤로 잇기(후신 · 합당 · 분당).", "Rename or recolor the same party (e.g. Grand National Party → Saenuri), or link different parties from earlier to later (successor · merger · split)."],
  ["위키 틀 — 위키 문서의 \"원내 구성\" 틀처럼 여당 · 야당 정당을 의석과 함께 모은 틀을 오른쪽 시각 화면에 그립니다. 원내 · 원외 전환, 나무위키 문법으로 복사, 반원 그림 저장.", "Wiki box — draws a wiki-style \"parliamentary composition\" box of government and opposition parties with their seats in the display panel. Switch in/out of parliament, copy as Namuwiki markup, save the hemicycle image."],
  ["정당별 · 의원별 찬반 표결. 의회를 통과한 법안의 서명 · 거부권 행사는 내각 › 서명에서 합니다.", "Yea/nay votes by party or member. Signing or vetoing bills that passed parliament happens in Cabinet › Sign."],
  ["국회공성전 — 의원들이 몸으로 표결을 지키거나 막는 상황입니다. 결과마다 오른쪽 하원 반원 위에서 의원들이 움직이는 애니메이션이 나와요 (켜고 끄기 · 0.5× ~ 4× 속도).", "Parliament siege — members physically protect or block a vote. Each outcome plays an animation of members moving on the lower-house hemicycle (toggle · 0.5×–4× speed)."],
  ["계엄 중 봉쇄 돌파", "Breaking the martial-law blockade"],
  ["계엄군 · 경찰이 국회를 막은 동안, 정당마다 참여율을 정하면 의원 한 명씩 봉쇄를 뚫는지 굴려 봅니다. 들어간 의원만 계엄 해제 결의안을 표결하고(재적 과반이면 해제), 반대 정당은 입구를 막을 수 있어요.", "While troops and police block parliament, set each party's turnout and each member rolls to break through. Only those inside vote on lifting martial law (a majority of all members lifts it), and opposing parties can block the entrance."],
  ["물리적 의사 방해", "Physical obstruction"],
  ["반대하는 법안의 표결을 막으려 의장석을 점거합니다. 참여 의원 수 · 결속도 · 의장 경호권 · 직권상정 · 국회선진화법으로 성공 확률이 정해지고, 성공하면 표결이 무산돼요. 폭력을 쓴 정당은 지지율이 깎이고 다친 의원은 몇 번 결석합니다.", "Occupy the speaker's podium to block a vote on a bill you oppose. Participants · cohesion · the speaker's security powers · direct tabling · the National Assembly Advancement Act set the chance; success scraps the vote. Violent parties lose support and injured members miss a few votes."],
  ["사람 — 인물(이름 · 사진 · 이념 · 정당 · 파벌 · 메모)을 미리 만들어 두고 자리에 배정합니다. 이름 · 사진을 고치면 배정된 모든 자리에 반영되고, 선거 · 당적 변경으로 자리가 사라져도 인물은 남아요.", "People — create people (name · photo · ideology · party · faction · memo) and assign them to posts. Editing a name or photo updates every post they hold, and people stay even when elections or party switches remove their posts."],
  ["의원 · 당수 · 원내대표 · 파벌 대표 · 의장단 · 대통령(국왕) · 내각 · 지방 단체장 · 왕가 주장자처럼 이름이 적힌 자리에서 인물을 만들고 연결합니다 (같은 이름은 한 사람).", "Creates and links people from every post with a name — members, leaders, floor leaders, faction leaders, speakers, president (monarch), cabinet, local heads and royal claimants (the same name is one person)."],
  ["선거 전에 인물을 지역구 후보로 내세우면, 총선 · 보궐선거에서 그 정당이 이긴 의석에 바로 배정돼요.", "Nominate a person as a district candidate before an election, and they are seated if their party wins that district in a general or by-election."],
  ["지역구 인구를 시민과 이민자로 나눕니다 (국가 › 지역의 \"시민 / 인구\"). 이민자 투표권은 선거 › 방식, 이민자 성향은 여론 › 종합.", "Split district population into citizens and migrants (\"citizens / population\" in Nation › Districts). Migrant voting rights are in Elections › Method, migrant leanings in Opinion › Overview."],
  ["지방선거 — 권역 단체장(예: 지사)과 지역구 단체장(예: 시장)을 뽑습니다. 지역구 인구 × 투표율로 실제 득표수를 계산하고, 당선자를 현직 단체장으로 반영하면 오른쪽에 지방자치 현황 지도가 나와요. 직책 이름은 권역 · 지역구마다 따로 정할 수 있습니다.", "Local elections — elect regional heads (e.g. governors) and district heads (e.g. mayors). Real vote counts come from district population × turnout; applying the winners as incumbents shows a local government map. Office names can be set per region or district."],
  ["국민투표 — 정당마다 찬성 · 중립 · 반대 입장을 정하면 지역구마다 그 정당 지지층이 입장대로 찬반을 나눠 득표가 나옵니다. 투표율 기준(예: 50%)을 켜면 그 아래일 때는 결과와 상관없이 부결.", "Referendum — set each party's stance (yes · neutral · no) and each district's supporters split accordingly. With a turnout threshold (e.g. 50%), anything below it fails regardless of the result."],
  ["지난 선거 결과 — 총선 · 대선(총리 선거) · 지방선거 · 국민투표 기록을 최근 순으로, 종류 칩 · 검색으로 걸러 봅니다.", "Past election results — general, presidential (PM), local elections and referendums, newest first, filtered by type chips or search."],
  ["군부 — 군 지휘부(국방부 장관 · 합참의장 · 육해공군 참모총장 등)를 정합니다. 지휘관마다 소속 · 정부에 대한 충성도(0~100) · 가까운 정당이 있고, 쿠데타 성공 확률 · 국회공성전 봉쇄 강도에 쓰여요.", "Military — set up the military command (defense minister · joint chiefs chair · army, navy and air force chiefs …). Each commander has a branch, loyalty to the government (0–100) and an allied party, used for coup chances and the siege blockade strength."],
  ["쿠데타 — 주도 세력(군부 · 정당 · 대통령 친위)과 지도자를 고르면 성공 확률을 요인별로 보여 주고, 일으키면 주사위를 굴립니다.", "Coup — pick who leads it (military · party · presidential self-coup) and a leader to see the chance by factor; launching it rolls the dice."],
  ["성공", "Success"],
  ["계엄령 선포 · 의회 정지 · 반대 정당 활동 금지. 군부가 성공하면 숨겨진 정부 형태 \"군정\" — 군사평의회 의장이 대통령 · 총리를 겸하고 선거가 멈춥니다.", "Martial law · parliament suspended · opposition parties banned. A successful military coup brings the hidden form of government \"military junta\" — the council chair is also president and PM, and elections stop."],
  ["실패", "Failure"],
  ["주도 세력 처벌(지도자 숙청 · 정당 활동 금지 · 대통령 축출)과 역풍으로 지지율 하락.", "The plotters are punished (leader purged · party banned · president ousted) and support falls in the backlash."],
  ["민정 이양(계엄 해제 · 선거 재개 · 막힌 정당 복권) · 역쿠데타 · 혁명.", "Hand over to civilians (martial law lifted · elections resume · banned parties reinstated) · counter-coup · revolution."],
  ["혁명 — 민중이 주체입니다. 주도 이념(민주 · 공산주의)과 혁명 정당을 고르면 성공 확률을 요인별로 보여 줘요 (정부 불신 · 군정 · 계엄 · 활동 금지 정당 · 혁명 정당 지지율 · 군의 충성).", "Revolution — the people rise. Pick the leading ideology (democratic · communist) and revolutionary party to see the chance by factor (distrust of government · military rule · martial law · banned parties · the party's support · military loyalty)."],
  ["공산주의 혁명", "Communist revolution"],
  ["성공하면 숨겨진 정부 형태 \"당-국가 체제\" — 혁명 정당 일당 집권, 다른 정당은 활동 금지 또는 우당, 의회는 최고인민회의, 선거는 단일 후보 찬반 투표.", "Success brings the hidden form of government \"party-state\" — one-party rule, other parties banned or satellite parties, parliament becomes a Supreme People's Assembly, and elections are single-candidate yes/no votes."],
  ["민주 혁명", "Democratic revolution"],
  ["성공하면 군정 · 당-국가 체제 · 계엄이 무너지고 막혔던 정당이 복권, 새 헌법과 새 총선.", "Success brings down military rule · the party-state · martial law, reinstates banned parties, and brings a new constitution and new elections."],
  ["왕실 — 왕가와 왕위 주장자(이름 · 칭호 · 성별 · 사진 · 지지 정당)를 정하고 계승 규칙(남계만 · 남자 우선 · 성별 무관)을 고릅니다. 주장자 순서(⋮⋮ 끌기)가 출생 순이에요.", "Royal — set up royal houses and claimants (name · title · gender · photo · backing parties) and choose the succession rule (male line only · male preference · absolute primogeniture). Claimant order (⋮⋮ drag) is birth order."],
  ["공화정에서 군주제를 되살립니다 — 지지 정당이 하원 과반이면 의회 결의로 입헌군주제, 아니면 왕당파 쿠데타(입헌군주제 · 전제군주정).", "Brings back the monarchy from a republic — by parliamentary resolution (constitutional monarchy) if the backing parties hold a lower-house majority, otherwise by a royalist coup (constitutional · absolute)."],
  ["군주제에서", "Under a monarchy"],
  ["서거 · 퇴위하면 계승 규칙대로 다음 계승자가 즉위하고, 다른 주장자가 정통 왕위를 주장하면 계승 분쟁(의회 표결 · 내전). 입헌군주제는 친위 쿠데타로 전제군주정, 전제군주정은 입헌 개혁으로 돌아가고, 공화 혁명으로 군주제를 없앨 수 있어요.", "On death or abdication the next heir takes the throne by the succession rule; a rival claim starts a succession dispute (parliamentary vote · civil war). A constitutional monarchy can become absolute by self-coup, an absolute one returns by constitutional reform, and a republican revolution can abolish the monarchy."],
  ["세력 변화 — 의회 › 세력 변화의 기록을 정당 역사 도표로 (의석 변화 · 당 변화 계보도, 아래로 스크롤). 우클릭으로 PNG · SVG 내보내기.", "Power shifts — the records from Parliament › Power shifts as a party history chart (seat changes · party lineage, scroll down). Right-click to export PNG · SVG."],
  ["위키 틀 — 원내 구성 틀 (정당 로고 · 의석 · 여야 구분). 우클릭으로 PNG · SVG 내보내기.", "Wiki box — the parliamentary composition box (party logos · seats · government/opposition). Right-click to export PNG · SVG."],
  ["국가 순위 — 세계 › 국가 순위의 순위표 (국기 · 진영 · 점수 · 순위 변동).", "Country ranking — the table from World › Country ranking (flags · blocs · scores · rank changes)."],
  ["나라 바깥 — 세계 여러 나라와 진영입니다. 꾸밈용이라 게임 계산에는 영향을 주지 않아요.", "Beyond the country — other nations and blocs of the world. Cosmetic: it does not affect game calculations."],
  ["국가 순위 — 냉전 국가 순위처럼 나라마다 국기(그림) · 진영 · 하위 이념 · 점수를 정하면 오른쪽 \"국가 순위\" 시각 탭에 순위표와 순위 변동이 나옵니다.", "Country ranking — like a Cold War power ranking: set each country's flag (image) · bloc · sub-ideology · score, and the \"Country ranking\" display tab shows the table and rank changes."],
  ["진영 — 진영 추가 · 삭제, 색 · 설명, 하위 이념 추가 · 삭제, 진영 구도 막대.", "Blocs — add or delete blocs, colors · descriptions, add or delete sub-ideologies, and a bloc balance bar."],
  ["경제권 (🔒 1.7.1)", "Economic blocs (🔒 1.7.1)"],
  ["여러 나라를 묶어 경제권(관세 동맹 · 공동시장 · 통화 동맹 …)을 정하고 경제에 반영하는 기능 — 1.7.1에서 열립니다.", "Group countries into economic blocs (customs unions · common markets · currency unions …) that feed into the economy — opens in 1.7.1."],
  ["왕가와 왕위 주장자를 정하고, 왕정복고 · 계승 · 계승 분쟁 · 친위 쿠데타 · 공화 혁명을 다룹니다. 주장자 순서(⋮⋮ 끌기)가 출생 순이고, 계승 규칙에 따라 계승 순위가 정해져요.", "Set up royal houses and claimants, and handle restoration, succession, succession disputes, self-coups and republican revolutions. Claimant order (⋮⋮ drag) is birth order, and the succession rule decides the line of succession."],
  ["👑 왕정복고", "👑 Restoration"],
  ["왕정복고", "Restoration"],
  ["공화정에서 군주제를 되살립니다. 주장자를 지지하는 정당이 하원 과반이면 의회 결의로, 아니면 왕당파 쿠데타로.", "Bring back the monarchy from a republic: by parliamentary resolution if the claimant's backing parties hold a lower-house majority, otherwise by a royalist coup."],
  ["먼저 아래에서 왕가와 주장자를 만드세요.", "First create a royal house and claimants below."],
  ["의회 결의", "Parliamentary resolution"],
  ["입헌군주제", "Constitutional monarchy"],
  ["전제군주정", "Absolute monarchy"],
  ["왕가와 왕위 주장자", "Royal houses and claimants"],
  ["[+] 왕가 추가", "[+] Add royal house"],
  ["[+] 예시 왕가 만들기", "[+] Create example houses"],
  ["[+] 주장자 추가", "[+] Add claimant"],
  ["계승 규칙", "Succession rule"],
  ["남계만 (살리카법)", "Male line only (Salic law)"],
  ["남자 우선", "Male preference"],
  ["성별 무관 (장자)", "Absolute primogeniture"],
  ["남", "M"],
  ["여", "F"],
  ["+ 지지 정당", "+ Backing party"],
  ["지지 철회", "Withdraw support"],
  ["왕가 색", "House color"],
  ["왕가 지우기", "Delete house"],
  ["빼기", "Remove"],
  ["이름", "Name"],
  ["왕가 이름 (예: 호엔촐레른가)", "House name (e.g. House of Hohenzollern)"],
  ["칭호 (예: 프로이센 왕자)", "Title (e.g. Prince of Prussia)"],
  ["끌어서 순서(출생 순) 바꾸기", "Drag to reorder (birth order)"],
  ["칭호", "Title"],
  ["(공석)", "(vacant)"],
  ["(이름 없음)", "(no name)"],
  ["왕이 총리를 임명하고(내각 › 총리) 거부권 · 비상 권한을 모두 쥡니다. 의회는 협찬 기관입니다.", "The monarch appoints the PM (Cabinet › PM) and holds the veto and all emergency powers. Parliament is an advisory body."],
  ["국왕은 상징적 국가원수이고 실권은 총리에게 있습니다 (의원내각제처럼).", "The monarch is a symbolic head of state and real power lies with the PM (as in a parliamentary system)."],
  ["계승", "Succession"],
  ["계승 분쟁", "Succession dispute"],
  ["⚱ 서거 · 퇴위 → 다음 계승자 즉위", "⚱ Death · abdication → next heir takes the throne"],
  ["의회 표결로 결판", "Settle by parliamentary vote"],
  ["내전으로 결판 (주사위)", "Settle by civil war (dice)"],
  ["정통 왕위 주장", "Claim the legitimate throne"],
  ["왕위를 다툴 다른 주장자가 없습니다.", "There is no other claimant to contest the throne."],
  ["입헌 개혁 · 공화 혁명", "Constitutional reform · republican revolution"],
  ["친위 쿠데타 · 공화 혁명", "Self-coup · republican revolution"],
  ["⚖ 입헌 개혁 (입헌군주제로)", "⚖ Constitutional reform (to constitutional monarchy)"],
  ["⚔ 친위 쿠데타 (전제군주정으로)", "⚔ Self-coup (to absolute monarchy)"],
  ["— 시민 혁명 (정당 없음) —", "— Citizens' revolution (no party) —"],
  ["✊ 공화 혁명", "✊ Republican revolution"],
  ["공화 혁명", "Republican revolution"],
  ["왕정복고 (의회 결의)", "Restoration (parliamentary resolution)"],
  ["왕정복고 (쿠데타)", "Restoration (coup)"],
  ["입헌 개혁", "Constitutional reform"],
  ["분쟁 — 의회 표결", "Dispute — parliamentary vote"],
  ["분쟁 — 내전", "Dispute — civil war"],
  ["군정에 대한 반감", "Resentment of military rule"],
  ["입헌 정부 · 여당의 의석", "Constitutional government · ruling party seats"],
  ["전제 왕권에 대한 반감", "Resentment of absolute rule"],
  ["계엄령", "Martial law"],
  ["계승 분쟁으로 흔들리는 왕실", "A crown shaken by a succession dispute"],
  ["왕위에 올릴 주장자를 고르세요 (위 \"왕가와 왕위 주장자\"에서 먼저 만듭니다).", "Pick a claimant to crown (create one first under \"Royal houses and claimants\")."],
  ["당-국가 체제에서는 먼저 민주 혁명으로 체제를 무너뜨려야 합니다.", "Under a party-state, first bring the regime down with a democratic revolution."],
  ["국가원수 = 군주 (상징적), 실권은 총리", "Head of state = monarch (symbolic), real power with the PM"],
  ["새 헌법 (입법 › 법령) · 대통령 선거 중단", "New constitution (Legislation › Statutes) · presidential elections halted"],
  ["왕이 총리 임명 · 거부권 · 비상 권한", "The monarch appoints the PM · veto · emergency powers"],
  ["계엄령 선포 · 왕국 기본법", "Martial law declared · Basic Law of the Kingdom"],
  ["쿠데타 실패 — 왕당파 정당 활동 금지 · 지지율 절반", "Coup failed — royalist parties banned · support halved"],
  ["이미 전제군주정입니다 — 내각 › 왕실의 입헌 개혁 · 공화 혁명으로 벗어날 수 있어요.", "Already an absolute monarchy — leave it through constitutional reform or a republican revolution in Cabinet › Royal."],
  ["왕위에 올릴 주장자가 없습니다 — 내각 › 왕실의 \"왕가와 왕위 주장자\"에서 먼저 만드세요.", "There is no claimant to crown — create one first under \"Royal houses and claimants\" in Cabinet › Royal."],
  ["디버그 모드로 바로 바꿈", "Switched directly in debug mode"],
  ["숨겨진 정부 형태: 전제군주정 — 왕이 총리 임명 · 거부권 · 비상 권한", "Hidden form of government: absolute monarchy — the monarch appoints the PM · veto · emergency powers"],
  ["계승자가 없어 왕위가 비었습니다", "No heir — the throne is vacant"],
  ["입헌 개혁 — 왕이 실권을 내놓고 입헌군주제로 돌아갑니다 (계엄 해제 · 활동 금지 정당 복권 · 새 헌법). 계속하시겠습니까?", "Constitutional reform — the monarch gives up real power and returns to constitutional monarchy (martial law lifted · banned parties reinstated · new constitution). Continue?"],
  ["입헌군주제로 — 국왕은 상징, 실권은 총리", "To constitutional monarchy — the monarch is symbolic, real power with the PM"],
  ["계엄 해제 · 활동 금지 정당 복권 · 새 헌법", "Martial law lifted · banned parties reinstated · new constitution"],
  ["새 공화국 헌법 · 계엄 해제 · 활동 금지 정당 복권", "New republican constitution · martial law lifted · banned parties reinstated"],
  ["왕정이 계엄령 선포", "The monarchy declares martial law"],
  ["시민 혁명", "Citizens' revolution"],
  ["정통 왕위를 주장할 다른 주장자를 고르세요.", "Pick another claimant to claim the legitimate throne."],
  ["지금 왕위에 있는 왕가는 지울 수 없습니다.", "You cannot delete the reigning house."],
  ["지금 왕위에 있는 사람은 뺄 수 없습니다 — \"서거 · 퇴위\"를 쓰세요.", "You cannot remove the reigning monarch — use \"Death · abdication\"."],
  ["국왕", "King"],
  ["여왕", "Queen"],
  ["황제", "Emperor"],
  ["여제", "Empress"],
  ["대공", "Grand Duke"],
  ["술탄", "Sultan"],
  ["새 왕가", "New house"],
  ["왕족", "Royal"],
  ["Give me liberty, or give me death! : 왕은 죽었다, 국왕 만세!", "Give me liberty, or give me death! : The king is dead, long live the king!"],
  ["🔒 경제권", "🔒 Economic blocs"],
  ["경제권 — 1.7.1에서 열림", "Economic blocs — opens in 1.7.1"],
  ["🔒 \"경제권\"은(는) 1.7.1 업데이트에서 열리는 기능입니다. 여러 나라를 묶어 경제권(관세 동맹 · 공동시장 · 통화 동맹 …)을 정하고 경제에 반영해요.", "🔒 \"Economic blocs\" opens in the 1.7.1 update. Group countries into economic blocs (customs unions · common markets · currency unions …) that feed into the economy."],
  ["정당 태그 선호", "Party tag preferences"],
  ["태그 선호", "Tag preferences"],
  ["태그 선호 화면 열기 →", "Open tag preferences →"],
  ["−2 싫어함 · 0 무관 · +2 좋아함 — 비운 칸은 이념에서 자동(흐린 숫자). 의원은 지출 항목의 태그로 예산안 찬반을 정합니다.", "−2 dislike · 0 neutral · +2 like — empty cells come from the ideology (faded numbers). Members vote on budgets by the tags of the spending items."],
  ["이 정당을 이념 자동으로", "Reset this party to ideology defaults"],
  ["고침", "Edited"],
  ["숨긴 기본 항목", "Hidden built-ins"],
  ["되살리기", "Restore"],
  ["기본값으로", "Reset to default"],
  ["고치기", "Edit"],
  ["지우기", "Delete"],
  ["효과 (자산이 기준 50보다 1점 높을 때)", "Effects (per point above the baseline of 50)"],
  ["+ 효과", "+ Effect"],
  ["효과 지우기", "Remove effect"],
  ["이름을 적어 주세요.", "Please enter a name."],
  ["EXECUTE / 실행 버튼", "EXECUTE / Execute button"],
  ["숨기기", "Hide"],
  ["표시", "Show"],
  ["편집 패널 아래의 \"PROTOCOL EXECUTE\"(실행) 버튼입니다. 설정을 바꾸면 의석 화면이 알아서 다시 그려져서 기본으로 숨겨 둡니다. 숨겨도 입력 칸 밖에서 Enter를 누르면 다시 그려요.", "The \"PROTOCOL EXECUTE\" button under the edit panel. The seat view redraws by itself when you change settings, so it is hidden by default. Even when hidden, press Enter outside an input to redraw."],
  ["의석 화면이 바로 바뀌어요", "The seat view updates right away"],
  ["의석 수 같은 설정을 바꾸면 의석 화면이 바로 새로 그려져요 — 새 정당의 자리도 생겼을 거예요. 화면이 맞지 않아 보이면 입력 칸 밖에서 Enter 키로 다시 그릴 수 있고, 설정 › 화면에서 실행 버튼을 켤 수도 있어요.", "Changing settings like seat counts redraws the seat view right away — the new party's seats should be there. If the view looks off, press Enter outside an input to redraw, or turn on the execute button in Settings › Display."],
  ["설정을 바꾸면 시각 화면이 알아서 새로 그려집니다. \"PROTOCOL EXECUTE\"(실행) 버튼은 기본으로 숨겨져 있고 설정 › 화면에서 켤 수 있어요 — 숨겨도 Enter로 다시 그릴 수 있습니다.", "The view redraws by itself when you change settings. The \"PROTOCOL EXECUTE\" button is hidden by default and can be turned on in Settings › Display — even hidden, Enter redraws."],
  ["군 지휘부를 정해 둡니다. 충성도는 지금 정부에 대한 충성(0~100)으로, 낮을수록 군부 쿠데타가 잘 되고 높을수록 친위 쿠데타를 돕습니다. 가까운 정당은 그 정당이 쿠데타를 일으킬 때 힘을 보탭니다.", "Set up the military command. Loyalty is loyalty to the current government (0–100): the lower it is, the likelier a military coup succeeds; the higher, the more it helps a self-coup. An allied party gets their help when it stages a coup."],
  ["— 가까운 정당 없음 —", "— No allied party —"],
  ["충성도", "Loyalty"],
  ["[+] 군 지휘관 추가", "[+] Add commander"],
  ["[+] 기본 군 지휘부 만들기 (국방부 장관 · 합참의장 · 육해공군 참모총장)", "[+] Create default command (defense minister · joint chiefs chair · army, navy and air force chiefs)"],
  ["주도 세력을 고르면 성공 확률을 요인별로 보여 줍니다. 성공하면 계엄령이 선포되고 의회가 멈추며, 실패하면 주도 세력이 처벌받습니다.", "Pick who leads it to see the chance of success broken down by factor. On success martial law is declared and parliament halts; on failure the plotters are punished."],
  ["주도할 군 지휘관", "Leading commander"],
  ["주도할 정당", "Leading party"],
  ["성공 확률", "Chance of success"],
  ["기본", "Base"],
  ["군 지휘부 전체의 불만", "Discontent across the military command"],
  ["정부 · 여당의 의석", "Government · ruling party seats"],
  ["합계는 5~95% 사이로 맞춥니다.", "The total is clamped to 5–95%."],
  ["군 지휘부의 불만", "Military discontent"],
  ["군 지휘부의 충성", "Military loyalty"],
  ["⚔ 군정 — 군사평의회 집권 중", "⚔ Military junta — the military council rules"],
  ["군정에서 벗어나기", "Leaving military rule"],
  ["민정 이양", "Hand over to civilians"],
  ["역쿠데타 준비", "Prepare counter-coup"],
  ["역쿠데타", "Counter-coup"],
  ["주도 정당 없이 군사평의회 집권 (숨겨진 정부 형태: 군정)", "The military council rules with no leading party (hidden form of government: military junta)"],
  ["계엄령 선포 · 의회 정지 · 선거 중단", "Martial law declared · parliament suspended · elections halted"],
  ["계엄령 선포 · 의회 정지", "Martial law declared · parliament suspended"],
  ["계엄령 해제 · 의회 활동 재개 · 선거 재개", "Martial law lifted · parliament resumes · elections resume"],
  ["대통령 · 총리 공석 (선거로 뽑음)", "President · PM vacant (chosen by election)"],
  ["군 지휘부가 없습니다 — 내각 › 군부에서 먼저 정하세요.", "There is no military command — set it up in Cabinet › Military first."],
  ["민정 이양 — 계엄령을 해제하고 의회 · 선거를 되살립니다. 쿠데타로 활동 금지된 정당은 복권되고, 대통령 · 총리는 다음 선거까지 공석입니다. 계속하시겠습니까?", "Hand over to civilians — lift martial law and restore parliament and elections. Parties banned by the coup are reinstated, and the president and PM stay vacant until the next election. Continue?"],
  ["이미 선포된 계엄령 (정부가 군을 쥐고 있음)", "Martial law already declared (the government holds the military)"],
  ["이미 선포된 계엄령", "Martial law already declared"],
  ["이미 정부 · 여당 (반대 세력 없이 굳히기)", "Already the government · ruling party (entrenching without opposition)"],
  ["군정 중입니다 — 아래 \"군정에서 벗어나기\"의 역쿠데타를 쓰세요.", "Military rule is in effect — use the counter-coup under \"Leaving military rule\" below."],
  ["주도할 군 지휘관을 고르세요 (내각 › 군부에서 군 지휘부를 먼저 정합니다).", "Pick a leading commander (set up the military command in Cabinet › Military first)."],
  ["지금 군사평의회 의장은 역쿠데타를 일으킬 수 없습니다.", "The current military council chair cannot stage a counter-coup."],
  ["주도할 정당을 고르세요 (활동 금지 · 해산된 정당은 안 됨).", "Pick a leading party (not a banned or dissolved one)."],
  ["군정 중에는 선거가 중단됩니다 — 내각 › 쿠데타의 \"민정 이양\" 뒤에 치를 수 있어요.", "Elections are halted under military rule — hold them after \"Hand over to civilians\" in Cabinet › Coup."],
  ["혁명 (1.6.3)", "Revolution (1.6.3)"],
  ["1.6.3에서", "In 1.6.3"],
  ["국방부 장관", "Minister of Defense"],
  ["합동참모의장", "Chairman of the Joint Chiefs"],
  ["육군참모총장", "Army Chief of Staff"],
  ["해군참모총장", "Navy Chief of Staff"],
  ["공군참모총장", "Air Force Chief of Staff"],
  ["친위 쿠데타", "Self-coup"],
  ["군사평의회", "Military council"],
  ["군사평의회 의장", "Military council chair"],
  ["Give me liberty, or give me death! : 주사위는 던져졌다", "Give me liberty, or give me death! : The die is cast"],
  ["Give me liberty, or give me death! : 대담하라!", "Give me liberty, or give me death! : Be bold!"],
  ["Give me liberty, or give me death! : 영광이 산 위에서 꺾였도다", "Give me liberty, or give me death! : Thy glory is slain upon thy high places"],
  ["원 구성(단원제 · 양원제 · 삼원제)과 의회별 이름 · 총 의석 수, 정당마다 몇 석인지 정합니다. \"배정 합계\"는 총 의석 수를 넘을 수 없어요.", "Unicameral · bicameral · tricameral, plus set each chamber's name and total seats, and how many seats each party has. The \"Assigned total\" can't exceed the total."],
  ["의장 · 표시", "Speakers · Display"],
  ["의석 · 원 구성", "Seats · Chambers"],
  ["시민 성향", "Citizen lean"],
  ["시민 지지율", "Citizen support"],
  ["이민자 지지율", "Immigrant support"],
  ["정부 형태 · 권한", "Government · Powers"],
  ["지역구 지도", "District Map"],
  ["선거 제도", "Electoral System"],
  ["후보", "Candidates"],
  ["지방선거 결과", "Local election results"],
  ["대선 · 총리 선거 방식(단순 다수 · 결선투표 · 선거인단)과 지지율을 가져올 기준 원, 이민자 투표권. 선거인단제를 고르면 선거인단 설정이 나와요.", "Presidential · PM election method (plurality · runoff · electoral college), the chamber whose support is used, and immigrant voting rights. Choosing the electoral college shows its settings."],
  ["후보 단일화(여러 정당이 후보 한 명으로)와 대선 · 총리 선거 후보(기본은 당수 — 의원 연결이나 직접 입력으로 바꿈).", "Candidate unions (several parties behind one candidate) and presidential · PM candidates (party leaders by default — change them by linking a member or typing a name)."],
  ["의장단(의장 · 부의장), 원별 반원 가운데 표시(의석 수 · 의회 로고 · 의장석), 집권 세력 강조. 단원제 · 양원제 · 삼원제는 의석 · 원 구성에서 골라요.", "Speakers (speaker · deputies), what each chamber shows at the center of the hemicycle (seat count · chamber logo · podium) and the governing bloc highlight. Unicameral · bicameral · tricameral is chosen in Seats · Chambers."],
  ["기능 검색 (예: 선거인단)", "Search features (e.g. electoral college)"],
  ["찾는 기능이 없습니다", "No matching feature"],
  ["설정", "Settings"],
  ["서명", "Sign"],
  ["기록", "Records"],
  ["서명 대기", "Awaiting signature"],
  ["최근 결정", "Recent decisions"],
  ["✍ 서명하러 →", "✍ Go sign →"],
  ["서명 · 거부권 행사는 내각 › 서명에서", "Sign or veto in Cabinet › Sign"],
  ["내각 › 서명", "Cabinet › Sign"],
  ["서명을 기다리는 법안이 없습니다", "No bills awaiting signature"],
  ["이(가) 서명하면 가결되고, 거부권을 행사하면 최종 부결됩니다. 거부권 주체는 내각 › 내각 설정에서 정해요.", "signs, the bill passes; if they veto, it finally fails. The veto holder is set in Cabinet › Cabinet settings."],
  ["의회를 통과한 법안에", "For bills that passed parliament: if"],
  ["거부권 주체가 없어 의회를 통과한 법안은 바로 가결됩니다. 서명 단계를 쓰려면 내각 › 내각 설정에서 거부권 주체를 정하세요.", "There is no veto holder, so bills that pass parliament pass immediately. To use the signing step, choose a veto holder in Cabinet › Cabinet settings."],
  ["🛑 거부", "🛑 Vetoed"],
  ["✍ 서명", "✍ Signed"],
  ["서명 — 의회를 통과해 거부권 주체(대통령 · 총리 · 내각)의 서명을 기다리는 법안입니다. 서명하면 가결되고, 거부권을 행사하면 최종 부결돼요. 거부권 주체가 없으면(내각 설정) 이 단계 없이 바로 가결됩니다.", "Sign — bills that passed parliament and await the veto holder's (president · PM · cabinet) signature. Signing passes the bill; a veto makes it finally fail. With no veto holder (Cabinet settings), bills pass without this step."],
  ["법안을 만들고 통과시키는 과정입니다. 메뉴 위의 단계 막대(제출 › 위원회 › 본회의 › 서명 › 기록 › 법령)에 단계마다 법안 수가 보이고, 누르면 그 탭으로 갑니다 (서명은 내각 › 서명).", "The process of writing and passing bills. The step bar at the top (Submit › Committee › Floor › Sign › Records › Statutes) shows how many bills are at each step; click a step to open its tab (signing is in Cabinet › Sign)."],
  ["종합", "Overview"],
  ["지역구 - 시민", "Districts - Citizens"],
  ["지지율 - 시민", "Support - Citizens"],
  ["시민 / 이민자 성향 따로 정하기", "Set citizen / migrant leanings separately"],
  ["지역구 - 이민자 · 지지율 - 이민자에서 이민자 성향을 따로 정합니다. 이민자가 투표하는 선거에서는 지역구마다 시민 · 이민자 수만큼 섞어 개표해요 (총선 비례 · 대선은 전국 수로).", "Set migrant leanings separately in Districts - Migrants and Support - Migrants. In elections where migrants vote, each district's count blends citizens and migrants by their numbers (national totals for list seats and presidential races)."],
  ["꺼져 있으면 지역구 - 이민자는 지역구 - 시민과, 지지율 - 이민자는 지지율 - 시민과 같은 값으로 묶이고 이민자도 시민과 같은 성향으로 투표합니다. 시민 · 인구 수는 따로예요.", "When off, Districts - Migrants is tied to Districts - Citizens and Support - Migrants to Support - Citizens, and migrants vote like citizens. Citizen and population counts stay separate."],
  ["국가 › 지역에서 시민 수", "Citizen counts in Nation › Districts"],
  ["선거 › 방식에서 투표권", "Voting rights in Elections › Method"],
  ["정당별 지지율", "Support by party"],
  ["합산", "Combined"],
  ["이민자", "Migrants"],
  ["지지율이 없습니다 — 지지율 - 시민에서 정하세요.", "No support set — set it in Support - Citizens."],
  ["이민자 성향은 여론 › 종합 · 지역구 - 이민자 · 지지율 - 이민자에서 정합니다.", "Migrant leanings are set in Opinion › Overview · Districts - Migrants · Support - Migrants."],
  ["여론 › 종합으로", "Go to Opinion › Overview"],
  ["— 여기서 바꾼 값은 이민자에게만 적용됩니다 (시민은 지역구 - 시민 · 지지율 - 시민).", "— changes here apply to migrants only (citizens are in Districts - Citizens · Support - Citizens)."],
  ["시민과 동기화됨", "Synced with citizens"],
  ["— 여기서 바꾸면 시민 성향도 함께 바뀝니다. 따로 정하려면 여론 › 종합에서 \"시민 / 이민자 성향 따로 정하기\"를 켜세요.", "— changes here also change citizen leanings. To set them separately, turn on \"Set citizen / migrant leanings separately\" in Opinion › Overview."],
  ["이민자 투표권: 지방선거", "Migrant voting: Local elections"],
  ["종합 — \"시민 / 이민자 성향 따로 정하기\"(기본 켬)와 시민 · 인구 · 이민자 수, 원마다 정당별 지지율(시민 · 이민자 · 합산)을 한눈에 봅니다. 끄면 이민자 탭이 시민 탭과 묶여(동기화) 이민자도 시민과 같은 성향으로 투표해요 (시민 · 인구 수는 따로).", "Overview — \"Set citizen / migrant leanings separately\" (on by default), citizen · population · migrant counts, and support by party per chamber (citizens · migrants · combined) at a glance. When off, the migrant tabs are tied to the citizen tabs (synced) and migrants vote like citizens (citizen and population counts stay separate)."],
  ["지역구 - 이민자 — 지역구 - 시민과 같은 화면으로 이민자의 지역구 · 권역 성향을 정합니다. 이민자가 투표하는 선거에서 지역구마다 시민 · 이민자 수만큼 섞어 개표해요 (지역구 성향이 없으면 권역 성향 → 이민자 지지율).", "Districts - Migrants — set migrants' district and region leanings on the same screen as Districts - Citizens. In elections where migrants vote, each district blends citizens and migrants by their numbers (no district leaning → region leaning → migrant support)."],
  ["지지율 - 이민자 — 지지율 - 시민과 같은 화면으로 이민자의 정당별 지지율을 정합니다. 이민자가 투표하는 총선 비례 · 대선은 전국 시민 · 이민자 수만큼 섞어 개표해요.", "Support - Migrants — set migrants' support by party on the same screen as Support - Citizens. List seats and presidential races where migrants vote blend national citizen and migrant counts."],
  ["여론 › 종합의 \"시민 / 이민자 성향 따로 정하기\"(기본 켬)를 켜 두면 지역구 - 이민자 · 지지율 - 이민자 탭에서 이민자 성향을 시민과 같은 화면으로 따로 정해요. 이민자가 투표하는 선거에서는 지역구마다 시민 · 이민자 수만큼 섞어 개표하고(총선 비례 · 대선은 전국 수로), 지방선거 · 국민투표는 유권자 수도 바뀝니다. 끄면 이민자 탭이 시민 탭과 묶여 이민자도 시민과 같은 성향으로 투표해요.", "With \"Set citizen / migrant leanings separately\" (on by default) in Opinion › Overview, set migrant leanings separately in the Districts - Migrants and Support - Migrants tabs, on the same screens as citizens. In elections where migrants vote, each district blends citizens and migrants by their numbers (national totals for list seats and presidential races), and local elections and referendums also change electorate size. When off, the migrant tabs are tied to the citizen tabs and migrants vote like citizens."],
  ["모든 자리에서 가져오기", "Import from all posts"],
  ["아직 사람이 없습니다. \"＋ 사람 추가\"로 만들거나, \"모든 자리에서 가져오기\"로 지금 자리에 적힌 이름을 인물로 옮겨 보세요.", "No people yet. Create one with \"＋ Add person\", or use \"Import from all posts\" to turn the names already written in posts into people."],
  ["이름이 적힌 자리가 없습니다 — 의원 · 당수 · 의장 · 내각 같은 자리에 이름을 적거나, 여기서 사람을 직접 추가하세요.", "No post has a name written in it — write names into posts like members, leaders, speakers or the cabinet, or add people here directly."],
  ["의원 · 당수 · 원내대표 · 파벌 대표 · 의장단 · 대통령(국왕) · 내각 · 지방 단체장 등 이름이 적힌 모든 자리에서 인물을 만들고 연결 (같은 이름은 한 사람)", "Create and link people from every post with a name — members, leaders, floor leaders, faction leaders, speakers, president (monarch), cabinet, local heads (same name = one person)"],
  ["\"모든 자리에서 가져오기\"를 누르면 의원 · 당수 · 파벌 대표 · 의장단 · 대통령(국왕) · 내각 · 지방 단체장처럼 이름이 적힌 모든 자리에서 인물을 만들고 연결합니다 (같은 이름은 한 사람). \"＋ 사람 추가\"로 직접 만들어도 돼요.", "Press \"Import from all posts\" to create and link people from every post with a name — members, leaders, faction leaders, speakers, president (monarch), cabinet and local heads (the same name is one person). You can also create them directly with \"＋ Add person\"."],
  ["의장단", "Speakers"],
  ["지방 단체장", "Local heads"],
  ["가결 · 부결 · 거부된 법안 보관함입니다 (상태별로 걸러 보기). 위쪽 칩에서 원(하원 · 상원 …)이나 위원회를 고르면 그곳의 본회의 표결 · 위원회 심사 기록을 하나씩 봅니다. 선거 기록은 선거 › 선거 기록에 있어요.", "The archive of passed, failed and vetoed bills (filter by status). Pick a chamber (lower house · upper house …) or a committee in the chips at the top to see each of its floor votes or committee reviews. Election records are in Elections › Election records."],
  ["법령집 — 가결된 법률을 조문 그대로 모아 봅니다. 법률은 개정 계보마다 가장 최근 판이 보이고(제정 · 개정 횟수), 여기서 개정안을 낼 수 있어요.", "The statute book — passed laws, article by article. Each amendment line shows its latest version (enactment · number of amendments), and you can propose amendments here."],
  ["헌법 — \"헌법 제정하기\"로 처음 만들고, \"직접 편집\"(표결 없이 바로) 또는 \"개정안 발의\"(표결을 거쳐, 가결 기준 2/3)로 고칩니다. 개정 이력이 남아요.", "Constitution — create it with \"Enact a constitution\", then change it with \"Edit directly\" (instantly, no vote) or \"Propose amendment\" (through a vote, 2/3 to pass). The amendment history is kept."],
  ["입법 › 표결 기록에는 가결 · 부결 · 거부된 법안이 남습니다. 상태 · 태그로 걸러 보고, 가결된 법안에서 개정안을 낼 수 있어요. 위쪽 칩에서 원이나 위원회를 고르면 그곳의 표결 · 심사 기록만 하나씩 볼 수 있습니다.", "Legislation › Vote records keeps passed, failed and vetoed bills. Filter by status or tag, and propose amendments from passed bills. Pick a chamber or committee in the chips at the top to see only its votes or reviews, one by one."],
  ["입법 › 법령에는 가결된 법률이 조문 그대로 모입니다. 개정 계보마다 가장 최근 판이 보이고, 여기서 개정안을 낼 수 있어요.", "Legislation › Statutes collects passed laws article by article. Each amendment line shows its latest version, and you can propose amendments here."],
  ["입법 › 헌법에서 헌법을 제정하고 고칩니다. 헌법 개정안(가결 기준 2/3)을 통과시키면 헌법이 바뀌고 개정 이력이 남아요.", "Enact and change the constitution in Legislation › Constitution. Passing a constitutional amendment (2/3 to pass) changes the constitution and adds to its amendment history."],
  ["이 위원회의 심사 기록이 없습니다", "No reviews by this committee yet"],
  ["이 원의 표결 기록이 없습니다", "No votes in this chamber yet"],
  ["소속 정당", "Party"],
  ["사람 지우기", "Delete person"],
  ["인물을 미리 만들어 두고 의석 · 당직 · 내각 자리에 배정합니다. 이름 · 사진을 여기서 고치면 배정된 모든 자리에 반영되고, 선거 · 당적 변경 · 궐석으로 자리가 사라져도 인물은 남아요.", "Create people in advance and assign them to seats, party posts and cabinet posts. Editing a name or photo here updates every post they hold, and people stay here even when an election, a party switch or a vacancy takes their post away."],
  ["＋ 사람 추가", "＋ Add person"],
  ["자리 있음", "With a post"],
  ["자리 없음", "Without a post"],
  ["지역구 후보", "District candidates"],
  ["조건에 맞는 사람이 없습니다.", "No one matches."],
  ["아직 사람이 없습니다. \"＋ 사람 추가\"로 만들거나, \"의원 · 내각에서 가져오기\"로 지금 자리에 적힌 이름을 인물로 옮겨 보세요.", "No people yet. Create one with \"＋ Add person\", or use \"Import from members · cabinet\" to turn the names already written in posts into people."],
  ["이름이 적힌 자리가 없습니다 — 의원 · 당수 · 내각 자리에 이름을 적거나, 여기서 사람을 직접 추가하세요.", "No post has a name written in it — write names into member, leader or cabinet posts, or add people here directly."],
  ["— 사람 탭에 남아 다음 선거에 다시 나갈 수 있어요", "— they stay in the People tab and can run again next election"],
  ["— 이념 없음 —", "— No ideology —"],
  ["＋ 자리 배정…", "＋ Assign post…"],
  ["새 내각 구성원 자리로 추가", "Add as a new cabinet member post"],
  ["＋ 지역구 후보로…", "＋ Make district candidate…"],
  ["집단지도체제 의장", "Collective leadership chair"],
  ["부총리", "Deputy PM"],
  ["당직", "Party posts"],
  ["지역구 인구가 없습니다 — 국가 › 지역에서 지역구마다 \"시민 / 인구\"를 적으세요.", "No district population — enter \"citizens / population\" for each district in Nation › Districts."],
  ["— 아직 이민자가 없습니다 (국가 › 지역에서 시민 수를 인구보다 적게 적으세요)", "— no migrants yet (in Nation › Districts, enter fewer citizens than the population)"],
  ["(비율로 나눔)", "(split proportionally)"],
  ["— 이민자가 투표하는 선거에서 지역구마다 시민 · 이민자 수만큼 섞어 개표합니다 (총선 비례 · 대선은 전국 시민 · 이민자 수로).", "— in elections where migrants vote, each district's count blends citizens and migrants by their numbers (national totals for list seats and presidential races)."],
  ["끄면 이민자도 그 지역 시민과 같은 성향으로 투표합니다 — 총선 · 대선 결과는 그대로, 지방선거 · 국민투표의 유권자 · 투표자 수만 바뀝니다.", "When off, migrants vote with the same lean as the local citizens — general and presidential results stay the same; only the electorate and turnout of local elections and referendums change."],
  ["시민권자 수 — 인구를 먼저 적으세요", "Citizens — enter the population first"],
  ["의장석 표시", "Speaker podium"],
  ["항상 표시", "Always show"],
  ["표시 안 함", "Hide"],
  ["애니메이션에서만", "Animations only"],
  ["의장석 점거 때만", "Podium occupation only"],
  ["반원 가운데(의석 수 · 로고 위)에 의장석(단상과 의장)을 그립니다.", "Draws the speaker's podium (dais and speaker) at the centre of the hemicycle, above the seat count or logo."],
  ["반원 가운데에 의장석(단상과 의장)을 그립니다. \"항상 표시\"면 반원 화면에도 늘 보이고, 봉쇄 돌파 · 의장석 점거 애니메이션에도 나옵니다.", "Draws the speaker's podium (dais and speaker) at the centre of the hemicycle. With \"Always show\" it stays on the hemicycle and also appears in the blockade-breaking and podium-occupation animations."],
  [
   "메인 메뉴",
   "Main menu"
  ],
  [
   "언어 팩 관리…",
   "Manage language packs…"
  ],
  [
   "앞으로의 계획과 바뀐 점",
   "Plans and what changed"
  ],
  [
   "새로 만들거나 이어서 하기",
   "New game or continue"
  ],
  [
   "로드맵 · 업데이트",
   "Roadmap & Updates"
  ],
  [
   "시작하기",
   "Start"
  ],
  [
   "기본값으로 초기화",
   "Reset to default"
  ],
  [
   "네온 모드",
   "Neon mode"
  ],
  [
   "다크 모드",
   "Dark mode"
  ],
  [
   "라이트 모드",
   "Light mode"
  ],
  [
   "눌러서 이 권역으로 칠하기",
   "Click to paint with this region"
  ],
  [
   "지금 이 권역으로 칠하는 중",
   "Currently painting with this region"
  ],
  [
   "🖌 칠하는 중",
   "🖌 Painting"
  ],
  [
   "← 메인으로",
   "← Main menu"
  ],
  [
   "바꾼 언어는 각 화면을 다시 열 때 적용됩니다.",
   "A new language applies when each screen is reopened."
  ],
  [
   "LANGUAGE / 언어",
   "LANGUAGE"
  ],
  [
   "LANGUAGE PACK / 언어 팩",
   "LANGUAGE PACK"
  ],
  [
   "다른 사람이 만든 언어 팩(.json)을 불러와 쓸 수 있고, 번역 템플릿으로 새 언어를 만들 수 있습니다.",
   "You can load language packs (.json) made by others, or create a new language from the translation template."
  ],
  [
   "설정 분류",
   "Settings categories"
  ],
  [
   "기타 설정",
   "Other settings"
  ],
  [
   "그 밖의 설정입니다.",
   "Other settings."
  ],
  [
   "DEVELOPER MODE / 개발자 모드",
   "DEVELOPER MODE"
  ],
  [
   "개발자 코드",
   "Developer code"
  ],
  [
   "확인",
   "OK"
  ],
  [
   "개발자 코드를 넣으면 다음 업데이트 미리보기(티저) 화면을 열 수 있습니다.",
   "Enter the developer code to open the next-update preview (teaser) screens."
  ],
  [
   "개발자 모드가 켜져 있습니다.",
   "Developer mode is on."
  ],
  [
   "개발자 모드가 켜졌습니다.",
   "Developer mode turned on."
  ],
  [
   "코드가 맞지 않습니다.",
   "Wrong code."
  ],
  [
   "개발자 모드를 껐습니다.",
   "Developer mode turned off."
  ],
  [
   "개발자 모드 끄기",
   "Turn off developer mode"
  ],
  [
   "쿠데타 · 군정 · 군부 설정",
   "Coups · junta · military setup"
  ],
  [
   "미수복 지역 · 영토 통일",
   "Unrecovered territories · unification"
  ],
  [
   "창 표시와 화면 요소를 고릅니다.",
   "Choose how the window and screen elements are shown."
  ],
  [
   "라이트/다크는 CRT 효과 없는 깔끔한 화면, 네온은 기존의 레트로 터미널 화면입니다.",
   "Light/Dark are clean screens without CRT effects; Neon is the original retro terminal look."
  ],
  [
   "현재 세이브",
   "Current save"
  ],
  [
   "💾 지금 저장",
   "💾 Save now"
  ],
  [
   "세이브 목록",
   "Saves"
  ],
  [
   "📦 프리셋에서",
   "📦 From preset"
  ],
  [
   "● 현재",
   "● Current"
  ],
  [
   "다른 이름으로 저장",
   "Save as new"
  ],
  [
   "지금 상태를 새 세이브로 복사해 두고, 그 세이브로 이어서 진행합니다.",
   "Copies the current state into a new save and continues in that save."
  ],
  [
   "파일 (.json)",
   "File (.json)"
  ],
  [
   "✕ 현재 세이브의 자동저장 초기화",
   "✕ Reset autosave of current save"
  ],
  [
   "이름 변경",
   "Rename"
  ],
  [
   "클릭하면 이 저장 지점을 엽니다",
   "Click to open this save point"
  ],
  [
   "아직 저장 안 됨",
   "Not saved yet"
  ],
  [
   "저장된 세이브가 없습니다",
   "No saves yet"
  ],
  [
   "이 환경에서는 브라우저 저장을 사용할 수 없습니다. 아래 \"종합 프리셋 내보내기\"로 파일에 저장하세요.",
   "Browser storage is not available here. Use \"Export full preset\" below to save to a file."
  ],
  [
   "국무회의에서 가결 · 부결된 법안 보관함입니다 (상태별로 걸러 보기). 의회가 의결한 법안은 입법 › 표결 기록에 있어요.",
   "The archive of bills passed or rejected by the cabinet council (filterable by status). Bills decided by parliament are in Legislation › Vote Records."
  ],
  [
   "국무회의에서 의결된 법안이 없습니다",
   "No bills decided by the cabinet council"
  ],
  [
   "내각 구성원",
   "Cabinet Members"
  ],
  [
   "원마다 따로 정합니다. 상원 · 삼원은 의회 › 의회 설정에서 양원제 · 삼원제를 골랐을 때 나타나요.",
   "Set separately per chamber. The Senate and Third chamber appear when you choose bicameral/tricameral in Parliament › Parliament Settings."
  ],
  [
   "탭 이름을 더블클릭 (또는 국가 › 저장의 ✎).",
   "Double-click the tab name (or ✎ in Nation › Save)."
  ],
  [
   "의회 설정",
   "Parliament Settings"
  ],
  [
   "의회 자체의 설정과 의회를 이루는 이념 · 정당 · 의석 · 집권 세력 · 의원을 다룹니다.",
   "Ideologies, parties, seats, members and the governing bloc that make up parliament, plus the settings of parliament itself."
  ],
  [
   "⚖ 입법",
   "⚖ Legislation"
  ],
  [
   "의회 · 입법 · 여론 · 선거 · 내각 · 국가 · 도움말 일곱 묶음과 그 안의 항목. 항목을 누르면 그 기능 화면이 열리고, 묶음 제목을 누르면 접히거나 펼쳐집니다 (다음에 열어도 그대로 기억).",
   "Seven groups — Parliament, Legislation, Opinion, Election, Cabinet, Nation, Help — and their items. Click an item to open that screen; click a group title to collapse or expand it (remembered next time)."
  ],
  [
   "시각 화면 오른쪽 위에 보이는 현재 날짜와 회기. 국가 › 날짜에서 정합니다 (\"열기\"로 이동).",
   "The current date and session at the top right of the visuals. Set them in Nation › Date (\"Open\" takes you there)."
  ],
  [
   "기능은 의회 · 입법 · 여론 · 선거 · 내각 · 국가 여섯 묶음으로 나뉘어 있고, 맨 아래 회색 \"도움말\"에는 모든 탭의 설명이 있어요. 왼쪽 메뉴에서 의회 › 정당을 눌러보세요.",
   "Features are grouped into Parliament, Legislation, Opinion, Election, Cabinet and Nation, and the gray \"Help\" at the bottom explains every tab. Click Parliament › Parties in the left menu."
  ],
  [
   "입법 메뉴에서는 법안을 작성해 의회에 올리고 표결합니다. 법안 제목을 적고 \"[+] 법안 등록\"을 눌러보세요.",
   "The Legislation menu is where you write bills, table them in parliament and vote. Enter a bill title and press \"[+] Register bill\"."
  ],
  [
   "내각이 의결하는 법안의 표결과 의결 정족수. 계엄령으로 의회가 정지된 동안에는 여기서 법안을 통과시킵니다.",
   "Votes on bills decided by the cabinet, and the quorum. While parliament is suspended under martial law, bills are passed here."
  ],
  [
   "◆ 위에서 의석을 고르고 \"붙여넣기\"를 누르면 현재 원내대표 이름·사진이 그 의석에 복사됩니다",
   "◆ Pick a seat above and press \"Paste\" to copy the current floor leader's name and photo to that seat"
  ],
  [
   "현재 선출 방식: 총리직선제 — 선거 > 총선 탭에서 \"총리 선거\"로 개표하세요",
   "Current method: direct PM election — count it as a \"PM election\" in Election > General"
  ],
  [
   "선거 › 총선에서 \"개표 시작\"을 누르면 지지율에 따라 개표가 진행됩니다. 지금 눌러보세요.",
   "In Election › General, press \"Start count\" to count votes based on support. Press it now."
  ],
  [
   "📊︎ 여론",
   "📊︎ Opinion"
  ],
  [
   "🗳 선거",
   "🗳 Election"
  ],
  [
   "지역구 의원",
   "District Members"
  ],
  [
   "비례대표",
   "Proportional"
  ],
  [
   "나라 전체의 설정과 입법 · 입법 기록을 다룹니다.",
   "Nation-wide settings, legislation and the legislative record."
  ],
  [
   "가결 · 부결 · 거부된 법안 보관함입니다 (상태별로 걸러 보기). 선거 기록은 선거 › 선거 기록에 있어요.",
   "The archive of passed, rejected and vetoed bills (filterable by status). Election records are in Election › Election Records."
  ],
  [
   "선거 결과를 좌우하는 지역구 · 성향 · 지지율을 정합니다. 여기서 정한 값으로 선거 탭에서 개표해요.",
   "Set the districts, leanings and support that decide elections. The Election tab counts votes using these values."
  ],
  [
   "총선 개표 화면과 결과. 개표가 진행되는 모습, 정당별 득표와 직전 대비 의석 변동(▲/▼)을 보여주고, 결과를 확인한 뒤 선거 › 총선의 \"✔ 의회에 반영\"을 누르면 그 결과대로 의석이 바뀝니다.",
   "General election count and results. Shows the count in progress, votes by party and seat changes (▲/▼); after checking, press \"✔ Apply to Parliament\" in Election › General to update the seats."
  ],
  [
   "서브 이념 추가",
   "Add sub-ideology"
  ],
  [
   "새 서브 이념",
   "New sub-ideology"
  ],
  [
   "집권과 연정",
   "Government & Coalitions"
  ],
  [
   "의회를 이루는 이념 · 정당 · 의석 · 의원 · 집권 세력을 다룹니다.",
   "Ideologies, parties, seats, members and the governing bloc that make up parliament."
  ],
  [
   "기준 원에 참여 중인 정당이 없습니다. 정당 탭 또는 선거 > 방식 탭에서 기준 원을 확인하세요.",
   "No party takes part in the base chamber. Check the base chamber in the Party tab or Election > Method."
  ],
  [
   "합칠 정당 · 파벌 (2개 이상 — 파벌만 골라 떼어 올 수도 있어요)",
   "Parties / factions to merge (2 or more — you can also pick just some factions)"
  ],
  [
   "흡수될 정당 · 파벌 (파벌만 골라 떼어 올 수도 있어요)",
   "Parties / factions to absorb (you can also pick just some factions)"
  ],
  [
   "합칠 정당(또는 파벌)을 2개 이상 고르세요.",
   "Pick at least two parties (or factions) to merge."
  ],
  [
   "흡수될 정당(또는 파벌)을 1개 이상 고르세요.",
   "Pick at least one party (or faction) to absorb."
  ],
  [
   "집단지도체제",
   "Collective leadership"
  ],
  [
   "입헌군주제",
   "Constitutional monarchy"
  ],
  [
   "이원집정부제",
   "Semi-presidential"
  ],
  [
   "대통령제",
   "Presidential"
  ],
  [
   "국왕",
   "Monarch"
  ],
  [
   "계엄령",
   "Martial law"
  ],
  [
   "국가 비상사태",
   "State of Emergency"
  ],
  [
   "내보내기 중 오류가 발생했습니다: ",
   "An error occurred while exporting: "
  ],
  [
   "언어 팩을 불러오지 못했습니다: ",
   "Could not load the language pack: "
  ],
  [
   "먼저 총리 후보(이름 또는 의원 연결)를 지정하세요.",
   "Choose a PM nominee first (a name or a linked member)."
  ],
  [
   "건설적 불신임제에서는 후임 총리를 함께 지명해야 합니다.\n후임 총리 이름을 입력하세요.",
   "Under a constructive vote of no confidence, a successor PM must be named.\nEnter the successor PM's name."
  ],
  [
   "이미 선포된 해산의 대상은 바꿀 수 없습니다.\n총선을 반영해 해제한 뒤 다시 고르세요.",
   "The target of a dissolution already declared cannot be changed.\nApply a general election to lift it, then choose again."
  ],
  [
   "먼저 권한 주체를 지정하세요.",
   "Choose who holds this power first."
  ],
  [
   "의회 전체가 이미 해산된 상태에서는 해산권을 분할할 수 없습니다.\n총선을 반영해 해제한 뒤 다시 시도하세요.",
   "The dissolution power cannot be split while the whole parliament is dissolved.\nApply a general election to lift it and try again."
  ],
  [
   "상원 또는 하원이 이미 해산된 상태에서는 해산권 분할을 끌 수 없습니다.\n총선을 반영해 해제한 뒤 다시 시도하세요.",
   "Splitting the dissolution power cannot be turned off while the Senate or the House is dissolved.\nApply a general election to lift it and try again."
  ],
  [
   "계엄 해제 결의안이 국가 > 입법 탭에 자동으로 상정되었습니다.\n의회가 가결하면 계엄령이 해제됩니다.",
   "A resolution to lift martial law was automatically placed on the floor in Nation > Legislation.\nMartial law is lifted if parliament passes it."
  ],
  [
   "의회가 정지된 계엄령 상태에서만 사용할 수 있습니다.",
   "Only available under martial law while parliament is suspended."
  ],
  [
   "국무회의에 참여할 인원이 없습니다 (모든 자리가 공석입니다).",
   "There is no one to take part in the cabinet meeting (all positions are vacant)."
  ],
  [
   "표결한 국무위원이 없습니다.\n내각 디스플레이에서 각 인물의 찬성·반대·기권을 먼저 표시하세요.",
   "No cabinet member has voted.\nMark each person's Yea · Nay · Abstain in the cabinet display first."
  ],
  [
   "계엄령으로 의회가 정지된 상태에서는 표결을 진행할 수 없습니다.\n법안은 국무회의를 통해 통과시킬 수 있습니다.",
   "Votes cannot be held while parliament is suspended under martial law.\nBills can be passed through the cabinet meeting instead."
  ],
  [
   "계엄령으로 의회가 정지된 상태에서는 국회로 상정할 수 없습니다.",
   "Bills cannot be sent to parliament while it is suspended under martial law."
  ],
  [
   "프리셋을 불러오지 못했습니다.",
   "Could not load the preset."
  ],
  [
   "프리셋 데이터 형식이 올바르지 않습니다.",
   "The preset data format is invalid."
  ],
  [
   "새 세이브를 만들지 못했습니다.",
   "Could not create a new save."
  ],
  [
   "이 브라우저/환경에서는 자동저장(localStorage)을 사용할 수 없습니다.\n(예: 파일을 직접 열었거나, 브라우저의 저장소 차단 설정)",
   "Autosave (localStorage) is not available in this browser/environment.\n(e.g. the file was opened directly, or the browser blocks storage)"
  ],
  [
   "현재 자동저장 데이터를 삭제하고 처음 상태로 되돌리시겠습니까?\n(이름 붙여 저장한 슬롯과 다른 세이브의 자동저장에는 영향이 없습니다)",
   "Delete the current autosave data and reset to the initial state?\n(Named saves and other saves' autosaves are not affected)"
  ],
  [
   "이 브라우저/환경에서는 저장 슬롯(localStorage)을 사용할 수 없습니다.",
   "Save slots (localStorage) are not available in this browser/environment."
  ],
  [
   "저장할 이름을 입력하세요.",
   "Enter a name for the save."
  ],
  [
   "저장에 실패했습니다. (브라우저 저장 공간이 부족할 수 있습니다)",
   "Saving failed. (The browser may be out of storage space)"
  ],
  [
   "이름을 바꾸지 못했습니다. (브라우저 저장 공간이 부족할 수 있습니다)",
   "Could not rename. (The browser may be out of storage space)"
  ],
  [
   "세이브를 불러오지 못했습니다.",
   "Could not load the save."
  ],
  [
   "합당하려면 정당이 2개 이상 있어야 합니다.",
   "You need at least 2 parties to merge."
  ],
  [
   "기준 원에 참여 중인 정당이 없습니다. 정당 탭 또는 선거 > 설정 탭에서 기준 원을 확인하세요.",
   "No party takes part in the base chamber. Check the base chamber in the Party tab or Election > Settings."
  ],
  [
   "기존 지역구 데이터가 모두 새 지도로 대체됩니다.\n(이름·의석 수·성향·당선자 정보 포함) 계속하시겠습니까?",
   "All existing district data will be replaced by the new map.\n(Including names, seat counts, tendencies and winners) Continue?"
  ],
  [
   "맵 메이커에서 내보낸 .jsx 파일에서 지역구로 쓸 도형을 찾을 수 없습니다.",
   "No shapes usable as districts were found in the .jsx file exported from Map Maker."
  ],
  [
   "구 지역구(그리드) 방식으로 되돌립니다.\nSVG 지도로 만든 지역구/의석/성향/당선자 데이터가 모두 삭제됩니다. 계속하시겠습니까?",
   "Revert to the old (grid) districts.\nAll districts/seats/tendencies/winners made with the SVG map will be deleted. Continue?"
  ],
  [
   "모든 지역구의 이름을 초기화하시겠습니까? (지도 도형·의석 수·성향은 유지됩니다)",
   "Reset the names of all districts? (Map shapes, seat counts and tendencies are kept)"
  ],
  [
   "권역별 득표율이 없습니다.\n국가 > 권역 탭에서 권역을 만들고 지역구를 배정하거나(자동 집계), 득표율을 직접 입력하세요.",
   "There are no regional vote shares.\nCreate regions in Nation > Regions and assign districts (automatic), or enter vote shares directly."
  ],
  [
   "언어 팩을 읽을 수 없습니다. (올바른 JSON 파일이 아닙니다)",
   "Could not read the language pack. (Not a valid JSON file)"
  ],
  [
   "번역 템플릿을 만들지 못했습니다.",
   "Could not create the translation template."
  ],
  [
   "원내대표",
   "Floor leader"
  ],
  [
   "예: 150000",
   "e.g. 150000"
  ],
  [
   "인구",
   "Population"
  ],
  [
   "총 인구",
   "Total population"
  ],
  [
   "⚙ 의회",
   "⚙ Parliament"
  ],
  [
   "🏛 국가",
   "🏛 Nation"
  ],
  [
   "🗳 여론",
   "🗳 Opinion"
  ],
  [
   "💾︎ 저장",
   "💾︎ Save"
  ],
  [
   "국가명 미설정",
   "Nation name not set"
  ],
  [
   "날짜 미설정",
   "Date not set"
  ],
  [
   "회기 미설정",
   "Session not set"
  ],
  [
   "클릭하여 국기 업로드",
   "Click to upload flag"
  ],
  [
   "✕ 국기 제거",
   "✕ Remove Flag"
  ],
  [
   "현재 날짜",
   "Current Date"
  ],
  [
   "국가명",
   "Nation Name"
  ],
  [
   "국기",
   "Flag"
  ],
  [
   "국가",
   "Nation"
  ],
  [
   "단원제",
   "Unicameral"
  ],
  [
   "양원제",
   "Bicameral"
  ],
  [
   "삼원제",
   "Tricameral"
  ],
  [
   "[+] 정당 추가",
   "[+] Add Party"
  ],
  [
   "[+] 연정 구성",
   "[+] Form Coalition"
  ],
  [
   "[+] 이념 추가",
   "[+] Add Ideology"
  ],
  [
   "+ 파벌 추가",
   "+ Add Faction"
  ],
  [
   "↗ 신당으로 분리",
   "↗ Split into New Party"
  ],
  [
   "↺ 자동정렬",
   "↺ Auto-sort"
  ],
  [
   " 당수 사진",
   " Leader Photo"
  ],
  [
   " 당 로고",
   " Party Logo"
  ],
  [
   " 정당 색 사용",
   " Use Party Color"
  ],
  [
   "정당 색 사용 중",
   "Using Party Color"
  ],
  [
   "당에 대한 설명을 입력하세요...",
   "Enter a description for the party..."
  ],
  [
   "placeholder=\"약칭\"",
   "placeholder=\"Abbr.\""
  ],
  [
   "정당 약자 표기 (예: SPD)",
   "Party abbreviation (e.g. SPD)"
  ],
  [
   "파벌명",
   "Faction name"
  ],
  [
   "파벌 당수 이름",
   "Faction leader name"
  ],
  [
   "정당명",
   "Party name"
  ],
  [
   "(이름 없음)",
   "(no name)"
  ],
  [
   "새 이념",
   "New Ideology"
  ],
  [
   "새 파벌",
   "New Faction"
  ],
  [
   "새 연정",
   "New Coalition"
  ],
  [
   "신당",
   "New Party"
  ],
  [
   "각외협력",
   "External Support"
  ],
  [
   "명칭 커스터마이징 (예: 신임과 보완, 보완과 신임 등)",
   "Customize the label (e.g. Confidence & Supply)"
  ],
  [
   "연정 없음 — 연정 탭에서 먼저 연정을 만드세요",
   "No coalition — create one first in the Coalition tab"
  ],
  [
   "단독 집권 (SINGLE PARTY RULE)",
   "Single-Party Rule (SINGLE PARTY RULE)"
  ],
  [
   "[✕] 무집권 상태",
   "[✕] No Ruling Power"
  ],
  [
   "\" 파벌을 신당으로 분리하시겠습니까?",
   "\" — split this faction into a new party?"
  ],
  [
   "신당:",
   "New party:"
  ],
  [
   "[배정된 정당 없음]",
   "[No parties assigned]"
  ],
  [
   "[무소속 이념/정당이 설정되어 있지 않습니다]",
   "[The independent ideology/party is not set up]"
  ],
  [
   "원외정당 (",
   "Out-of-Parliament ("
  ],
  [
   "이념 미지정",
   "Ideology not set"
  ],
  [
   "[여소야대]",
   "[Divided Government]"
  ],
  [
   "[소수 MIN]",
   "[Minority MIN]"
  ],
  [
   "[과반 MAJ]",
   "[Majority MAJ]"
  ],
  [
   "[여당 GOV]",
   "[Ruling GOV]"
  ],
  [
   "상태:  활동 금지",
   "Status:  Banned"
  ],
  [
   "상태:  해산",
   "Status:  Dissolved"
  ],
  [
   ">활동 금지",
   ">Banned"
  ],
  [
   ">활동중",
   ">Active"
  ],
  [
   ">해산",
   ">Dissolved"
  ],
  [
   "활동 금지",
   "Banned"
  ],
  [
   "*해산됨*",
   "*Dissolved*"
  ],
  [
   "해산",
   "Dissolved"
  ],
  [
   "국가재건당",
   "National Reconstruction Party"
  ],
  [
   "개혁그룹",
   "Reform Group"
  ],
  [
   "민주당",
   "Democratic Party"
  ],
  [
   "사회당",
   "Socialist Party"
  ],
  [
   "국민전선",
   "National Front"
  ],
  [
   "혁명적 사회주의",
   "Revolutionary Socialism"
  ],
  [
   "국가사회주의",
   "National Socialism"
  ],
  [
   "사회주의",
   "Socialism"
  ],
  [
   "진보주의",
   "Progressivism"
  ],
  [
   "자유주의",
   "Liberalism"
  ],
  [
   "보수주의",
   "Conservatism"
  ],
  [
   "권위주의",
   "Authoritarianism"
  ],
  [
   "무당파",
   "Unaffiliated"
  ],
  [
   "여당",
   "Ruling Party"
  ],
  [
   "야당",
   "Opposition"
  ],
  [
   "삼원✔",
   "Third✔"
  ],
  [
   "삼원✘",
   "Third✘"
  ],
  [
   "하원✔",
   "House✔"
  ],
  [
   "하원✘",
   "House✘"
  ],
  [
   "상원✔",
   "Senate✔"
  ],
  [
   "상원✘",
   "Senate✘"
  ],
  [
   "· 상원",
   "· Senate"
  ],
  [
   "· 삼원",
   "· Third"
  ],
  [
   "석, 상원",
   " seats, Senate"
  ],
  [
   "기준:",
   "Threshold:"
  ],
  [
   "파벌:",
   "Faction:"
  ],
  [
   "연정:",
   "Coalition:"
  ],
  [
   "이념:",
   "Ideology:"
  ],
  [
   "정당:",
   "Party:"
  ],
  [
   "▌ 멤버 (",
   "▌ Members ("
  ],
  [
   "' 멤버 없음 '",
   "' No members '"
  ],
  [
   ")가 자동으로 대상에 포함됩니다.",
   ") is automatically included as the target."
  ],
  [
   "▌ 명칭",
   "▌ Name"
  ],
  [
   "▌ 종합",
   "▌ Overview"
  ],
  [
   "종합",
   "Overview"
  ],
  [
   "▌ 파벌",
   "▌ Factions"
  ],
  [
   "합계",
   "Total"
  ],
  [
   ";\">합계",
   ">Total"
  ],
  [
   "로고",
   "Logo"
  ],
  [
   "— 궐석",
   "— Vacant"
  ],
  [
   "국가재건특별법 제1조",
   "National Reconstruction Special Act, Article 1"
  ],
  [
   "국가 재건을 위해 필요한 모든 조치를 취할 수 있다.",
   "All measures necessary for national reconstruction may be taken."
  ],
  [
   "집행부는 의회의 동의 없이 긴급 법령을 발동할 수 있다.",
   "The executive may issue emergency decrees without the consent of Parliament."
  ],
  [
   "긴급",
   "Emergency"
  ],
  [
   "재건",
   "Reconstruction"
  ],
  [
   "의회 명칭",
   "Parliament Name"
  ],
  [
   "총 의석 수",
   "Total Seats"
  ],
  [
   "지정...",
   "Set..."
  ],
  [
   "궐석 처리된 지역구만 대상으로 다시 개표",
   "Recount only vacated districts"
  ],
  [
   "이 지역구를 궐석 처리하시겠습니까?",
   "Vacate this district's seat?"
  ],
  [
   "(보궐선거로 다시 채울 때까지 소속 정당 의석에서 1석 감소합니다)",
   "(Its party's seat count is reduced by 1 until refilled by a by-election)"
  ],
  [
   "[이 의원실에는 무소속 의석이 없습니다 — 의회>설정 탭에서 무소속 정당의 의석 수를 설정하세요]",
   "[This chamber has no independent seats — set the independent party's seat count in the Parliament > Settings tab]"
  ],
  [
   "궐석 처리된 지역구가 없습니다.",
   "No vacated districts."
  ],
  [
   "의회 > 의원 탭에서 궐석 처리를 먼저 진행하세요.",
   "Vacate a district first in the Parliament > Members tab."
  ],
  [
   "의회>의원 탭에서 당선자 이름을 입력해 주세요.",
   "Enter the winner's name in the Parliament > Members tab."
  ],
  [
   "의원 이름",
   "Member name"
  ],
  [
   "[지역구 당선 의원이 없습니다 — 지역구+비례 방식으로 선거를 진행하고 의회에 반영하면 여기 표시됩니다]",
   "[No elected district members — run an election in District+Proportional mode and apply it to Parliament to see them here]"
  ],
  [
   "↻ 의회 반영",
   "↻ Apply to Parliament"
  ],
  [
   "✔ 의회에 반영",
   "✔ Apply to Parliament"
  ],
  [
   "👁 보기",
   "👁 View"
  ],
  [
   "🔍 정보 보기",
   "🔍 View Info"
  ],
  [
   "통계 표시",
   "Show Stats"
  ],
  [
   "— 의석",
   "— seats"
  ],
  [
   "— 기권 (회색)",
   "— Abstain (gray)"
  ],
  [
   "↺ 재개표",
   "↺ Recount"
  ],
  [
   "↩ 개정:",
   "↩ Amendment:"
  ],
  [
   "좌석 정보",
   "Seat Info"
  ],
  [
   "(이름 미지정)",
   "(name not set)"
  ],
  [
   "#",
   "#"
  ],
  [
   "예: 대게르만국",
   "e.g. Greater Germania"
  ],
  [
   "수동 진행형",
   "Manual Progression"
  ],
  [
   "단순형",
   "Simple"
  ],
  [
   "개별형",
   "Individual"
  ],
  [
   "정기회",
   "Regular Session"
  ],
  [
   "임시회",
   "Extraordinary Session"
  ],
  [
   "예: 1952년 3월 15일",
   "e.g. March 15, 1952"
  ],
  [
   "예: 제21대 국회 제1회 임시회",
   "e.g. 21st National Assembly, 1st Extraordinary Session"
  ],
  [
   "▶ 다음 회기",
   "▶ Next Session"
  ],
  [
   "+1개월",
   "+1mo"
  ],
  [
   "+7일",
   "+7d"
  ],
  [
   "+1일",
   "+1d"
  ],
  [
   "국회",
   "National Assembly"
  ],
  [
   "새 법안 작성 (NEW BILL)",
   "Draft New Bill (NEW BILL)"
  ],
  [
   "기존 법안 수정 (EDIT BILL)",
   "Edit Existing Bill (EDIT BILL)"
  ],
  [
   "태그 (쉼표로 구분, 예: 경제, 안보)",
   "Tags (comma-separated, e.g. Economy, Security)"
  ],
  [
   "법안 검색...",
   "Search bills..."
  ],
  [
   "기록 검색...",
   "Search records..."
  ],
  [
   "법안 제목...",
   "Bill title..."
  ],
  [
   "법안 내용을 입력하세요...",
   "Enter the bill's content..."
  ],
  [
   "-- 수정할 법안 선택 --",
   "-- Select a bill to edit --"
  ],
  [
   "-- 법안 선택 --",
   "-- Select Bill --"
  ],
  [
   "법안을 선택하세요...",
   "Select a bill..."
  ],
  [
   "[+] 법안 등록",
   "[+] Register Bill"
  ],
  [
   "[✔] 수정 저장",
   "[✔] Save Changes"
  ],
  [
   "심의 법안 선택 (SELECT BILL)",
   "Select Bill for Review (SELECT BILL)"
  ],
  [
   "정당 일괄 투표 (PARTY BULK)",
   "Bulk Party Vote (PARTY BULK)"
  ],
  [
   "-- 표결 대기 중 --",
   "-- Awaiting Vote --"
  ],
  [
   "[ 삼원 표결 결과 ]",
   "[ Third Vote Result ]"
  ],
  [
   "[ 상원 표결 결과 ]",
   "[ Senate Vote Result ]"
  ],
  [
   "[ 하원 표결 결과 ]",
   "[ House Vote Result ]"
  ],
  [
   "▶ 삼원 표결 확정",
   "▶ Confirm Third Vote"
  ],
  [
   "▶ 하원 표결 확정",
   "▶ Confirm House Vote"
  ],
  [
   "▶ 상원 표결 확정",
   "▶ Confirm Senate Vote"
  ],
  [
   "특별다수 (2/3 이상)",
   "Supermajority (2/3 or more)"
  ],
  [
   "과반 (재적 과반수)",
   "Majority (over half of members)"
  ],
  [
   "전원 일치",
   "Unanimous"
  ],
  [
   "전원일치",
   "Unanimous"
  ],
  [
   "특별다수(2/3)",
   "Supermajority (2/3)"
  ],
  [
   "가결 기준",
   "Passage Threshold"
  ],
  [
   "분자",
   "Numerator"
  ],
  [
   "분모",
   "Denominator"
  ],
  [
   "▲ 찬성 (초록)",
   "▲ Yea (green)"
  ],
  [
   "▼ 반대 (빨강)",
   "▼ Nay (red)"
  ],
  [
   "▲ 찬성",
   "▲ Yea"
  ],
  [
   "▼ 반대",
   "▼ Nay"
  ],
  [
   "▲찬",
   "▲Yea"
  ],
  [
   "▼반",
   "▼Nay"
  ],
  [
   "(찬",
   "(Yea"
  ],
  [
   "/반",
   "/Nay"
  ],
  [
   "/기",
   "/Abs"
  ],
  [
   "✔ 최종 가결",
   "✔ Finally Passed"
  ],
  [
   "✘ 최종 부결",
   "✘ Finally Rejected"
  ],
  [
   "✔ 가결 (",
   "✔ Passed ("
  ],
  [
   "✘ 부결 (",
   "✘ Rejected ("
  ],
  [
   "부결 —",
   "Rejected —"
  ],
  [
   "가결 확정됨",
   "Passage Confirmed"
  ],
  [
   "부결 확정됨",
   "Rejection Confirmed"
  ],
  [
   "결과 확정",
   "Result Confirmed"
  ],
  [
   "표결 확정",
   "Vote Confirmed"
  ],
  [
   "표결 기록 없음",
   "No vote record"
  ],
  [
   "📝 개정 대상:",
   "📝 Amending:"
  ],
  [
   "개정안 (",
   "Amendment ("
  ],
  [
   "개정안",
   "Amendment"
  ],
  [
   "▾ 세부 기록 (총",
   "▾ Detailed Records (Total"
  ],
  [
   "▾ 세부 기록",
   "▾ Detailed Records"
  ],
  [
   "가결된 법안만 개정안을 발의할 수 있습니다.",
   "Only passed bills can have amendments proposed."
  ],
  [
   "법안이 수정되었습니다.",
   "The bill has been updated."
  ],
  [
   "법안 제목을 입력하세요.",
   "Enter a bill title."
  ],
  [
   "심의할 법안을 먼저 선택하세요.",
   "Select a bill to review first."
  ],
  [
   "표결을 먼저 확정하세요.",
   "Confirm the vote first."
  ],
  [
   "대기 중인 법안이 없습니다",
   "No pending bills"
  ],
  [
   "완료된 법안이 없습니다",
   "No completed bills"
  ],
  [
   "검색 결과가 없습니다",
   "No search results"
  ],
  [
   "에서 부결된 법안은",
   " — a bill rejected here"
  ],
  [
   "에 상정되지 않습니다.",
   " is not brought to the floor."
  ],
  [
   "석 부족)",
   " seats short)"
  ],
  [
   "석 필요",
   " seats needed"
  ],
  [
   "석 = 실질",
   " seats = effective"
  ],
  [
   "석 + 비례",
   " seats + proportional"
  ],
  [
   "석 · 득표율",
   " seats · vote share"
  ],
  [
   "석 (",
   " seats ("
  ],
  [
   "석)",
   " seats)"
  ],
  [
   "— 의석",
   "— seats"
  ],
  [
   "미상정",
   "Not Tabled"
  ],
  [
   "대기 중",
   "Pending"
  ],
  [
   "제출",
   "Submit"
  ],
  [
   "상정",
   "Floor"
  ],
  [
   "표결",
   "Vote"
  ],
  [
   "취소",
   "Cancel"
  ],
  [
   "법안",
   "Bill"
  ],
  [
   "성향 탭에서 설정한 지지도를 기반으로 각 지역구의 당선자를 결정합니다.",
   "Determines each district's winner based on the support levels set in the Tendency tab."
  ],
  [
   "의원실마다 정당 구성이 다를 수 있어 지지율을 독립적으로 설정합니다.",
   "Each chamber can have a different party makeup, so support rates are set independently."
  ],
  [
   "지역구는 성향 탭의 지지도로 결정, 비례는 아래 지지율로 결정",
   "Districts are decided by the Tendency tab's support levels; proportional seats by the support rate below"
  ],
  [
   "성향 데이터가 없는 지역구는 무작위로 배정됩니다.",
   "Districts without tendency data are assigned randomly."
  ],
  [
   "성향 맵은 우측 패널에서 확인 및 편집하세요",
   "Check and edit the tendency map in the right panel"
  ],
  [
   "각 지역구 결과에 추가되는 랜덤 변동",
   "Random variation added to each district's result"
  ],
  [
   "지역구 이름 (예: 종로구)",
   "District name (e.g. Jongno)"
  ],
  [
   "보궐 (궐석 지역구만 재선거)",
   "By-election (re-vote vacated districts only)"
  ],
  [
   "예: 1952년 3월 5일",
   "e.g. March 5, 1952"
  ],
  [
   "예: 제1회 총선거",
   "e.g. 1st General Election"
  ],
  [
   "선택 해제 (이동/확대만)",
   "Deselect (pan/zoom only)"
  ],
  [
   "하원 0칸 · 상원 0칸",
   "House 0 cells · Senate 0 cells"
  ],
  [
   "0석 (활성 지역구 수)",
   "0 seats (active districts)"
  ],
  [
   "상원 선거결과",
   "Senate Election Results"
  ],
  [
   "하원 선거결과",
   "House Election Results"
  ],
  [
   "삼원 선거결과",
   "Third Election Results"
  ],
  [
   "선택한 지역구",
   "Selected district"
  ],
  [
   "⏩ 즉시 완료",
   "⏩ Finish Instantly"
  ],
  [
   "전체에 반영",
   "Apply to All"
  ],
  [
   "지역구 설정",
   "District Settings"
  ],
  [
   "⏸ 일시정지",
   "⏸ Pause"
  ],
  [
   "전체 초기화",
   "Reset All"
  ],
  [
   "지역구 의석",
   "District Seats"
  ],
  [
   "선거 결과",
   "Election Results"
  ],
  [
   "편집 모드",
   "Edit Mode"
  ],
  [
   "선거 제목",
   "Election Title"
  ],
  [
   "선거 방식",
   "Election Method"
  ],
  [
   "개표 속도",
   "Count Speed"
  ],
  [
   "지역구 맵",
   "District Map"
  ],
  [
   "개표 시작",
   "Start Count"
  ],
  [
   "불러오기",
   "Load"
  ],
  [
   "지지율",
   "Support Rate"
  ],
  [
   "지지율 분포",
   "Support Rate Distribution"
  ],
  [
   "모드 선택 후 캔버스 의원 원 클릭 (정보 보기 모드는 투표를 바꾸지 않음)",
   "Select a mode, then click a seat dot on the canvas (Info mode does not change the vote)"
  ],
  [
   "클릭/드래그로 칸 편집 (이름 모드는 클릭만)",
   "Click/drag to edit cells (Name mode: click only)"
  ],
  [
   "휠: 확대/축소",
   "Wheel: zoom"
  ],
  [
   "휠클릭+드래그: 이동",
   "Wheel-click+drag: pan"
  ],
  [
   "투표 입력 모드",
   "Vote Input Mode"
  ],
  [
   "노이즈 (±%)",
   "Noise (±%)"
  ],
  [
   "지역구 탭에서 활성화된 지역구가 없습니다.",
   "No districts are active in the District tab."
  ],
  [
   "지역구를 먼저 추가하거나 비례 모드를 선택하세요.",
   "Add a district first, or switch to Proportional mode."
  ],
  [
   "지역구 선거 기록이 없어 배경만 표시됩니다",
   "No district election record — showing background only"
  ],
  [
   "선거 탭 > 지역구 체크박스에서 \"보궐\"을 선택하고 개표하면이 지역구(",
   "Selecting \"By-election\" in the district checkbox under the Election tab and running the count will fill this district ("
  ],
  [
   "지지율을 입력해 주세요.",
   "Please enter support rates."
  ],
  [
   "각 정당의 지지율(%) 칸에 숫자를 입력하세요.",
   "Enter a number in each party's support rate (%) field."
  ],
  [
   "[활성화된 지역구가 없습니다]",
   "[No active districts]"
  ],
  [
   "저장된 선거 기록이 없습니다",
   "No saved election records"
  ],
  [
   "시뮬레이션을 먼저 실행하세요",
   "Run the simulation first"
  ],
  [
   "설정된 지역구가 없습니다",
   "No districts set"
  ],
  [
   "정당별 세부 데이터 없음",
   "No per-party detail data"
  ],
  [
   "지역구를 먼저 설정하세요",
   "Set up districts first"
  ],
  [
   ">> 개표 중... <<",
   ">> Counting... <<"
  ],
  [
   ">> 개표 시작 <<",
   ">> Start Count <<"
  ],
  [
   ">-- 소속 없음 --",
   ">-- No Affiliation --"
  ],
  [
   "보궐선거 결과 (",
   "By-election Result ("
  ],
  [
   "개표 중... (",
   "Counting... ("
  ],
  [
   "봉쇄조항(%)",
   "Threshold (%)"
  ],
  [
   "면제: 지역구",
   "Exempt: districts"
  ],
  [
   "석 이상",
   "or more"
  ],
  [
   "재개표 중...",
   "Recounting..."
  ],
  [
   "발각은 개표 도중 무작위 시점에 드러납니다 — 그 순간 개표가 멈추고, 조작된 표를 무효로 해 처음부터 다시 개표하며 활동 금지 처분을 받습니다. 발각되지 않으면 효과가 그대로 반영됩니다. 결과와 무관하게 시도는 개표 1회로 소진됩니다.",
   "Fraud is uncovered at a random point during the count — counting stops, the rigged votes are voided, the count starts over and the party is banned. If not caught, the effect applies as is. Either way, the attempt is used up after one count."
  ],
  [
   "개표 중...",
   "Counting..."
  ],
  [
   "무제 선거",
   "Untitled Election"
  ],
  [
   "정당명  지지율(%)  오차(±%)",
   "Party  Support Rate(%)  Margin(±%)"
  ],
  [
   "▌ 지역구 목록",
   "▌ District List"
  ],
  [
   "성향 맵",
   "Tendency Map"
  ],
  [
   "성향",
   "Tendency"
  ],
  [
   "강도",
   "Strength"
  ],
  [
   "비례",
   "Proportional"
  ],
  [
   "미투표",
   "Not Voted"
  ],
  [
   "반원",
   "Arc"
  ],
  [
   "꺼짐",
   "Off"
  ],
  [
   "✕ 저장 데이터 초기화",
   "✕ Reset Saved Data"
  ],
  [
   "파일로 저장",
   "Save to File"
  ],
  [
   "💾︎ 저장",
   "💾︎ Save"
  ],
  [
   "자동저장",
   "Autosave"
  ],
  [
   "자동저장됨",
   "Autosaved"
  ],
  [
   "자동저장된 데이터 없음",
   "No autosaved data"
  ],
  [
   "이 환경에서는 자동저장을 사용할 수 없음",
   "Autosave is not available in this environment"
  ],
  [
   "이 브라우저/환경에서는 자동저장(localStorage)을 사용할 수 없습니다.",
   "Autosave (localStorage) is not available in this browser/environment."
  ],
  [
   "(예: 파일을 직접 열었거나, 브라우저의 저장소 차단 설정)",
   "(e.g. the file was opened directly, or the browser blocks storage)"
  ],
  [
   "저장된 데이터를 모두 삭제하고 처음 상태로 되돌리시겠습니까?",
   "Delete all saved data and return to the initial state?"
  ],
  [
   "(파일로 저장한 .json 파일에는 영향이 없습니다)",
   "(Files you saved to disk are not affected)"
  ],
  [
   "마지막 저장:",
   "Last saved:"
  ],
  [
   "불러오기 실패: 저장 파일이 깨졌거나 형식이 다릅니다.",
   "Load failed: the save file is corrupted or in an unrecognized format."
  ],
  [
   "초기화",
   "Reset"
  ],
  [
   "1.5.1 - 영어버전 출시",
   "1.5.1 - English Version Release"
  ],
  [
   "1.5.0 - 모바일 출시",
   "1.5.0 - Mobile Release"
  ],
  [
   "2027 출시",
   "2027 Release"
  ],
  [
   "- 저장 버전명 체계 변경 (v1.0부터 시작, 파일명도 dno-save-v1.0-... 형식으로 변경, KST 기준 타임스탬프)",
   "- Changed the save version naming scheme (starting from v1.0; filenames now use the dno-save-v1.0-... format with a KST timestamp)"
  ],
  [
   "- 좌석 정보 카드 추가 (호버 대신 클릭으로 확인, 무소속 이름·파벌·집권 세력 표기)",
   "- Added a seat info card (click instead of hover; shows independent name, faction, and ruling power)"
  ],
  [
   "- 자동저장 기능 추가 (localStorage 기반, 새로고침해도 유지)",
   "- Added autosave (localStorage-based, persists across refreshes)"
  ],
  [
   "- 시작 화면 리워크 (점검 안내/자동 리디렉션 페이지로 전환)",
   "- Landing screen rework (switched to a maintenance-notice/auto-redirect page)"
  ],
  [
   "- 점검 기간 자동화 (자동으로 점검 안내 표시 및 리디렉션)",
   "- Automated maintenance windows (auto-shows the notice and redirects)"
  ],
  [
   "- 정당 시스템 리워크 I (무소속 로직 리워크)",
   "- Party system rework I (reworked independent logic)"
  ],
  [
   "- 좌석 호버 시 흰색 고리 표시 추가",
   "- Added a white ring on seat hover"
  ],
  [
   "- 네온 테마 추가",
   "- Added neon theme"
  ],
  [
   "- 일반 테마 추가",
   "- Added general theme"
  ],
  [
   "- 영어 번역 작업",
   "- English translation work"
  ],
  [
   "- 모바일 내에서도 구동 가능하도록 수정",
   "- Fixed to also run properly on mobile"
  ],
  [
   "제거",
   "Remove"
  ],
  [
   "추가",
   "Add"
  ],
  [
   "삭제",
   "Delete"
  ],
  [
   "닫기",
   "Close"
  ],
  [
   "설정",
   "Settings"
  ],
  [
   "구성",
   "Setup"
  ],
  [
   "정보",
   "Info"
  ],
  [
   "이름",
   "Name"
  ],
  [
   "연도",
   "Year"
  ],
  [
   "기록",
   "Record"
  ],
  [
   "입법",
   "Legislation"
  ],
  [
   "전체",
   "All"
  ],
  [
   "없음",
   "None"
  ],
  [
   "연정",
   "Coalition"
  ],
  [
   "하원",
   "House"
  ],
  [
   "상원",
   "Senate"
  ],
  [
   "삼원",
   "Third"
  ],
  [
   "정당",
   "Party"
  ],
  [
   "의원",
   "Members"
  ],
  [
   "이념",
   "Ideology"
  ],
  [
   "당수",
   "Leader"
  ],
  [
   "기권",
   "Abstain"
  ],
  [
   "찬성",
   "Yea"
  ],
  [
   "반대",
   "Nay"
  ],
  [
   "의석",
   "Seats"
  ],
  [
   "실행",
   "Run"
  ],
  [
   "ⓘ 도움말",
   "ⓘ Help"
  ],
  [
   "열기 →",
   "Open →"
  ],
  [
   "지역구",
   "District"
  ],
  [
   "선거",
   "Election"
  ],
  [
   "무소속",
   "Independent"
  ],
  [
   "비례",
   "Proportional"
  ],
  [
   "필터",
   "Filter"
  ],
  [
   "개표",
   "Counting"
  ],
  [
   "국회",
   "National Assembly"
  ],
  [
   "회기",
   "Session"
  ],
  [
   "국가명",
   "Nation Name"
  ],
  [
   "현재:",
   "Current:"
  ],
  [
   "✕ 제거",
   "✕ Remove"
  ],
  [
   "▶ 재개",
   "▶ Resume"
  ],
  [
   "사진 업로드",
   "Upload Photo"
  ],
  [
   "가결 후 열림",
   "Opens After Passage"
  ],
  [
   "에서 부결된 법안은",
   " — a bill rejected here"
  ],
  [
   "예: ",
   "e.g. "
  ],
  [
   "오후",
   "PM"
  ],
  [
   "오전",
   "AM"
  ],
  [
   "집권 세력 강조 (HIGHLIGHT GOV)",
   "Highlight Ruling Power (HIGHLIGHT GOV)"
  ],
  [
   "표결일",
   "Vote Date"
  ],
  [
   "대수",
   "Term"
  ],
  [
   "선거 결과가 반영되었습니다.",
   "Election results have been applied."
  ],
  [
   "파벌을 \"합쳐서\" 반영하는 정당의 파벌별 의석은 선거 전 분포가 무효화되어 0으로 초기화되었습니다.",
   "Faction-level seats for parties whose factions are merged in elections have been reset to 0, since the pre-election distribution no longer applies."
  ],
  [
   "정당 탭에서 파벌 의석을 다시 배분해 주세요.",
   "Please redistribute faction seats in the Party tab."
  ],
  [
   " 개별 정보 없음 ",
   " No individual info "
  ],
  [
   "의석 수가 0입니다.",
   "Seat count is 0."
  ],
  [
   "의회 설정에서 의석 수를 확인하세요.",
   "Check the seat count in Parliament Settings."
  ],
  [
   "에서 부결된 법안은 삼원에 상정되지 않습니다.",
   " — a bill rejected here is not brought to the Third floor."
  ],
  [
   "—기",
   "—Abs"
  ],
  [
   "선거결과",
   "Election Results"
  ],
  [
   "건)",
   " items)"
  ],
  [
   "과반",
   "Majority"
  ],
  [
   "언어 팩 불러오기 (.json)",
   "Import Language Pack (.json)"
  ],
  [
   "번역 템플릿 받기",
   "Download Translation Template"
  ],
  [
   "바꾼 언어는 각 화면을 다시 열 때 적용됩니다. 다른 사람이 만든 언어 팩(.json)을 불러와 쓸 수 있고, 번역 템플릿으로 새 언어를 만들 수 있습니다.",
   "A new language applies when each screen is reopened. You can import language packs (.json) made by others, or create a new language from the translation template."
  ],
  [
   "언어 팩 삭제",
   "Delete language pack"
  ],
  [
   "[⇄] 합당 (흡수합당 · 신설합당)",
   "[⇄] Merge Parties (Absorption · New Party)"
  ],
  [
   "신설합당 (새 정당 창당)",
   "New-Party Merger"
  ],
  [
   "흡수합당",
   "Absorption Merger"
  ],
  [
   "존속 정당",
   "Surviving Party"
  ],
  [
   "흡수될 정당",
   "Parties to Absorb"
  ],
  [
   "새 정당 이름",
   "New Party Name"
  ],
  [
   "흡수되는 정당을 계파로 남기기",
   "Keep absorbed parties as factions"
  ],
  [
   "합당",
   "Merge"
  ],
  [
   "새로 시작",
   "Start New"
  ],
  [
   "빈 세이브",
   "Blank Save"
  ],
  [
   "예: 2차 총선 직후",
   "e.g. Right after the 2nd general election"
  ],
  [
   "생성 후 시작",
   "Create & Start"
  ],
  [
   "프리셋 — 고르면 복사본이 새 세이브로 만들어집니다",
   "Presets — picking one creates a copy as a new save"
  ],
  [
   "튜토리얼",
   "Tutorial"
  ],
  [
   "처음이라면 여기서 시작하세요. 1983년 서독(독일연방공화국)에서 기본 튜토리얼 6개로 화면과 조작을 직접 해보며 익히고, 선거 · 지도 · 단일화 · 부정선거 같은 기능은 세부 튜토리얼에서 골라 배울 수 있어요.",
   "Start here if you're new. In West Germany (the Federal Republic of Germany) in 1983, six basic lessons walk you through the screens and controls hands-on, and detailed lessons cover features like elections, maps, candidate unification and election fraud whenever you need them."
  ],
  [
   "이어하기",
   "Continue"
  ],
  [
   "세이브 검색",
   "Search saves"
  ],
  [
   "저장된 세이브가 없습니다. 왼쪽에서 새로 시작하세요.",
   "No saves yet. Start a new one on the left."
  ],
  [
   "저장 파일(.json) 불러오기",
   "Load save file (.json)"
  ],
  [
   "검색 결과가 없습니다.",
   "No results."
  ],
  [
   "등록된 프리셋이 없습니다.",
   "No presets available."
  ],
  [
   "불러오는 중...",
   "Loading..."
  ],
  [
   "새 의회 (1)",
   "New Parliament (1)"
  ],
  [
   "즐겨찾기 해제",
   "Remove from favorites"
  ],
  [
   "즐겨찾기",
   "Favorite"
  ],
  [
   "세이브 이름을 입력하세요.",
   "Enter a save name."
  ],
  [
   "세이브가 이미 있습니다. 다른 이름을 입력하세요.",
   "save already exists. Please enter a different name."
  ],
  [
   "은(는) 예약된 이름입니다. 다른 이름을 입력하세요.",
   " is a reserved name. Please enter a different name."
  ],
  [
   "저장 파일을 불러올 수 없습니다. (형식이 올바르지 않거나 손상된 파일)",
   "Couldn't load the save file. (Invalid format or corrupted file)"
  ],
  [
   "- 순서 변경(⋮⋮) 핸들이 모바일 터치 드래그로도 동작하도록 수정",
   "- The reorder (⋮⋮) handle now works with touch dragging on mobile"
  ],
  [
   "- 파일명 체계 정리 (main/dno/roadmap/settings/teaser) 및 저장 파일 버전 v1.1로 업데이트",
   "- Cleaned up file names (main/dno/roadmap/settings/teaser) and updated the save file version to v1.1"
  ],
  [
   "- 설정에 테마 색(강조색) 선택 기능 신설 (HEX 직접 입력, 기본값 초기화, 다른 탭에도 실시간 반영), 그동안 특정 화면에서만 고정 청록색으로 하드코딩돼 있던 옅은 배경/그림자 색상들도 모두 테마 색을 따라가도록 수정",
   "- Added a theme (accent) color picker to Settings (direct HEX input, reset to default, applied live across tabs), and faint backgrounds/shadows that were hard-coded cyan on some screens now follow the theme color"
  ],
  [
   "- 캔버스/SVG 우클릭 시 뜨는 \"내보내기...\" 메뉴 신설 — 반원·지역구 지도 등 모든 시각화를 PNG/JPG/SVG 형식으로 다운로드 가능",
   "- Added an \"Export...\" menu on right-clicking any canvas/SVG — download every visualization (hemicycle, district maps, etc.) as PNG/JPG/SVG"
  ],
  [
   "- 내보내기 창에 \"아래 의석 수 등 통계 포함\" 체크박스 추가, 실제 화면과 동일한 카드 디자인(색상 띠·이름·의석·%·상태 태그·범례)으로 재현 (SVG는 실제 DOM을 그대로 담아 픽셀 단위로 동일, PNG/JPG는 캔버스 도형으로 재구성)",
   "- Added an \"Include stats below (seat counts, etc.)\" checkbox to the export dialog, reproducing the on-screen card design (color strip, name, seats, %, status tags, legend) — SVG embeds the real DOM pixel-for-pixel, PNG/JPG are rebuilt as canvas shapes"
  ],
  [
   "- 통계 포함 내보내기에 \"무소속 펼치기\"(개별 의원 명단 표시), \"원외정당 포함하기\"(의석 0 seats 정당도 포함), \"당수/로고 사진 포함\" 세부 옵션 추가 — 모두 화면 실제 접힘 상태에는 영향 없이 내보내기에만 반영",
   "- Added detail options to exports with stats: \"Expand independents\" (list individual members), \"Include extra-parliamentary parties\" (parties with 0 seats) and \"Include leader/logo photos\" — these only affect the export, not the on-screen collapsed state"
  ],
  [
   "- \"전체에 반영\" 동기화 체크박스의 배경·테두리가 하드코딩된 청록색 대신 테마 색을 따라가도록 수정",
   "- The \"Apply to all\" sync checkbox's background and border now follow the theme color instead of hard-coded cyan"
  ],
  [
   "- 시작 화면의 점검 안내/자동 리디렉션 페이지(index.html)에도 설정에서 고른 테마 색이 반영되도록 수정 (그동안 테마 색 모듈이 로드되지 않아 항상 기본 청록색으로 고정돼 있던 문제)",
   "- The maintenance notice / auto-redirect start page (index.html) now uses the theme color chosen in Settings (the theme color module wasn't loaded, so it was always the default cyan)"
  ],
  [
   "- 조작 탭과 화면 탭 사이 경계를 드래그로 리사이즈 가능, 더블클릭으로 기본 폭 복원, 리사이즈 시 반원 캔버스가 찌그러지던 문제 수정",
   "- The border between the control and display panels can be dragged to resize (double-click restores the default width); fixed the hemicycle canvas distorting on resize"
  ],
  [
   "- 키보드 단축키 추가: Ctrl+S(즉시 저장 + \"저장됨\" 토스트), Enter(입력 중이 아닐 때 프로토콜 실행), Esc(열려 있는 확인/알림/내보내기 창 닫기)",
   "- Added keyboard shortcuts: Ctrl+S (save now + \"Saved\" toast), Enter (execute protocol when not typing), Esc (close open confirm/alert/export windows)"
  ],
  [
   "- 이전 버전에서 쓰던 구 방식 자동저장 데이터를 새 저장 슬롯 형식으로 자동 이관 — 업데이트 후 세이브가 사라진 것처럼 보이는 문제 방지",
   "- Old-style autosave data from earlier versions is migrated to the new save slot format automatically — so saves don't seem to vanish after updating"
  ],
  [
   "- 화면 최상단에 크롬 탭 스타일의 세이브 탭 바 신설 — 클릭 한 번으로 확인창 없이 세이브 사이를 즉시 전환, \"+\"로 새 세이브를 새로 만들거나 미리 등록해둔 프리셋에서 시작 가능 (presets/ 폴더 + index.json으로 시나리오 배포·공유)",
   "- Added a Chrome-style save tab bar at the very top — switch between saves instantly with one click, no confirmation, and use \"+\" to create a new save or start from a registered preset (distribute/share scenarios via the presets/ folder + index.json)"
  ],
  [
   "- Electron 기반 Windows 데스크톱 앱(.exe) 패키징 지원 추가 (npm run build:win)",
   "- Added packaging as an Electron-based Windows desktop app (.exe) (npm run build:win)"
  ],
  [
   "- JS/CSS 파일을 js/, css/ 폴더로 정리 (내부 구조 변경, HTML 진입점 경로는 그대로 유지)",
   "- Organized JS/CSS files into js/ and css/ folders (internal change; HTML entry paths unchanged)"
  ],
  [
   "- 테마 모드 3종(라이트/다크/네온) 추가 — 기존 레트로 스타일은 \"네온\"으로 이름 변경",
   "- Added three theme modes (Light / Dark / Neon) — the original retro style is now called \"Neon\""
  ],
  [
   "- 라이트/다크 모드 UI 대대적 개편: 전용 스타일시트(css/modern.css) 분리, 테두리 없는 모노톤 버튼 등 현대적인 디자인",
   "- Major Light/Dark UI overhaul: a dedicated stylesheet (css/modern.css) and a modern design with borderless monotone buttons"
  ],
  [
   "- 창 크기 조절 시 선거 결과 · 지역구 지도 등 캔버스가 찌그러지던 문제 수정",
   "- Fixed election results, district maps and other canvases distorting when resizing the window"
  ],
  [
   "- old2.html 추가 — UI 개편 전 화면을 체험할 수 있는 페이지 (세이브는 따로 보관)",
   "- Added old2.html — a page to try the pre-overhaul UI (saves are kept separately)"
  ],
  [
   "1.5.9 - 프로그램 출시",
   "1.5.9 - Program Release"
  ],
  [
   "- Steam 서비스 준비",
   "- Preparing for Steam release"
  ],
  [
   "- Steam 개발자 계정을 위한 펀딩 시작",
   "- Starting funding for a Steam developer account"
  ],
  [
   "메인 화면으로",
   "Back to main screen"
  ],
  [
   "새 세이브 이름",
   "New save name"
  ],
  [
   "새 세이브",
   "New save"
  ],
  [
   "🆕 새로 생성",
   "🆕 Create new"
  ],
  [
   "📦 프리셋에서 생성",
   "📦 Create from preset"
  ],
  [
   "사이드바 접기/펼치기",
   "Collapse/expand sidebar"
  ],
  [
   "사이드바 · 상단 바",
   "Sidebar · Top Bar"
  ],
  [
   "💼︎ 내각",
   "💼︎ Cabinet"
  ],
  [
   "드래그하여 폭 조절 (더블클릭: 기본값으로 초기화)",
   "Drag to resize (double-click: reset to default)"
  ],
  [
   "다시 계산 (PROTOCOL EXECUTE)",
   "Recalculate (PROTOCOL EXECUTE)"
  ],
  [
   "⬇ 내보내기...",
   "⬇ Export..."
  ],
  [
   "▌ 내보내기",
   "▌ Export"
  ],
  [
   "최상단에 포함",
   "Include at top"
  ],
  [
   "아래 의석 수 등 통계 포함",
   "Include stats below (seat counts, etc.)"
  ],
  [
   "당수/로고 사진 포함",
   "Include leader/logo photos"
  ],
  [
   "무소속 펼치기",
   "Expand independents"
  ],
  [
   "원외정당 포함하기",
   "Include extra-parliamentary parties"
  ],
  [
   "예: 통합민주당",
   "e.g. United Democratic Party"
  ],
  [
   "✦ 이념 순 자동정렬",
   "✦ Auto-sorted by ideology"
  ],
  [
   "정당 복제",
   "Duplicate party"
  ],
  [
   "당수 사진",
   "Leader photo"
  ],
  [
   "당 로고 업로드",
   "Upload party logo"
  ],
  [
   "당 로고",
   "Party logo"
  ],
  [
   "클릭하여 사진 업로드",
   "Click to upload a photo"
  ],
  [
   "-- 의석 선택 (붙여넣기 대상) --",
   "-- Select a seat (paste target) --"
  ],
  [
   "◆ 위에서 의석을 고르고 \"붙여넣기\"를 누르면 현재 당수 이름·사진이 그 의석에 복사됩니다",
   "◆ Pick a seat above and press \"Paste\" to copy the current leader's name and photo to that seat"
  ],
  [
   "배정 합계",
   "Assigned total"
  ],
  [
   "드래그로 순서 변경",
   "Drag to reorder"
  ],
  [
   "-- 대표당 미지정 --",
   "-- No lead party --"
  ],
  [
   "★ 집권",
   "★ Ruling"
  ],
  [
   "연정에 정식 참여하지 않지만 신임투표·예산안 등에서 정부를 지지하는 정당",
   "Parties that don't formally join the coalition but support the government in confidence votes, budgets, etc."
  ],
  [
   "검색 (이름 / #좌석번호)",
   "Search (name / #seat number)"
  ],
  [
   "좌석 번호",
   "Seat number"
  ],
  [
   "👑 당수로 지정",
   "👑 Make leader"
  ],
  [
   "-- 소속 없음 --",
   "-- No affiliation --"
  ],
  [
   "— 정식 참여",
   "— full member"
  ],
  [
   "이름 미지정",
   "Unnamed"
  ],
  [
   "원 구성",
   "Chambers"
  ],
  [
   "의장 이름",
   "Speaker name"
  ],
  [
   "[+] 부의장 추가",
   "[+] Add deputy speaker"
  ],
  [
   "지역구 시스템 (기본: 지도)",
   "District system (default: Map)"
  ],
  [
   "지도 모드로 바꾸면 선거 > 지역구 탭에서 SVG 지도를 업로드할 수 있습니다",
   "In Map mode you can upload an SVG map in Elections > Districts"
  ],
  [
   "지도 글씨·배지 크기",
   "Map text/badge size"
  ],
  [
   "국회 반원 중앙 표시",
   "House hemicycle center"
  ],
  [
   "상원 반원 중앙 표시",
   "Senate hemicycle center"
  ],
  [
   "삼원 반원 중앙 표시",
   "Third chamber hemicycle center"
  ],
  [
   "클릭하여 로고 업로드",
   "Click to upload a logo"
  ],
  [
   "클릭해서 로고를 올리고, [로고]를 선택하면 반원 중앙에 표시됩니다",
   "Click to upload a logo, then choose [Logo] to show it in the middle of the hemicycle"
  ],
  [
   "반원 중앙에 표시할 로고",
   "Logo shown in the hemicycle center"
  ],
  [
   "저장 주기",
   "Autosave interval"
  ],
  [
   "15초",
   "15s"
  ],
  [
   "30초",
   "30s"
  ],
  [
   "1분",
   "1m"
  ],
  [
   "3분",
   "3m"
  ],
  [
   "5분",
   "5m"
  ],
  [
   "10분",
   "10m"
  ],
  [
   "이름 붙여 저장 (브라우저에 보관)",
   "Save with a name (kept in the browser)"
  ],
  [
   "심의 선택",
   "Select for deliberation"
  ],
  [
   "[ 국회 표결 결과 ]",
   "[ Parliament vote result ]"
  ],
  [
   "심의 법안 선택 (COUNCIL BILL)",
   "Select bill (COUNCIL BILL)"
  ],
  [
   "국무회의 의결 정족수",
   "Cabinet Council quorum"
  ],
  [
   "! 계엄령 중 — 국무회의로 법안 통과",
   "! Martial law — bills pass through the Cabinet Council"
  ],
  [
   "의회 표결이 정지된 동안, 내각 디스플레이(우측 \"내각\" 탭)에서 국무위원별로 찬성·반대·기권을 표시하세요. 아래에 실시간 집계가 표시됩니다.",
   "While parliamentary voting is suspended, mark each minister's yea/nay/abstain in the cabinet display (the \"Cabinet\" tab on the right). The live tally appears below."
  ],
  [
   "[ 국무회의 표결 결과 ]",
   "[ Cabinet Council vote result ]"
  ],
  [
   "▶ 국무회의로 의결",
   "▶ Resolve in the Cabinet Council"
  ],
  [
   "! 국무회의 표결 중",
   "! Cabinet Council voting"
  ],
  [
   "전원 찬성",
   "All yea"
  ],
  [
   "전원 반대",
   "All nay"
  ],
  [
   "예: 제1회 대통령 선거",
   "e.g. 1st Presidential Election"
  ],
  [
   "예: 제1회 총리 선거",
   "e.g. 1st Prime Minister Election"
  ],
  [
   "단순 다수 대표제",
   "First-past-the-post"
  ],
  [
   "기준 원:",
   "Base chamber:"
  ],
  [
   "(설정 탭에서 변경)",
   "(change in the Settings tab)"
  ],
  [
   "총리 선거",
   "PM election"
  ],
  [
   "개표 방식",
   "Counting method"
  ],
  [
   "지도에서 지역구를 하나씩 클릭해 직접 개표합니다",
   "Click districts on the map one by one to count them yourself"
  ],
  [
   "(활성 지역구 수)",
   "(active districts)"
  ],
  [
   "(선거 > 설정 탭에서 변경 — 대선과 방식을 공유합니다)",
   "(change in Elections > Settings — shared with the presidential election)"
  ],
  [
   "대선·총리 선거 방식",
   "Presidential / PM election method"
  ],
  [
   "— 총리직선제일 때 총리 선거에도 그대로 적용됩니다",
   "— also used for PM elections when the PM is directly elected"
  ],
  [
   "단순 다수",
   "First-past-"
  ],
  [
   "결선투표제",
   "Two-round"
  ],
  [
   "선거인단제",
   "Electoral college"
  ],
  [
   "1위 후보가 과반이 아니어도 최다 득표로 당선됩니다",
   "The top candidate wins with the most votes even without a majority"
  ],
  [
   "기준 원",
   "Base chamber"
  ],
  [
   "— 지지율(선거인단제는 지역구 결과)을 가져올 원",
   "— the chamber whose support (district results for the electoral college) is used"
  ],
  [
   "후보 설정",
   "Candidates"
  ],
  [
   "— 기본값은 당수, 의원 연결 또는 직접 입력으로 다른 인물을 세울 수 있습니다 (대선/총리 선거 공용)",
   "— defaults to the party leader; link a member or type a name to field someone else (shared by presidential/PM elections)"
  ],
  [
   "후보 이름 (비우면 당수)",
   "Candidate name (blank = leader)"
  ],
  [
   "후보 이름 (비우면 대표)",
   "Candidate name (blank = leader)"
  ],
  [
   "-- 의원에서 불러오기 --",
   "-- Load from a member --"
  ],
  [
   "정당별로 다음 총선 개표 1회에 한해 부정선거를 시도할 수 있습니다. 발각되면 활동 금지 처분을 받습니다.",
   "Each party can attempt election fraud once, in the next general election count. If caught, the party is banned."
  ],
  [
   "⚠ 부정선거 시도",
   "⚠ Attempt election fraud"
  ],
  [
   "(다음 총선 개표 1회에 적용)",
   "(applies to the next general election count only)"
  ],
  [
   "맵 메이커",
   "Map Maker"
  ],
  [
   "에서 내보낸 .jsx 파일을 업로드하면, 그리드 대신 실제 지도 모양으로 지역구를 만들 수 있습니다.",
   " — upload a .jsx file exported from it to use real map-shaped districts instead of the grid."
  ],
  [
   "에서 내보낸 .jsx 파일을 업로드하거나, ",
   " — upload a .jsx file exported from it, or pick a country map from "
  ],
  [
   "맵 프리셋",
   "Map presets"
  ],
  [
   "에서 나라 지도를 고르면 그리드 대신 실제 지도 모양으로 지역구를 만들 수 있습니다.",
   ", to use real map-shaped districts instead of the grid."
  ],
  [
   "태그 빼기",
   "Remove tag"
  ],
  [
   "새 태그",
   "New tag"
  ],
  [
   "태그 더하기 (Enter)",
   "Add a tag (Enter)"
  ],
  [
   "태그 — 아래에서 고르거나 새로 입력 (Enter · 쉼표)",
   "Tags — pick below or type a new one (Enter · comma)"
  ],
  [
   "위원회 소관 태그",
   "Committee tags"
  ],
  [
   "누르면 붙고, 태그가 겹치는 위원회가 심사해요",
   "click to add; the committee whose tags match reviews the bill"
  ],
  [
   "상임위원회가 없어요 — 입법 › 위원회에서 만들면 소관 태그를 골라 붙일 수 있어요",
   "No standing committees yet — create them in Legislation › Committees to pick their tags here"
  ],
  [
   "다른 법안에서 쓴 태그",
   "Tags used on other bills"
  ],
  [
   "소관 위원회",
   "Committee"
  ],
  [
   "소관 태그와 겹치지 않아 위원회 심사 없이 본회의로",
   "No committee tag matches — goes straight to the floor"
  ],
  [
   "— 기권",
   "— Abstain"
  ],
  [
   "의석을 누르거나 끌어서 표를 바꿔요",
   "Click or drag across seats to change votes"
  ],
  [
   "통과 예상",
   "Expected to pass"
  ],
  [
   "부결 예상",
   "Expected to fail"
  ],
  [
   "🗺 맵 프리셋에서 고르기",
   "🗺 Pick a map preset"
  ],
  [
   "나라를 고르면 그 나라의 행정구역이 지역구 지도가 됩니다. 고른 뒤 지역구를 눌러 의석 수 · 인구 · 성향을 정하세요.",
   "Pick a country and its administrative divisions become your district map. Then click a district to set seats, population and leanings."
  ],
  [
   "지도를 불러오는 중…",
   "Loading maps…"
  ],
  [
   "지도를 불러오지 못했습니다.",
   "Could not load the maps."
  ],
  [
   "지도 자료: Natural Earth (공개 도메인)",
   "Map data: Natural Earth (public domain)"
  ],
  [
   "🔒 정식판",
   "🔒 Full game"
  ],
  [
   "정식판에서 열립니다",
   "Available in the full game"
  ],
  [
   "STEAM DEMO · 체험판",
   "STEAM DEMO"
  ],
  [
   "체험판",
   "Demo"
  ],
  [
   "🔒 정식판에서 — 체험판은 국가 › 지역의 맵 프리셋으로",
   "🔒 Full game only — the demo uses map presets in Nation › Territory"
  ],
  [
   "맵 메이커는 정식판에서 쓸 수 있어요.\n체험판에서는 국가 › 지역의 \"맵 프리셋에서 고르기\"로 나라 지도를 골라 지역구를 만들 수 있습니다.",
   "The Map Maker is available in the full game.\nIn the demo, use \"Pick a map preset\" in Nation › Territory to choose a country map for your districts."
  ],
  [
   "체험판에서는 저장 파일을 불러올 수 없어요. (정식판에서 열립니다)",
   "Loading save files isn't available in the demo. (Available in the full game)"
  ],
  [
   "체험판이에요 — 정식판에서 기능이 더 늘어나요",
   "This is the demo — the full game has more features"
  ],
  [
   "맵 프리셋으로 지도 고르기",
   "Pick a map with map presets"
  ],
  [
   "맵 프리셋 고르기",
   "Picking a map preset"
  ],
  [
   "하나의 지도를 하원·상원·삼원이 함께 쓰며, 지역구를 클릭하면 원별 의석 수와 정당별 성향(%)을 지정할 수 있습니다.",
   "The House, Senate and Third chamber share one map; click a district to set its seats per chamber and party leanings (%)."
  ],
  [
   "업로드하면",
   "Uploading"
  ],
  [
   "기존 지역구 데이터가 새 지도로 대체",
   "replaces the existing district data with the new map"
  ],
  [
   "⬆ 지역구 지도 업로드 (.jsx)",
   "⬆ Upload district map (.jsx)"
  ],
  [
   "파일 없음",
   "No file"
  ],
  [
   "테두리 색",
   "Border color"
  ],
  [
   "테마 색과 동기화",
   "Sync with theme color"
  ],
  [
   "채우기는 항상 투명입니다",
   "Fill is always transparent"
  ],
  [
   "글씨 테두리 색",
   "Text outline color"
  ],
  [
   "지역구 약칭 글씨의 테두리 색입니다",
   "Outline color for district abbreviations"
  ],
  ["직접 지정", "Custom"],
  ["개표 변동 ±", "Count variation ±"],
  ["총선 지역구는 성향(무당층 포함)에 정당마다 이만큼 무작위로 더해 개표 — 0이면 매번 성향대로 같은 결과", "General-election districts are counted from their leanings (incl. undecided) plus this much random variation per party — 0 gives the same result every time"],
  ["중점 디자인", "Direction design"],
  ["사용자 템플릿", "Custom template"],
  ["기본 (큰 아이콘 + 이름판)", "Default (big icon + name plate)"],
  ["예제 템플릿 넣기", "Insert example template"],
  ["기본 모양으로", "Reset to default"],
  ["미리 보기", "Preview"],
  ["가로", "Width"],
  ["세로", "Height"],
  ["간격", "Spacing"],
  ["템플릿 (HTML — 비우면 기본)", "Template (HTML — empty for default)"],
  ["CSS (방향성 트리 안에만 걸림)", "CSS (applies only inside the direction tree)"],
  ["칸으로", "Form"],
  ["JSON으로", "JSON"],
  ["아이콘 (이모지 또는 그림)", "Icon (emoji or image)"],
  ["그림", "Image"],
  ["그림 빼기", "Remove image"],
  ["시나리오 전체 JSON", "Whole scenario JSON"],
  ["세계 지도", "World map"],
  ["지도 불러오기 (.hemimap)", "Import map (.hemimap)"],
  ["칠할 국가", "Country to paint"],
  ["국가 영토 색", "Country territory color"],
  ["영토 칠하기", "Paint territory"],
  ["구역 확인", "Inspect region"],
  ["배정 지우기", "Erase assignment"],
  ["모든 배정 지우기", "Clear all assignments"],
  ["국가별 영토", "Territory by country"],
  ["새 국가 이름", "New country name"],
  ["국가 추가", "Add country"],
  ["국가 순위에서 국가 편집", "Edit countries in rankings"],
  ["국가 영토", "Territory"],
  ["경제권 목록", "Economic regions"],
  ["경제권 칠하기", "Paint economic region"],
  ["구역 찾기", "Find areas"],
  ["미배정만", "Unassigned only"],
  ["이 경제권 삭제", "Delete this economic region"],
  ["새 경제권 이름 (예: 북부 공업권)", "New economic region name (e.g. Northern Industrial Belt)"],
  ["구역 이름 · 키 검색", "Search by area name or key"],
  ["세계 지도의 구역을 묶어 공업권 · 무역권 · 수도권 같은 경제 지역을 만듭니다. 국가 영토 · 선거 지역구와 따로 저장되고, 국경을 넘어도 됩니다.", "Group map areas into economic regions such as industrial belts, trade zones or a capital region. They are saved separately from territory and electoral districts, and may cross borders."],
  ["경제권을 고른 뒤 구역을 누르거나 끌어 배정합니다. 한 구역은 경제권 하나에만 속하고, 칠해도 국가 영토는 바뀌지 않습니다.", "Pick an economic region, then click or drag over areas to assign them. An area belongs to one economic region at most, and painting never changes territory."],
  ["구역을 누르면 이름 · 경제권 · 소속 국가를 확인할 수 있습니다.", "Click an area to see its name, economic region and country."],
  ["시나리오의 경제권 조건 · 효과가 이 ID를 씁니다.", "Scenario conditions and effects refer to this ID."],
  ["경제권 ↗", "Economic regions ↗"],
  ["세계지도 연결", "World map links"],
  ["+ 나라", "+ Country"],
  ["연결 안 함", "Not linked"],
  ["발생 조건을 검사하는 때", "When to check the trigger"],
  ["날짜가 바뀔 때", "When the date changes"],
  ["총선 결과를 반영할 때", "When election results are applied"],
  ["지도 변경 시", "When the map changes"],
  ["모든 시점", "Every time"],
  ["구역 소유 (세계지도)", "Owns areas (world map)"],
  ["영토 변경 (세계지도)", "Transfer territory (world map)"],
  ["경제권 소속 (세계지도)", "In economic region (world map)"],
  ["경제권 배정 (세계지도)", "Assign economic region (world map)"],
  ["미배정", "Unassigned"],
  ["경고", "Warning"],
  ["확인 필요", "Needs checking"],
  ["시나리오 메이커", "Scenario maker"],
  ["시나리오 시간", "Scenario time"],
  ["선택형 이벤트", "Choice events"],
  ["실시간", "Real-time"],
  ["턴제", "Turn-based"],
  ["진행 방식", "Time mode"],
  ["다음 턴", "Next turn"],
  ["1턴 = 1일", "1 turn = 1 day"],
  ["▶ 진행", "▶ Play"],
  ["Ⅱ 일시정지", "Ⅱ Pause"],
  ["일시정지", "Paused"],
  ["불러온 게임 · 일시정지", "Loaded game · paused"],
  ["속도", "Speed"],
  ["시나리오 · 턴제", "Scenario · turn-based"],
  ["시나리오 · 실시간", "Scenario · real-time"],
  ["일반 게임 · 실시간", "Standard game · real-time"],
  ["적용", "Apply"],
  ["JSON이 맞으면 \"적용\"으로 바뀝니다", "Click \"Apply\" once the JSON is valid"],
  ["격변 — JSON", "Upheaval — JSON"],
  ["- 방향성 아이콘은 이모지 또는 그림, 방향성 · 격변의 세부 정보(먼저 · 이 중 하나 · 배타 · 조건 · 효과 · 게이지 · 임무 · 결말 등)는 \"칸으로\"(칸 채우기) 또는 \"JSON으로\"(그 항목 전체를 직접) 고침, 고급 탭에서 시나리오 전체 JSON", "- Direction icons can be an emoji or an image; details of directions and upheavals (prerequisites, any-of, exclusives, conditions, effects, gauges, missions, outcomes, etc.) can be edited as a form or as JSON for the whole item, plus whole-scenario JSON in the Advanced tab"],
  ["시나리오", "Scenario"],
  ["🎯 시나리오", "🎯 Scenario"],
  ["방향성", "Direction"],
  ["격변", "Upheaval"],
  ["방향성 트리", "Direction tree"],
  ["시나리오 · 격변", "Scenarios · upheavals"],
  ["세계관 · 방향성 트리 · 격변이 있는 시나리오 만들기", "Make scenarios with lore, direction trees and upheavals"],
  ["챌린지", "Challenge"],
  ["새 시나리오", "New scenario"],
  ["내보내기 (.hemicmp)", "Export (.hemicmp)"],
  ["내 시나리오", "My scenarios"],
  ["기본 · 세계관", "Basics · lore"],
  ["시작 나라", "Starting countries"],
  ["격변", "Upheaval"],
  ["결말", "Endings"],
  ["고급", "Advanced"],
  ["세계관", "Lore"],
  ["격변 화면", "Upheaval view"],
  ["진행 중인 격변이 없습니다.", "No upheavals in progress."],
  ["지나간 격변", "Past upheavals"],
  ["시나리오 끝내기", "End scenario"],
  ["고를 수 있음", "Available"],
  ["끝냄", "Completed"],
  ["격변 결정", "Upheaval decisions"],
  ["임무", "Missions"],
  ["격변 시작", "Upheaval begins"],
  ["이 방향으로", "Go this way"],
  ["방향성 트리 보기", "View direction tree"],
  ["어느 나라로 시작할까요?", "Which country do you want to start as?"],
  ["+ 방향성", "+ Direction"],
  ["+ 격변", "+ Upheaval"],
  ["+ 결말", "+ Ending"],
  ["+ 시작 나라", "+ Starting country"],
  ["+ 게이지", "+ Gauge"],
  ["+ 임무", "+ Mission"],
  ["게이지", "Gauges"],
  ["기한 있는 임무", "Timed missions"],
  ["격변 전용 이벤트 · 결정", "Upheaval-only events · decisions"],
  ["예제 넣기", "Insert example"],
  ["+ 도우미", "+ Helper"],
  ["시나리오를 확인했습니다", "Scenario checked"],
  ["이 세이브에서 시나리오를 뗄까요? 나라는 그대로 두고 방향성 · 격변 · 시나리오 이벤트 · 결정만 없어집니다.", "Detach the scenario from this save? The country stays as it is; only directions, upheavals and scenario events · decisions go away."],
  ["상자를 누르면 자세히 보고 고를 수 있습니다. 한 번에 하나씩, 정한 날이 지나면 끝나고 효과가 들어갑니다.", "Click a box to see details and choose it. One at a time; when its days pass it completes and its effects apply."],
  ["오른쪽 방향성 트리에서 상자를 눌러 자세히 보고 고를 수도 있습니다.", "You can also click a box in the direction tree on the right to see details and choose it."],
  ["시나리오 (세계관 · 시작 나라 · 결말)", "Scenarios (lore · starting countries · endings)"],
  ["방향성 트리", "Direction trees"],
  ["격변 (게이지 · 기한 임무 · 결말)", "Upheaval (gauges · timed missions · outcomes)"],
  ["슈퍼 이벤트", "Super events"],
  ["챌린지 (목표형)", "Challenges (goal-based)"],
  ["시나리오 목표", "Scenario goals"],
  ["목표 달성:", "Goal reached:"],
  ["실패 조건", "Failure conditions"],
  ["승리", "Victory"],
  ["패배", "Defeat"],
  ["이날까지 목표를 지키면 승리", "hold the goals until this date to win"],
  ["목표", "Goals"],
  ["목표 없음", "No goals"],
  ["이러면 패배", "You lose if"],
  ["브리핑", "Briefing"],
  ["지금 확인", "Check now"],
  ["결과 보기", "View result"],
  ["편집기", "Editor"],
  ["편집기로", "To editor"],
  ["계속 플레이", "Keep playing"],
  ["이 세이브에서 시나리오 떼기", "Detach the scenario from this save"],
  ["시나리오 끝내기", "End scenario"],
  ["목표를 확인했습니다", "Goals checked"],
  ["이 세이브에서 시나리오를 뗄까요? 나라는 그대로 두고 목표 카드 · 시나리오 이벤트 · 결정만 없어집니다.", "Detach the scenario from this save? The country stays as it is; only the goal card and the scenario's events and decisions go away."],
  ["목표 없음 — 자유 플레이", "No goals — free play"],
  ["모든 목표를 이루었습니다.", "All goals achieved."],
  ["까지 목표를 이루지 못함", ": goals not achieved by then"],
  ["(끝까지 유지)", "(must hold)"],
  ["새 시나리오", "New scenario"],
  ["정당이 집권", "Party in government"],
  ["정당이 집권하지 않음", "Party not in government"],
  ["정당 의석", "Party seats"],
  ["집권 세력 의석", "Ruling bloc seats"],
  ["경제 지표", "Economic indicator"],
  ["날짜가 되면", "When the date arrives"],
  ["정당 상태", "Party status"],
  ["플래그(이벤트 · 결정이 켬)", "Flag (set by events · decisions)"],
  ["시나리오 변수", "Scenario variable"],
  ["직접 쓰기 (JSON)", "Write it yourself (JSON)"],
  ["집권 세력 최대 정당", "Largest ruling party"],
  ["하원 최대 정당", "Largest party in the lower house"],
  ["야당 최대 정당", "Largest opposition party"],
  ["사용자 조건", "Custom condition"],
  ["기본 정보", "Basics"],
  ["버전", "Version"],
  ["한 줄 설명", "One-line description"],
  ["목록에 보일 짧은 설명", "Short description shown in lists"],
  ["브리핑 (시작할 때 보이는 글)", "Briefing (shown at the start)"],
  ["상황 설명, 플레이어가 할 일", "The situation and what the player should do"],
  ["승리했을 때 글", "Victory text"],
  ["패배했을 때 글", "Defeat text"],
  ["시작", "Start"],
  ["내장 프리셋", "Built-in preset"],
  ["세이브 파일 (.hemi)", "Save file (.hemi)"],
  ["다른 세이브 고르기", "Choose another save"],
  ["게임에서 시작 상황을 만들고 저장 › 파일로 저장(.hemi)한 파일", "Set up the starting situation in the game, then use Save › Save to file (.hemi)"],
  ["시작 상태를 읽는 중…", "Reading the starting state…"],
  ["마감일 (선택)", "Deadline (optional)"],
  ["마감일까지 목표를 지키면 승리 (아니면 목표를 다 이루는 순간 승리)", "Win by holding the goals until the deadline (otherwise you win the moment all goals are met)"],
  ["고급 — 이벤트 · 결정 · 변수", "Advanced — events · decisions · variables"],
  ["예제 이벤트 · 결정 넣기", "Insert example event · decision"],
  ["하나라도 맞으면 패배", "Any one of these means defeat"],
  ["시험 플레이 · 공유", "Test play · sharing"],
  ["시험 플레이를 누르면 시작 상태로 새 세이브를 만들고 시나리오를 붙여 게임이 열립니다. 오른쪽 아래 🎯 카드에서 목표를 보고, 날짜를 넘기거나 총선 결과를 반영할 때마다 검사합니다.", "Test play creates a new save from the starting state, attaches the scenario and opens the game. The 🎯 card at the bottom right shows the goals, which are checked whenever you advance the date or apply general election results."],
  ["내보내기(.hemiscn)한 파일을 다른 사람이 여기서 불러오면 같은 시나리오를 할 수 있습니다. 시나리오는 이 기기에 자동 저장됩니다.", "Anyone who opens an exported .hemiscn file here can play the same scenario. Scenarios are saved automatically on this device."],
  ["이 시나리오 지우기", "Delete this scenario"],
  ["목표가 없으면 자유 플레이입니다.", "With no goals it's free play."],
  ["실패 조건 없음", "No failure conditions"],
  ["+ 목표 추가", "+ Add goal"],
  ["+ 실패 조건 추가", "+ Add failure condition"],
  ["정당 이름", "Party name"],
  ["플래그 이름", "Flag name"],
  ["변수 이름", "Variable name"],
  ["위로", "Move up"],
  ["조건 JSON을 읽지 못했습니다", "Couldn't read the condition JSON"],
  ["Hemicycle 세이브 파일(.hemi)이 아닙니다.", "This isn't a Hemicycle save file (.hemi)."],
  ["Hemicycle 시나리오 파일(.hemiscn)이 아닙니다.", "This isn't a Hemicycle scenario file (.hemiscn)."],
  ["시작할 세이브 파일을 고르세요.", "Choose the save file to start from."],
  ["조건을 읽지 못한 항목이 있습니다:", "Some conditions couldn't be read:"],
  ["시나리오를 넘기지 못했습니다. (저장 공간 부족)", "Couldn't hand over the scenario (out of storage)."],
  ["예정 표 찍기", "Planned votes"],
  ["Hemicycle 트레일러", "Hemicycle Trailer"],
  ["새 영상 · 공식 트레일러", "New video · Official trailer"],
  ["투표 중…", "Voting…"],
  ["통과", "Passed"],
  ["VOTE / 표결 연출", "VOTE / Vote style"],
  ["COUNT / 개표 연출", "COUNT / Seat reveal"],
  ["기존", "Classic"],
  ["개편", "Revamped"],
  ["기존: 좌석에 찬성 · 반대 · 기권을 바로 찍고 \"표결 확정\"으로 끝냅니다. 개편: 좌석 · 당론으로 예정 표를 정해 두고 \"표결 시작\"을 누르면 의원들이 무작위 타이밍으로 하나씩 투표한 뒤 찬성 · 반대 · 기권 순으로 자리가 모입니다.", "Classic: click yea · nay · abstain straight onto seats and finish with \"Confirm Vote\". Revamped: plan votes with seats and party lines, press \"Start Vote\" and members vote one by one at random moments, then the seats regroup into yea · nay · abstain."],
  ["개표하는 동안 반원의 의석을 정당 순서대로 왼쪽부터 채울지, 최종 자리 배치에서 무작위 순서로 켤지 고릅니다 (선거 › 설정에서도 바꿀 수 있어요).", "While counting, fill the hemicycle party by party from the left, or light up seats of the final layout in random order (also in Elections › Settings)."],
  ["찬성 예정", "Plan yea"],
  ["반대 예정", "Plan nay"],
  ["기권 예정", "Plan abstain"],
  ["✕ 지우기", "✕ Clear"],
  ["▲ 찬성 예정 (초록)", "▲ Plan Yea (green)"],
  ["▼ 반대 예정 (빨강)", "▼ Plan Nay (red)"],
  ["— 기권 예정 (회색)", "— Plan Abstain (gray)"],
  ["✕ 예정 지우기", "✕ Clear plan"],
  ["고른 뒤 반원의 좌석을 누르면 그 의원의 예정 표가 정해집니다. 아래 \"표결 시작\"을 누르면 의원들이 하나씩 투표해요", "Pick one, then click a seat to set that member's planned vote. Press \"Start Vote\" below and members vote one by one"],
  ["당론 (PARTY LINE)", "Party Line (PARTY LINE)"],
  ["정당마다 당론을 정하면 소속 의원 모두의 예정 표가 그렇게 바뀝니다. 그 뒤 좌석을 눌러 이탈표를 따로 정할 수 있어요", "Setting a party line changes the planned vote of every member of that party. Click seats afterwards to set individual defectors"],
  ["▶ 하원 표결 시작", "▶ Start House Vote"],
  ["▶ 상원 표결 시작", "▶ Start Senate Vote"],
  ["▶ 삼원 표결 시작", "▶ Start Third Vote"],
  ["표결 시작", "Start Vote"],
  ["⏩ 투표 중… (누르면 건너뛰기)", "⏩ Voting… (click to skip)"],
  ["입법 › 표결에서 심의할 법안을 고른 뒤, 정당마다 당론을 정하거나 좌석을 눌러 의원별 찬성 · 반대 · 기권 예정을 찍습니다. 원마다 \"표결 시작\"을 누르면 의원들이 하나씩 투표하고, 끝나면 찬성 · 반대 · 기권 순으로 자리가 모이며 가결 · 부결이 정해져요. 양원제면 하원을 통과한 뒤 상원 표결로 넘어갑니다.", "In Legislation › Vote, pick a bill, then set each party's line or click seats to plan each member's yea · nay · abstain. Press \"Start Vote\" for a chamber and members vote one by one; when it ends the seats regroup into yea · nay · abstain and the bill passes or fails. In a bicameral system the bill moves to the Senate after passing the House."],
  ["개표 연출", "Seat reveal"],
  ["순차적으로 채우기", "Fill in order"],
  ["무작위 자리 채우기", "Random seat reveal"],
  ["— 개표하는 동안 반원의 의석을 어떻게 채울지 — 순차: 정당 순서대로 왼쪽부터 · 무작위: 최종 자리 배치에서 무작위 순서로 켜지며 개표율 표시", "— How the hemicycle fills while counting — in order: party by party from the left · random: seats of the final layout light up in random order, with the share counted"],
  ["내 시나리오", "My scenarios"],
  ["내보내기 (.hemiscn)", "Export (.hemiscn)"],
  ["▶ 시험 플레이", "▶ Test play"],
  ["시험 플레이", "Test play"],
  ["시나리오 테스트", "Scenario test"],
  ["목표 · 이벤트가 있는 시나리오 만들고 공유하기", "Make and share scenarios with goals and events"],
  ["테스트", "Test"],
  ["활동 중", "Active"],
  ["0.3.0 - 시나리오 테스트", "0.3.0 - Scenario test"],
  ["시나리오 편집기 (scenario.html)", "Scenario editor (scenario.html)"],
  ["목표 · 실패 조건 · 마감일", "Goals · failure conditions · deadline"],
  ["이벤트 · 결정 · 변수", "Events · decisions · variables"],
  ["시험 플레이 · 공유 (.hemiscn)", "Test play · sharing (.hemiscn)"],
  ["- 시나리오 편집기(scenario.html, 메인 화면 › 시나리오) — 제목 · 제작자 · 브리핑 · 승리 · 패배 글, 시작은 내장 프리셋 또는 세이브 파일(.hemi)", "- Scenario editor (scenario.html, Main menu › Scenario) — title, creator, briefing, victory and defeat texts; start from a built-in preset or a save file (.hemi)"],
  ["- 목표 · 실패 조건 — 정당 집권 · 의석 · 지지율, 집권 세력 의석, 국정 지지율, 경제 지표, 날짜, 정당 상태, 플래그 · 변수, 직접 쓰기(JSON). 목표는 \"선택\" · \"끝까지 유지\"로, 마감일과 \"마감일까지 버티면 승리\"", "- Goals and failure conditions — party in government, seats, support, ruling bloc seats, government approval, economic indicators, dates, party status, flags and variables, or custom JSON. Goals can be optional or must-hold, with a deadline and \"win by holding until the deadline\""],
  ["- 이벤트 · 결정 · 변수 — 스크립트 모드 형식(docs/MODDING.md), 그 시나리오의 세이브에서만 돎", "- Events, decisions and variables — script mod format (docs/MODDING.md), running only in that scenario's save"],
  ["- 시험 플레이 — 시작 상태로 새 세이브를 만들어 시나리오를 붙임, 브리핑 창 · 오른쪽 아래 🎯 목표 카드 · 날짜를 넘기거나 총선 결과를 반영할 때 검사 · 승리 · 패배 창", "- Test play — creates a new save from the starting state and attaches the scenario: briefing window, 🎯 goal card at the bottom right, checks when the date advances or election results are applied, victory and defeat windows"],
  ["- 내 시나리오는 이 기기에 자동 저장, 내보내기 · 불러오기(.hemiscn)로 공유", "- My scenarios are saved automatically on this device; share them by exporting and opening .hemiscn files"],
  ["업데이트!", "Updated!"],
  ["신규!", "New!"],
  ["여론 › 기사", "Opinion › Articles"],
  ["국정 지지율", "Government approval"],
  ["여론 · 기사", "Opinion · News"],
  ["신문", "Paper"],
  ["여론 추이", "Opinion trend"],
  ["사진으로 저장", "Save as image"],
  ["모든 언론사", "All outlets"],
  ["모든 유형", "All types"],
  ["새 기사", "New article"],
  ["+ 새 기사", "+ New article"],
  ["기사 찾기", "Find an article"],
  ["발행", "Publish"],
  ["발행됨", "Published"],
  ["초안", "Draft"],
  ["발행 취소", "Unpublish"],
  ["읽기", "Read"],
  ["정치", "Politics"],
  ["사회", "Society"],
  ["국제", "World"],
  ["사설", "Editorial"],
  ["속보", "Breaking"],
  ["기사를 쓰고 발행하면 정한 만큼 정당 지지율 · 국정 지지율이 움직입니다 (발행 취소하면 그만큼 되돌림). 오른쪽 \"여론 · 기사\" 화면에 신문 1면과 여론 추이가 보입니다.", "Write and publish articles to move party support and government approval by the amounts you set (unpublishing reverses them). The \"Opinion · News\" view on the right shows the front page and the opinion trend."],
  ["아직 기사가 없습니다. \"+ 새 기사\"로 첫 기사를 써 보세요.", "No articles yet. Write your first one with \"+ New article\"."],
  ["조건에 맞는 기사가 없습니다.", "No matching articles."],
  ["← 목록", "← List"],
  ["기사 수정", "Edit article"],
  ["발행된 기사 — 효과를 바꾸면 저장할 때 다시 계산됩니다", "Published article — changed effects are recalculated when you save"],
  ["유형", "Type"],
  ["제목", "Title"],
  ["부제", "Subtitle"],
  ["본문", "Body"],
  ["작성일", "Date"],
  ["언론사", "Outlet"],
  ["기자", "Reporter"],
  ["대표 사진", "Main photo"],
  ["예: 여당, 예산안 단독 처리", "e.g. Ruling party passes budget alone"],
  ["(선택)", "(optional)"],
  ["기사 본문", "Article body"],
  ["예: 헤미일보", "e.g. The Hemi Daily"],
  ["사진 올리기", "Upload photo"],
  ["사진 바꾸기", "Change photo"],
  ["사진 빼기", "Remove photo"],
  ["연결", "Links"],
  ["정치인", "Politicians"],
  ["이름으로 추가", "Add by name"],
  ["+ 법안 연결", "+ Link a bill"],
  ["정부", "Government"],
  ["정당 없음", "No parties"],
  ["발행할 때 효과", "Effects on publishing"],
  ["정당 지지율은 아래 영향 범위에 따라 — 전국이면 모든 원의 지지율, 권역 · 지역구면 그곳의 시민 성향이 움직입니다. 국정 지지율은 언제나 전국.", "Party support follows the reach below — nationwide moves support in every chamber; regions or districts move citizen leanings there. Government approval is always nationwide."],
  ["정당 지지율", "Party support"],
  ["+ 효과 추가", "+ Add effect"],
  ["연결한 정당으로 채우기", "Fill from linked parties"],
  ["영향 범위", "Reach"],
  ["전국", "Nationwide"],
  ["권역", "Region"],
  ["개별 지역구", "Single districts"],
  ["권역이 없습니다", "No regions"],
  ["지역구 지도가 없습니다", "No district map"],
  ["권역 찾기", "Find a region"],
  ["지역구 찾기", "Find a district"],
  ["곳 고름", "selected"],
  ["발행 기사", "Published"],
  ["모두", "All"],
  ["비우기", "Clear"],
  ["저장", "Save"],
  ["초안 저장", "Save draft"],
  ["저장하고 발행", "Save and publish"],
  ["기사 제목을 적어 주세요.", "Please enter a headline."],
  ["작성일은 YYYY-MM-DD 형식으로 적어 주세요. (예: 2026-11-03)", "Enter the date as YYYY-MM-DD (e.g. 2026-11-03)."],
  ["초안을 저장했습니다", "Draft saved"],
  ["발행된 기사를 고쳤습니다", "Published article updated"],
  ["사진을 읽지 못했습니다.", "Couldn't read the photo."],
  ["(제목 없음)", "(untitled)"],
  ["기사 발행:", "Article published:"],
  ["대통령 · 총리 · 내각에 대한 국정 지지율입니다. 날짜를 넘길 때마다 정당 지지율과 함께 기록되어 오른쪽 \"여론 추이\" 그래프에 그려집니다.", "Government approval for the president, prime minister and cabinet. It's recorded with party support every time the date advances and drawn on the \"Opinion trend\" chart on the right."],
  ["내각", "Cabinet"],
  ["지금 기록하기", "Record now"],
  ["여론 추이 보기", "View opinion trend"],
  ["기록 지우기", "Clear records"],
  ["지금 여론을 기록했습니다", "Current opinion recorded"],
  ["여론 기록을 모두 지울까요? (지금 지지율은 그대로)", "Clear all opinion records? (current support stays as it is)"],
  ["자동 여론 변동", "Automatic opinion shifts"],
  ["날짜를 넘기면 국정 지지율이 저절로 움직이기 (끄면 지금처럼 손으로만)", "Let government approval move on its own as the date advances (off: manual only, as before)"],
  ["경제 반영 세기", "Economy weight"],
  ["성장률 ↑ · 실업률 ↓ · 물가 안정이면 오름", "Rises with growth ↑, unemployment ↓ and stable prices"],
  ["경제를 시작한 세이브에서만", "Only in saves with the economy started"],
  ["기준값으로 돌아가기", "Drift back to baseline"],
  ["여당 지지율 연동", "Link to ruling-party support"],
  ["내각 지지율이 움직인 만큼(이 비율로) 집권 세력 정당 지지율도 (지지율 비례로 나눔)", "ruling parties' combined support follows cabinet approval by this share (split by their support)"],
  ["총선 뒤 허니문", "Post-election honeymoon"],
  ["총선 결과를 의회에 반영할 때", "when general election results are applied"],
  ["기사 효과는 자동 변동과 상관없이 발행할 때 들어갑니다.", "Article effects apply on publishing, regardless of automatic shifts."],
  ["아직 발행한 기사가 없습니다. 여론 › 기사에서 기사를 쓰고 발행하세요.", "No published articles yet. Write and publish one in Opinion › Articles."],
  ["오늘의 신문", "Today's Paper"],
  ["아직 여론 기록이 없습니다. 날짜를 넘기거나 기사를 발행하면, 또는 여론 › 국정 지지율에서 \"지금 기록하기\"를 누르면 기록됩니다.", "No opinion records yet. They're recorded when you advance the date, publish an article, or click \"Record now\" in Opinion › Government approval."],
  ["아직 여론 기록이 없습니다.", "No opinion records yet."],
  ["발행한 기사가 없습니다.", "No published articles."],
  ["그래프를 사진으로 만들지 못했습니다.", "Couldn't make an image of the chart."],
  ["점선은 국정 지지율, 아래 점은 기사", "dashed lines are government approval, dots along the bottom are articles"],
  ["발행을 취소할까요? 들어갔던 지지율 효과만큼 되돌립니다.", "unpublish this? The support effects it applied will be reversed."],
  ["기사를 지울까요?", "delete this article?"],
  ["(발행된 기사라 지지율 효과도 되돌립니다)", "(it's published, so its support effects are reversed too)"],
  ["영향 범위에서", "In Reach, pick at least one"],
  ["을 하나 이상 고르세요.", " ."],
  ["- 로드맵 카드 개편 — 카드마다 상태 칩(완료 · 진행 중 · 예정) · 날짜 · 요약 목록 · 항목 수(진행 중 카드는 \"완료 n · 예정 m\"), 카드 높이는 내용만큼, 진행 중 카드 강조. 자세히 보기 창은 항목을 목록으로 · \"앞으로 (예정)\" 같은 소제목으로 나누고 \"고친 점\"에 고침 표시, 항목이 많으면 찾기 칸", "- Roadmap card redesign — each card shows a status chip (Done · In progress · Planned), date, summary list and item count (\"Done n · Planned m\" on the in-progress card); cards are as tall as their content and the in-progress card stands out. The details window lists items under subheadings such as \"Coming next (planned)\", tags fixes, and adds a search box when there are many items"],
  ["완료", "Done"],
  ["진행 중", "In progress"],
  ["예정", "Planned"],
  ["고침", "Fix"],
  ["키 번역", "Key-based translation"],
  ["한국어 팩", "Korean pack"],
  ["처음이라면 여기서 시작하세요.", "Start here if you're new."],
  ["고르면 복사본이 새 세이브로 만들어집니다", "Picking one makes a copy as a new save"],
  ["아무것도 없는 나라에서 직접 만들어 갑니다", "Build your own country from scratch"],
  ["★ 즐겨찾기", "★ Favorites"],
  ["이념 체계 (하위 이념 포함)", "Ideology system (with sub-ideologies)"],
  ["국가 · 정당 설정", "Country and party setup"],
  ["원외정당 (노동당 · 정의당 · 자유와혁신)", "Extra-parliamentary parties (Labor Party, Justice Party, Freedom and Innovation)"],
  ["일반 세이브", "Other saves"],
  ["기본 과정", "Basic lessons"],
  ["심화 과정", "Advanced lessons"],
  ["처음이라면 #1부터 순서대로", "New here? Go in order from #1"],
  ["필요한 기능만 골라서", "Pick just the features you need"],
  ["☆를 눌러 자주 여는 세이브를 여기에 모아 두세요.", "Click ☆ to keep saves you open often here."],
  ["나머지 세이브가 없습니다.", "No other saves."],
  ["저장된 세이브가 없습니다. \"새로 시작\"에서 시작하세요.", "No saves yet. Start one from \"New game\"."],
  ["마친 과정", "Completed lesson"],
  ["튜토리얼을 불러오지 못했습니다.", "Couldn't load the tutorial."],
  ["테마 색 비례", "Relative to theme"],
  ["직접 지정: 고른 색 그대로 · 테마 색 비례: 테마 색이 바뀌면 같은 비율로 따라 바뀜", "Custom: exactly the color you pick · Relative to theme: follows the theme color in the same proportion when it changes"],
  ["테마 색 그대로", "Same as theme color"],
  ["색상", "Hue"],
  ["채도", "Saturation"],
  ["밝기", "Brightness"],
  [
   "지도 안 지역구 수:",
   "Districts on map:"
  ],
  [
   "개 | 지역구를 클릭하면 의석 수·성향을 편집할 수 있습니다",
   " | click a district to edit its seats and leanings"
  ],
  [
   "권역형 비례대표에서 지역구를 묶는 단위입니다. 원별로 독립적으로 설정합니다. (전국형을 쓸 경우 설정하지 않아도 됩니다)",
   "Regions group districts for regional list PR. Set them separately per chamber. (Not needed if you use national lists.)"
  ],
  [
   "▌ 권역 목록 (칠하기 대상을 선택하세요)",
   "▌ Regions (choose one to paint)"
  ],
  [
   "[+] 권역 추가",
   "[+] Add region"
  ],
  [
   "▌ 권역별 득표율",
   "▌ Vote share by region"
  ],
  [
   "자동 집계",
   "Automatic"
  ],
  [
   "수동 입력",
   "Manual"
  ],
  [
   "자동 집계: 권역에 속한 지역구들의 성향(%)을 평균해 득표율로 사용합니다. 수동 입력: 권역마다 직접 지지율을 입력합니다.",
   "Automatic: averages the leanings (%) of the region's districts as its vote share. Manual: enter support for each region yourself."
  ],
  [
   "완전연동형(100%)",
   "Fully compensatory (100%)"
  ],
  [
   "병립형(0%)",
   "Parallel (0%)"
  ],
  [
   "완전연동형",
   "Fully compensatory"
  ],
  [
   "연동 비율(%)",
   "Compensation (%)"
  ],
  [
   "0% = 병립형(지역구·비례 독립 배분) · 100% = 완전연동형(전체 의석을 득표율에 맞춤) · 그 사이는 준연동형처럼 절충 · 권역형은",
   "0% = parallel (districts and lists allocated independently) · 100% = fully compensatory (all seats match vote share) · in between is a semi-compensatory mix · regional lists need"
  ],
  [
   "0% = 병립형(지역구·비례 독립 배분) · 100% = 완전연동형(전체 의석을 득표율에 맞춤) · 그 사이는 준연동형처럼 절충",
   "0% = parallel (districts and lists allocated independently) · 100% = fully compensatory (all seats match vote share) · in between is a semi-compensatory mix"
  ],
  [
   "비례대표 방식 (국회) —",
   "List PR method (House) —"
  ],
  [
   "비례대표 방식 (상원) —",
   "List PR method (Senate) —"
  ],
  [
   "국가 > 권역",
   "Nation > Regions"
  ],
  [
   "탭에서 권역을 먼저 설정하세요",
   "regions to be set up first"
  ],
  [
   "오차(±%)",
   "Margin (±%)"
  ],
  [
   "↺ 위치 초기화",
   "↺ Reset view"
  ],
  [
   "· Shift+스크롤: 확대/축소 · 휠클릭 드래그: 이동",
   "· Shift+scroll: zoom · middle-click drag: pan"
  ],
  [
   "권역 배정 맵",
   "Region assignment map"
  ],
  [
   "아래에서 \"칠하기\" 권역을 고른 뒤, 지도(또는 그리드)의 지역구를 클릭해 그 권역에 배정/해제하세요.",
   "Choose a region to \"paint\" below, then click districts on the map (or grid) to add/remove them."
  ],
  [
   "SVG 지도가 없습니다 — 지역구 탭에서 업로드하세요",
   "No SVG map — upload one in the District tab"
  ],
  [
   "지역구 탭에서 지도를 먼저 업로드하세요",
   "Upload a map in the District tab first"
  ],
  [
   "아직 권역이 없습니다. 아래 [+] 버튼으로 추가하세요.",
   "No regions yet. Add one with the [+] button below."
  ],
  [
   "권역을 먼저 추가하세요.",
   "Add a region first."
  ],
  [
   "정부 형태",
   "Form of government"
  ],
  [
   "의원내각제",
   "Parliamentary"
  ],
  [
   "내각 · 직책 이름 (내각 디스플레이에 표시될 이름을 직접 바꿀 수 있습니다 — 비워두면 기본값 사용)",
   "Cabinet & position titles (rename them as shown in the cabinet display — leave blank for defaults)"
  ],
  [
   "총리 / 국무총리",
   "Prime Minister / Premier"
  ],
  [
   "의장 (집단지도체제)",
   "Chair (collective leadership)"
  ],
  [
   "장관 / 국무위원",
   "Minister / Cabinet member"
  ],
  [
   "법안 거부권(veto) 주체",
   "Bill veto holder"
  ],
  [
   "거부권이 있으면, 표결 통과된 법안을 국가 > 입법 탭에서 거부할 수 있습니다",
   "With a veto, bills that pass a vote can be vetoed in Nation > Legislation"
  ],
  [
   "국가 비상사태 권한 주체",
   "State of emergency power holder"
  ],
  [
   "의회 해산 권한 주체",
   "Dissolution power holder"
  ],
  [
   "해산권 분할 —",
   "Split dissolution —"
  ],
  [
   "해산: 대통령 /",
   "dissolution: President /"
  ],
  [
   "해산: 총리",
   "dissolution: PM"
  ],
  [
   "계엄령 권한 주체",
   "Martial law power holder"
  ],
  [
   "대통령 이름",
   "President name"
  ],
  [
   "🔗 의원과 연결됨 — 이름·사진·당적 자동 반영",
   "🔗 Linked to a member — name, photo and party applied automatically"
  ],
  [
   "연결 해제",
   "Unlink"
  ],
  [
   "✕ 사진 제거",
   "✕ Remove photo"
  ],
  [
   "총리직선제",
   "Direct PM election"
  ],
  [
   "국무총리 이름",
   "Premier name"
  ],
  [
   "총리 이름",
   "PM name"
  ],
  [
   "🔒 현재 총리로 고정 (의석 변동에 영향받지 않음)",
   "🔒 Lock the current PM (unaffected by seat changes)"
  ],
  [
   "🔓 고정 해제 (다시 다수당 대표를 실시간 반영)",
   "🔓 Unlock (follow the majority party leader again)"
  ],
  [
   "🔒 내각 불신임으로 총리가 공석입니다 — 직접 지정하거나, 아래 \"고정 해제\"로 현재 다수당 대표를 새 총리로 반영하세요.",
   "🔒 The PM post is vacant after a no-confidence vote — set one directly, or use \"Unlock\" below to make the current majority party leader PM."
  ],
  [
   "🔒 총리가 고정되어 있습니다 — 다수당이 바뀌어도 총리는 유지되며, 내각 불신임이 가결되면 공석이 됩니다.",
   "🔒 The PM is locked — they stay in office even if the majority changes, and the post becomes vacant if a no-confidence vote passes."
  ],
  [
   "[+] 부총리 추가",
   "[+] Add deputy PM"
  ],
  [
   "총리 후보 지명 (대통령 임명제)",
   "Nominate PM (presidential appointment)"
  ],
  [
   "총리 후보",
   "PM nominee"
  ],
  [
   "후보 이름",
   "Candidate name"
  ],
  [
   "지명 → 의회 심의 상정",
   "Nominate → send to parliament"
  ],
  [
   "내각 불신임",
   "No confidence"
  ],
  [
   "건설적 불신임제 (독일 · 이스라엘식) — 불신임안에 후임을 함께 지명",
   "Constructive vote of no confidence (German/Israeli style) — name a successor in the motion"
  ],
  [
   "-- 후임 총리 소속 정당 --",
   "-- Successor PM's party --"
  ],
  [
   "후임 총리 이름",
   "Successor PM name"
  ],
  [
   "건설적 불신임안",
   "Constructive no-confidence motion"
  ],
  [
   "내각 불신임안",
   "No-confidence motion"
  ],
  [
   "발의 !",
   "file !"
  ],
  [
   "가결되면 국가 > 입법 탭에서 확인할 수 있으며, 통과 시 현재 총리가 해임됩니다",
   "Shown in Nation > Legislation once filed; if it passes, the current PM is dismissed"
  ],
  [
   "가결되면 지명한 후임이 곧바로 새 총리가 되고, 기존 내각(부총리·국무위원)은 물러납니다 — 공석이 생기지 않습니다",
   "If it passes, the named successor becomes PM right away and the old cabinet (deputy PMs, ministers) steps down — no vacancy"
  ],
  [
   "[+] 국무위원 추가",
   "[+] Add cabinet member"
  ],
  [
   "[+] 장관 추가",
   "[+] Add minister"
  ],
  [
   "▌ 비상 권한",
   "▌ Emergency powers"
  ],
  [
   "해산 대상",
   "Dissolve"
  ],
  [
   "의회 전체",
   "Whole parliament"
  ],
  [
   "한 원만 해산하면 그 원의 의석만 비워지고, 그 원의 총선을 반영하면 해제됩니다.",
   "Dissolving one chamber empties only its seats; it's lifted once that chamber's general election is applied."
  ],
  [
   "의회 해산",
   "Dissolution"
  ],
  [
   "존속 정당이 이름·색·당수를 유지한 채 다른 정당들을 흡수합니다. 흡수된 정당의 의석·의원·연정·지지율이 존속 정당으로 옮겨집니다.",
   "The surviving party keeps its name, color and leader and absorbs the others. The absorbed parties' seats, members, coalitions and support move to it."
  ],
  [
   "흡수될 정당을 1개 이상 고르세요.",
   "Pick at least one party to absorb."
  ],
  [
   "고른 정당들이 모두 해산하고 새 정당으로 합쳐집니다. 의석·의원·연정·지지율이 새 정당으로 옮겨집니다.",
   "All selected parties dissolve and merge into a new party. Seats, members, coalitions and support move to the new party."
  ],
  [
   "합칠 정당 (2개 이상)",
   "Parties to merge (2 or more)"
  ],
  [
   "합쳐지는 정당들을 새 정당의 계파로 남기기",
   "Keep merged parties as factions of the new party"
  ],
  [
   "합칠 정당을 2개 이상 고르세요.",
   "Pick at least two parties to merge."
  ],
  [
   "의석 수",
   "Seat count"
  ],
  [
   "지금 설정에선 숨겨져 있어요",
   "hidden with the current settings"
  ],
  [
   "의회 ›",
   "Parliament ›"
  ],
  [
   "여론 ›",
   "Opinion ›"
  ],
  [
   "내각 ›",
   "Cabinet ›"
  ],
  [
   "시각 ›",
   "Visuals ›"
  ],
  [
   "맨 위 ›",
   "Top ›"
  ],
  [
   "왼쪽 ›",
   "Left ›"
  ],
  [
   "가운데 ›",
   "Center ›"
  ],
  [
   "공통 ›",
   "General ›"
  ],
  [
   "⚠ (부정선거)",
   "⚠ (Election fraud)"
  ],
  [
   " (부정선거)",
   " (Election fraud)"
  ],
  [
   "의회를 이루는 정당 · 의석 · 의원 · 연정을 다룹니다.",
   "Parties, seats, members and coalitions that make up parliament."
  ],
  [
   "나라의 정당을 만들고 꾸밉니다.",
   "Create and customize your nation's parties."
  ],
  [
   "정당이 속할 이념을 추가하고 순서를 정합니다. 자동 정렬일 때 정당은 이 순서대로 반원에 앉아요.",
   "Add ideologies and set their order. With auto-sort, parties sit in the hemicycle in this order."
  ],
  [
   "정당 추가 · 복제 · 삭제, 이름 · 약칭 · 색 · 이념 · 상태, 소속 의회, 파벌, 합당(흡수합당 · 신설합당).",
   "Add, duplicate and delete parties; name, abbreviation, color, ideology, status, chambers, factions, and mergers (absorption / new party)."
  ],
  [
   "정당 대표와 파벌 대표의 이름 · 사진. 의원내각제에선 다수당 당수가 자동으로 총리가 됩니다.",
   "Names and photos of party and faction leaders. Under a parliamentary system, the majority party leader automatically becomes PM."
  ],
  [
   "의회별 이름과 총 의석 수, 정당마다 몇 석인지 정합니다. \"배정 합계\"는 총 의석 수를 넘을 수 없어요.",
   "Set each chamber's name and total seats, and how many seats each party has. The \"Assigned total\" can't exceed the total."
  ],
  [
   "원마다 따로 정합니다. 상원 · 삼원은 국가 › 설정에서 양원제 · 삼원제를 골랐을 때 나타나요.",
   "Set separately per chamber. The Senate and Third chamber appear when you choose bicameral/tricameral in Nation › Settings."
  ],
  [
   "지역구에서 당선된 의원 명단입니다. 이름 · 사진을 채우고, 궐석(빈자리)으로 처리하면 보궐선거를 치를 수 있어요. 지역구 선거를 치른 뒤에 채워집니다.",
   "The roster of district winners. Fill in names and photos, and mark seats vacant to hold by-elections. Filled after a district election."
  ],
  [
   "비례대표 의원 명단입니다. 자리마다 소속 정당 · 이름 · 사진을 정하고, 그 의원을 당수로 지정할 수 있어요.",
   "The list (PR) member roster. Set each seat's party, name and photo, and make a member party leader."
  ],
  [
   "정당들을 묶어 연립정부를 만듭니다. 집권 연정(★) · 대표당 · 각외협력 정당을 정하고, 단독 집권이나 무집권 상태로 둘 수도 있어요. 집권 세력은 반원에서 금색 테두리로 표시됩니다.",
   "Group parties into coalition governments. Set the ruling coalition (★), lead party and confidence-and-supply parties, or leave single-party or no government. The governing side gets a gold outline in the hemicycle."
  ],
  [
   "나라 전체의 설정과 입법 · 선거 · 기록을 다룹니다.",
   "Nation-wide settings, legislation, elections and records."
  ],
  [
   "나라의 기본 틀을 정합니다.",
   "Set up the basics of your nation."
  ],
  [
   "단원제 · 양원제 · 삼원제, 의장단(의장 · 부의장), 원별 반원 가운데 표시(의석 수 · 의회 로고), 집권 세력 강조.",
   "Unicameral/bicameral/tricameral, presiding officers (speaker, deputies), what each hemicycle center shows (seat count or chamber logo), highlight government."
  ],
  [
   "국가명과 국기.",
   "Nation name and flag."
  ],
  [
   "화면 오른쪽 위에 보이는 현재 날짜와 회기, 표시 방식.",
   "The current date and session shown at the top right, and how they're displayed."
  ],
  [
   "자동저장 주기, 이름 붙여 저장 · 불러오기, 파일(.json)로 저장 · 불러오기, 초기화.",
   "Autosave interval, named saves and loading, saving/loading files (.json), and reset."
  ],
  [
   "법안을 만들고 통과시키는 과정입니다.",
   "Drafting bills and getting them passed."
  ],
  [
   "새 법안 작성(제목 · 내용 · 태그 · 가결 기준), 기존 법안 수정과 개정안.",
   "Write new bills (title, text, tags, passing threshold), edit existing bills and amendments."
  ],
  [
   "법안을 의회 또는 국무회의에 올립니다. 검색 · 태그로 찾을 수 있어요.",
   "Table bills in parliament or the Cabinet Council. Find them by search or tags."
  ],
  [
   "정당별 · 의원별 찬반 표결. 거부권이 있으면 통과된 법안을 거부할 수 있습니다.",
   "Vote yea/nay by party or by member. With a veto, passed bills can be vetoed."
  ],
  [
   "내각이 의결하는 법안의 표결과 의결 정족수.",
   "Votes on bills decided by the cabinet, and the quorum."
  ],
  [
   "선거를 치르고 개표합니다. 결과는 여론 탭의 지지율 · 성향을 바탕으로 정해져요.",
   "Hold elections and count votes. Results are based on support and leanings from the Opinion tabs."
  ],
  [
   "대통령(총리직선제면 총리) 선거 개표.",
   "Count presidential elections (or PM elections under direct PM election)."
  ],
  [
   "의회 선거 — 비례 · 지역구 · 전체 방식, 궐석 지역구만 다시 뽑는 보궐선거, 개표 속도.",
   "Parliamentary elections — list, district or both, by-elections for vacant districts only, and counting speed."
  ],
  [
   "대선 방식(단순 다수 · 결선투표 · 선거인단), 지지율을 가져올 기준 원, 후보.",
   "Presidential method (first-past-the-post / two-round / electoral college), the base chamber for support, and candidates."
  ],
  [
   "지나간 일을 모아 둡니다.",
   "A record of what has happened."
  ],
  [
   "가결 · 부결 · 거부된 법안 보관함 (상태별로 걸러 보기).",
   "Archive of passed, rejected and vetoed bills (filter by status)."
  ],
  [
   "지난 선거 결과.",
   "Past election results."
  ],
  [
   "정당별로 다음 총선 개표 1회에 한해 부정선거를 시도할 수 있습니다. 발각은 개표 도중 무작위 시점에 드러나며, 그 순간 개표가 멈추고 조작된 표를 무효로 해 처음부터 다시 개표합니다. 발각된 정당은 활동 금지 처분을 받아요.",
   "Each party can attempt election fraud once, in the next general election count. Fraud is uncovered at a random point during the count: counting stops, the rigged votes are voided and the count starts over. A party caught is banned."
  ],
  [
   "선거 결과를 좌우하는 지역구 · 성향 · 지지율을 정합니다. 여기서 정한 값으로 국가 › 선거에서 개표해요.",
   "Set the districts, leanings and support that decide elections. Nation › Elections counts votes using these values."
  ],
  [
   "지역구를 만들고 원별 의석 수를 정합니다. 맵 메이커에서 만든 지도(.jsx)를 올리면 실제 지도 모양의 지역구를 쓸 수 있어요.",
   "Create districts and set their seats per chamber. Upload a map (.jsx) made in the Map Maker to use real map-shaped districts."
  ],
  [
   "지역구마다 정당별 성향(%)을 정합니다. 지역구 선거에서 어느 정당이 이길지가 여기서 갈려요.",
   "Set each party's leaning (%) per district. This decides who wins district elections."
  ],
  [
   "권역형 비례대표를 쓸 때 지역구를 권역으로 묶습니다. 권역 득표율은 지역구 성향을 평균하는 자동 집계나 직접 입력 중에서 고릅니다.",
   "Group districts into regions for regional list PR. Region vote shares are either averaged from district leanings or entered by hand."
  ],
  [
   "정당별 지지율(%)과 오차 범위를 정합니다. 비례대표 의석과 대선 결과의 바탕이 되고, 선거를 치르려면 꼭 필요해요. 전국형 · 권역형 비례를 고를 수 있습니다.",
   "Set each party's support (%) and margin of error. It drives list seats and presidential results and is required to hold an election. Choose national or regional lists."
  ],
  [
   "정부를 이끄는 사람들과 그 권한을 다룹니다. 의석 화면의 \"내각\" 탭에 한눈에 보여요.",
   "The people who lead the government and their powers. See them at a glance in the \"Cabinet\" tab of the seat screen."
  ],
  [
   "정부 형태(대통령제 · 이원집정부제 · 의원내각제 · 입헌군주제 · 집단지도체제)와 직책 이름, 그리고 법안 거부권 · 비상사태 · 의회 해산 · 계엄령 권한을 누가 가질지 정합니다. 의회 해산은 의회 전체 또는 한 원(예: 하원)만 고를 수 있어요.",
   "Choose the form of government (presidential / semi-presidential / parliamentary / constitutional monarchy / collective leadership), position titles, and who holds the veto, state of emergency, dissolution and martial law powers. Dissolution can target the whole parliament or one chamber (e.g. the lower house)."
  ],
  [
   "대통령의 이름 · 사진 · 소속 정당. 의원에서 불러오면 그 의원 정보와 연결돼 함께 바뀝니다.",
   "The president's name, photo and party. Load from a member to link them so they stay in sync."
  ],
  [
   "총리 선출 방식(다수당 대표 자동 · 총리직선제), 현재 총리 고정, 부총리, 내각 불신임안 발의. 건설적 불신임제(독일 · 이스라엘식)를 켜면 불신임안에 후임을 함께 지명하고, 가결되면 그 후임이 바로 총리가 됩니다.",
   "How the PM is chosen (majority leader automatically / direct election), locking the current PM, deputy PMs, and filing no-confidence motions. With the constructive vote of no confidence (German/Israeli style), the motion names a successor who becomes PM immediately if it passes."
  ],
  [
   "장관 · 국무위원을 추가하고 직책 · 이름 · 사진 · 소속 정당을 정합니다.",
   "Add ministers and cabinet members and set their positions, names, photos and parties."
  ],
  [
   "화면 맨 위의 세이브 탭 바와 왼쪽 메뉴(사이드바) 쓰는 법입니다.",
   "How to use the save tab bar at the top and the menu (sidebar) on the left."
  ],
  [
   "⌂ 집 아이콘",
   "⌂ Home icon"
  ],
  [
   "탭 바 맨 왼쪽. 누르면 지금 상태를 바로 저장한 뒤 메인 화면(시작 화면)으로 돌아갑니다.",
   "At the far left of the tab bar. Saves right away, then returns to the main (start) screen."
  ],
  [
   "세이브 탭",
   "Save tabs"
  ],
  [
   "탭 하나하나가 세이브(나라 하나)입니다. 누르면 확인창 없이 그 세이브로 바로 바뀌고, 진행 상황은 세이브마다 따로 자동저장돼요.",
   "Each tab is a save (one nation). Click to switch to it instantly with no confirmation; progress is autosaved separately for each save."
  ],
  [
   "맨 앞의 기본 자동저장 — 어느 세이브에도 속하지 않은 작업을 담아 두어 기존 데이터가 사라지지 않게 합니다.",
   "The default autosave at the front — holds work that doesn't belong to any save so existing data is never lost."
  ],
  [
   "이름 바꾸기",
   "Rename"
  ],
  [
   "탭 이름을 더블클릭 (또는 국가 › 설정 › 저장의 ✎).",
   "Double-click the tab name (or ✎ in Nation › Settings › Save)."
  ],
  [
   "그 세이브 삭제 (확인 후).",
   "Delete that save (after confirming)."
  ],
  [
   "+ 새 세이브",
   "+ New save"
  ],
  [
   "새 세이브를 만듭니다.",
   "Creates a new save."
  ],
  [
   "새로 생성",
   "Create new"
  ],
  [
   "아무것도 없는 기본 상태에서 새로 시작 — 지금 화면은 복사되지 않아요.",
   "Start fresh from the default state — the current screen isn't copied."
  ],
  [
   "프리셋에서 생성",
   "Create from preset"
  ],
  [
   "서독 튜토리얼처럼 미리 준비된 나라의 복사본으로 시작.",
   "Start from a copy of a ready-made nation, like the West Germany tutorial."
  ],
  [
   "메뉴 묶음과 항목",
   "Menu groups and items"
  ],
  [
   "의회 · 국가 · 여론 · 내각 · 도움말 다섯 묶음과 그 안의 항목. 항목을 누르면 그 기능 화면이 열리고, 묶음 제목을 누르면 접히거나 펼쳐집니다 (다음에 열어도 그대로 기억).",
   "Five groups — Parliament, Nation, Opinion, Cabinet, Help — and their items. Click an item to open that screen; click a group title to collapse or expand it (remembered next time)."
  ],
  [
   "사이드바 접기",
   "Collapse sidebar"
  ],
  [
   "사이드바 머리 오른쪽의 접기 버튼으로 아이콘만 남기고 접어 편집 화면을 넓게 쓸 수 있어요. 접힌 상태에선 아이콘을 누르면 그 묶음으로 바로 이동합니다.",
   "Use the collapse button at the right of the sidebar header to shrink it to icons and widen the edit area. When collapsed, click an icon to jump to that group."
  ],
  [
   "편집 패널 머리 · 폭 조절",
   "Edit panel header · resizing"
  ],
  [
   "편집 패널 맨 위에는 라이트/다크에선 지금 위치(묶음 › 항목), 네온에선 \"MINISTRY OF INTERIOR\" 띠와 국가명이 보입니다. 편집 패널과 시각 화면 사이 경계를 끌면 폭을 바꿀 수 있고, 더블클릭하면 기본 폭으로 돌아가요.",
   "The top of the edit panel shows your location (group › item) in Light/Dark, or the \"MINISTRY OF INTERIOR\" strip and nation name in Neon. Drag the border between the edit panel and visuals to resize; double-click to reset."
  ],
  [
   "실행 버튼과 단축키",
   "Execute button and shortcuts"
  ],
  [
   "설정을 바꾼 뒤 \"PROTOCOL EXECUTE\"(실행)를 누르면 시각 화면이 새로 그려집니다.",
   "After changing settings, press \"PROTOCOL EXECUTE\" to redraw the visuals."
  ],
  [
   "입력 칸 밖에서 누르면 실행.",
   "Execute (when not typing in a field)."
  ],
  [
   "바로 저장.",
   "Save now."
  ],
  [
   "되돌리기 (Ctrl+Shift+Z로 다시 실행).",
   "Undo (Ctrl+Shift+Z to redo)."
  ],
  [
   "열려 있는 확인 · 안내 · 내보내기 창 닫기.",
   "Close open confirm, notice or export windows."
  ],
  [
   "화면 오른쪽의 시각 탭 — 설정한 내용이 그림으로 보이는 곳입니다.",
   "The visual tabs on the right — where your settings are drawn."
  ],
  [
   "하원(첫 번째 의회)의 의석을 반원으로 보여줍니다. 위쪽 \"반원 / 지역구\"로 지역구 지도 보기로 바꿀 수 있고, 아래에는 여당 · 야당별 정당 카드(의석 수 · 비율 · 파벌)와 원외정당, 의장단이 나와요.",
   "Shows the House (first chamber) seats as a hemicycle. Switch to the district map with \"Hemicycle / District\" at the top; below are party cards for government and opposition (seats, share, factions), extra-parliamentary parties and presiding officers."
  ],
  [
   "상원(두 번째 의회)의 의석. 보는 법은 하원과 같습니다.",
   "Senate (second chamber) seats. Works the same as the House."
  ],
  [
   "삼원(세 번째 의회)의 의석.",
   "Third chamber seats."
  ],
  [
   "대통령 · 총리 · 부총리 · 국무위원 등 정부 구성원을 카드로 한눈에 보여줍니다. 내각 묶음에서 정한 내용이 여기 반영돼요.",
   "Shows the president, PM, deputy PMs, ministers and other government members as cards. Reflects what you set in the Cabinet group."
  ],
  [
   "지역구 지도. 국가 › 지역를 열면 나타나고, 지역구를 눌러 편집할 수 있어요. 탭의 ×로 닫습니다.",
   "District map. Appears when you open Nation › Districts; click a district to edit it. Close with the × on the tab."
  ],
  [
   "정당별 성향 지도. 여론 › 성향을 열면 나타나며, 지역구마다 어느 정당 쪽인지 색으로 보여요.",
   "Party leaning map. Appears when you open Opinion › Tendency and colors each district by which party it leans toward."
  ],
  [
   "권역 지도. 국가 › 권역을 열면 나타나고, 지역구를 칠해 권역으로 묶습니다.",
   "Region map. Appears when you open Nation › Regions; paint districts to group them into regions."
  ],
  [
   "총선 개표 화면과 결과. 개표가 진행되는 모습, 정당별 득표와 직전 대비 의석 변동(▲/▼)을 보여주고, 결과를 확인한 뒤 국가 › 선거의 \"✔ 의회에 반영\"을 누르면 그 결과대로 의석이 바뀝니다.",
   "General election count and results. Shows the count in progress, votes by party and seat changes (▲/▼); after checking, press \"✔ Apply to Parliament\" in Nation › Elections to update the seats."
  ],
  [
   "총선을 개표하면 원마다 생겨요",
   "appears per chamber after a general election count"
  ],
  [
   "양원제 · 삼원제일 때 나타나요",
   "appears with bicameral/tricameral"
  ],
  [
   "삼원제일 때 나타나요",
   "appears with tricameral"
  ],
  [
   "날짜 · 회기",
   "Date · Session"
  ],
  [
   "시각 화면 오른쪽 위에 보이는 현재 날짜와 회기. 국가 › 설정 › 날짜에서 정합니다 (\"열기\"로 이동).",
   "The current date and session at the top right of the visuals. Set them in Nation › Settings › Date (\"Open\" takes you there)."
  ],
  [
   "좌석 정보 · 이미지 내보내기",
   "Seat info · image export"
  ],
  [
   "좌석(점)을 누르면 그 자리의 정당 · 의원 정보 카드가 뜹니다. 반원 · 지도 · 선거 결과 · 내각 화면에서 오른쪽 클릭(모바일은 길게 누르기) → \"내보내기...\"를 고르면 이미지로 저장할 수 있어요.",
   "Click a seat (dot) to see that seat's party and member info. Right-click (long-press on mobile) the hemicycle, maps, election results or cabinet view and choose \"Export...\" to save an image."
  ],
  [
   "화면 둘러보기",
   "Screen Tour"
  ],
  [
   "메뉴 이동 · 의석 화면 · 세이브",
   "Menus · seat screen · saves"
  ],
  [
   "서독에 오신 것을 환영합니다",
   "Welcome to West Germany"
  ],
  [
   "가상의 나라 \"튜토리얼 공화국\"에서 기본 조작을 직접 해보며 배웁니다. 튜토리얼은 #1 ~ #5로 짧게 나뉘어 있고, 밝게 표시된 곳을 실제로 조작해야 다음 단계로 넘어가요. 이 나라는 복사본(새 세이브)이라 마음껏 바꿔도 괜찮습니다.",
   "Learn the basics hands-on in the fictional \"Tutorial Republic\". The tutorial is split into short lessons #1–#5, and you move on by actually using the highlighted control. This nation is a copy (a new save), so feel free to change anything."
  ],
  [
   "메뉴 이동하기",
   "Using the menu"
  ],
  [
   "기능은 의회 · 국가 · 여론 · 내각 네 묶음으로 나뉘어 있고, 회색 \"도움말\"에는 모든 탭의 설명이 있어요. 화면 아래 탭 바에서 \"의회\"를 누르고, 위쪽 칩 줄에서 \"정당\"을 골라보세요.",
   "Features are grouped into Parliament, Nation, Opinion and Cabinet, and the gray \"Help\" explains every tab. Tap \"Parliament\" in the bottom tab bar, then pick \"Parties\" in the chip row at the top."
  ],
  [
   "기능은 의회 · 국가 · 여론 · 내각 네 묶음으로 나뉘어 있고, 맨 아래 회색 \"도움말\"에는 모든 탭의 설명이 있어요. 왼쪽 메뉴에서 의회 › 정당을 눌러보세요.",
   "Features are grouped into Parliament, Nation, Opinion and Cabinet, and the gray \"Help\" at the bottom explains every tab. Click Parliament › Parties in the left menu."
  ],
  [
   "정당 화면이 열렸어요.",
   "The Parties screen is open."
  ],
  [
   "의석 살펴보기",
   "Exploring the seats"
  ],
  [
   "의석은 반원 모양으로 그려집니다. 좌석(점) 하나를 눌러보세요.",
   "Seats are drawn as a hemicycle. Click a seat (dot)."
  ],
  [
   "그 자리의 정당 · 의원 정보가 떴어요. 좌석을 오른쪽 클릭(길게 누르기)하면 이미지로 내보낼 수도 있어요.",
   "That seat's party and member info appeared. Right-click (long-press) a seat to export an image."
  ],
  [
   "맨 위의 탭 하나하나가 세이브입니다. +로 새 세이브(또는 프리셋 복사본)를 만들고, 탭 이름을 더블클릭하면 이름을 바꿀 수 있어요. 진행 상황은 자동으로 저장됩니다.",
   "Each tab at the top is a save. Use + to create a new save (or a preset copy), and double-click a tab name to rename it. Progress is saved automatically."
  ],
  [
   "정당과 의석",
   "Parties & Seats"
  ],
  [
   "정당 만들기 · 이름 짓기 · 의석 배정 · 다시 계산",
   "Create a party · name it · assign seats · recalculate"
  ],
  [
   "정당 만들기",
   "Creating a party"
  ],
  [
   "의회 › 정당 › 정보에서는 정당을 추가하고 이름 · 색 · 이념을 정합니다. \"[+] 정당 추가\"를 눌러 새 정당을 만들어 보세요.",
   "Parliament › Parties › Info is where you add parties and set their name, color and ideology. Press \"[+] Add party\" to create a new one."
  ],
  [
   "새 정당 \"신당\"이 목록에 생겼어요.",
   "The new party \"New Party\" appeared in the list."
  ],
  [
   "정당 이름 짓기",
   "Naming the party"
  ],
  [
   "방금 만든 정당의 이름 칸에 원하는 이름을 입력해 보세요. 옆의 색 칸으로 정당 색도 바꿀 수 있어요.",
   "Type a name in the new party's name box. You can also change its color with the color box next to it."
  ],
  [
   "멋진 이름이네요!",
   "Nice name!"
  ],
  [
   "빈자리 만들기",
   "Making room"
  ],
  [
   "의석 나눠주기",
   "Assigning seats"
  ],
  [
   "의석이 배정됐어요.",
   "Seats assigned."
  ],
  [
   "다시 계산하기",
   "Recalculating"
  ],
  [
   "설정을 바꾼 뒤에는 이 버튼을 눌러 의석 화면을 새로 그립니다. 지금 눌러보세요. (입력 칸 밖에서 Enter 키를 눌러도 같아요)",
   "After changing settings, press this button to redraw the seat screen. Press it now. (Pressing Enter outside a text field does the same.)"
  ],
  [
   "의석 화면이 새로 그려졌어요. 새 정당의 자리도 생겼을 거예요.",
   "The seat screen was redrawn. The new party should have seats now."
  ],
  [
   "법안 제출 · 상정과 표결",
   "Submitting · tabling and voting"
  ],
  [
   "법안 제출하기",
   "Submitting a bill"
  ],
  [
   "국가 › 입법에서는 법안을 작성해 의회에 올리고 표결합니다. 법안 제목을 적고 \"[+] 법안 등록\"을 눌러보세요.",
   "Nation › Legislation is where you write bills, table them in parliament and vote. Enter a bill title and press \"[+] Register bill\"."
  ],
  [
   "법안이 등록됐어요!",
   "Bill registered!"
  ],
  [
   "상정과 표결",
   "Tabling and voting"
  ],
  [
   "등록한 법안은 상정 탭에서 의회(또는 국무회의)에 올리고, 표결 탭에서 정당별 · 의원별로 찬반 표를 던집니다. 가결 · 부결된 법안은 기록 탭에 남아요.",
   "Registered bills are tabled in parliament (or the Cabinet Council) from the Table tab, and voted on by party or member in the Vote tab. Passed and rejected bills stay in the Records tab."
  ],
  [
   "여론과 선거",
   "Opinion & Elections"
  ],
  [
   "지지율 입력 · 개표",
   "Entering support · counting votes"
  ],
  [
   "지지율 정하기",
   "Setting support"
  ],
  [
   "여론 › 지지율에서 정당마다 예상 지지율(%)을 정합니다. 선거는 이 숫자를 바탕으로 치러져요. 한 정당 이상에 지지율을 입력해 보세요 (예: 40).",
   "Opinion › Support is where you set each party's expected support (%). Elections are based on these numbers. Enter support for at least one party (e.g. 40)."
  ],
  [
   "지지율이 입력됐어요.",
   "Support entered."
  ],
  [
   "선거 치르기",
   "Holding an election"
  ],
  [
   "국가 › 선거 › 총선에서 \"개표 시작\"을 누르면 지지율에 따라 개표가 진행됩니다. 지금 눌러보세요.",
   "In Nation › Elections › General, press \"Start count\" to count votes based on support. Press it now."
  ],
  [
   "개표가 시작됐어요!",
   "The count has started!"
  ],
  [
   "개표 지켜보기",
   "Watching the count"
  ],
  [
   "개표가 진행 중입니다. 반원에 의석이 하나씩 채워지는 모습을 지켜보세요. ",
   "The count is in progress. Watch the hemicycle fill up seat by seat. "
  ],
  [
   "개표가 끝났어요. ",
   "The count is finished. "
  ],
  [
   "결과를 확인한 뒤 선거 › 총선의 \"✔ 의회에 반영\"을 누르면 그 결과대로 의석이 바뀌어요. 결과는 오른쪽 클릭(길게 누르기)으로 이미지로 내보낼 수 있고, 개표 속도는 선거 설정에서 조절합니다.",
   "After checking the result, press \"✔ Apply to Parliament\" in Elections › General to change the seats to match it. You can export the result as an image with right-click (long-press), and adjust the counting speed in the election settings."
  ],
  [
   "총리와 당수 · 국무위원 · 내각 화면",
   "PM and leaders · cabinet members · cabinet view"
  ],
  [
   "총리는 누가 될까?",
   "Who becomes PM?"
  ],
  [
   "내각 › 내각 설정에서 대통령제 · 이원집정부제 · 의원내각제 등 정부 형태를 고릅니다. 서독은 의원내각제라, 의석이 가장 많은 정당의 대표(당수)가 자동으로 총리가 돼요 (👑 표시). 서독에서는 이 자리를 \"연방총리\"라고 불러요 — 직책 이름은 나라마다 정할 수 있습니다.",
   "Cabinet › Settings is where you choose the form of government (presidential, semi-presidential, parliamentary, ...). West Germany is parliamentary, so the leader of the party with the most seats automatically becomes head of government (marked 👑) — here the post is called \"Federal Chancellor\" (each country can name its own posts)."
  ],
  [
   "다수당 대표 정하기",
   "Choosing the majority leader"
  ],
  [
   "당수가 정해졌어요. 이제 내각 › 총리에도 이 사람이 총리로 표시됩니다.",
   "Leader set. They now appear as PM in Cabinet › PM too."
  ],
  [
   "국무위원 추가하기",
   "Adding a cabinet member"
  ],
  [
   "내각 › 내각에서 장관 같은 국무위원을 추가합니다. \"[+] 국무위원 추가\"를 눌러보세요.",
   "Cabinet › Cabinet is where you add ministers and other cabinet members. Press \"[+] Add cabinet member\"."
  ],
  [
   "국무위원 자리가 생겼어요. 이름 · 직책 · 소속 정당을 채울 수 있어요.",
   "A cabinet seat was added. You can fill in the name, position and party."
  ],
  [
   "내각 화면",
   "Cabinet view"
  ],
  [
   "의석 화면의 \"내각\" 탭에서 총리와 국무위원이 한눈에 보입니다. 오른쪽 클릭(길게 누르기)으로 이미지로 내보낼 수 있어요.",
   "The \"Cabinet\" tab of the seat screen shows the PM and cabinet at a glance. Export it as an image with right-click (long-press)."
  ],
  [
   "테마와 언어",
   "Theme & Language"
  ],
  [
   "메인 메뉴 › 설정에서 라이트 · 다크 · 네온 테마와 언어를 바꿀 수 있습니다. 이 튜토리얼은 시작 화면의 프리셋 목록에서 언제든 다시 할 수 있어요.",
   "Change the Light / Dark / Neon theme and the language in Main menu › Settings. You can redo this tutorial any time from the preset list on the start screen."
  ],
  [
   "직접 해보세요 — 해내면 \"다음\"이 열립니다",
   "Try it yourself — \"Next\" unlocks when you do"
  ],
  [
   "튜토리얼 목차",
   "Tutorial lessons"
  ],
  [
   " · 실습",
   " · Hands-on"
  ],
  [
   "#1 ~ #5를 모두 마쳤습니다. 이제 이 나라를 마음대로 바꿔보거나, 시작 화면에서 새 세이브를 만들어 나만의 나라를 꾸려보세요.",
   "You've finished #1–#5. Now change this nation however you like, or create a new save from the start screen and build your own."
  ],
  [
   "무엇을 배워볼까요?",
   "What would you like to learn?"
  ],
  [
   "하나하나 몇 단계로 짧게 끝납니다. 순서대로 하지 않고 골라서 해도 괜찮아요.",
   "Each one takes just a few steps. You can do them in any order."
  ],
  [
   "새 정당",
   "New Party"
  ],
  [
   "맨 위",
   "Top"
  ],
  [
   "id/label 우선 사용",
   "Prefer id/label"
  ],
  [
   "내보낼 때",
   "Wrap export in"
  ],
  [
   "래퍼 포함",
   "wrapper"
  ],
  [
   "업로드한 SVG가 여기 표시됩니다",
   "Your uploaded SVG appears here"
  ],
  [
   "SVG 지도를 지역구 지도 파일(.jsx)로 — 만든 파일은 국가 › 지역에서 불러옵니다",
   "Turn an SVG map into a district map file (.jsx) — load it in Nation › Districts"
  ],
  [
   "SVG 파일을 선택하세요.",
   "Choose an SVG file."
  ],
  [
   "SVG에서 지역구 도형 찾기",
   "Find district shapes in the SVG"
  ],
  [
   "① ⬆ SVG 열기 → ② ▶ 분석 → ③ 오른쪽 목록에서 이름 고치기 · 고르기 → ④ 내보내기",
   "① ⬆ Open SVG → ② ▶ Analyze → ③ Rename · pick in the list on the right → ④ Export"
  ],
  [
   "▶ 분석",
   "▶ Analyze"
  ],
  [
   "⬆ SVG 열기",
   "⬆ Open SVG"
  ],
  [
   "내보내기",
   "Export"
  ],
  [
   "먼저 SVG를 파싱하세요.",
   "Analyze an SVG first."
  ],
  [
   "모두 선택",
   "Select all"
  ],
  [
   "선택 해제",
   "Deselect all"
  ],
  [
   "선택된 요소가 없습니다.",
   "Nothing selected."
  ],
  [
   "선택한 것만 내보내기",
   "Export selected"
  ],
  [
   "수정된 SVG 다운로드",
   "Download edited SVG"
  ],
  [
   "요소 목록",
   "Elements"
  ],
  [
   "유효한 SVG가 아닙니다.",
   "Not a valid SVG."
  ],
  [
   "찾은 도형",
   "Shapes found"
  ],
  [
   "SVG 지도로 지역구 지도 만들기",
   "Build district maps from SVG"
  ],
  [
   "화면 · 테마",
   "Display · Theme"
  ],
  [
   "탭 닫기",
   "Close tab"
  ],
  [
   "📂 닫은 탭 다시 열기",
   "📂 Reopen closed tab"
  ],
  [
   "닫은 탭이 없습니다",
   "No closed tabs"
  ],
  [
   "이 탭을 닫을까요?\n자동저장이 꺼져 있어 저장하지 않은 변경사항은 사라집니다.",
   "Close this tab?\nAutosave is off, so unsaved changes will be lost."
  ],
  [
   "- 상단 탭 바 오른쪽에 \"저장\" 버튼 — 국가 › 저장이 떠 있는 저장 창으로 옮겨짐(자동저장 · 세이브 목록 · 다른 이름으로 저장 · 파일), + 버튼은 크롬처럼 마지막 탭 바로 오른쪽으로",
   "- \"Save\" button on the right of the top tab bar — Nation › Save moved into a floating save panel (autosave · save list · save as · file); the + button now sits right after the last tab, like Chrome"
  ],
  [
   "저장 · 자동저장 · 세이브 목록 · 파일",
   "Save · Autosave · Save list · File"
  ],
  [
   "새 탭",
   "New tab"
  ],
  [
   "지역구 시스템(지도 · 그리드)과 지도 위 글씨 · 배지 크기.",
   "District system (map/grid) and the size of map labels and badges."
  ],
  [
   "지도 모드에서는 국가 › 지역 탭에서 SVG 지도(.jsx)를 올릴 수 있습니다",
   "In map mode, upload the district map (.jsx) in Nation › Districts"
  ],
  [
   "의회 구성",
   "Parliament Composition"
  ],
  [
   "국가 설정",
   "Nation Settings"
  ],
  [
   "내각 설정",
   "Cabinet Settings"
  ],
  [
   "국무회의 기록",
   "Council Records"
  ],
  [
   "선거 기록",
   "Election Records"
  ],
  [
   "표결 기록",
   "Vote Records"
  ],
  [
   "하루 진행 (+1일)",
   "Advance 1 day (+1 day)"
  ],
  [
   "일주일 진행 (+7일)",
   "Advance 1 week (+7 days)"
  ],
  [
   "한 달 진행 (+1개월)",
   "Advance 1 month (+1 month)"
  ],
  [
   "하루 진행",
   "Advance 1 day"
  ],
  [
   "일주일 진행",
   "Advance 1 week"
  ],
  [
   "한 달 진행",
   "Advance 1 month"
  ],
  [
   "날짜 · 회기 설정…",
   "Date & session settings…"
  ],
  [
   "날짜 · 회기 설정",
   "Date & session settings"
  ],
  [
   "다음 회기",
   "Next session"
  ],
  [
   "회기 번호 +1",
   "Session number +1"
  ],
  [
   "더 보기",
   "More"
  ],
  [
   "삭제 (Shift+클릭: 확인 없이 바로 삭제)",
   "Delete (Shift+click: delete without confirming)"
  ],
  [
   "세이브 삭제",
   "Delete save"
  ],
  [
   "삭제하지 못했습니다. (저장 공간 오류)",
   "Couldn't delete. (storage error)"
  ],
  [
   "다음: 정기회",
   "Next: Regular"
  ],
  [
   "다음: 임시회",
   "Next: Extraordinary"
  ],
  [
   "다음 회기를 정기회로 열지 임시회로 열지 — 누르면 전환 (지금 회기는 그대로, 다음 회기부터 적용 · 지금 회기 종류는 설정에서)",
   "Whether the next session opens as regular or extraordinary — click to switch (the current session stays as is; change the current session's type in settings)"
  ],
  [
   "회기 번호 +1 (골라 둔 종류로)",
   "Session number +1 (with the chosen type)"
  ],
  [
   "지금 회기 종류 (다음 회기 종류는 오른쪽 위 날짜 줄의 \"다음:\" 버튼으로)",
   "Current session type (pick the next session's type with the \"Next:\" button on the date line, top right)"
  ],
  [
   "연 · 월 · 일",
   "Year · Month · Day"
  ],
  [
   "직접 입력",
   "Type it in"
  ],
  [
   "오른쪽 위 날짜 줄의 ▶ · ▶▶ · ▶▶▶ 로 하루 · 일주일 · 한 달씩 넘길 수 있습니다",
   "Use ▶ · ▶▶ · ▶▶▶ on the date line (top right) to advance a day, a week or a month"
  ],
  [
   "자동 진행",
   "Automatic progression"
  ],
  [
   "날짜가 정기회 시작일을 지나면 다음 회기를 정기회로 시작",
   "When the date passes the regular-session start date, open the next session as a regular session"
  ],
  [
   "정기회 시작일",
   "Regular session starts on"
  ],
  [
   "하원 총선 결과가 확정되면 대수 +1 (보궐선거 · 재개표는 제외)",
   "Term +1 when a lower-house general election result is confirmed (not by-elections or recounts)"
  ],
  [
   "회기가 개별형일 때 동작합니다. 날짜 연동은 연 · 월 · 일 날짜에서만 동작합니다.",
   "Works when the session is set to Individual. Date-based progression only works with year/month/day dates."
  ],
  [
   "지도의 지역구를 클릭해 그 권역에 배정/해제하세요.",
   "click a district on the map to assign it to that region or remove it."
  ],
  [
   "지도 위 글씨 · 배지 크기.",
   "Size of the labels and badges on the map."
  ],
  [
   "① ⬆ SVG 열기(바로 분석) → ② 오른쪽 목록에서 이름 고치기 · 고르기 → ③ 내보내기",
   "① ⬆ Open SVG (analyzed right away) → ② Rename · pick in the list on the right → ③ Export"
  ],
  [
   "스크롤: 확대 · 축소",
   "Scroll: zoom"
  ],
  [
   "휠 클릭 드래그: 이동",
   "Middle-drag: pan"
  ],
  [
   "클릭: 선택",
   "Click: select"
  ],
  [
   "사각형",
   "Rectangle"
  ],
  [
   "- 맵 메이커: 미리보기에서 스크롤로 확대 · 축소, 휠 클릭 드래그로 이동, ↺ 위치 초기화 · 도형 종류를 선 / 면 / 사각형 / 원으로 표시 · ⌖(하이라이트) 버튼 대신 목록 줄과 지도 도형이 마우스를 올리면 서로 강조 · 한글 이름이 __로 보이던 문제 수정 · 도형 색 상태를 기본 / 호버(굵은 테두리) / 선택(강조색) / 선택+호버로 네 가지 모두 구분 (선택한 도형에서 마우스를 빼면 호버 색이 남던 문제 수정)",
   "- Map Maker: scroll to zoom, middle-drag to pan and ↺ reset in the preview · shapes labelled line / area / rectangle / circle · the ⌖ (highlight) button is replaced by linked hover between list rows and map shapes · fixed Korean names showing as __ · shapes now show four distinct states — normal / hover (thick outline) / selected (accent fill) / selected + hover (fixed a selected shape keeping the hover color after the mouse left)"
  ],
  [
   "반영할 새 개표 결과가 없습니다. (이미 의회에 반영했습니다)",
   "There's no new count to apply. (It has already been applied to parliament.)"
  ],
  [
   "메뉴 이동 · 의석 화면 · 날짜 줄 · 세이브 탭",
   "Menus · seat view · date line · save tabs"
  ],
  [
   "1983년 3월, 총선을 막 치른 서독(독일연방공화국)에서 직접 조작해 보며 배웁니다. 연방의회에는 기민·기사연합 · 사회민주당 · 자유민주당 · 녹색당이 있고, 기민·기사연합과 자유민주당이 연정을 꾸려 집권하고 있어요. 튜토리얼은 두 가지예요 — 기본 튜토리얼(#1 ~ #6)은 처음 쓰는 분을 위한 핵심 흐름이고, 세부 튜토리얼은 이념 · 파벌 · 지도 · 선거 방식 · 정부 권한 같은 기능을 필요한 것만 골라 배웁니다. 밝게 표시된 곳을 실제로 조작해야 넘어가는 단계도 있어요. 이 나라는 복사본(새 세이브)이라 마음껏 바꿔도 괜찮습니다.",
   "You'll learn by doing in West Germany (the Federal Republic of Germany) in March 1983, just after a federal election. The Bundestag has the CDU/CSU, the SPD, the FDP and the Greens, and the CDU/CSU and FDP govern together in a coalition. There are two kinds of tutorials — the basic tutorial (#1 – #6) walks newcomers through the core flow, and the detailed tutorials cover features like ideologies, factions, maps, election systems and government powers so you can pick just what you need. Some steps only move on once you've actually done the highlighted thing. This country is a copy (a new save), so feel free to change anything."
  ],
  [
   "날짜와 회기",
   "Date and session"
  ],
  [
   "시각 화면 맨 위 줄에는 나라의 현재 날짜와 회기가 보입니다. ▶ · ▶▶ · ▶▶▶로 하루 · 일주일 · 한 달씩 넘기고, \"다음 회기\"로 회기를 올려요. ⚙를 누르면 날짜 · 회기 설정 창이 뜹니다. (자세한 건 세부 튜토리얼 \"날짜와 회기\")",
   "The top line of the visual screen shows the country's current date and session. ▶ · ▶▶ · ▶▶▶ advance a day, a week or a month, and \"Next session\" moves the session on. ⚙ opens the date & session settings. (More in the detailed tutorial \"Date and session\")"
  ],
  [
   "맨 위의 탭 하나하나가 세이브(나라 하나)입니다. 누르면 그 나라로 바로 바뀌고, 진행 상황은 세이브마다 따로 자동저장돼요. +는 새 탭(새로 만들기 · 프리셋 · 닫은 탭 다시 열기), 탭 이름을 더블클릭하면 이름 바꾸기, ×는 탭만 닫기(세이브는 남아요)입니다. 맨 왼쪽 ⌂는 저장하고 메인 화면으로 돌아갑니다.",
   "Each tab at the top is a save (one country). Click one to switch to it instantly; each save autosaves its own progress. + opens a new tab (new · preset · reopen closed tab), double-click a tab name to rename it, and × only closes the tab (the save stays). ⌂ on the far left saves and returns to the main screen."
  ],
  [
   "법안 제출 · 상정 · 표결 · 표결 기록",
   "Submit bills · table · vote · vote records"
  ],
  [
   "입법 › 제출에서 법안을 작성합니다. 법안 제목을 적고 \"[+] 법안 등록\"을 눌러보세요. (내용 · 태그 · 가결 기준은 비워 둬도 돼요)",
   "Write bills in Legislation › Submit. Enter a bill title and press \"[+] Register Bill\". (Content, tags and passing threshold can stay empty)"
  ],
  [
   "상정하기",
   "Tabling"
  ],
  [
   "입법 › 상정에는 등록된 법안이 모입니다. 법안마다 의회에 올릴지 국무회의에 올릴지 고르고, 법안을 누르면 표결로 넘어가요. 검색과 태그로 찾을 수 있습니다.",
   "Legislation › Table collects registered bills. For each bill choose whether it goes to parliament or the cabinet council, and click a bill to move on to voting. You can search and filter by tag."
  ],
  [
   "표결하기",
   "Voting"
  ],
  [
   "입법 › 표결에서 심의할 법안을 고른 뒤, 찬성 · 반대 · 기권을 골라 반원의 좌석을 누르거나 정당별로 한 번에 표를 던집니다. 원마다 \"표결 확정\"을 누르면 가결 · 부결이 정해지고, 양원제면 하원을 통과한 뒤 상원 표결로 넘어가요.",
   "In Legislation › Vote, pick the bill under consideration, choose yea · nay · abstain and click seats on the hemicycle, or cast votes for a whole party at once. Pressing \"Confirm vote\" for each chamber decides pass or fail; in a bicameral system a bill passed by the lower house moves on to the upper house."
  ],
  [
   "입법 › 표결 기록에는 가결 · 부결 · 거부된 법안이 남습니다. 상태 · 태그로 걸러 보고, 가결된 법안에서 개정안을 낼 수 있어요.",
   "Legislation › Vote Records keeps passed, rejected and vetoed bills. Filter by status or tag, and propose an amendment from a passed bill."
  ],
  [
   "지지율 입력 · 개표 · 의회에 반영",
   "Enter support · count · apply to parliament"
  ],
  [
   "의회에 반영하기",
   "Apply to parliament"
  ],
  [
   "개표만으로는 의회가 바뀌지 않습니다. 개표가 끝나면 \"✔ 의회에 반영\"을 눌러 결과대로 의석을 바꿔보세요. (마음에 안 들면 \"재개표\"로 다시 셀 수 있어요)",
   "Counting alone doesn't change parliament. When the count finishes, press \"✔ Apply to Parliament\" to change the seats to match the result. (If you don't like it, \"Recount\" counts again)"
  ],
  [
   "새 의회가 구성됐어요! 의석 화면의 반원이 선거 결과대로 바뀌었습니다.",
   "A new parliament is formed! The hemicycle now matches the election result."
  ],
  [
   "내각 › 내각 구성원에서 장관 같은 국무위원을 추가합니다. \"[+] 국무위원 추가\"를 눌러보세요.",
   "Add cabinet members such as ministers in Cabinet › Cabinet Members. Press \"[+] Add Cabinet Member\"."
  ],
  [
   "저장과 메인 화면",
   "Saving and the main screen"
  ],
  [
   "저장 창 · 탭 닫기와 다시 열기 · 도움말 · 메인 화면",
   "Save panel · closing and reopening tabs · help · main screen"
  ],
  [
   "저장 창 열기",
   "Open the save panel"
  ],
  [
   "맨 위 탭 바 오른쪽 끝의 \"저장\" 버튼을 눌러보세요. 저장과 관련된 것이 모두 이 창에 모여 있어요.",
   "Press the \"Save\" button at the right end of the top tab bar. Everything about saving is gathered in this panel."
  ],
  [
   "저장 창이 열렸어요.",
   "The save panel is open."
  ],
  [
   "저장 창 둘러보기",
   "A look around the save panel"
  ],
  [
   "맨 위는 지금 세이브와 \"지금 저장\"(Ctrl+S와 같음), 그 아래는 자동저장과 저장 주기입니다. 세이브 목록에서 ★로 즐겨찾기 · 이름 바꾸기 · 삭제를 하고, \"다른 이름으로 저장\"으로 지금 상태를 새 세이브로 복사해요. 파일(.json)로 저장해 두면 다른 기기에서도 불러올 수 있습니다.",
   "At the top are the current save and \"Save now\" (same as Ctrl+S), then autosave and its interval. In the save list you can star favorites, rename and delete, and \"Save as\" copies the current state into a new save. Saving to a file (.json) lets you load it on another device."
  ],
  [
   "탭 닫기와 다시 열기",
   "Closing and reopening tabs"
  ],
  [
   "탭의 ×는 세이브를 지우지 않고 탭만 닫습니다. 탭을 모두 닫으면 아래 화면이 비어요. 닫은 탭은 + › \"닫은 탭 다시 열기\"로 다시 띄웁니다. 세이브를 정말 지우려면 저장 창의 세이브 목록이나 시작 화면의 🗑를 쓰세요.",
   "A tab's × closes only the tab without deleting the save. If you close every tab, the screen below goes blank. Bring closed tabs back with + › \"Reopen closed tab\". To really delete a save, use the save list in the save panel or 🗑 on the start screen."
  ],
  [
   "메뉴 맨 아래 회색 \"도움말\" 묶음에는 모든 탭이 무슨 일을 하는지 카드로 정리돼 있고, \"열기 →\"로 그 탭에 바로 갈 수 있어요. 헷갈릴 때 먼저 찾아보세요.",
   "The grey \"Help\" group at the bottom of the menu explains what every tab does as cards, and \"Open →\" takes you straight to that tab. Look there first when something is unclear."
  ],
  [
   "메인 화면",
   "Main screen"
  ],
  [
   "⌂를 누르면 저장한 뒤 메인 화면으로 갑니다. 메인 화면에서는 시작하기(세이브 고르기 · 프리셋 · 파일 불러오기), 맵 메이커, 로드맵, 설정(라이트 · 다크 · 네온 테마)을 고르고, 🌐로 언어를 바꿉니다. 이 튜토리얼은 시작하기 › 프리셋의 \"서독\"으로 언제든 다시 할 수 있어요.",
   "⌂ saves and takes you to the main screen. There you choose Start (pick a save · preset · load a file), Map Maker, Roadmap and Settings (light · dark · neon theme), and change the language with 🌐. You can replay this tutorial any time with the \"West Germany\" preset under Start."
  ],
  [
   "이념과 서브 이념",
   "Ideologies and sub-ideologies"
  ],
  [
   "이념 추가 · 하위 이념 · 좌석 순서",
   "Add ideologies · sub-ideologies · seat order"
  ],
  [
   "이념 목록",
   "Ideology list"
  ],
  [
   "의회 › 이념에서 정당이 속할 이념을 만듭니다. 위에서 아래 순서가 반원의 왼쪽 → 오른쪽 순서예요. 순서를 바꾸면 \"자동 정렬\"을 켠 정당들의 자리도 따라 바뀝니다.",
   "Create the ideologies parties belong to in Parliament › Ideology. Top-to-bottom order is the hemicycle's left-to-right order. Reordering also moves the seats of parties with \"auto sort\" on."
  ],
  [
   "이념 · 서브 이념 추가",
   "Adding ideologies and sub-ideologies"
  ],
  [
   "\"이념 추가\"로 새 이념을 만들고, 이념 옆의 하위 이념 버튼으로 서브 이념(예: 보수주의 › 온건 보수)을 만들 수 있어요. 정당의 이념 칸에서 서브 이념까지 골라 더 세밀하게 자리를 정합니다.",
   "\"Add Ideology\" creates a new ideology, and the sub-ideology button next to an ideology creates a sub-ideology (e.g. Conservatism › Moderate conservatism). Picking a sub-ideology in a party's ideology field places it more precisely."
  ],
  [
   "정당 자리 정렬",
   "Ordering party seats"
  ],
  [
   "정당 목록의 순서가 반원의 자리 순서입니다. 자동 정렬을 누르면 이념 순서대로 정당을 다시 줄 세워요. 직접 끌거나 순서 버튼으로 옮길 수도 있습니다.",
   "The order of the party list is the order of seats on the hemicycle. Auto sort lines parties up again in ideology order. You can also drag them or move them with the order buttons."
  ],
  [
   "정당 심화",
   "Parties in depth"
  ],
  [
   "복제 · 상태 · 파벌 · 합당 · 당수와 원내대표",
   "Duplicate · status · factions · merging · leaders and floor leaders"
  ],
  [
   "정당 카드",
   "Party card"
  ],
  [
   "정당 카드에서 이름 · 약칭 · 색 · 이념 · 로고를 정하고, 어느 원(하원 · 상원 · 삼원)에 속하는지 고릅니다. 상태를 \"활동 금지\"로 바꾸면 그 정당은 표결 · 선거에서 빠져요. 복제 버튼은 정당을 그대로 복사합니다.",
   "On a party card set the name, abbreviation, color, ideology and logo, and choose which chambers (lower · upper · third) it sits in. Setting the status to \"Banned\" removes the party from votes and elections. The duplicate button copies a party as is."
  ],
  [
   "파벌",
   "Factions"
  ],
  [
   "정당 안에 파벌(계파)을 만들 수 있어요. 파벌마다 이름 · 색 · 의석을 정하면 반원에서 한 정당 안의 파벌이 색으로 나뉘어 보이고, 표결 때 파벌별로 표를 던질 수 있습니다. 총선 결과를 반영할 때 파벌을 나눠서(선거 전 몫대로 · 지역 기반 파벌은 그 지역구 득표만큼) 반영할지, 정당 몫으로 합쳐서 반영할지도 고릅니다.",
   "You can create factions inside a party. Give each faction a name, color and seats, and the hemicycle shows the party split by faction color; in votes each faction can vote separately. You also choose whether factions are split when election results are applied (by pre-election shares, or by their districts' votes for a regional faction) or merged into the party."
  ],
  [
   "합당 창에서 여러 정당을 하나로 합칩니다. 흡수합당은 한 정당이 나머지를 흡수하고, 신설합당은 새 이름 · 이념의 정당을 만들어요. 합쳐지는 정당을 새 정당의 파벌로 남길 수도 있고, 정당의 파벌도 골라 합칠 수 있습니다.",
   "The merge dialog combines several parties into one. An absorbing merger has one party absorb the others, while a new merger creates a party with a new name and ideology. Merged parties can be kept as factions of the new party, and you can pick parties' factions to merge too."
  ],
  [
   "당수와 원내대표",
   "Leaders and floor leaders"
  ],
  [
   "정당 › 당수에서 정당 대표와 파벌 대표의 이름 · 사진을 정합니다. 원내대표도 따로 둘 수 있고, \"의석 선택 → 붙여넣기\"로 반원에서 고른 의원의 이름 · 사진을 그대로 가져올 수 있어요.",
   "Party › Leaders sets the name and photo of party and faction leaders. You can also have a floor leader, and \"Pick seat → paste\" copies the name and photo of a member chosen on the hemicycle."
  ],
  [
   "단원제 · 양원제 · 삼원제 · 의장단 · 반원 가운데 · 연립정부",
   "Unicameral · bicameral · tricameral · presiding officers · hemicycle center · coalition government"
  ],
  [
   "의회 › 의회 설정에서 단원제 · 양원제 · 삼원제를 고릅니다. 원이 늘어나면 의회 구성 · 표결 · 선거 · 시각 화면에 그 원이 함께 나타나요. 원 이름(예: 국회 · 원로원)은 의회 › 의회 구성에서 바꿉니다.",
   "Choose unicameral, bicameral or tricameral in Parliament › Parliament Settings. Added chambers appear across composition, voting, elections and the visual screen. Rename chambers (e.g. National Assembly · Senate) in Parliament › Parliament Composition."
  ],
  [
   "원마다 의장과 부의장의 이름 · 사진을 정합니다. 부의장은 여러 명 둘 수 있고, 의장단은 시각 화면의 원 현황 아래에 표시돼요.",
   "Set the names and photos of each chamber's speaker and deputy speakers. You can have several deputies, and presiding officers appear below the chamber overview on the visual screen."
  ],
  [
   "반원 가운데 표시",
   "Hemicycle center"
  ],
  [
   "반원 가운데에 총 의석 수를 보여줄지, 그 원의 로고 이미지를 보여줄지 원마다 고릅니다. 로고 칸을 눌러 이미지를 올린 뒤 \"로고\"를 고르세요.",
   "For each chamber, choose whether the center of the hemicycle shows the total seat count or the chamber's logo image. Click the logo box to upload an image, then choose \"Logo\"."
  ],
  [
   "의회 › 집권과 연정에서 정당들을 묶어 연립정부를 만듭니다. 집권 연정(★)과 대표당, 연정 밖에서 지지하는 각외협력 정당을 정하고, 단독 집권이나 무집권으로 둘 수도 있어요. 집권 세력은 반원에서 금색 테두리로 표시됩니다(의회 설정의 \"집권 세력 강조\").",
   "Parliament › Government & Coalitions groups parties into a coalition government. Set the ruling coalition (★), its lead party and parties giving external support, or leave a single-party government or no government. The governing bloc is outlined in gold on the hemicycle (\"Highlight government\" in Parliament Settings)."
  ],
  [
   "지역구 의원 · 비례대표",
   "District members · list members"
  ],
  [
   "의회 › 지역구 의원과 비례대표에서 의원 한 명 한 명의 이름 · 사진을 채웁니다. 지역구 의원을 궐석(빈자리)으로 처리하면 선거 › 총선에서 보궐선거로 그 자리만 다시 뽑을 수 있어요.",
   "Fill in each member's name and photo in Parliament › District Members and List Members. Mark a district member as vacant and you can hold a by-election for just that seat in Elections › General."
  ],
  [
   "지역구와 지도",
   "Districts and maps"
  ],
  [
   "맵 메이커 · 지도 올리기 · 지역구 편집 · 성향 · 권역",
   "Map Maker · uploading a map · editing districts · tendency · regions"
  ],
  [
   "맵 메이커로 지도 만들기",
   "Making a map with Map Maker"
  ],
  [
   "지역구는 실제 지도 모양으로 만듭니다. 메인 화면 › 맵 메이커에서 SVG 지도 파일을 열면 도형이 선 · 면 · 사각형 · 원으로 나뉘어 보이고, 지역구로 쓸 도형(보통 \"면\")을 골라 이름을 붙인 뒤 지역구 지도 파일(.jsx)로 내보냅니다. 미리보기는 스크롤로 확대 · 축소, 휠 클릭 드래그로 이동해요.",
   "Districts take the shape of a real map. Open an SVG map in Main screen › Map Maker, and its shapes are sorted into line · area · rectangle · circle; pick the shapes to use as districts (usually \"area\"), name them, and export a district map file (.jsx). Scroll to zoom the preview and middle-drag to pan."
  ],
  [
   "지역구 지도 올리기",
   "Uploading the district map"
  ],
  [
   "국가 › 지역에서 맵 메이커로 만든 .jsx 파일을 올립니다. 올리면 도형 하나하나가 지역구가 되고, 하원 · 상원 · 삼원이 같은 지도를 함께 씁니다. (새 지도를 올리면 기존 지역구 정보는 새 지도로 바뀌어요)",
   "Upload the .jsx file made with Map Maker in Nation › Districts. Each shape becomes a district, and the lower, upper and third chambers share the same map. (Uploading a new map replaces the existing district data)"
  ],
  [
   "지역구 편집",
   "Editing districts"
  ],
  [
   "여론 › 성향에서 지역구마다 정당별 성향(%)을 정합니다. 지역구 선거에서 누가 이길지가 여기서 갈려요. 시각 화면에는 종합 지도와 정당별 지도가 함께 보입니다.",
   "Polls › Tendency sets each party's tendency (%) in every district, which decides who wins district races. The visual screen shows an overall map and one map per party."
  ],
  [
   "권역형 비례대표를 쓸 때는 국가 › 권역에서 지역구를 권역으로 묶습니다. 권역을 고른 뒤 지도에서 지역구를 눌러(끌어서 여러 개) 칠해요. 권역 득표율은 성향을 평균하는 자동 집계나 직접 입력 중에서 고릅니다.",
   "When using regional list seats, group districts into regions in Nation › Regions. Pick a region and click districts on the map (drag for several) to paint them. Regional vote shares come either from averaging tendencies automatically or from your own input."
  ],
  [
   "지도 글씨 크기",
   "Map label size"
  ],
  [
   "국가 › 국가 설정에서 지도 위 약칭 글씨와 의석 배지의 크기를 한꺼번에 조절합니다.",
   "Nation › Nation Settings adjusts the size of district labels and seat badges on the map all at once."
  ],
  [
   "선거 심화",
   "Elections in depth"
  ],
  [
   "선거 방식 · 비례 배분 · 선택 개표 · 보궐선거 · 대선 · 선거 기록",
   "Election methods · list allocation · manual count · by-elections · presidential · election records"
  ],
  [
   "총선 방식",
   "General election method"
  ],
  [
   "선거 › 총선에서 뽑을 원과 방식을 고릅니다. 비례만 · 지역구만 · 둘 다(혼합)를 고를 수 있고, 지역구는 여론 › 성향, 비례는 여론 › 지지율을 바탕으로 정해져요.",
   "Choose the chambers and method in Elections › General — list only, districts only, or both (mixed). Districts are decided by Polls › Tendency and list seats by Polls › Support."
  ],
  [
   "자동 개표와 선택 개표",
   "Automatic and manual count"
  ],
  [
   "지역구 지도가 있는 선거는 개표 방식을 고릅니다(지도를 올리면 나타나요). 자동 개표는 지역구가 무작위 순서로 하나씩 열리고, 선택 개표는 결과 지도에서 지역구를 직접 눌러 하나씩 엽니다. 아래 막대로 개표 속도도 바꿀 수 있어요.",
   "Elections with a district map let you choose how to count (it appears once a map is uploaded). Automatic counting opens districts one by one in random order, while manual counting lets you open each district yourself by clicking it on the result map. The slider below changes the counting speed."
  ],
  [
   "보궐선거",
   "By-elections"
  ],
  [
   "\"보궐\"을 켜고 개표하면 궐석 처리된 지역구만 다시 뽑아 바로 반영합니다. 궐석은 의회 › 지역구 의원에서 처리해요.",
   "Turn on \"By-election\" and count to re-elect only the vacant districts and apply the result right away. Mark seats vacant in Parliament › District Members."
  ],
  [
   "비례 배분 방식",
   "List allocation method"
  ],
  [
   "여론 › 지지율에서 원마다 비례대표를 어떻게 나눌지 정합니다. 전국 단위(전국형)로 나눌지, 권역마다 나눌지(권역형)를 고르고, 지지율마다 오차 범위를 줄 수 있어요.",
   "Polls › Support sets how each chamber's list seats are allocated — nationwide or per region — and you can give each party's support a margin of error."
  ],
  [
   "선거 › 대선에서 대통령(총리직선제면 총리) 선거를 개표합니다. 방식(단순 다수 · 결선투표 · 선거인단)과 후보는 선거 › 방식에서 정해요.",
   "Elections › Presidential counts the presidential election (or the prime minister's, with direct PM elections). The method (plurality · runoff · electoral college) and candidates are set in Elections › Method."
  ],
  [
   "치른 선거는 선거 › 선거 기록에 남고, 누르면 그때의 결과 화면을 다시 볼 수 있어요.",
   "Past elections are kept in Elections › Election Records, and clicking one shows its result screen again."
  ],
  [
   "입법 심화",
   "Legislation in depth"
  ],
  [
   "가결 기준 · 태그 · 개정안 · 거부권 · 국무회의",
   "Passing threshold · tags · amendments · veto · cabinet council"
  ],
  [
   "법안마다 가결 기준을 정합니다. 과반 · 3/5 · 2/3 같은 정해진 기준이나 직접 분수를 넣을 수 있어요. 태그를 달아 두면 상정 · 기록에서 걸러 보기 쉽습니다.",
   "Each bill has a passing threshold — a preset one such as majority, 3/5 or 2/3, or your own fraction. Tags make bills easy to filter in tabling and records."
  ],
  [
   "거부권",
   "Veto"
  ],
  [
   "내각 › 내각 설정에서 법안 거부권을 누가 가질지(대통령 · 총리 · 내각 · 없음) 정합니다. 거부권이 있으면 입법 › 표결에서 통과된 법안을 거부할 수 있어요.",
   "Cabinet › Cabinet Settings decides who holds the bill veto (president · prime minister · cabinet · nobody). With a veto, passed bills can be vetoed in Legislation › Vote."
  ],
  [
   "상정에서 \"국무회의\"로 올린 법안은 내각 › 국무회의에서 국무위원들이 표결합니다. 의결 정족수를 정할 수 있고, 계엄령으로 의회가 정지된 동안에는 여기서 법안을 통과시켜요. 결과는 내각 › 국무회의 기록에 남습니다.",
   "Bills sent to the \"Cabinet council\" in tabling are voted on by cabinet members in Cabinet › Cabinet Council. You can set the quorum, and while martial law suspends parliament, bills pass here. Results are kept in Cabinet › Council Records."
  ],
  [
   "정부 형태와 권한",
   "Government and powers"
  ],
  [
   "정부 형태 · 직책 이름 · 비상 권한 · 의회 해산 · 불신임",
   "Form of government · titles · emergency powers · dissolution · no-confidence"
  ],
  [
   "대통령제 · 이원집정부제 · 의원내각제 · 입헌군주제 · 집단지도체제 중에서 고릅니다. 형태에 따라 대통령 · 총리 · 의장 탭이 나타나거나 숨고, 직책 이름(대통령 → 국왕 등)도 바꿀 수 있어요.",
   "Choose presidential, semi-presidential, parliamentary, constitutional monarchy or collective leadership. Depending on the form, the president, prime minister and chair tabs appear or hide, and titles can be renamed (President → King, etc.)."
  ],
  [
   "비상 권한과 의회 해산",
   "Emergency powers and dissolution"
  ],
  [
   "비상사태 · 의회 해산 · 계엄령 권한을 누가 가질지 정하고, 가진 사람의 탭에서 선포합니다. 해산은 의회 전체나 한 원만 할 수 있고, 해산된 원은 다음 총선을 의회에 반영할 때 풀려요. 계엄령으로 의회를 정지하면 법안은 국무회의에서만 통과됩니다.",
   "Decide who holds the state of emergency, dissolution and martial law powers, and declare them from that person's tab. Dissolution can cover all of parliament or one chamber, and a dissolved chamber is restored when the next general election is applied. Under martial law that suspends parliament, bills pass only in the cabinet council."
  ],
  [
   "총리와 불신임",
   "Prime minister and no-confidence"
  ],
  [
   "내각 › 총리에서 총리 선출 방식(다수당 대표 자동 · 총리직선제)을 고르고, 지금 총리를 고정하거나 부총리를 둡니다. 내각 불신임안을 발의할 수 있고, 건설적 불신임제(독일 · 이스라엘식)를 켜면 불신임안에 후임 총리를 함께 지명해요.",
   "In Cabinet › Prime Minister choose how the PM is selected (majority leader automatically · direct election), pin the current PM or add deputy PMs. You can move a motion of no confidence, and with constructive no-confidence (German · Israeli style) the motion must name a successor."
  ],
  [
   "내각 › 대통령에서 이름 · 사진 · 소속 정당을 정합니다. 반원의 의원에서 불러오면 그 의원 정보와 연결돼 함께 바뀌어요.",
   "Cabinet › President sets the name, photo and party. Loading a member from the hemicycle links them, so changes follow that member."
  ],
  [
   "날짜 넘기기 · 다음 회기 · 설정 창 · 자동 진행",
   "Advancing the date · next session · settings panel · automatic progression"
  ],
  [
   "날짜 넘기기",
   "Advancing the date"
  ],
  [
   "날짜 줄의 ▶는 하루, ▶▶는 일주일, ▶▶▶는 한 달을 넘깁니다. 월말 · 윤년도 달력대로 계산해요. 지금 한 번 눌러보세요.",
   "On the date line, ▶ advances a day, ▶▶ a week and ▶▶▶ a month, following the real calendar including month ends and leap years. Try pressing one now."
  ],
  [
   "날짜가 넘어갔어요.",
   "The date moved forward."
  ],
  [
   "\"다음: 정기회 / 다음: 임시회\" 버튼으로 다음 회기를 어떤 종류로 열지 고르고(지금 회기는 그대로), \"다음 회기\"를 누르면 회기 번호가 1 올라가면서 고른 종류가 적용됩니다.",
   "Use the \"Next: Regular / Next: Extraordinary\" button to choose what kind the next session will be (the current one stays as is), and \"Next session\" raises the session number and applies the chosen kind."
  ],
  [
   "날짜 · 회기 설정 창",
   "Date & session settings"
  ],
  [
   "\"자동 진행\"을 켜면 날짜를 넘기다 정기회 시작일(기본 9월 1일)을 지날 때 다음 회기가 정기회로 열리고, 하원 총선 결과를 의회에 반영하면 대수가 1 올라갑니다. 둘 다 켜고 끌 수 있어요.",
   "With \"Automatic progression\" on, passing the regular-session start date (Sep 1 by default) while advancing the date opens the next session as a regular session, and applying a lower-house general election raises the term by one. Both can be switched on or off."
  ],
  [
   "부정선거",
   "Election fraud"
  ],
  [
   "부정선거 시도와 발각",
   "Attempting fraud and getting caught"
  ],
  [
   "부정선거 (⚠)",
   "Election fraud (⚠)"
  ],
  [
   "선거 › ⚠에서 정당별로 다음 총선 개표 1회에 한해 부정선거를 시도할 수 있습니다. 성공하면 표가 그 정당 쪽으로 옮겨지지만, 발각되면 그 정당은 활동 금지 처분을 받아요.",
   "In Elections › ⚠ each party can attempt fraud once, for the next general election count. If it works, votes shift toward that party; if it's discovered, the party is banned."
  ],
  [
   "화면 다루기와 내보내기",
   "Working the screen and exporting"
  ],
  [
   "시각 탭 · 이미지 내보내기 · 사이드바 · 폭 조절 · 단축키",
   "Visual tabs · image export · sidebar · resizing · shortcuts"
  ],
  [
   "시각 탭",
   "Visual tabs"
  ],
  [
   "시각 화면 위의 탭으로 하원 · 상원 · 내각을 오가고, 여론의 지역구 · 성향 · 권역을 열거나 총선을 개표하면 그 지도와 선거결과 탭이 생깁니다(× 로 닫기). 원 화면 오른쪽 위의 \"반원 / 지역구\"로 지역구 지도 보기로 바꿀 수 있어요.",
   "The tabs above the visual screen switch between the lower house, upper house and cabinet; opening Polls' districts, tendency or regions, or counting a general election, adds those map and result tabs (close with ×). \"Hemicycle / Districts\" at the top right of a chamber switches to the district map view."
  ],
  [
   "이미지로 내보내기",
   "Exporting images"
  ],
  [
   "반원 · 지도 · 선거 결과 · 내각 화면에서 오른쪽 클릭(모바일은 길게 누르기) → \"내보내기...\"를 고르면 PNG · JPG · SVG 이미지로 저장합니다. 정당 통계와 국기 · 국가명 · 날짜 머리를 함께 넣을 수 있어요.",
   "On the hemicycle, maps, election results or cabinet, right-click (long-press on mobile) → \"Export...\" saves a PNG · JPG · SVG image. You can include party statistics and a header with the flag, nation name and date."
  ],
  [
   "사이드바와 폭 조절",
   "Sidebar and resizing"
  ],
  [
   "사이드바 머리의 접기 버튼으로 아이콘만 남겨 편집 화면을 넓게 쓸 수 있어요. 편집 패널과 시각 화면 사이 경계를 끌면 폭을 바꾸고, 더블클릭하면 원래 폭으로 돌아갑니다.",
   "The collapse button in the sidebar header leaves only icons so the editing area gets wider. Drag the border between the editing panel and the visual screen to resize, and double-click it to restore the default width."
  ],
  [
   "단축키",
   "Shortcuts"
  ],
  [
   "Enter(입력 칸 밖) — 다시 계산 · Ctrl+S — 바로 저장 · Ctrl+Z — 되돌리기 · Ctrl+Shift+Z — 다시 실행 · Esc — 열린 창 닫기. 튜토리얼에서는 ← · → 로 단계를 오가고 Esc로 그만둡니다.",
   "Enter (outside input fields) — recalculate · Ctrl+S — save now · Ctrl+Z — undo · Ctrl+Shift+Z — redo · Esc — close open panels. In the tutorial, ← · → move between steps and Esc stops."
  ],
  [
   "세부 튜토리얼까지 모두 마쳤습니다. 이제 이 나라를 마음대로 바꿔보거나, 시작 화면에서 새 세이브를 만들어 나만의 나라를 꾸려보세요. 궁금한 기능은 메뉴 맨 아래 \"도움말\"에서 찾을 수 있어요.",
   "You've finished the detailed tutorials too. Now reshape this country however you like, or create a new save from the start screen and build your own. Any feature you're curious about is explained under \"Help\" at the bottom of the menu."
  ],
  [
   "처음이라면 기본 튜토리얼을 순서대로, 그다음 필요한 세부 튜토리얼만 골라 하세요. 하나하나 몇 단계로 짧게 끝납니다.",
   "If you're new, take the basic tutorial in order, then pick only the detailed tutorials you need. Each one takes just a few steps."
  ],
  [
   "기본 튜토리얼",
   "Basic tutorial"
  ],
  [
   "처음 쓰는 분을 위한 핵심 흐름 — 순서대로 추천",
   "The core flow for newcomers — best in order"
  ],
  [
   "세부 튜토리얼",
   "Detailed tutorials"
  ],
  [
   "기능별 자세한 설명 — 필요한 것만 골라서",
   "Feature by feature — pick what you need"
  ],
  [
   "하원 · 상원 · 삼원",
   "Lower · Upper · Third"
  ],
  [
   "날짜 줄의 ⚙로 여는 창. 연호(선택) · 연 · 월 · 일, 회기의 대수 · 이름 · 회기 번호 · 지금 회기 종류, 그리고 자동 진행(정기회 시작일이 지나면 정기회로 · 하원 총선 반영 시 대수 +1).",
   "Opened with ⚙ on the date line. Era name (optional) · year · month · day; the session's term · name · number · current type; and automatic progression (regular session after its start date · term +1 when a lower-house election is applied)."
  ],
  [
   "탭 바 오른쪽 끝 \"저장\" 버튼으로 여는 창. 지금 저장(Ctrl+S), 자동저장과 주기, 세이브 목록(즐겨찾기 · 이름 바꾸기 · 삭제), 다른 이름으로 저장, 파일(.json)로 저장 · 불러오기, 자동저장 초기화.",
   "Opened with the \"Save\" button at the right end of the tab bar. Save now (Ctrl+S), autosave and interval, the save list (favorites · rename · delete), save as, save to / load from file (.json), and resetting autosave."
  ],
  [
   "의회 선거 — 비례 · 지역구 · 혼합 방식, 자동 · 선택 개표, 궐석 지역구만 다시 뽑는 보궐선거, 개표 속도. 개표가 끝나면 \"✔ 의회에 반영\"을 눌러야 의석이 바뀝니다.",
   "Parliamentary elections — list · district · mixed methods, automatic or manual counting, by-elections that re-elect only vacant districts, and counting speed. When the count finishes, press \"✔ Apply to Parliament\" to change the seats."
  ],
  [
   "기본 자동저장 — 어느 세이브에도 속하지 않은 작업을 담아 두어 기존 데이터가 사라지지 않게 합니다.",
   "The default autosave — holds work that doesn't belong to any save so existing data isn't lost."
  ],
  [
   "탭 이름을 더블클릭 (또는 저장 창의 ✎).",
   "Double-click the tab name (or ✎ in the save panel)."
  ],
  [
   "탭만 닫기 — 세이브는 지워지지 않아요. 탭을 모두 닫으면 아래 화면이 빕니다. 세이브 삭제는 저장 창의 세이브 목록이나 시작 화면의 🗑에서.",
   "Closes only the tab — the save isn't deleted. Closing every tab leaves the screen below blank. Delete saves from the save list in the save panel or 🗑 on the start screen."
  ],
  [
   "닫은 탭 다시 열기",
   "Reopen closed tab"
  ],
  [
   "×로 닫아 둔 세이브를 다시 탭으로 띄웁니다.",
   "Brings a save you closed with × back as a tab."
  ],
  [
   "저장 버튼",
   "Save button"
  ],
  [
   "탭 바 오른쪽 끝. 저장 창(지금 저장 · 자동저장 · 세이브 목록 · 다른 이름으로 저장 · 파일)을 엽니다. 국가 › 저장에 있던 것이 모두 여기로 옮겨졌어요.",
   "At the right end of the tab bar. Opens the save panel (save now · autosave · save list · save as · file). Everything that used to be in Nation › Save has moved here."
  ],
  [
   "열려 있는 확인 · 안내 · 내보내기 · 저장 · 날짜 창 닫기.",
   "Close open confirmation · notice · export · save · date panels."
  ],
  [
   "테마 · 언어 · 튜토리얼",
   "Theme · language · tutorial"
  ],
  [
   "⌂로 메인 화면에 가면 설정(라이트 · 다크 · 네온 테마)과 🌐 언어(언어 팩 불러오기 포함)를 바꿀 수 있어요. 튜토리얼은 시작하기 › 프리셋의 \"서독\"으로 언제든 다시 할 수 있고, 기본 튜토리얼(핵심 흐름)과 세부 튜토리얼(기능별)로 나뉘어 있습니다.",
   "From the main screen (⌂) you can change Settings (light · dark · neon theme) and the 🌐 language (including loading language packs). Replay the tutorial any time with the \"West Germany\" preset under Start; it's split into the basic tutorial (core flow) and detailed tutorials (by feature)."
  ],
  [
   "시각 화면 맨 위 줄의 현재 날짜와 회기. ▶ · ▶▶ · ▶▶▶로 하루 · 일주일 · 한 달씩 넘기고, \"다음: 정기회 / 임시회\"로 다음 회기 종류를 골라(지금 회기는 그대로) \"다음 회기\"로 넘깁니다. ⚙로 날짜 · 회기 설정 창을 엽니다.",
   "The current date and session on the top line of the visual screen. ▶ · ▶▶ · ▶▶▶ advance a day, a week or a month; choose the next session's type with \"Next: Regular / Extraordinary\" (the current session stays as is) and move on with \"Next session\". ⚙ opens the date & session settings."
  ],
  [
   "연호 (선택 — 비워 두면 연도만 표시)",
   "Era name (optional — leave blank to show just the year)"
  ],
  [
   "대수와 회기 번호를 정해 둬야 동작합니다.",
   "Works once a term and session number are set."
  ],
  [
   "예: 레이와 → 레이와 1년 4월 20일",
   "e.g. Reiwa → Reiwa 1, April 20"
  ],
  [
   "- 튜토리얼 중 앱의 알림 · 확인창이 막히거나 Enter가 튜토리얼로 새던 문제 수정, 마친 과정 기록을 과정 이름(id)으로 (예전 기록은 그대로 옮김)",
   "- Fixed app dialogs being blocked during the tutorial and Enter leaking into the tutorial; completed lessons are now recorded by id (old records carried over)"
  ],
  [
   "해상도",
   "Resolution"
  ],
  [
   "1.5.8 - 후보 단일화",
   "1.5.8 - Candidate Unification"
  ],
  [
   "- 후보 단일화 추가",
   "- Candidate unification added"
  ],
  [
   "1.5.9 - 지선",
   "1.5.9 - Local Elections"
  ],
  [
   "1.6: 텀블벅 펀딩",
   "1.6: Tumblbug Funding"
  ],
  [
   "1.6.0 - 텀블벅 펀딩 출시",
   "1.6.0 - Tumblbug Funding Launch"
  ],
  [
   "- 텀블벅 펀딩 출시",
   "- Tumblbug crowdfunding launch"
  ],
  [
   "- Steam 개발자 계정을 위한 펀딩",
   "- Funding for a Steam developer account"
  ],
  [
   "1.7: 나무위키식 의회 틀",
   "1.7: Namuwiki-style Parliament Templates"
  ],
  [
   "1.7.0 - 나무위키식 의회 틀",
   "1.7.0 - Namuwiki-style Parliament Templates"
  ],
  [
   "- 나무위키식 의회 틀 추가",
   "- Namuwiki-style parliament templates added"
  ],
  [
   "1.8: 데모 출시",
   "1.8: Demo Release"
  ],
  [
   "1.8.0 - Stove/Steam 데모 출시",
   "1.8.0 - Stove/Steam Demo Release"
  ],
  [
   "- Stove · Steam 데모 출시",
   "- Stove · Steam demo release"
  ],
  [
   "1.9: 얼리 액세스",
   "1.9: Early Access"
  ],
  [
   "1.9.0 - Steam 얼리 액세스 출시",
   "1.9.0 - Steam Early Access Launch"
  ],
  [
   "- Steam 얼리 액세스 출시",
   "- Steam Early Access launch"
  ],
  [
   "- 무소속 로직 리워크",
   "- Independents logic rework"
  ],
  [
   "- 의석 번호 추가",
   "- Seat numbers"
  ],
  [
   "- 로드맵 · 메인 화면 리워크",
   "- Roadmap · main screen rework"
  ],
  [
   "- 저장 v10",
   "- Save v10"
  ],
  [
   "- 지역구 이름 설정",
   "- District names"
  ],
  [
   "- 슬라이딩 순서 변경",
   "- Drag-to-reorder"
  ],
  [
   "- 정당 · 연정 카드 접기",
   "- Collapsible party · coalition cards"
  ],
  [
   "- 법안 제출 · 상정 분리",
   "- Bill submission and tabling split"
  ],
  [
   "- 입법 · 선거 기록 리워크",
   "- Legislation · election records rework"
  ],
  [
   "- 법안 버전 표기",
   "- Bill versions"
  ],
  [
   "- 저장 v12",
   "- Save v12"
  ],
  [
   "- 정당 해산 · 금지 표기",
   "- Party dissolution · ban labels"
  ],
  [
   "- 선거 > 지지율 탭",
   "- Elections > Polling tab"
  ],
  [
   "- 점검 안내 시작 화면",
   "- Maintenance start screen"
  ],
  [
   "- 저장 v13",
   "- Save v13"
  ],
  [
   "- 국가명 · 국기 설정",
   "- Country name · flag"
  ],
  [
   "- 원외정당 시스템",
   "- Extra-parliamentary parties"
  ],
  [
   "- 날짜 · 회기 설정",
   "- Date · session settings"
  ],
  [
   "- 탭 디자인 정리",
   "- Tab design cleanup"
  ],
  [
   "- 실행 취소 · 다시 실행",
   "- Undo · redo"
  ],
  [
   "- 저장 버전 v1.0",
   "- Save version v1.0"
  ],
  [
   "- 데스크톱 · 모바일 UI 모드",
   "- Desktop · mobile UI modes"
  ],
  [
   "- 비례대표 개별 명단",
   "- Individual list-seat rosters"
  ],
  [
   "- 의원 검색 · 필터",
   "- Member search · filters"
  ],
  [
   "- 반원 중앙 로고",
   "- Logo in the hemicycle centre"
  ],
  [
   "- 지도 지역구 시스템",
   "- Map district system"
  ],
  [
   "- 지역구 안 의석 나눠 갖기",
   "- Seats shared within a district"
  ],
  [
   "- 경합 빗금 · 득표율 색 농도",
   "- Tie hatching · vote-share shading"
  ],
  [
   "- 테마 색 설정",
   "- Theme colour"
  ],
  [
   "- 이미지 내보내기 (PNG · JPG · SVG)",
   "- Image export (PNG · JPG · SVG)"
  ],
  [
   "- 통계 · 머리글 포함 옵션",
   "- Stats · header options"
  ],
  [
   "- 무소속 활동 금지 상태",
   "- Banned status for independents"
  ],
  [
   "- 내각 탭 신설",
   "- New Cabinet tab"
  ],
  [
   "- 거부권 · 비상 권한",
   "- Veto · emergency powers"
  ],
  [
   "- 대선 · 총리 선출 · 불신임",
   "- Presidential election · PM election · no-confidence"
  ],
  [
   "- 집단지도체제",
   "- Collective leadership"
  ],
  [
   "- 부정선거 탭 정식 공개",
   "- Election fraud tab unlocked"
  ],
  [
   "- 날짜 · 회기 표시 정리",
   "- Date · session display cleanup"
  ],
  [
   "- 세이브 슬롯 · 세이브 탭 바",
   "- Save slots · save tab bar"
  ],
  [
   "- 자동저장 주기 설정",
   "- Autosave interval"
  ],
  [
   "- 정당 복제 · 단축키",
   "- Party duplication · shortcuts"
  ],
  [
   "- 라이트 · 다크 · 네온 테마",
   "- Light · dark · neon themes"
  ],
  [
   "- 사이드바 · 모바일 UI 개편",
   "- Sidebar · mobile UI overhaul"
  ],
  [
   "- 튜토리얼 · 도움말",
   "- Tutorial · help"
  ],
  [
   "- 합당 · 건설적 불신임제",
   "- Party mergers · constructive no-confidence"
  ],
  [
   "- Hemicycle 이름 확정 · 메인 화면 개편",
   "- Named Hemicycle · main screen redesign"
  ],
  [
   "- 입법 · 선거 메뉴 신설",
   "- New Legislation · Elections menus"
  ],
  [
   "- 날짜 · 회기 줄 · 연호",
   "- Date · session bar · era names"
  ],
  [
   "- 튜토리얼 확장 · 맵 메이커 개편",
   "- Expanded tutorial · Map Maker redesign"
  ],
  [
   "모든 원에 같은 비율",
   "Same ratio for every chamber"
  ],
  [
   "집권 정당 강조 색",
   "Ruling party highlight colour"
  ],
  [
   "기본값",
   "Default"
  ],
  [
   "네온 테마",
   "Neon theme"
  ],
  [
   "소식",
   "News"
  ],
  [
   "Hemicycle 공식 유튜브",
   "Hemicycle on YouTube"
  ],
  [
   "@Hemicycles · 업데이트 소식과 공지",
   "@Hemicycles · updates and announcements"
  ],
  [
   "- 로드맵 0.0.1 · 0.0.2의 \"일반 테마\" · \"네온 테마\"를 누르면 그 시절 화면(old.html · old2.html)으로",
   "- Roadmap 0.0.1 · 0.0.2: \"General theme\" and \"Neon theme\" link to those old screens (old.html · old2.html)"
  ],
  [
   "- logo.html(로고 제작 화면) — 의회 메뉴만 남기고, 집권 정당 강조 색을 HEX 코드로 바꾸고 네온 빛번짐을 켜고 끌 수 있음 · 본 게임 세이브와 따로 저장",
   "- logo.html (logo maker) — only the Parliament menu, with a HEX colour for the ruling-party highlight and a neon glow toggle · saved separately from the main game"
  ],
  [
   "- old2.html(개편 전 화면)은 라이트/다크 설정과 상관없이 항상 네온으로",
   "- old2.html (the pre-redesign screen) always uses the neon theme, whatever light/dark setting is chosen"
  ],
  [
   "- 화면 최상단에 크롬 탭 스타일의 세이브 탭 바 신설 — 클릭 한 번으로 확인창 없이 세이브 사이를 즉시 전환, \"+\"로 새 세이브를 새로 만들거나 미리 등록해둔 프리셋에서 시작 가능 (프리셋으로 시나리오 배포·공유)",
   "- Added a Chrome-style save tab bar at the very top — switch between saves instantly with one click, no confirmation, and use \"+\" to create a new save or start from a registered preset (distribute/share scenarios as presets)"
  ],
  [
   "- 무소속 시스템 리워크",
   "- Independents system rework"
  ],
  [
   "지금은 공개 베타 테스트 기간이에요 — 기능과 세이브 형식이 바뀔 수 있어요",
   "This is an open beta test — features and the save format may change"
  ],
  [
   "- 나무위키식 의회 틀 — 의석 배치 · 정당별 의석 · 집권 세력을 한눈에 보여주는 틀",
   "- Namuwiki-style parliament box — seat layout, seats per party and the ruling bloc at a glance"
  ],
  [
   "1.7: 텀블벅 펀딩",
   "1.7: Tumblbug Funding"
  ],
  [
   "1.7.0 - 텀블벅 펀딩 출시",
   "1.7.0 - Tumblbug Funding Launch"
  ],
  [
   "1.6.4 - 대담하라! \"De l'audace!\"",
   "1.6.4 - Be bold! \"De l'audace!\""
  ],
  [
   "- 법령정보센터식 법전 — 가결된 법안을 조문 형태로 모아 보는 입법 기록",
   "- Statute book in the style of a national law portal — passed bills collected as articles"
  ],
  [
   "- 숨겨진 정부 형태: 절대군주제 — 왕이 총리 임명 · 거부권 · 비상 권한을 가짐",
   "- Hidden government form: absolute monarchy — the monarch appoints the PM and holds the veto and emergency powers"
  ],
  [
   "- 친위 쿠데타(입헌군주제 → 절대군주제) · 공화 혁명(군주제 폐지)",
   "- Self-coup (constitutional → absolute monarchy) · republican revolution (abolishing the monarchy)"
  ],
  [
   "- 왕정복고",
   "- Restoration"
  ],
  [
   "- 숨겨진 정부 형태: 절대군주제",
   "- Hidden government form: absolute monarchy"
  ],
  [
   "- 왕위 주장자 · 계승 분쟁",
   "- Claimants · succession disputes"
  ],
  [
   "- 친위 쿠데타 · 공화 혁명",
   "- Self-coup · republican revolution"
  ],
  [
   "- 쿠데타 (군부 · 정당 · 친위)",
   "- Coups (military · party · self-coup)"
  ],
  [
   "- 성공 · 실패 결과",
   "- Success and failure outcomes"
  ],
  [
   "- 민정 이양 · 역쿠데타",
   "- Return to civilian rule · counter-coups"
  ],
  [
   "- 혁명 (주도 이념별 결과)",
   "- Revolutions (outcome depends on ideology)"
  ],
  [
   "- 숨겨진 정부 형태: 당-국가 체제",
   "- Hidden government form: party-state"
  ],
  [
   "- 민주 혁명 · 새 헌법",
   "- Democratic revolution · new constitution"
  ],
  [
   "- 국호 · 국기 교체",
   "- New country name and flag"
  ],
  [
   "- 선거인단 시스템",
   "- Electoral college system"
  ],
  [
   "- 계엄 중 봉쇄 돌파",
   "- Breaking the martial-law blockade"
  ],
  [
   "- 물리적 의사 방해 (의장석 점거)",
   "- Physical obstruction (occupying the Speaker's chair)"
  ],
  [
   "- 지지율 페널티 · 국회선진화법",
   "- Support penalties · anti-brawl law"
  ],
  [
   "네온 테마",
   "Neon theme"
  ],
  [
   "파일 (.hemi)",
   "File (.hemi)"
  ],
  [
   "저장 파일(.hemi) 불러오기",
   "Load save file (.hemi)"
  ],
  [
   "- 메인 화면 \"프로토콜 실행\" 버튼을 누르면 새 세이브를 만들거나 기존 세이브(자동저장 포함)를 골라 이어할 수 있는 온보딩 창 신설, 저장 파일(.hemi) 업로드로 바로 이어하기도 가능",
   "- Pressing \"Execute Protocol\" on the main screen now opens an onboarding window to create a new save or continue an existing one (including autosaves), or continue straight from an uploaded save file (.hemi)"
  ],
  [
   "자동저장 주기, 이름 붙여 저장 · 불러오기, 파일(.hemi)로 저장 · 불러오기, 초기화.",
   "Autosave interval, named saves and loading, saving/loading files (.hemi), and reset."
  ],
  [
   "맨 위는 지금 세이브와 \"지금 저장\"(Ctrl+S와 같음), 그 아래는 자동저장과 저장 주기입니다. 세이브 목록에서 ★로 즐겨찾기 · 이름 바꾸기 · 삭제를 하고, \"다른 이름으로 저장\"으로 지금 상태를 새 세이브로 복사해요. 파일(.hemi)로 저장해 두면 다른 기기에서도 불러올 수 있습니다.",
   "At the top are the current save and \"Save now\" (same as Ctrl+S), then autosave and its interval. In the save list you can star favorites, rename and delete, and \"Save as\" copies the current state into a new save. Saving to a file (.hemi) lets you load it on another device."
  ],
  [
   "탭 바 오른쪽 끝 \"저장\" 버튼으로 여는 창. 지금 저장(Ctrl+S), 자동저장과 주기, 세이브 목록(즐겨찾기 · 이름 바꾸기 · 삭제), 다른 이름으로 저장, 파일(.hemi)로 저장 · 불러오기, 자동저장 초기화.",
   "Opened with the \"Save\" button at the right end of the tab bar. Save now (Ctrl+S), autosave and interval, the save list (favorites · rename · delete), save as, save to / load from file (.hemi), and resetting autosave."
  ],
  [
   "당선 정당 직접 지정",
   "Assign winners manually"
  ],
  [
   "— 선거 없이 이 지역구 의석을 정합니다 (선거를 돌리면 선거 결과로 바뀜)",
   "— set this district's seats without an election (running an election replaces them)"
  ],
  [
   "— 비어 있음 —",
   "— empty —"
  ],
  [
   "지도에 의석 수 숫자 박스 표시",
   "Show seat-count boxes on the map"
  ],
  [
   "번역 템플릿 받기 (KO · 한국어 기준)",
   "Translation template (KO · Korean-based)"
  ],
  [
   "번역 템플릿 받기 (EN · 영어 기준)",
   "Translation template (EN · English-based)"
  ],
  [
   "제작자: sushdjr0106 · 의석 수 일부 수정",
   "By sushdjr0106 · some seat counts adjusted"
  ],
  [
   "일본국",
   "Japan"
  ],
  [
   "준비 중",
   "Coming soon"
  ],
  [
   "제작자: sushdjr0106",
   "By sushdjr0106"
  ],
  [
   "미합중국",
   "United States of America"
  ],
  [
   "제작자: ttorri",
   "By ttorri"
  ],
  [
   "▌ 권역 선거구 의석",
   "▌ Regional constituency seats"
  ],
  [
   "권역 하나를 여러 명을 뽑는 선거구로 씁니다 (예: 일본 참의원의 도도부현 선거구). 의석 수와 정당별 당선 의석을 직접 정하면 정당 의석에 바로 반영되고, 선거를 돌려도 비례 의석과 겹치지 않게 따로 유지됩니다.",
   "Use a region as one multi-member constituency (e.g. the prefectural districts of Japan's House of Councillors). Set its seats and each party's winners directly; they count toward party seats right away and are kept separate from list seats when an election runs."
  ],
  [
   "- 조문식 입법 기록",
   "- Article-style legislative record"
  ],
  [
   "- 헌법 · 개정안",
   "- Constitution · amendments"
  ],
  [
   "- 법안 조항 · 상임위원회",
   "- Bill articles · standing committees"
  ],
  [
   "WINDOW / 창 표시",
   "WINDOW"
  ],
  [
   "테두리 없는 전체 화면",
   "Borderless fullscreen"
  ],
  [
   "창 모드",
   "Windowed"
  ],
  [
   "전체 화면",
   "Fullscreen"
  ],
  [
   "F11 키로 전체 화면과 창 모드를 오갈 수 있습니다",
   "Press F11 to switch between fullscreen and windowed"
  ],
  [
   "전체 화면은 다른 화면으로 옮기면 창 모드로 돌아갑니다",
   "Fullscreen returns to windowed when you move to another screen"
  ],
  [
   "이 원의 지역구 지도",
   "This chamber's district map"
  ],
  [
   "하원 지도 공유",
   "Share the House map"
  ],
  [
   "따로 쓰기",
   "Separate map"
  ],
  [
   "기본은 하원 지도를 상원·삼원이 함께 쓰며, 원을 골라 ",
   "By default the Senate and Third chamber share the House map; pick a chamber and press "
  ],
  [
   "를 누르면 그 원만의 지도를 올릴 수 있습니다. 지역구를 클릭하면 원별 의석 수와 정당별 성향(%)을 지정할 수 있습니다.",
   " to upload a map just for it. Click a district to set its seats per chamber and party leanings (%)."
  ],
  [
   "후보 단일화",
   "Candidate unification"
  ],
  [
   "— 여러 정당이 후보를 한 명으로 합쳐 출마합니다. 지지가 가장 높은 정당이 후보를 내고 참여 정당의 지지를 합쳐 받습니다 (비례 투표는 따로)",
   "— Several parties field one joint candidate. The member with the highest support runs and receives the combined support of all members (list votes stay separate)"
  ],
  [
   "+ 단일화 추가",
   "+ Add unification"
  ],
  [
   "단일화한 정당이 없습니다",
   "No parties have unified"
  ],
  [
   "단일화 이름 (비우면 정당 이름을 이어 붙임)",
   "Unification name (blank joins the party names)"
  ],
  [
   "단일화 해제",
   "Dissolve unification"
  ],
  [
   "다른 단일화에서 옮겨 옵니다",
   "Moves it from another unification"
  ],
  [
   "대선 · 총리 선거",
   "Presidential · PM elections"
  ],
  [
   "총선 지역구",
   "General election districts"
  ],
  [
   "두 정당 이상 골라야 단일화가 적용됩니다",
   "Pick two or more parties for the unification to apply"
  ],
  [
   "원별 지역구 분리",
   "Per-chamber district maps"
  ],
  [
   "- 앱 · 설치 파일 · 브라우저 탭 아이콘에 Hemicycle 로고",
   "- Hemicycle logo as the app, installer and browser tab icon"
  ],
  [
   "창작마당",
   "Workshop"
  ],
  [
   "모드 폴더",
   "Mods folder"
  ],
  [
   "모드 폴더 열기",
   "Open mods folder"
  ],
  [
   "MOD THEMES / 모드 테마",
   "MOD THEMES"
  ],
  [
   "\"+ 단일화 추가\"를 눌러 보세요.",
   "Press \"+ Add unification\"."
  ],
  [
   "\"대선 · 총리 선거\"를 켜면 기준 원 지지율이 가장 높은 정당이 단일 후보로 나서고, 결과에 \"(A당 · B당 단일 후보)\"로 표시돼요. \"총선 지역구\"를 켜면 지역구마다 성향이 가장 높은 참여 정당이 후보를 냅니다. 필요 없어지면 \"단일화 해제\"를 누르세요.",
   "With \"Presidential · PM elections\" on, the member with the highest support in the base chamber runs as the joint candidate, shown in results as \"(Party A · Party B joint candidate)\". With \"General election districts\" on, the member with the strongest leaning runs in each district. Press \"Dissolve unification\" when you no longer need it."
  ],
  [
   "권역 의석 지정",
   "Region seats"
  ],
  [
   "권역 자체에 의석을 줄 수도 있어요(예: 여러 지역구를 묶어 한꺼번에 뽑는 선거구). 권역마다 의석 수와 정당별 당선 수를 정하면, 그 의석은 비례 의석에서 빠지고 선거를 돌려도 그대로 남습니다.",
   "Regions can hold seats of their own (e.g. a constituency that elects several members across grouped districts). Set each region's seats and winners per party — those seats come out of the list seats and stay put when you run an election."
  ],
  [
   "다시 보고 싶은 과정을 골라 언제든 복습할 수 있어요.",
   "Pick any lesson to go over it again."
  ],
  [
   "단일화 만들기",
   "Create a unification"
  ],
  [
   "단일화가 적용됐어요.",
   "The unification is in effect."
  ],
  [
   "단일화에 참여할 정당을 두 개 이상 체크해 보세요. 한 정당은 단일화 하나에만 들어갈 수 있고, 이름은 비워 두면 정당 이름을 이어 붙여 써요.",
   "Tick two or more parties to join. A party can only be in one unification, and if you leave the name blank the party names are joined together."
  ],
  [
   "대상 의원실을 고르고, 비례 득표율을 몇 %p 부풀릴지 정합니다. 지역구 개표 조작에서 고른 지역구는 실제 결과와 상관없이 이 정당이 이겨요(지역구 지도가 있을 때). 발각 확률은 조작 규모에 따라 자동으로 계산되고, \"수동\"을 켜면 직접 정할 수 있습니다.",
   "Pick the target chamber and how many points to inflate the list vote by. Districts chosen under district rigging go to this party no matter the real result (when there is a district map). The chance of being caught is worked out from the scale of the fraud, or set it yourself with \"Manual\"."
  ],
  [
   "들키면 어떻게 될까",
   "What if they get caught"
  ],
  [
   "맵 메이커 · 지도 올리기 · 원별 지도 · 지역구 편집 · 당선 정당 지정 · 성향 · 권역",
   "Map maker · upload a map · per-chamber maps · edit districts · set winners · leanings · regions"
  ],
  [
   "모든 과정을 마쳤어요",
   "You've finished every lesson"
  ],
  [
   "무엇을 조작할까",
   "What to rig"
  ],
  [
   "부정선거 계획이 세워졌어요.",
   "The fraud plan is set."
  ],
  [
   "빈 단일화가 생겼어요.",
   "An empty unification was created."
  ],
  [
   "선거 › ⚠에서는 정당별로 부정선거를 꾸밀 수 있습니다. 시도는 다음 총선 개표 한 번에만 적용되고, 들키면 큰 대가를 치러요.",
   "Under Elections › ⚠ each party can plot election fraud. An attempt only applies to the next general election count, and getting caught costs dearly."
  ],
  [
   "선거 전에 여러 정당이 후보를 한 명으로 합치는 기능입니다. 참여 정당 중 지지가 가장 높은 정당이 후보를 내고, 나머지 정당의 지지를 모두 합쳐 받아요. 비례대표 투표는 단일화와 상관없이 각 정당이 따로 받습니다.",
   "Before an election, several parties can merge behind one candidate. The member with the highest support fields the candidate and receives the combined support of the others. List votes are still counted for each party separately."
  ],
  [
   "선거를 돌리지 않고 지역구 결과를 정할 수도 있어요. 지역구 편집 칸의 \"당선 정당 직접 지정\"에서 의석마다 정당을 고르면, 정당 의석 수 · 지역구 의원 · 지도 색이 함께 바뀝니다. 나중에 선거를 돌리면 선거 결과로 덮어써져요.",
   "You can also set a district's result without running an election. Pick a party for each seat under \"Set winners manually\" in the district editor, and party seat counts, district members and map colours all follow. Running an election later overwrites it."
  ],
  [
   "시도 켜기 · 부풀리기와 지역구 조작 · 발각 확률 · 결과",
   "Turn on an attempt · inflation and district rigging · chance of being caught · outcome"
  ],
  [
   "시도 켜기",
   "Turn on an attempt"
  ],
  [
   "아무 정당이나 \"⚠ 부정선거 시도\"를 체크해 보세요. 설정 칸이 열립니다.",
   "Tick \"⚠ Attempt election fraud\" for any party. Its settings will open."
  ],
  [
   "어디에 적용할까",
   "Where it applies"
  ],
  [
   "여러 석을 뽑는 지역구를 여러 정당이 나눠 가지면, 지도 위에 정당별 의석 수 숫자 박스가 뜹니다(한 정당이 다 가져가면 색만 칠해요). 국가 › 국가 설정에서 박스를 켜고 끌 수 있어요.",
   "When several parties split a multi-member district, the map shows number boxes with each party's seats (if one party takes them all, only the colour is shown). Turn the boxes on or off in Nation › Nation settings."
  ],
  [
   "여러 정당이 후보 한 명으로 · 대선과 지역구에 따로 적용",
   "Several parties, one candidate · applies to presidential and district races separately"
  ],
  [
   "국가 › 지역에서 맵 메이커로 만든 .jsx 파일을 올립니다. 올리면 도형 하나하나가 지역구가 되고, 기본으로는 하원 · 상원 · 삼원이 같은 지도를 함께 씁니다. (새 지도를 올리면 기존 지역구 정보는 새 지도로 바뀌어요)",
   "Upload the .jsx file made in the map maker under Nation › Districts. Each shape becomes a district, and by default the House, Senate and Third chamber share the same map. (Uploading a new map replaces the existing district data.)"
  ],
  [
   "원마다 다른 지도",
   "A different map per chamber"
  ],
  [
   "원이 둘 이상이면 위쪽에서 원을 고를 수 있습니다. 상원 · 삼원을 고르면 \"하원 지도 공유 / 따로 쓰기\"가 나와요. 따로 쓰기를 누르면 지금 지도를 복사해 그대로 이어 쓰고(의석 · 당선자 · 성향 유지), 그 원만의 지도를 새로 올릴 수 있습니다. 다시 공유로 돌리면 하원 지도에 있는 지역구의 값만 되돌아와요.",
   "With more than one chamber you can pick a chamber at the top. For the Senate or Third chamber, \"Share the House map / Separate map\" appears. Separate map copies the current map so everything carries on (seats, winners, leanings), and then you can upload a map just for that chamber. Switching back to shared restores values only for districts on the House map."
  ],
  [
   "의석 숫자 박스",
   "Seat number boxes"
  ],
  [
   "이어서 배워볼까요?",
   "Ready to pick up where you left off?"
  ],
  [
   "참여 정당 고르기",
   "Choose the parties"
  ],
  [
   "처음이라면 기본 튜토리얼을 순서대로 하고, 그다음 필요한 세부 튜토리얼만 골라 하세요. 과정마다 몇 단계로 짧게 끝납니다.",
   "New here? Do the basic lessons in order, then pick only the detailed lessons you need. Each lesson is just a few steps."
  ],
  [
   "들킬지는 개표 도중에 드러납니다. 들키지 않으면 조작이 결과에 그대로 반영되고, 들키면 개표 중간(무작위 시점)에 개표가 멈추며 그 정당은 활동 금지 처분을 받고(알림이 뜹니다) 조작 표를 무효로 해 처음부터 다시 개표해요. 어느 쪽이든 시도는 개표 한 번으로 사라집니다. 그만두려면 체크를 풀면 돼요.",
   "Whether it's caught comes out during the count. If not caught, the rigging goes straight into the result; if caught, counting stops at a random point, the party is banned (you'll get a notice) and the rigged votes are voided and counted again from the start. Either way the attempt is used up after one count. Untick it to call it off."
  ],
  [
   "후보 단일화란?",
   "What is candidate unification?"
  ],
  [
   "이어서 하기",
   "Continue"
  ],
  [
   "지선",
   "Local"
  ],
  [
   "국민투표",
   "Referendum"
  ],
  [
   "지선 결과",
   "Local results"
  ],
  [
   "국민투표 결과",
   "Referendum results"
  ],
  [
   "뽑는 자리",
   "Office"
  ],
  [
   "선거 단위",
   "Unit"
  ],
  [
   "권역마다 1명",
   "One per region"
  ],
  [
   "지역구마다 1명",
   "One per district"
  ],
  [
   "지도 · 인구 기준 원",
   "Map · population chamber"
  ],
  [
   "투표율 (%)",
   "Turnout (%)"
  ],
  [
   "투표율 기준 (%)",
   "Turnout threshold (%)"
  ],
  [
   "득표율은 지역구 성향(없으면 전국 지지율)에 노이즈를 더해 정하고, 득표수는 인구 × 투표율로 계산합니다.",
   "Vote shares come from district leanings (or national support if none) plus noise, and vote counts are population × turnout."
  ],
  [
   "안건 (질문)",
   "Question"
  ],
  [
   "정당별 입장",
   "Party positions"
  ],
  [
   "— 지지층이 입장대로 찬반을 나눕니다 (찬성 85% · 중립 50% · 반대 15%가 찬성)",
   "— each party's voters split as their party says (Yes 85% · Neutral 50% · No 15% vote yes)"
  ],
  [
   "중립",
   "Neutral"
  ],
  [
   "가결",
   "Passed"
  ],
  [
   "부결",
   "Rejected"
  ],
  [
   "부결 (투표율 미달)",
   "Rejected (turnout too low)"
  ],
  [
   "당선",
   "Won"
  ],
  [
   "득표",
   "Votes"
  ],
  [
   "득표율",
   "Vote share"
  ],
  [
   "투표율 기준을 켜면 투표율이 그보다 낮을 때 찬성이 많아도 부결됩니다.",
   "With a turnout threshold, the question fails below it even if Yes wins."
  ],
  [
   "예: 제1회 전국동시지방선거",
   "e.g. 1st Nationwide Local Elections"
  ],
  [
   "예: 도지사 · 시장",
   "e.g. Governor · Mayor"
  ],
  [
   "예: 헌법 개정안에 찬성하십니까?",
   "e.g. Do you approve the constitutional amendment?"
  ],
  [
   "기록 삭제",
   "Delete record"
  ],
  [
   "이 기록을 삭제할까요?",
   "Delete this record?"
  ],
  [
   "정당이 없습니다.",
   "No parties."
  ],
  [
   "지방선거",
   "Local elections"
  ],
  [
   "당선자 없음",
   "no winner"
  ],
  [
   "단체장",
   "local heads"
  ],
  [
   "지역구가 없습니다 — 국가 › 지역에서 지도를 올려 주세요.",
   "No districts — upload a map under Nation › Districts."
  ],
  [
   "지방선거를 치를 지역이 없습니다.\n국가 › 지역에서 지도를 올리고 지역구를 만든 뒤(권역 단위면 국가 › 권역에서 권역도) 다시 시도하세요.",
   "There's nowhere to hold local elections.\nUpload a map and create districts under Nation › Districts (and regions under Nation › Regions for regional units), then try again."
  ],
  [
   "국민투표에 부칠 안건(질문)을 적어 주세요.",
   "Enter the question to put to the referendum."
  ],
  ["권역별 득표율", "Vote share by region"],
  ["지역구별 · 권역별 결과", "Results by district · region"],
  ["대통령 선거", "Presidential election"],
  ["조건에 맞는 기록이 없습니다", "No records match"],
  ["투표율 미달 · 부결", "Rejected · turnout below quorum"],
  ["나라의 기본 틀 — 상징 · 지역(지역구) · 권역을 정합니다.", "The basic framework of the nation — symbols, districts and regions."],
  ["지역구를 만들고 원별 의석 수 · 인구를 정합니다. 맵 메이커에서 만든 지도(.jsx)를 올리면 실제 지도 모양의 지역구를 쓸 수 있어요. (1.5.9까지는 여론 › 지역구)", "Create districts and set each chamber's seats and population. Upload a map made in the map maker (.jsx) to use real map-shaped districts. (Opinion › Districts up to 1.5.9)"],
  ["지역구를 권역으로 묶습니다 — 권역형 비례대표 · 지방선거 권역 단체장의 단위. 권역 득표율은 지역구 성향을 평균하는 자동 집계나 직접 입력 중에서 고릅니다. (1.5.9까지는 여론 › 권역)", "Group districts into regions — the unit for regional list seats and regional heads in local elections. Regional vote shares come either from averaging district tendencies automatically or from direct input. (Opinion › Regions up to 1.5.9)"],
  ["선거 결과를 좌우하는 성향 · 지지율을 정합니다 (지역구 · 권역은 국가 묶음). 여기서 정한 값으로 선거 탭에서 개표해요.", "Set the tendencies and support rates that decide elections (districts and regions are under Nation). The Elections tab counts votes from these values."],
  ["봉쇄조항", "Electoral threshold"],
  ["지도에 지역구 이름 표시", "Show district names on maps"],
  ["서브 이념 없음", "No sub-ideology"],
  ["서브 이념 — 비워 두면 이념 그대로", "Sub-ideology — leave empty to use the ideology"],
  ["파벌 약자 표기 (예: CSU)", "Faction abbreviation (e.g. CSU)"],
  ["파벌 복제", "Duplicate faction"],
  ["약칭", "Abbr."],
  ["당색", "Party color"],
  ["흰색", "White"],
  ["투명", "Transparent"],
  ["바탕", "Background"],
  ["로고 바탕 — 위키 틀 · 의석 카드 등에서 로고 뒤에 깔리는 색", "Logo background — the color behind the logo in the wiki box, seat cards and elsewhere"],
  ["원내 구성", "Composition"],
  ["원외정당", "Extra-parliamentary parties"],
  ["원내 구성 틀 보기", "Show the composition box"],
  ["원외정당 틀 보기", "Show the extra-parliamentary box"],
  ["당색 바탕", "Party color"],
  ["흰 바탕", "White"],
  ["로고 바탕 — 위키 틀 등에서 로고 뒤에 깔리는 색", "Logo background — the color behind the logo in the wiki box and elsewhere"],
  ["총선에서", "In elections"],
  ["파벌 나눠서", "Split factions"],
  ["합쳐서", "Merged"],
  ["개표 결과를 의회에 반영하면 새 의석을 선거 전 파벌 몫대로 나눕니다. 지역 기반 파벌은 그 지역구들에서 정당이 얻는 표만큼 가져가요.", "When election results are applied, the new seats are divided by the factions' pre-election shares. A regional faction takes the share of the party's votes won in its districts."],
  ["개표 결과를 의회에 반영하면 파벌 의석이 정당 몫으로 합쳐집니다 (파벌은 남고 의석은 0 — 다시 배분해야 해요).", "When election results are applied, faction seats are merged into the party (factions stay, with 0 seats — reassign them afterwards)."],
  ["지역 기반", "Regional base"],
  ["— 없음 (선거 전 몫대로)", "— none (pre-election shares)"],
  ["(\"파벌 나눠서\" 정당은 새 의석을 파벌 몫대로 나눴습니다.)", "(Parties set to \"Split factions\" had their new seats divided among their factions.)"],
  ["Give me liberty, or give me death! : 테니스 코트의 맹세", "Give me liberty, or give me death! : The Tennis Court Oath"],
  ["Give me liberty, or give me death! : 인간은 자유롭게 태어났다", "Give me liberty, or give me death! : Man is born free"],
  ["로고는 의회 › 정당 › 로고에서 바꿉니다 (눌러서 열기)", "Change logos in Parliament › Parties › Logo (click to open)"],
  ["클릭하여 당 로고 업로드", "Click to upload a party logo"],
  ["클릭하여 파벌 로고 업로드", "Click to upload a faction logo"],
  ["✕ 로고 제거", "✕ Remove logo"],
  ["로고 칸을 눌러 이미지를 올리세요 (정사각형 권장)", "Click the logo box to upload an image (square works best)"],
  ["▌ 파벌 로고", "▌ Faction logos"],
  ["[정당 없음]", "[No parties]"],
  ["정당 · 파벌 로고를 올리고 지웁니다 (정사각형 권장). 의회 구성 카드의 로고는 보기만 하고, 누르면 여기로 와요. 통계 카드에 로고를 쓸지는 정보 탭의 \"통계 표시\"에서 고릅니다.", "Upload and remove party and faction logos (square works best). Logos on the Composition cards are display-only and bring you here when clicked. Whether stats cards show the logo is set under \"Stats display\" on the Info tab."],
  ["직책", "Title"],
  ["기본 직책입니다. 권역 · 지역구마다 직책을 따로 정하려면(예: 서울 특별시장 · 경기 도지사 · 구청장 · 군수) 아래 현직 단체장 목록의 직책 칸에 적으세요.", "These are the default titles. To give a region or district its own title (e.g. Mayor of Seoul, Governor of Gyeonggi, district mayor, county head), type it in the Title box in the incumbent list below."],
  ["Hemicycle — 세이브 파일 변환", "Hemicycle — Save file converter"],
  ["세이브 파일 변환 (.hemi ↔ .json)", "Save file converter (.hemi ↔ .json)"],
  [".hemi는 세이브 내용(JSON)을 압축한 파일이고, .json은 압축하지 않은 예전 형식입니다. 둘은 내용이 같아서 서로 바꿔도 그대로 불러올 수 있어요. 휴대폰에서 .hemi 파일이 열리지 않으면 여기서 .json으로 바꿔 보세요.", ".hemi is the save data (JSON) compressed; .json is the older uncompressed format. Their content is the same, so either one loads after converting. If a .hemi file won't open on your phone, convert it to .json here."],
  ["세이브 파일 고르기", "Choose a save file"],
  [".hemi 또는 .json 파일을 누르거나 여기로 끌어다 놓으세요", "Tap to choose a .hemi or .json file, or drop it here"],
  [".json을 사람이 읽기 좋게 줄 바꿈 (파일이 커져요)", "Pretty-print the .json (makes the file larger)"],
  ["⬇ .json으로 받기", "⬇ Download as .json"],
  ["⬇ .hemi로 받기", "⬇ Download as .hemi"],
  ["바꾼 파일 쓰기", "Using the converted file"],
  ["— 메인 화면 › 시작하기 › \"저장 파일(.hemi) 불러오기\", 또는 게임 안의 저장 › 파일 › 불러오기에서 .hemi · .json 어느 쪽이든 열 수 있습니다.", "— open either .hemi or .json from Main › Start › \"Load save file (.hemi)\", or from Save › File › Load in the game."],
  ["파일은 이 기기 안에서만", "Files are converted only on this device"],
  ["바뀝니다 — 어디에도 올리지 않아요.", "— nothing is uploaded anywhere."],
  ["읽는 중…", "Reading…"],
  ["파일", "File"],
  ["형식", "Format"],
  [".hemi (압축)", ".hemi (compressed)"],
  ["JSON (압축 안 함)", "JSON (uncompressed)"],
  ["풀었을 때", "Uncompressed"],
  ["세이브", "Save"],
  ["오류", "Error"],
  ["이 브라우저는 압축된 .hemi를 풀 수 없습니다 (최신 브라우저로 열어 주세요)", "This browser can't decompress .hemi files (please use an up-to-date browser)"],
  ["세이브 파일이 아니거나 손상된 파일입니다", "Not a save file, or the file is damaged"],
  ["JSON이지만 Hemicycle 세이브 형식이 아닙니다 — 바꿀 수는 있지만 게임에서 열리지 않을 수 있어요", "This is JSON but not a Hemicycle save — it can be converted but may not open in the game"],
  ["이 브라우저는 압축 기능이 없어 .hemi를 만들 수 없습니다", "This browser has no compression support, so it can't create .hemi files"],
  ["🔄 .hemi ↔ .json 변환 (휴대폰에서 .hemi가 안 열릴 때)", "🔄 Convert .hemi ↔ .json (when .hemi won't open on a phone)"],
  ["🔄 .hemi ↔ .json 변환", "🔄 Convert .hemi ↔ .json"],
  ["파일이 너무 커서 여기서 열 수 없습니다. 시작한 뒤 저장 › 파일 › 불러오기로 열어 보세요.", "This file is too large to open here. Start the game and open it from Save › File › Load."],
  ["지역구 성향을 하나도 정하지 않은(모두 0인) 지역구는 이 권역 성향으로 총선 지역구 · 지방선거 · 국민투표를 치릅니다. 지도에서 지역구를 누르면 그 권역으로 바뀌어요.", "Districts with no tendency of their own (all 0) use this region's tendency in district elections, local elections and referendums. Clicking a district on the map switches to its region."],
  ["모두 이 권역 성향을 씁니다", "all use this region's tendency"],
  ["권역별", "By region"],
  ["지역구별", "By district"],
  [
   "권역마다",
   "Per region"
  ],
  [
   "지역구마다",
   "Per district"
  ],
  [
   "예: 지사",
   "e.g. Governor"
  ],
  [
   "예: 시장",
   "e.g. Mayor"
  ],
  [
   "권역 단체장 · 지역구 단체장 중 하나 이상을 골라 주세요.",
   "Pick at least one: regional heads or district heads."
  ],
  [
   "권역이 없습니다 — 국가 › 권역에서 권역을 만들고 지역구를 배정하세요.",
   "No regions — create regions and assign districts under Nation › Regions."
  ],
  [
   "✔ 현직 단체장에 반영됨",
   "✔ Applied to current officeholders"
  ],
  [
   "✔ 당선자를 현직 단체장으로 반영",
   "✔ Make the winners the current officeholders"
  ],
  [
   "🏛 단체장 현황 보기",
   "🏛 View officeholders"
  ],
  [
   "권역 없음",
   "No region"
  ],
  [
   "공석",
   "Vacant"
  ],
  [
   "— 공석 —",
   "— Vacant —"
  ],
  [
   "이름 미입력",
   "Name not set"
  ],
  [
   "지방자치",
   "Local government"
  ],
  [
   "지방자치 현황",
   "Local government overview"
  ],
  [
   "사진",
   "Photo"
  ],
  [
   "테마 템플릿",
   "Theme template"
  ],
  [
   "THEME TEMPLATE / 테마 템플릿",
   "THEME TEMPLATE"
  ],
  [
   "테마 템플릿 받기 (.json)",
   "Download theme template (.json)"
  ],
  [
   "지금 테마의 색이 채워진 테마 파일을 받습니다. id · name과 색을 바꾼 뒤 데스크톱 앱의 모드 폴더에 폴더째 넣으면 \"모드 테마\"에 나타납니다.",
   "Downloads a theme file filled with the current theme's colours. Change the id, name and colours, then put it in its own folder inside the desktop app's mods folder and it shows up under \"Mod themes\"."
  ],
  [
   "영토 통일",
   "Territorial unification"
  ],
  [
   "미수복 지역",
   "Unrecovered territory"
  ],
  [
   "— 실제로 다스리지 못하는 지역구 (선거 · 의석에서 빠짐)",
   "— a district the country doesn't actually control (left out of elections and seats)"
  ],
  [
   "지역구를 눌러 편집 칸에서 \"미수복 지역\"을 체크하세요",
   "Click a district and tick \"Unrecovered territory\" in its editor"
  ],
  ["선택한 도형 합치기", "Merge selected shapes"],
  ["고른 도형들을 지역구 하나로 합칩니다", "Merge the selected shapes into one district"],
  ["떨어진 땅 여러 곳이 도형 하나로 묶여 있으면 목록의 ✂로 나누고, 같은 지역구는 골라서 합치세요", "If separate pieces of land are bundled into one shape, split them with ✂ in the list; select shapes of the same district to merge them"],
  ["합칠 도형을 두 개 이상 고르세요.", "Select two or more shapes to merge."],
  ["면(path · polygon)끼리만 합칠 수 있습니다.", "Only area shapes (path · polygon) can be merged."],
  ["좌표 변환(transform)이 서로 다른 도형은 합칠 수 없습니다.", "Shapes with different transforms cannot be merged."],
  ["먼저 SVG를 여세요.", "Open an SVG first."],
  [": 성향 미지정", ": no tendency set"],
  [" (이 원에 의석 없음)", " (no seats in this chamber)"],
  [" (경합): ", " (tied): "],
  ["내각 (오른쪽 내각 탭 · 제목에 뜨는 이름)", "Cabinet (name shown on the cabinet tab and its title, e.g. Bundeskabinett)"],
  ["이전 자동저장", "Previous autosave"],
  ["열려 있는 세이브 없음", "No save open"],
  ["열려 있는 세이브가 없습니다. 위 탭 바의 \"+\"로 새로 만들거나 아래 목록에서 여세요.", "No save is open. Create one with \"+\" in the tab bar above, or open one from the list below."],
  ["● 저장하지 않은 변경사항 있음", "● Unsaved changes"],
  ["저장 공간이 가득 차 저장하지 못함", "Storage full — not saved"],
  ["저장하지 않은 변경사항을 버리고 마지막 저장 상태로", "Discard unsaved changes and go back to the last save"],
  ["저장하지 않은 변경사항을 버리고 마지막으로 저장한 상태로 되돌릴까요?", "Discard unsaved changes and go back to the last saved state?"],
  ["저장하지 않은 변경사항이 있습니다.", "You have unsaved changes."],
  ["지금 세이브에 저장하고 옮길까요?", "Save them to this save and switch?"],
  ["저장하고 탭을 닫을까요?", "Save and close the tab?"],
  ["저장하고 메인 화면으로 갈까요?", "Save and go to the main screen?"],
  ["안 쓰는 세이브를 지우거나, \"종합 프리셋 내보내기\"로 파일에 따로 보관한 뒤 지워 주세요.", "Delete saves you no longer use, or keep them with \"Export full preset\" and then delete them."],
  ["불러온 세이브", "Imported save"],
  ["지금 시점을 따로 남겨 두고 싶을 때 쓰세요.", "Use it when you want to keep this moment separately."],
  ["탭 바 오른쪽 끝 \"저장\" 버튼으로 여는 창. 지금 저장(Ctrl+S), 자동저장과 주기, 세이브 목록(즐겨찾기 · 이름 바꾸기 · 삭제), 다른 이름으로 저장(사본), 파일(.hemi)로 저장 · 불러오기(새 탭으로 열림). 자동저장을 끄면 저장하지 않은 변경사항을 ↺로 되돌릴 수 있어요.", "Opened with the \"Save\" button at the right end of the tab bar. Save now (Ctrl+S), autosave and interval, the save list (favorites · rename · delete), save as (a copy), save to / load from file (.hemi — loading opens a new tab). With autosave off, ↺ discards unsaved changes."],
  ["탭 하나하나가 세이브(나라 하나)입니다. 누르면 그 세이브로 바로 바뀌고, 진행 상황은 그 세이브에 그대로 자동저장돼요. 프리셋으로 시작하면 프리셋 제목으로 탭이 생깁니다.", "Each tab is a save (one nation). Click to switch to it instantly; progress is autosaved straight into that save. Starting from a preset opens a tab named after the preset."],
  ["탭 이름 옆의 점 — 아직 저장하지 않은 변경사항이 있다는 뜻. 자동저장이 켜져 있으면 곧 저장되고, 꺼져 있으면 탭을 옮기거나 닫을 때 저장할지 물어요.", "The dot next to a tab name means there are unsaved changes. With autosave on they are saved shortly; with it off, you're asked whether to save when switching or closing tabs."],
  ["맨 위의 탭 하나하나가 세이브(나라 하나)입니다. 누르면 그 나라로 바로 바뀌고, 진행 상황은 그 세이브에 그대로 자동저장돼요. 이름 옆에 ●가 보이면 아직 저장하지 않은 변경사항이 있다는 뜻이에요. +는 새 탭(새로 만들기 · 프리셋 · 닫은 탭 다시 열기), 탭 이름을 더블클릭하면 이름 바꾸기, ×는 탭만 닫기(세이브는 남아요)입니다. 맨 왼쪽 ⌂는 저장하고 메인 화면으로 돌아갑니다.", "Each tab at the top is a save (one country). Click one to switch to it instantly; progress is autosaved straight into that save. A ● next to the name means there are unsaved changes. + opens a new tab (new · preset · reopen closed tab), double-click a tab name to rename it, and × only closes the tab (the save stays). ⌂ on the far left saves and returns to the main screen."],
  ["의석 번호 통일", "Unified seat numbers"],
  ["서독 프리셋", "West Germany preset"],
  ["- 여론 › 지역구를 국가 › 지역으로 옮기고, 국가 › 미수복 탭 신설", "- Opinion › Districts moves to Nation › Districts, plus a new Nation › Unrecovered tab"],
  ["경제 시스템", "Economy system"],
  ["종속국 의회", "Dependency parliaments"],
  ["종속국", "Dependencies"],
  ["1.6.1 - 인간은 자유롭게 태어났다 \"L'homme est né libre.\"", "1.6.1 - Man is born free \"L'homme est né libre.\""],
  ["국가 › 사람 탭", "Nation › People tab"],
  ["무소속 포함하기", "Include independents"],
  ["켜면 무당파 표의 일부가 무소속에게도 갑니다 (무소속 지지율이 0이어도). 끄면 무당파 표는 정당에만 나눠집니다.", "When on, part of the undecided vote also goes to independents (even at 0% support). When off, undecided votes go to parties only."],
  ["끄면 무소속이 모든 원에서 빠집니다 (선거 · 지지율 · 의석에 나오지 않음). 다시 켜면 원래대로 돌아옵니다.", "When off, independents are removed from every chamber (no elections, polling or seats). Turn it back on to restore them."],
  ["무소속 \"사용\"", "Independents \"On\""],
  ["끄면 무소속이 모든 원에서 빠집니다 (선거 · 지지율 · 의석에 나오지 않음). 다시 켜면 끄기 전대로 돌아와요. 무소속 의석이 남아 있으면 먼저 0으로 만들어야 끌 수 있습니다.", "When off, independents are removed from every chamber (no elections, polling or seats); turning it back on restores the previous state. If independents still hold seats, set them to 0 first."],
  ["개표 때마다 무당파 표를 정당에 나눠 비례대표 의석 배분에 더합니다.\nS = max(0, 무당파 지지율 ± 오차),  r = 0~1 난수 (선거마다)\n① 무작위 몫 S·r — 정당마다 난수 u(0~1) → 정당 i의 몫 = S·r · uᵢ / Σu  (지지율과 무관)\n② 지지율 몫 S·(1−r) — 정당 지지율 wᵢ(오차 반영) × 친화도 aᵢ(0.5~1.5 난수) → 몫 = S·(1−r) · wᵢaᵢ / Σwa\n최종 가중치 = wᵢ + ①몫 + ②몫 → 이 비율로 비례 의석을 배분. 활동 금지 정당은 받지 않고, 지역구 결과는 성향(%)으로 따로 정해져요.", "Each count splits the undecided vote among parties and adds it to the list-seat allocation.\nS = max(0, undecided share ± margin),  r = random 0–1 (per election)\n① Random share S·r — a random u (0–1) per party → party i gets S·r · uᵢ / Σu  (independent of support)\n② Support share S·(1−r) — party support wᵢ (with margin) × affinity aᵢ (random 0.5–1.5) → share = S·(1−r) · wᵢaᵢ / Σwa\nFinal weight = wᵢ + ① + ② → list seats are allocated in this ratio. Banned parties get nothing, and district results are decided separately by tendency (%)."],
  ["무당파 칸 바로 아래. 켜면 무소속도 무당파 표를 받습니다 — ①은 지지율과 무관해서 무소속 지지율이 0이어도 의석을 얻을 수 있어요. 끄면(기본) 무소속은 ① · ② 모두에서 빠집니다.", "Right below the undecided row. When on, independents also receive undecided votes — ① ignores support, so independents can win seats even at 0%. When off (default), independents are left out of both ① and ②."],
  ["위원회", "Committees"],
  ["법령", "Statutes"],
  ["본회의", "Floor"],
  ["법률안", "Bill"],
  ["헌법 개정안", "Constitutional amendment"],
  ["조문", "Articles"],
  ["— 제1조 · 제2조처럼 조 단위로 씁니다 (비워 둬도 돼요)", "— written article by article (Article 1, Article 2 …; can be left empty)"],
  ["조 제목 (선택, 예: 목적)", "Article title (optional, e.g. Purpose)"],
  ["조문 내용", "Article text"],
  ["+ 조 추가", "+ Add article"],
  ["이 조 삭제", "Delete this article"],
  ["상임위원회는 법안을 본회의에 올리기 전에 먼저 심사합니다. 위원은 그 원의 정당 의석 비율대로 배정되고, 위원 과반이 찬성하면 본회의로, 부결되면 폐기돼요.", "Standing committees review bills before they reach the floor. Members are allotted by each party's share of seats in that chamber; a bill goes to the floor if a majority of members vote yes, and dies if rejected."],
  ["아직 상임위원회가 없습니다. 위원회를 만들면 법안을 본회의 전에 소관 위원회에서 먼저 심사해요.", "No standing committees yet. Once you create them, bills are reviewed by the responsible committee before reaching the floor."],
  ["+ 위원회 추가", "+ Add committee"],
  ["위원회 삭제", "Delete committee"],
  ["새 위원회", "New Committee"],
  ["헌법", "Constitution"],
  ["아직 헌법이 없습니다.", "There is no constitution yet."],
  ["헌법 제정하기", "Enact a constitution"],
  ["헌법 제정", "Enact constitution"],
  ["헌법 직접 편집", "Edit constitution directly"],
  ["법률", "Laws"],
  ["법률 검색...", "Search laws..."],
  ["아직 가결된 법률이 없습니다. 의회에서 가결된 법률안이 조문 그대로 여기에 모여요.", "No laws have passed yet. Bills passed by the legislature are collected here, article by article."],
  ["조문이 없습니다.", "No articles."],
  ["예: 경제, 예산", "e.g. Economy, Budget"],
  ["없음 (바로 본회의)", "None (straight to the floor)"],
  ["위원 수", "Members"],
  ["위원장", "Chair"],
  ["소관 태그", "Jurisdiction tags"],
  ["소관 위원회:", "Committee:"],
  ["위원회 심사로 →", "To committee review →"],
  ["위원회 심사 중", "In committee"],
  ["(위원회 심사 중)", "(in committee)"],
  ["심사 중인 법안이 없습니다. 입법 › 상정에서 법안의 소관 위원회를 고르세요.", "No bills under review. Choose a bill's committee in Legislation › Floor."],
  ["그 원에 의석을 가진 정당이 없어 위원을 배정할 수 없습니다.", "No party holds seats in that chamber, so no members can be allotted."],
  ["이름 (예: 대한민국헌법)", "Name (e.g. Constitution of the Republic)"],
  ["전문 (선택)", "Preamble (optional)"],
  ["[✔] 저장", "[✔] Save"],
  ["직접 편집은 표결 없이 바로 바뀝니다 (처음 헌법을 만들 때 · 고칠 때). 표결을 거치려면 \"개정안 발의\"를 쓰세요.", "Direct edits take effect immediately without a vote (for drafting or fixing the constitution). To go through a vote, use \"Propose amendment\"."],
  ["제정", "Enacted"],
  ["✎ 직접 편집", "✎ Edit directly"],
  ["개정 이력 없음", "No amendments yet"],
  ["개정안 발의", "Propose amendment"],
  ["📝 개정안 발의", "📝 Propose amendment"],
  ["📜 헌법 보기", "📜 View constitution"],
  ["기본 위원회", "Default committees"],
  ["법제사법위원회", "Legislation and Judiciary Committee"],
  ["기획재정위원회", "Strategy and Finance Committee"],
  ["외교통일위원회", "Foreign Affairs and Unification Committee"],
  ["국방위원회", "National Defense Committee"],
  ["행정안전위원회", "Public Administration and Security Committee"],
  ["교육위원회", "Education Committee"],
  ["보건복지위원회", "Health and Welfare Committee"],
  ["환경노동위원회", "Environment and Labor Committee"],
  ["국가 재건을 위해 필요한 모든 조치를 취할 수 있다.\n집행부는 의회의 동의 없이 긴급 법령을 발동할 수 있다.", "All measures necessary for national reconstruction may be taken.\nThe executive may issue emergency decrees without the consent of the legislature."],
  ["⬆ 지도 열기", "⬆ Open map"],
  ["파일 이름", "File name"],
  ["그림 자동 추적", "Raster auto-trace"],
  ["색 허용 오차", "Color tolerance"],
  ["최소 크기", "Min size"],
  ["바탕 빼기", "Drop background"],
  ["픽셀 지도", "Pixel map"],
  ["같은 색은 떨어져도 한 지역", "Same color = one region even if apart"],
  ["다시 추적", "Trace again"],
  ["연 지도가 여기 표시됩니다", "The opened map shows here"],
  ["그림에서 지역을 찾는 중…", "Finding regions in the image…"],
  ["국가 순위", "Country ranking"],
  ["진영", "Blocs"],
  ["미수복", "Unrecovered"],
  ["왕실", "Royal house"],
  ["공성전", "Siege"],
  ["세력 변화", "Power shifts"],
  ["위키 틀", "Wiki box"],
  ["군부", "Military"],
  ["쿠데타", "Coup"],
  ["혁명", "Revolution"],
  ["경제", "Economy"],
  ["세계", "World"],
  ["사람", "People"],
  ["국가 › 사람 — 인물 · 자리 배정 · 지역구 후보", "Nation › People — people · post assignment · district candidates"],
  ["쿠데타 · 군정 · 군부 설정 (+1.6.1)", "Coup · military rule · military settings (+1.6.1)"],
  ["혁명 · 당-국가 체제 · 선거인단 (+1.6.1 · 1.6.2)", "Revolution · party-state · electoral college (+1.6.1 · 1.6.2)"],
  ["국회공성전 — 봉쇄 돌파 · 의장석 점거 (+1.6.1 ~ 1.6.3)", "Parliament siege — breaking the blockade · occupying the podium (+1.6.1 ~ 1.6.3)"],
  ["세력 변화 타임라인 · 위키 틀 · 냉전 국가 순위 (+1.6.1 ~ 1.6.4)", "Party strength timeline · wiki infobox · Cold War nation ranking (+1.6.1 ~ 1.6.4)"],
  ["왕정복고 · 전제군주정 · 왕위 계승 · 친위 쿠데타 · 공화 혁명 (+1.6.1 ~ 1.6.5)", "Restoration · absolute monarchy · succession · self-coup · republican revolution (+1.6.1 ~ 1.6.5)"],
  ["미수복 지역 · 영토 통일 (+1.6.1 ~ 1.6.6)", "Unrecovered territories · reunification (+1.6.1 ~ 1.6.6)"],
  ["- 데스크톱 앱 세이브 폴더 — 세이브를 앱 안이 아니라 정한 폴더(기본 문서\\Hemicycle\\Saves)에 세이브마다 .hemi 파일로 저장, 설정 › 기타 설정 › 저장 위치에서 폴더 열기 · 위치 바꾸기(세이브를 새 폴더로 옮김). 탐색기에서 넣은 .hemi는 세이브로 보이고, 지운 세이브는 휴지통으로", "- Desktop save folder — saves are stored as one .hemi file each in a folder you choose (default Documents\\Hemicycle\\Saves) instead of inside the app; Settings › Other › Save folder can open the folder or change it (saves move to the new folder). .hemi files dropped in show up as saves, and deleted saves go to the Recycle Bin"],
  ["업데이트 확인", "Check for updates"],
  ["지금 다시 시작해 설치", "Restart now to install"],
  ["릴리스 페이지", "Releases page"],
  ["확인 중…", "Checking…"],
  ["업데이트가 필요합니다", "Update required"],
  ["다시 시도", "Try again"],
  ["다운로드 페이지 열기", "Open download page"],
  ["다운로드 페이지", "Download page"],
  ["종료", "Quit"],
  ["Hemicycle Steam 상점", "Hemicycle on Steam"],
  ["찜하기 · 창작마당 · 리뷰", "Wishlist · Workshop · Reviews"],
  ["상점 페이지 준비 중", "Store page coming soon"],
  ["세이브 내보내기", "Export saves"],
  ["정식 출시 — 세이브를 파일로 받아 Steam 판으로", "Official release — download your saves for the Steam version"],
  ["이 브라우저(앱)에 남아 있는 세이브를 골라 파일로 받습니다. 받은 파일은 Steam 판에서 시작하기 › 저장 파일 불러오기로 열 수 있어요.", "Pick saves stored in this browser (app) and download them as files. Open them in the Steam version via Start › Load save file."],
  ["⬇ 선택한 세이브 받기", "⬇ Download selected saves"],
  ["이 브라우저(앱)에 남은 세이브가 없습니다.", "There are no saves in this browser (app)."],
  ["Hemicycle 정식 출시", "Hemicycle official release"],
  ["Hemicycle이 Steam으로 정식 출시되어, 이 판에서는 더 이상 플레이할 수 없습니다. 지금까지의 세이브는 파일로 받아 Steam 판에서 이어서 할 수 있어요.", "Hemicycle is now officially released on Steam, so this version can no longer be played. Download your saves as files and continue in the Steam version."],
  ["Steam 상점 열기 ↗", "Open Steam store ↗"],
  ["Steam 상점 페이지 준비 중", "Steam store page coming soon"],
  ["⬇ 세이브 내보내기", "⬇ Export saves"],
  ["처음 화면으로", "Back to start"],
  ["받는 중…", "Downloading…"],
  ["- 의회 › 의회 설정에 의장석 표시 설정 (모든 미리보기 공통)", "- Speaker podium display setting in Parliament › Settings (all previews)"],
  ["법안 태그 고르기", "Bill tag picker"],
  ["헌법 탭", "Constitution tab"],
  ["경제 탭 (잠김, 1.6.9)", "Economy tab (locked, 1.6.9)"],
  ["우클릭 내보내기", "Right-click export"],
  ["- 세계 메뉴 신설 — 국가 순위(오른쪽 시각 탭, 국기 · 점수 고치기) · 진영, 경제 메뉴는 색만 정해 두고 잠금 (1.6.9)", "- New World menu — country ranking (right display tab, flags · scores) · blocs; Economy menu reserved and locked (1.6.9)"],
  ["법안을 만들고 통과시키는 과정입니다. 메뉴 위의 단계 막대(제출 › 위원회 › 본회의 › 서명 · 기록 › 법령)에 단계마다 법안 수가 보이고, 누르면 그 탭으로 갑니다.", "The process of drafting bills and getting them passed. The stage bar above the menu (Submit › Committees › Floor › Signing · Records › Statutes) shows the number of bills at each stage — click one to jump to that tab."],
  ["새 법안 작성 — 종류(법률안 · 헌법 개정안), 제목, 조문(제1조 · 제2조 … 조 단위로 쓰고 순서를 바꿈), 태그, 가결 기준. 기존 법안 수정과 개정안도 여기서.", "Draft a new bill — type (bill · constitutional amendment), title, articles (written article by article, Article 1, Article 2 …, reorderable), tags and passage threshold. Editing existing bills and amendments is here too."],
  ["고르면 지금 헌법 조문이 채워지고 가결 기준이 2/3로 바뀝니다. 가결되면 그 조문이 새 헌법이 돼요.", "Choosing it fills in the current constitution's articles and sets the threshold to 2/3. If it passes, those articles become the new constitution."],
  ["상임위원회 — 법안을 본회의 전에 먼저 심사합니다. 위원은 그 원의 정당 의석 비율대로 배정되고, 정당마다 찬성 · 반대 · 기권을 골라 \"심사 확정\"을 누르면 위원 과반 찬성일 때 본회의로, 부결이면 폐기돼요.", "Standing committees — review bills before the floor. Members are allotted by each party's share of seats in that chamber; choose yes · no · abstain for each party and press \"Confirm committee review\": with a majority of members in favor the bill goes to the floor, otherwise it dies."],
  ["법제사법 · 기획재정 · 외교통일 · 국방 · 행정안전 · 교육 · 보건복지 · 환경노동 8개를 한 번에 만듭니다.", "Creates eight committees at once: Legislation & Judiciary · Strategy & Finance · Foreign Affairs & Unification · Defense · Public Administration & Security · Education · Health & Welfare · Environment & Labor."],
  ["법안 태그가 위원회 소관 태그와 겹치면 그 위원회로 자동 지정됩니다 (상정 탭에서 바꾸거나 \"없음\"으로 바로 본회의).", "If a bill's tags overlap a committee's jurisdiction tags, it is assigned to that committee automatically (change it in the Floor tab, or pick \"None\" to go straight to the floor)."],
  ["법안을 의회 또는 국무회의에 올리고, 의회로 올릴 법안은 소관 위원회를 고릅니다. 위원회 심사가 끝나야 \"심의 선택\"이 열려요. 검색 · 태그로 찾을 수 있습니다.", "Send bills to the legislature or the cabinet council, and choose the committee for bills going to the legislature. \"Select for deliberation\" opens once the committee review is done. Find bills by search or tag."],
  ["법령집 — 헌법과 가결된 법률을 조문 그대로 모아 봅니다. 법률은 개정 계보마다 가장 최근 판이 보이고(제정 · 개정 횟수), 여기서 개정안을 낼 수 있어요.", "Statute book — the constitution and passed laws, article by article. Each law shows its latest version per amendment chain (enactment · number of amendments), and you can propose amendments from here."],
  ["\"헌법 제정하기\"로 처음 만들고, \"직접 편집\"(표결 없이 바로) 또는 \"개정안 발의\"(표결을 거쳐)로 고칩니다. 개정 이력이 남아요.", "Create it with \"Enact a constitution\", then change it with \"Edit directly\" (no vote) or \"Propose amendment\" (through a vote). Amendments are recorded."],
  ["법안 제출 · 위원회 · 상정 · 표결 · 표결 기록 · 법령", "Submitting bills · committees · tabling · voting · vote records · statutes"],
  ["입법 › 제출에서 법안을 작성합니다. 법안 제목을 적고 \"[+] 법안 등록\"을 눌러보세요. (조문 · 태그 · 가결 기준은 비워 둬도 돼요 — 조문은 제1조 · 제2조처럼 조 단위로 씁니다)", "Draft bills in Legislation › Submit. Enter a bill title and press \"[+] Register bill\". (Articles, tags and threshold can be left empty — articles are written one by one, Article 1, Article 2 …)"],
  ["입법 › 위원회에서 상임위원회를 만들면, 법안이 본회의 전에 소관 위원회 심사를 먼저 거칩니다. 위원은 정당 의석 비율대로 배정되고, 위원 과반이 찬성해야 본회의로 넘어가요. 위원회가 없으면 법안은 바로 본회의로 갑니다.", "Create standing committees in Legislation › Committees and bills are reviewed by the responsible committee before the floor. Members are allotted by party seat share, and a majority must vote yes for the bill to reach the floor. Without committees, bills go straight to the floor."],
  ["입법 › 상정에는 등록된 법안이 모입니다. 법안마다 의회에 올릴지 국무회의에 올릴지, 소관 위원회를 어디로 할지 고르고, \"심의 선택\"을 누르면 표결로 넘어가요. 검색과 태그로 찾을 수 있습니다.", "Registered bills gather in Legislation › Floor. For each bill choose whether it goes to the legislature or the cabinet council and which committee reviews it, then press \"Select for deliberation\" to move on to the vote. Search and tags help you find them."],
  ["입법 › 법령에는 헌법과 가결된 법률이 조문 그대로 모입니다. 헌법을 제정하고, 헌법 개정안(가결 기준 2/3)을 통과시키면 헌법이 바뀌고 개정 이력이 남아요.", "Legislation › Statutes collects the constitution and passed laws, article by article. Enact a constitution, and when a constitutional amendment (2/3 threshold) passes, the constitution changes and the amendment is recorded."],
  ["상임위원회", "Standing committees"],
  ["궐석 처리 (사퇴/사망)", "Vacate seat (resigned/died)"],
  ["직책 (예: 외교부 장관)", "Position (e.g. Minister of Foreign Affairs)"],
  ["[궐석]", "[Vacant]"],
  ["보궐선거로 채우기", "Fill by by-election"],
  ["보호령", "Protected territory"],
  ["동군연합", "Personal union"],
  ["신탁통치령", "Trust territory"],
  ["＋ 새 형태…", "+ New form…"],
  ["+ 형태 추가", "+ Add form"],
  ["기본 목록으로", "Reset to defaults"],
  ["— 직접 추가 · 이름 바꾸기 · 지우기", "— add, rename or remove"],
  ["종속 형태 목록을 기본 목록으로 되돌릴까요? (이미 정한 나라의 형태는 그대로)", "Reset the list of dependency forms to the defaults? (Countries keep the form they already have)"],
  ["종속국 · 종속국 의회 · 합병 · 해방 (+1.6.1 ~ 1.6.7)", "Dependencies · dependency parliaments · annexation · release (+1.6.1 ~ 1.6.7)"],
  ["종속국 만들기 · 칠하기 · 종속국 의회와 선거 · 합병 · 해방", "Creating dependencies · painting · dependency parliaments and elections · annexation · release"],
  ["종속국 만들기", "Creating a dependency"],
  ["칠하기와 지도", "Painting and the map"],
  ["합병과 해방", "Annexation and release"],
  ["+ 종속국 추가", "+ Add dependency"],
  ["본국 정당 가져오기", "Import home parties"],
  ["선거 실시", "Hold election"],
  ["+ 정당", "+ Party"],
  ["합병", "Annex"],
  ["해방", "Release"],
  ["다시 종속국으로", "Make a dependency again"],
  ["지역구에서 빼기", "Remove from districts"],
  ["독립국 (해방된 나라)", "Independent states (released)"],
  ["보호국", "Protectorate"],
  ["괴뢰국", "Puppet state"],
  ["자치령", "Dominion"],
  ["위성국", "Satellite state"],
  ["속국", "Vassal"],
  ["— 아님 (본국 지역구) —", "— None (home district) —"],
  ["+ 새 종속국", "+ New dependency"],
  ["이민자 투표권", "Immigrant voting rights"],
  ["— 시민권자는 모든 선거에서 투표합니다", "— citizens vote in every election"],
  ["대선 · 총리 직선", "Presidential · direct PM"],
  ["이민자 성향 따로 정하기", "Set immigrant leanings separately"],
  ["선거 › 방식에서 설정", "Set in Elections › System"],
  ["시민", "Citizens"],
  ["통화 · 재정 정책", "Monetary · fiscal policy"],
  ["경제 그래프", "Economy charts"],
  ["경제권", "Economic blocs"],
  ["- 경제권 — 여러 나라를 묶어 경제권(관세 동맹 · 공동시장 · 통화 동맹 …)을 정하고 경제에 반영", "- Economic blocs — group countries into blocs (customs union · common market · currency union …) that affect the economy"],
  ["개요", "Overview"],
  ["분석", "Analysis"],
  ["통화", "Monetary"],
  ["재정", "Fiscal"],
  ["시나리오", "Scenario"],
  ["항목", "Items"],
  ["경제 시스템 — 통화 · 재정 · 지역구 경제 · 예산안 · 경제 그래프 (+1.6.1 ~ 1.6.8)", "Economy — monetary · fiscal · district economies · budget bills · economy charts (+1.6.1 ~ 1.6.8)"],
  ["날짜를 따라 도는 경제 · 신용등급과 경고 신호 · 계기판과 금액 · 추이 · 통화 · 재정과 예산안 · 이벤트 · 전문가 분석 · 지역 · 시나리오", "An economy that follows the date · credit rating and warning signs · gauges and amounts · trends · monetary · fiscal and budget bills · events · expert analysis · regions · scenarios"],
  ["날짜를 따라 계산", "Follows the date"],
  ["신용등급과 경고 신호", "Credit rating and warning signs"],
  ["계기판과 금액", "Gauges and amounts"],
  ["추이 그래프", "Trend chart"],
  ["이벤트", "Events"],
  ["시민 · 이민자", "Citizens · immigrants"],
  ["지역구 시민 / 인구 · 선거마다 이민자 투표권 · 이민자 성향", "Citizens / population per district · immigrant voting rights per election · immigrant lean"],
  ["시민과 이민자", "Citizens and immigrants"],
  ["시민 수 적기", "Entering citizens"],
  ["이민자 성향", "Immigrant lean"],
  ["보이지 않는 손", "The invisible hand"],
  ["턴 넘기기", "Advancing turns"],
  ["계기판과 추이", "Gauges and trends"],
  ["재정과 예산안", "Public finance and the budget"],
  ["전문가 분석", "Expert analysis"],
  ["지역 · 시나리오 · 항목", "Regions · scenarios · items"],
  ["기준금리", "Policy rate"],
  ["화폐발행률", "Money printing rate"],
  ["양적완화", "Quantitative easing"],
  ["양적긴축", "Quantitative tightening"],
  ["평가절하", "Devaluation"],
  ["예산안 제출", "Submit budget"],
  ["초안 버리기", "Discard draft"],
  ["입법 › 표결에 예상대로 넣기", "Fill Legislation › Vote with predicted votes"],
  ["국가 순위의 우리나라 점수가 GDP를 따라감", "Our country's ranking score follows GDP"],
  ["인플레이션", "Inflation"],
  ["성장률", "Growth"],
  ["실업률", "Unemployment"],
  ["부채비율", "Debt ratio"],
  ["민심", "Public mood"],
  ["신뢰도", "Confidence"],
  ["국채금리", "Bond yield"],
  ["추이", "Trends"],
  ["경기 순환", "Business cycle"],
  ["인플레이션 분석", "Inflation analysis"],
  ["재정 건전성", "Fiscal health"],
  ["지역 격차", "Regional gaps"],
  ["정책 실험", "Policy lab"],
  ["자산", "Assets"],
  ["데이터 표", "Data table"],
  ["직접 고르기", "Custom"],
  ["크게 보기", "Full screen"],
  ["⛶ 크게 보기", "⛶ Full screen"],
  ["CSV 내보내기", "Export CSV"],
  ["분석 열기", "Open analysis"],
  ["예산 반원", "Budget hemicycle"],
  ["가로 막대 두 줄", "Two horizontal bars"],
  ["의무지출", "Mandatory spending"],
  ["세율", "Tax rates"],
  ["국고 · 부채", "Treasury · debt"],
  ["부채 상환", "Repay debt"],
  ["인프라에 투자", "Invest in infrastructure"],
  ["프리셋", "Presets"],
  ["규칙", "Rules"],
  ["위기 임계값", "Crisis thresholds"],
  ["화면 표시", "Display"],
  ["+ 규칙 추가", "+ Add rule"],
  ["지금부터 다시 세기", "Restart count from now"],
  ["경제 처음부터 (기록 지움)", "Restart economy (clears history)"],
  ["지출 항목", "Spending items"],
  ["세목", "Taxes"],
  ["+ 새 지출 항목", "+ New spending item"],
  ["+ 새 세목", "+ New tax"],
  ["항목 추가", "Add item"],
  ["세목 추가", "Add tax"],
  ["경고 신호 없음", "No warning signs"],
  ["실질 마이너스 성장", "Negative real growth"],
  ["과도한 적자", "Excessive deficit"],
  ["국고 과잉", "Bloated reserves"],
  ["금융 위기", "Financial crisis"],
  ["통화 붕괴 위험", "Currency collapse risk"],
  ["부채 한도 근접", "Near debt ceiling"],
  ["서독 1983", "West Germany 1983"],
  ["안정기", "Stable times"],
  ["전후 재건", "Postwar reconstruction"],
  ["구제금융", "Bailout"],
  ["전시 체제", "War economy"],
  ["궐석", "Vacant"],
  ["SVG · 그림(webp · png · jpg · bmp, 자동 추적) · .jsx · .hemimap 지도를 지역구 지도(.jsx — 모양만) 또는 지역구 프리셋(.hemimap — 모양 · 이름 · 약칭 · 의석 수 · 인구)으로 — 만든 파일은 국가 › 지역구 지도에서 불러옵니다", "Turn SVG · images (webp · png · jpg · bmp, auto-traced) · .jsx · .hemimap maps into a district map (.jsx — shapes only) or a district preset (.hemimap — shapes · names · abbreviations · seats · population) — load the file in Country › District map"],
  ["같은 색 이웃 합치기", "Merge same-color neighbors"],
  ["지역구 목록", "District list"],
  ["약칭 · 의석 · 인구 칸 보이기", "Show abbreviation · seats · population fields"],
  ["모양 · 이름 · 약칭 · 의석 · 인구 — 추천", "Shapes · names · abbreviations · seats · population — recommended"],
  [".jsx 전체", ".jsx (all)"],
  [".jsx 고른 것", ".jsx (selected)"],
  [".jsx에 <svg viewBox> 래퍼 포함", "Include <svg viewBox> wrapper in .jsx"],
  ["SVG 도형의 id · label을 지역구 이름으로 씁니다 (끄면 도형 순서대로 이름)", "Use SVG shape ids · labels as district names (off: name by shape order)"],
  ["연 지도와 목록을 모두 비웁니다", "Clear the open map and the list"],
  ["목록의 지역구마다 약칭 · 의석 수 · 인구 칸을 보이기 (지역구 프리셋 .hemimap에 담김)", "Show abbreviation · seats · population fields for each district in the list (saved in the .hemimap district preset)"],
  ["내보낼 때 쓸 파일 이름 (.hemimap · .jsx · .svg는 자동으로 붙음)", "File name for exports (.hemimap · .jsx · .svg is added automatically)"],
  ["모든 지역구의 모양만 .jsx로 내보냅니다", "Export the shapes of all districts as .jsx"],
  ["목록에서 고른 지역구의 모양만 .jsx로 내보냅니다", "Export the shapes of the selected districts as .jsx"],
  ["나누기 · 합치기 · 이름 고치기를 반영한 지금 지도를 SVG로", "Download the current map as SVG, with splits, merges and renames applied"],
  [".jsx 파일 안에 <svg viewBox> 래퍼를 함께 넣습니다", "Put an <svg viewBox> wrapper inside the .jsx file"],
  ["고른 지역구가 없습니다 — 목록에서 고르거나, \".jsx 전체\"로 모두 내보내세요.", "No districts selected — pick some in the list, or use \".jsx (all)\" to export them all."],
  ["위원 구성", "Membership"],
  ["자동 (의석 비례)", "Auto (by seats)"],
  ["직접 정하기", "Set manually"],
  ["정당마다 위원 수를 정합니다 (위원 수 = 합계). 의석이 바뀌어도 그대로이고, \"자동 (의석 비례)\"로 돌리면 이 합계로 다시 나눠요.", "Set each party's member count (committee size = the total). It stays when seats change; switching back to \"Auto (by seats)\" re-splits this total by seats."],
  ["기본은 \"자동 (의석 비례)\" — 위원 수를 그 원의 정당 의석 비율대로 나눕니다. \"직접 정하기\"로 바꾸면 정당마다 위원 수를 직접 넣고(위원 수 = 합계), 의석이 바뀌어도 그대로예요. 켤 때는 지금 자동 배정에서 시작합니다.", "Default is \"Auto (by seats)\" — members are split by each party's seats in that chamber. Switch to \"Set manually\" to enter each party's member count (committee size = the total); it stays the same when seats change. It starts from the current automatic split."],
  ["무당층", "Undecided"],
  ["개표 때마다 무당층 표가 이 지역 정당들에 나뉩니다 (일부는 무작위, 나머지는 성향 비율대로 · 성향 0인 정당은 받지 않음)", "At each count, undecided votes are split among this area's parties (partly random, the rest by tendency · parties at 0 get none)"],
  ["지역구 · 권역마다 성향 칸 아래에 무당층(%)을 정할 수 있습니다. 개표 때마다 무당층 표를 그 지역에 후보를 낸 정당들에 나눠 더해요 — 일부(무작위 비율)는 정당마다 난수로, 나머지는 성향 × 친화도(0.5~1.5 난수) 비율로. 성향이 0인 정당은 받지 않아 무당층만으로 당선되지는 않고, 결과가 덜 뻔해집니다. 총선 지역구와 지방선거에 쓰여요. 지역구에 따로 정하지 않으면 권역 성향을 쓰는 지역구는 권역 무당층을 따릅니다.", "Under the tendency fields of each district or region you can set an undecided share (%). At every count, undecided votes are split among the parties running there — a random portion by a random number per party, the rest by tendency × affinity (random 0.5–1.5). Parties at 0 tendency get none, so undecided votes alone never elect anyone; results just become less predictable. Used for general-election districts and local elections. A district without its own value follows its region's undecided share when it uses the region's tendency."],
  ["지역구 프리셋(.hemimap) 파일입니다. 세이브를 연 뒤 국가 › 지역구 지도의 \"지역구 지도 업로드\"로 올리면 그 세이브의 지역구만 바뀝니다.", "This is a district preset (.hemimap). Open a save, then upload it with \"Upload district map\" in Country › District map to replace only that save's districts."],
  ["지역구 프리셋(.hemimap) 파일입니다.\n국가 › 지역구 지도의 \"지역구 지도 업로드\"로 올리면 지금 세이브의 지역구만 바뀝니다.", "This is a district preset (.hemimap).\nUpload it with \"Upload district map\" in Country › District map to replace only this save's districts."],
  ["종합 프리셋 (.hemi)", "Full preset (.hemi)"],
  ["지금 세이브 전체(정당 · 의회 · 지역구 · 내각 · 경제 …)를 파일 하나로. 종합 프리셋으로 나눠 줄 때도 이 파일을 씁니다.", "The whole save (parties · parliament · districts · cabinet · economy …) as one file. Use it to share full presets too."],
  ["종합 프리셋 내보내기", "Export full preset"],
  ["종합 프리셋 불러오기", "Load full preset"],
  ["지역구 프리셋 (.hemimap)", "District preset (.hemimap)"],
  ["지역구만 — 지도 · 이름 · 약칭 · 원별 의석 수 · 인구 · 권역. 정당 · 성향 · 선거 결과는 담지 않아요. 불러오기는 국가 › 지역구 지도의 업로드 칸에서.", "Districts only — map · names · abbreviations · seats per chamber · population · regions. Parties, tendencies and election results aren't included. Load it from the upload field in Country › District map."],
  ["지역구만 내보내기", "Export districts only"],
  ["⬆ 지역구 지도 업로드 (.jsx · .hemimap)", "⬆ Upload district map (.jsx · .hemimap)"],
  ["에서 내보낸 .jsx 파일이나 지역구 프리셋(.hemimap — 지도 · 이름 · 의석 · 인구 · 권역)을 업로드하거나,", " — upload a .jsx file exported from it or a district preset (.hemimap — map · names · seats · population · regions), or"],
  ["내보낼 지역구가 없습니다.\n국가 › 지역구 지도에서 지도를 올리거나 맵 프리셋을 고른 뒤 다시 시도하세요.", "There are no districts to export.\nUpload a map or pick a map preset in Country › District map, then try again."],
  ["지역구 프리셋에 지역구가 없습니다.", "The district preset has no districts."],
  ["지역구 프리셋을 불러오지 못했습니다: 파일이 깨졌거나 형식이 다릅니다.", "Couldn't load the district preset: the file is damaged or in a different format."],
  ["파일을 읽지 못했습니다.", "Couldn't read the file."],
  ["지금 지역구가 모두 이 지역구 프리셋으로 바뀝니다 — 지도 · 이름 · 의석 수 · 인구 · 권역 (모든 원).\n정당 · 내각은 그대로이고, 지역구 성향 · 당선자 · 선거 결과는 비워집니다. 계속하시겠습니까?", "All current districts will be replaced by this district preset — map · names · seats · population · regions (all chambers).\nParties and cabinet stay; district tendencies, winners and election results are cleared. Continue?"],
  ["종합 프리셋(.hemi) 파일입니다.\n저장 창의 \"종합 프리셋 불러오기\"로 여세요. 여기서는 지역구 프리셋(.hemimap)과 맵 메이커 지도(.jsx)를 올립니다.", "This is a full preset (.hemi).\nOpen it with \"Load full preset\" in the save window. This field takes district presets (.hemimap) and map maker maps (.jsx)."],
  ["지역구 프리셋(.hemimap)이나 맵 메이커 지도(.jsx)가 아닙니다.", "This isn't a district preset (.hemimap) or a map maker map (.jsx)."],
  ["지역구를 만들고 원별 의석 수 · 인구를 정합니다. 맵 메이커에서 만든 지도(.jsx)를 올리면 실제 지도 모양의 지역구를 쓸 수 있고, 지역구 프리셋(.hemimap)을 올리면 지도 · 이름 · 의석 수 · 인구 · 권역이 한 번에 들어와요 (정당 · 내각은 그대로). (1.5.9까지는 여론 › 지역구)", "Create districts and set seats and population per chamber. Upload a map made in the map maker (.jsx) to use real map shapes, or a district preset (.hemimap) to bring in the map, names, seats, population and regions at once (parties and cabinet stay). (Up to 1.5.9 this was Opinion › Districts)"],
  ["비례 득표율 따로 정하기", "Set list vote separately"],
  ["이 원의 비례 의석 · 봉쇄조항은 \"비례(%)\" 값으로 나눕니다 (권역형 비례는 권역 득표). 지역구(성향)와 대선 · 지방선거 · 여론은 지지율을 그대로 써요. 위성정당 예: 모정당 비례 0%, 위성정당 지지율 0% · 비례 N%.", "This chamber's list seats and threshold are allocated by the \"List(%)\" values (regional lists use regional votes). Districts (tendency), presidential and local elections and opinion keep using support. Satellite party example: parent party list 0%, satellite support 0% · list N%."],
  ["비례(%)", "List(%)"],
  ["비례 득표율(%)", "List vote (%)"],
  ["비례 득표율을 입력해 주세요.\n각 정당의 비례(%) 칸에 숫자를 입력하세요.", "Please enter list votes.\nType a number in each party's List(%) field."],
  ["원마다 켜면 정당마다 \"비례(%)\" 칸이 생깁니다 (켤 때 지금 지지율을 복사). 그 원의 비례 의석과 봉쇄조항(전국형 비례)은 이 값(± 오차, 무당파 배분 포함)으로 나누고, 지역구(성향) · 대선 · 지방선거 · 여론은 지지율을 그대로 써요. 위성정당 예: 모정당 비례 0%, 위성정당 지지율 0% · 비례 N%. 권역형 비례는 권역 득표를 씁니다.", "Turn it on per chamber and each party gets a \"List(%)\" field (copied from current support when turned on). That chamber's list seats and threshold (national lists) are allocated by these values (± error, including undecided votes), while districts (tendency), presidential and local elections and opinion keep using support. Satellite party example: parent party list 0%, satellite support 0% · list N%. Regional lists use regional votes."],
  ["교섭단체 기준(위키 틀과 같은 값)에 못 미치는 정당들이 함께 교섭단체를 이룹니다. 합친 의석이 기준을 넘으면 성립하고, 위키 틀에서 비교섭단체 대신 그 정당들로 보이며 각주가 붙어요.", "Parties below the negotiating-group threshold (the same value as the wiki box) form a negotiating group together. It holds once their combined seats pass the threshold; the wiki box then shows those parties instead of \"non-negotiating group\", with a footnote."],
  ["정권 상태", "Regime"],
  ["계엄령 · 전제군주정 · 군정에서는 정권 쪽 정당이 덜 들키고(×0.5 · ×0.3 · ×0.2) 들켜도 활동 금지 대신 지지율이 떨어지며(왕정은 왕실 스캔들), 야당은 더 들키고(×1.5) 활동 금지 + 지지율 절반. 군정은 내각 › 쿠데타에서 \"관제 선거\"를 허용해야 선거를 치러요.", "Under martial law, absolute monarchy or a junta, regime parties are caught less often (×0.5 · ×0.3 · ×0.2) and, if caught, lose support instead of being banned (a royal scandal under a monarchy); the opposition is caught more often (×1.5) and is banned with support halved. A junta holds elections only if \"managed elections\" is allowed in Cabinet › Coup."],
  ["날짜를 따라 도는 나라 경제입니다. 결과를 강제하지 않고 계산 · 표시 · 제안하며, 모든 수치는 직접 고칠 수 있어요. 계산은 날짜가 분기(설정에 따라 1개월 · 1년) 경계를 지날 때만 돕니다. 오른쪽 \"경제\" 시각 탭에 계기판과 그래프가 있어요.", "The national economy, which runs along the game date. It calculates, shows and suggests without forcing outcomes, and every number can be edited. It only advances when the date crosses a quarter (or month or year, per settings). Gauges and charts are in the \"Economy\" visual tab on the right."],
  ["개요 — 지표마다 반원 계기(안전 · 경고 · 위기), 신용등급, 경제 체제, 경고 신호, 국가부채 · 국고 · 세입 · 세출 금액.", "Overview — a semicircle gauge per indicator (safe · warning · crisis), credit rating, economic system, warning signals, and national debt · treasury · revenue · spending amounts."],
  ["분석 — 전문가 그래프(연동 다중 패널 · 예측 부채꼴 · 기여도 분해 · 부채 동학 · 정책 민감도 · 예산 흐름도), 분석 프리셋, 데이터 표 · CSV.", "Analysis — expert charts (linked panels · forecast fan · contribution breakdown · debt dynamics · policy sensitivity · budget flow), analysis presets, data table · CSV."],
  ["통화 — 기준금리 · 화폐발행률 · 양적완화 · 양적긴축 · 평가절하, 중앙은행 독립(자동 금리). 통화정책은 법안 없이 바로 반영돼요.", "Monetary — policy rate · money printing rate · quantitative easing · quantitative tightening · devaluation, central bank independence (automatic rates). Monetary policy applies immediately, without a bill."],
  ["재정 — 재량지출 · 의무지출 · 세목별 세율 · 국고 · 부채 한도. 예산 · 세율 바꾸기는 기본으로 예산안(법안)을 거쳐 입법 › 표결에서 통과해야 반영됩니다 (못 넘기면 준예산).", "Fiscal — discretionary and mandatory spending, tax rates by tax, treasury, debt ceiling. By default, budget and tax changes go through a budget bill and take effect only when it passes in Legislation › Vote (otherwise a provisional budget)."],
  ["지역 — 지역구마다 산업구조 · 연령구조 · 소득등급 · 실업률 · 민심. 같은 정책도 지역마다 다르게 작용하고, 경제 성과가 지지율 · 지역구 성향을 조금씩 움직여요 (설정).", "Regions — industry mix, age structure, income level, unemployment and public mood per district. The same policy works differently by region, and economic performance gradually moves support and district tendencies (setting)."],
  ["시나리오 — 초기값(고정 · 전환 · 구간)과 프리셋.", "Scenario — starting values (fixed · transition · range) and presets."],
  ["이벤트 — 정한 날짜에 대공황 · 금융 위기 · 오일 쇼크 · 하이퍼인플레이션 · 국가 부도 · 재해 · 호황(또는 직접 만든 사건)을 일으킵니다.", "Events — trigger a great depression, financial crisis, oil shock, hyperinflation, sovereign default, disaster or boom (or your own event) on a set date."],
  ["항목 — 사용자 정의 지출 항목 · 세목 · 자산.", "Items — custom spending items, taxes and assets."],
  [" (해산)", " (dissolved)"],
  [" (활동 금지)", " (banned)"],
  ["활동 금지 대신 부정선거 규탄 여론 — 지지율 20% 하락", "no ban; public outrage over the fraud — support −20%"],
  ["활동 금지 대신 왕실 스캔들 — 지지율 25% 하락 (혁명 확률 상승)", "no ban; royal scandal — support −25% (revolution more likely)"],
  ["활동 금지 대신 관제 선거 의혹 — 지지율 15% 하락", "no ban; suspicions of a rigged state election — support −15%"],
  ["활동 금지 + 지지율 절반 (계엄 당국의 처벌)", "banned + support halved (punished by the martial-law authorities)"],
  ["활동 금지 + 지지율 절반 (왕실의 처벌)", "banned + support halved (punished by the crown)"],
  ["강제 해산(활동 금지) + 지지율 절반", "forcibly dissolved (banned) + support halved"],
  ["군정 (관제 선거)", "Junta (managed election)"],
  ["정부 · 여당", "Government parties"],
  ["왕당파", "Royalists"],
  ["군부 쪽 정당", "Military-aligned parties"],
  ["야당", "Opposition"],
  ["발각 확률은 그대로, 발각되면 활동 금지. 계엄령 · 전제군주정 · 군정(관제 선거)에서는 정권 쪽 정당은 덜 발각되고 처벌도 가벼워요.", "Detection odds as set; a caught party is banned. Under martial law, absolute monarchy or a junta (managed election), regime-side parties are caught less often and punished more lightly."],
  ["관제 선거 허용", "Allow managed elections"],
  ["켜면 군정 중에도 총선 · 대선 · 지방선거를 치릅니다. 군부 쪽 정당의 부정선거는 거의 들키지 않고(×0.2) 들켜도 지지율만 떨어지지만, 야당이 들키면 강제 해산돼요.", "When on, general, presidential and local elections go ahead under the junta. Fraud by military-aligned parties is rarely caught (×0.2) and only costs support, but a caught opposition party is forcibly dissolved."],
  ["동일 후보수 분배", "Equal split"],
  ["의석수 비례 분배", "Split by seats"],
  ["현직 우선", "Incumbent first"],
  ["추첨", "Lottery"],
  ["정하기", "Choose"],
  ["다시 정하기", "Choose again"],
  ["총선 지역구를 참여 정당이 같은 수씩 나눠 맡습니다 (각자 상대적으로 강한 지역구부터). 대선 · 총리 선거는 같은 확률로 추첨해요. 결집률은 후보를 내지 않는 참여 정당의 표가 단일후보에게 가는 비율이에요.", "General-election districts are split evenly among the member parties (each takes the districts where it is relatively strongest first). Presidential and PM candidates are drawn by lot with equal odds. Consolidation is the share of the non-running member parties' votes that go to the single candidate."],
  ["총선 지역구를 참여 정당의 지금 의석 비율대로 나눠 맡습니다 (각자 상대적으로 강한 지역구부터). 대선 · 총리 선거는 의석 비례 추첨으로 정해요. 결집률은 후보를 내지 않는 참여 정당의 표가 단일후보에게 가는 비율이에요.", "General-election districts are divided by the member parties' current seat shares (each takes the districts where it is relatively strongest first). Presidential and PM candidates are drawn by lot weighted by seats. Consolidation is the share of the non-running member parties' votes that go to the single candidate."],
  ["지역구마다 지금 그 지역구를 가진(지난 선거 당선) 참여 정당이 다시 나섭니다. 현직이 없으면 지지율 1위. 대선 · 총리 선거는 현직 대통령 · 총리의 정당이 참여했으면 그 정당이에요. 결집률은 후보를 내지 않는 참여 정당의 표가 단일후보에게 가는 비율이에요.", "In each district, the member party that holds it now (won it last time) runs again; with no incumbent, the top party. For presidential and PM elections, the sitting president's or PM's party if it is a member. Consolidation is the share of the non-running member parties' votes that go to the single candidate."],
  ["지역구마다 참여 정당 중 한 곳을 같은 확률로 추첨합니다. 대선 · 총리 선거도 추첨이에요. 결집률은 후보를 내지 않는 참여 정당의 표가 단일후보에게 가는 비율이에요.", "In each district, one member party is drawn by lot with equal odds. Presidential and PM candidates are drawn by lot too. Consolidation is the share of the non-running member parties' votes that go to the single candidate."],
  ["권역 · 지역구를 참여 정당의 전체 지지율 비율대로 나눠 맡아요 (각자 상대적으로 강한 곳부터). 결집하지 않은 표는 다른 정당으로 흩어져요.", "Regions and districts are divided by the member parties' overall support (each takes the places where it is relatively strongest first). Votes that don't consolidate scatter to other parties."],
  ["권역 · 지역구를 참여 정당이 같은 수씩 나눠 맡아요 (각자 상대적으로 강한 곳부터). 결집하지 않은 표는 다른 정당으로 흩어져요.", "Regions and districts are split evenly among the member parties (each takes the places where it is relatively strongest first). Votes that don't consolidate scatter to other parties."],
  ["권역 · 지역구를 참여 정당의 지금 의석 비율대로 나눠 맡아요 (각자 상대적으로 강한 곳부터). 결집하지 않은 표는 다른 정당으로 흩어져요.", "Regions and districts are divided by the member parties' current seat shares (each takes the places where it is relatively strongest first). Votes that don't consolidate scatter to other parties."],
  ["권역 · 지역구마다 그곳 지역구 의석을 가장 많이 가진 참여 정당이 나서요. 없으면 지지율 1위. 결집하지 않은 표는 다른 정당으로 흩어져요.", "In each region and district, the member party holding the most district seats there runs; if none, the top party. Votes that don't consolidate scatter to other parties."],
  ["권역 · 지역구마다 참여 정당 중 한 곳을 같은 확률로 추첨해요. 결집하지 않은 표는 다른 정당으로 흩어져요.", "In each region and district, one member party is drawn by lot with equal odds. Votes that don't consolidate scatter to other parties."],
  ["🤝 공동교섭단체", "🤝 Joint negotiating groups"],
  ["공동교섭단체", "Joint negotiating group"],
  ["1.6.9 미리보기", "1.6.9 preview"],
  ["교섭단체 기준에 못 미치는 정당들이 함께 교섭단체를 이룹니다. 합쳐서 기준을 넘기면 성립하고, 위키 틀에서 비교섭단체 대신 그 정당들로 보이며 각주가 붙어요.", "Parties below the negotiating-group threshold form one together. Once their combined seats pass the threshold it stands, and in the wiki box those parties show up instead of under non-negotiating groups, with a footnote."],
  ["교섭단체 기준", "Negotiating-group threshold"],
  ["석 — 0이면 기준 없음 (위키 틀과 같은 값)", "seats — 0 means no threshold (same value as the wiki box)"],
  ["교섭단체 이름 (비우면 정당 이름을 이어서)", "Group name (blank = party names joined)"],
  ["공동교섭단체 해산", "Dissolve joint group"],
  ["+ 공동교섭단체 구성", "+ Form joint negotiating group"],
  ["의석이 있는 정당이 없습니다", "No party holds seats"],
  ["후보 선출 방법 · 공동교섭단체", "Candidate selection methods · joint negotiating groups"],
  ["● 창당 · 당명 변경 / 곡선으로 합쳐짐 = 승계 / ✕ 소멸 · 줄 · 이름을 누르면 자세히", "● founded · renamed / curve = succession / ✕ dissolved · click a line or name for details"],
  ["지지율 1위", "Top support"],
  ["지지율 비례 분배", "Split by support"],
  ["예비선거", "Primary"],
  ["총선 지역구는 참여 정당의 전체 지지율 비율대로 나눠 맡습니다 (각자 상대적으로 강한 지역구부터). 대선 · 총리 선거는 지지율 비례 추첨으로 후보를 정해요. 결집률은 후보를 내지 않는 참여 정당의 표가 단일후보에게 가는 비율이에요.", "General-election districts are divided among the member parties in proportion to their overall support (each takes the districts where it is relatively strongest first). For presidential and PM elections the candidate is drawn by lot, weighted by support. Consolidation is the share of the non-running member parties' votes that go to the single candidate."],
  ["지역구마다 · 대선에서 참여 정당 중 지지율이 가장 높은 정당이 후보를 냅니다. 결집률은 후보를 내지 않는 참여 정당의 표가 단일후보에게 가는 비율이에요.", "In each district and in presidential elections, the member party with the highest support fields the candidate. Consolidation is the share of the non-running member parties' votes that go to the single candidate."],
  ["예비선거 치르기", "Hold primary"],
  ["예비선거 다시 치르기", "Hold primary again"],
  ["추첨하기", "Draw"],
  ["다시 추첨", "Draw again"],
  ["지지율 1위(기본) · 지지율 비례 분배(총선 지역구를 참여 정당의 전체 지지율 비율대로 나눠 맡음, 대선 · 총리 선거는 지지율 비례 추첨) · 예비선거(참여 정당 지지 + 일반 유권자 여론조사(유동층)를 정한 비율로 섞은 경선). 대선 · 총리 선거의 추첨 · 경선은 단일화 카드에서 한 번 치러 후보를 정해 둡니다.", "Top support (default) · split by support (general-election districts divided by the member parties' overall support; presidential/PM elections drawn by lot weighted by support) · primary (member-party support mixed with a general-public poll of swing voters at a set ratio). For presidential/PM elections, the draw or primary is held once on the union card to fix the candidate."],
  ["결집률", "Consolidation"],
  ["후보를 내지 않는 참여 정당의 표가 단일후보에게 가는 비율(기본 100%, 경선을 치르면 +5%p). 총선 지역구에서 결집하지 않은 표는 다른 정당으로 흩어져요.", "The share of the non-running member parties' votes that go to the single candidate (100% by default, +5%p after a primary). In general-election districts, votes that don't consolidate scatter to other parties."],
  ["아직 칠한 땅이 없습니다", "No land painted yet"],
  ["의회 이름", "Parliament name"],
  ["지지율 %", "Support %"],
  ["정당 색", "Party color"],
  ["정당 지우기", "Delete party"],
  ["점무늬 색", "Dot color"],
  ["나라 이름", "Country name"],
  ["종속 형태", "Dependency type"],
  ["독립국", "Independent state"],
  ["눌러서 이름 바꾸기", "Click to rename"],
  ["본국에 딸린 나라 — 지도에 그 나라 색 점무늬로 따로 보이고, 본국 선거 · 의석에서 빠집니다. 종속국마다 따로 의회(의석 · 정당 · 선거)가 있고, 본국에 합병하거나 해방(독립)시킬 수 있습니다.", "Countries attached to the homeland — shown on the map with dots in their own color and left out of homeland elections and seats. Each dependency has its own parliament (seats · parties · elections) and can be annexed into the homeland or released (independence)."],
  ["새 형태 (예: 동군연합, 보호령, 번국, 조공국)", "New type (e.g. personal union, protectorate, vassal kingdom, tributary state)"],
  ["새 형태 (예: 동군연합)", "New type (e.g. personal union)"],
  ["새 종속 형태 — Enter로 추가, Esc로 취소", "New dependency type — Enter to add, Esc to cancel"],
  ["새 종속국 이름 (예: 보헤미아-모라비아 보호령, 만주국, 그린란드)", "New dependency name (e.g. Protectorate of Bohemia and Moravia, Manchukuo, Greenland)"],
  ["오른쪽 지도에서 종속국 땅을 눌러 본국 지역구로 돌립니다. 다시 \"지우는 중\"을 누르면 끝납니다.", "Click dependency land on the map to the right to return it to the homeland. Click \"Erasing\" again to finish."],
  ["\"칠하기\"를 누른 뒤 오른쪽 지도에서 지역구를 차례로 눌러 그 나라 땅으로 정하세요. 칠하기 도구를 끈 채 지역구를 누르면 아래에서 종속국을 고를 수 있습니다.", "Click \"Paint\", then click districts on the map to the right to make them that country's land. With the paint tool off, click a district to pick its dependency below."],
  ["종속국을 추가하고 \"칠하기\"로 오른쪽 지도에서 그 나라 땅을 칠하세요.", "Add a dependency, then use \"Paint\" to paint its land on the map to the right."],
  ["본국 하원에 의석이 있는 정당이 없습니다.", "No party holds seats in the homeland's lower house."],
  ["종속국 — 본국에 딸린 나라(보호국 · 괴뢰국 · 자치령 …)를 만들고 \"칠하기\"로 지도에서 그 나라 땅을 정합니다. 종속국 땅은 모든 지도에서 그 나라 색 점무늬로 보이고, 본국 총선 지역구 · 지방선거 · 국민투표와 지역구 의석 수에서 빠집니다.", "Dependencies — create countries attached to the homeland (protectorates · puppet states · dominions …) and use \"Paint\" to mark their land on the map. Dependency land shows dots in its country's color on every map and is left out of homeland general-election districts, local elections, referendums and the district seat count."],
  ["종속국마다 의회 이름 · 의석 수 · 봉쇄조항 · 정당(지지율 · 의석)을 정하고 \"선거 실시\"로 의석을 새로 나눕니다. \"본국 정당 가져오기\"로 본국 정당을 그대로 들일 수 있어요.", "Set each dependency's parliament name, seats, threshold and parties (support · seats), then \"Hold election\" to reallocate seats. \"Import homeland parties\" brings in the homeland's parties as they are."],
  ["합병 · 해방", "Annex · release"],
  ["\"합병\"은 종속국 땅을 일반 지역구로 돌리고(종속국 의회 해산), \"해방\"은 독립국으로 떼어 냅니다 — 독립국은 지도에 따로 보이고 세계 › 국가 순위에 오르며, 다시 종속국으로 삼거나 지역구에서 아예 뺄 수 있어요.", "\"Annex\" turns the dependency's land into regular districts (its parliament is dissolved); \"Release\" makes it an independent state — shown separately on the map and added to World › Ranking, and it can be made a dependency again or removed from the districts entirely."],
  ["지방선거 연대", "Local election alliances"],
  ["여러 정당이 연대해 권역 · 지역구마다 단일후보를 냅니다 (총선 지역구 단일화와 따로). 단일후보는 예비선거(그 지역의 연대 정당 지지 + 일반 유권자 여론조사(유동층)를 정한 비율로) 또는 지지율 1위로 정하고, 나머지 연대 정당의 표는 결집률만큼 단일후보에게 갑니다.", "Several parties field one candidate in each region and district (separately from general-election district unions). The candidate is picked by a primary (local support for the alliance parties + a general-public poll of swing voters, at a set ratio) or by top support, and the other alliance parties' votes go to the candidate at the consolidation rate."],
  ["🤝 지방선거 연대 · 단일후보", "🤝 Local election alliances · single candidates"],
  ["연대한 정당은 권역 · 지역구마다 한 명만 내보냅니다. 연대를 하나라도 정하면 지방선거에는 총선 지역구 단일화(선거 › 후보) 대신 이 연대가 쓰여요.", "Allied parties field just one candidate per region and district. Once you set up any alliance, local elections use it instead of general-election district unions (Elections › Candidates)."],
  ["연대 이름 (비우면 정당 이름을 이어서)", "Alliance name (blank = party names joined)"],
  ["연대 지우기", "Delete alliance"],
  ["단일후보 정하기", "Choosing the candidate"],
  ["예비선거 (경선)", "Primary"],
  ["지지율 최고", "Top support"],
  ["유동층(여론조사) 반영 (%)", "Swing-voter poll weight (%)"],
  ["결집률 (%)", "Consolidation (%)"],
  ["권역 · 지역구마다 연대 안에서 지지율이 가장 높은 정당이 후보가 돼요. 결집하지 않은 표는 다른 정당으로 흩어져요.", "In each region and district, the alliance party with the highest support becomes the candidate. Votes that don't consolidate scatter to other parties."],
  ["정당을 두 곳 이상 고르세요.", "Pick at least two parties."],
  ["+ 연대 추가", "+ Add alliance"],
  ["Give me liberty, or give me death! : 갈라질 수도 없고 분리될 수도 없다", "Give me liberty, or give me death! : Indivisible and inseparable"],
  ["혁명 연합", "Revolutionary coalition"],
  ["여러 정당이 함께 일으킵니다 — 연합 정당의 지지율 · 앞서는 지역도 성공 확률에 더하고, 실패하면 연합 정당도 함께 활동 금지돼요.", "Several parties rise up together — the coalition parties' support and the areas they lead also add to the chance of success, and if it fails the coalition parties are banned too."],
  ["평의회 체제", "Council state"],
  ["혁명 연합으로 공산주의 혁명에 성공하면 고를 수 있어요 — 연합 정당이 모두 남아 경쟁 선거로 정권을 주고받고(최고평의회 · 평의회 의장), 연합 밖 정당은 활동 금지. 당-국가 체제를 고르면 연합 정당은 우당이 됩니다.", "Available when a communist revolution succeeds with a revolutionary coalition — every coalition party survives and they trade power through competitive elections (Supreme Council · Chair of the Council), while parties outside the coalition are banned. Choose the party-state instead and the coalition parties become allied parties."],
  ["영토 통일 (전체)", "Reunify all territory"],
  ["칠하기", "Paint"],
  ["칠하는 중", "Painting"],
  ["통합", "Integrate"],
  ["지우개", "Eraser"],
  ["지우는 중", "Erasing"],
  ["+ 새 종류", "+ New kind"],
  ["— 아님 (일반 지역구) —", "— None (regular district) —"],
  ["국가 › 미수복에서 관리", "Manage in Country › Unrecovered"],
  ["다른 지역과 같게", "Same as other areas"],
  ["빗금 색으로", "Hatch color"],
  ["빗금 색", "Hatch color"],
  ["종류 이름", "Kind name"],
  ["이 지역구 빼기", "Remove this district"],
  ["+ 종류 추가", "+ Add kind"],
  ["지도의 지역 이름 색", "Area name color on the map"],
  ["선택한 지역구:", "Selected district:"],
  ["아직 칠한 지역구가 없습니다", "No districts painted yet"],
  ["— 실제로 다스리지 못하는 지역구 (선거 · 의석에서 빠짐) · 종류는 국가 › 미수복에서 관리", "— a district the country does not actually control (left out of elections and seats) · manage kinds in Country › Unrecovered"],
  ["실제로 다스리지 못하는 지역구 — 선거 · 의석에서 빠지고 지도에 종류별 빗금으로 표시됩니다. 종류마다 따로 본국에 통합할 수 있습니다.", "Districts the country does not actually control — they are left out of elections and seats and shown on the map with a hatch for each kind. Each kind can be integrated into the homeland separately."],
  ["새 종류 이름 (예: 오스트리아, 알자스로렌-룩셈부르크, 동방영토, 북방영토)", "New kind name (e.g. Austria, Alsace-Lorraine-Luxembourg, Eastern Territories, Northern Territories)"],
  ["오른쪽 지도에서 미수복 지역을 눌러 일반 지역구로 돌립니다. 다시 \"지우는 중\"을 누르면 끝납니다.", "Click unrecovered districts on the map to the right to turn them back into regular districts. Click \"Erasing\" again to finish."],
  ["\"칠하기\"를 누른 뒤 오른쪽 지도에서 지역구를 차례로 눌러 여러 곳을 한 번에 칠하세요. 칠하기 도구를 끈 채 지역구를 누르면 아래에서 종류를 고를 수 있습니다.", "Click \"Paint\", then click districts on the map to the right to paint several at once. With the paint tool off, click a district to pick its kind below."],
  ["종류를 추가하고 \"칠하기\"로 오른쪽 지도에서 지역구를 칠하세요.", "Add a kind, then use \"Paint\" to paint districts on the map to the right."],
  ["미수복 — 나라가 영유권을 주장하지만 실제로 다스리지 못하는 땅(미수복 지역)을 정합니다. 종류를 여러 개 만들어 이름 · 빗금 색을 정하고, \"칠하기\"를 켠 채 지도에서 지역구를 눌러 지정해요. 미수복 지역은 모든 지도에서 빗금으로 보이고, 총선 지역구 · 지방선거 · 국민투표와 지역구 의석 수에서 빠집니다.", "Unrecovered — mark land the country claims but does not actually control (unrecovered territory). Create several kinds, each with a name and hatch color, and with \"Paint\" on, click districts on the map to assign them. Unrecovered territory is hatched on every map and left out of general-election districts, local elections, referendums and the district seat count."],
  ["통합 · 영토 통일", "Integrate · reunify"],
  ["\"통합\"은 그 종류만, \"영토 통일 (전체)\"는 모든 미수복 지역을 되찾아 일반 지역구로 돌립니다 (선거 · 의석에 다시 포함).", "\"Integrate\" recovers just that kind; \"Reunify all territory\" recovers every unrecovered territory and turns it back into regular districts (counted in elections and seats again)."],
  ["이름 색", "Name color"],
  ["미수복 지역의 지역구 이름을 다른 지역과 같은 색으로 할지, 그 종류의 빗금 색으로 할지 고릅니다.", "Choose whether unrecovered districts are labeled in the same color as other areas or in their kind's hatch color."],
  ["Give me liberty, or give me death! : 즉시, 지체 없이", "Give me liberty, or give me death! : Immediately, without delay"],
  ["여론 시스템 완성", "Complete public-opinion system"],
  ["기사 시스템 추가", "New article system"],
  ["경제권 추가", "Economic blocs"],
  ["경제 시스템 소규모 보완", "Small economy improvements"],
  ["여론조사", "Opinion polls"],
  ["분당", "Party splits"],
  ["시위", "Protests"],
  ["지방정부", "Local governments"],
  ["- 여론 › 기사 탭 신설 — 기사 작성·수정·삭제·발행", "- New Opinion › Articles tab — write, edit, delete and publish articles"],
  ["- 기사 제목, 부제, 본문, 작성일, 언론사, 기자, 대표 사진 설정", "- Set an article's headline, subhead, body, date, outlet, reporter and lead photo"],
  ["- 기사 유형 추가 — 정치·경제·사회·국제·사설·속보", "- Article types — politics, economy, society, world, editorial, breaking news"],
  ["- 기사와 정당·정치인·정부·정책·법안 연결", "- Link articles to parties, politicians, governments, policies and bills"],
  ["- 기사 발행 시 관련 정당·정치인의 지지율 변동 효과 설정", "- Set how publishing an article moves the support of the parties and politicians involved"],
  ["- 기사 영향 범위 설정 — 전국·권역·개별 지역구", "- Set an article's reach — nationwide, regional or a single district"],
  ["- 대통령·총리·내각 국정 지지율 추가", "- Approval ratings for the president, prime minister and cabinet"],
  ["- 정당 지지율과 국정 지지율의 날짜별 변화 기록", "- Day-by-day record of party support and approval ratings"],
  ["- 지지율 변동 그래프와 기사 발생 시점 표시", "- Support charts that mark when articles came out"],
  ["- 경제지표·정책·정치적 사건에 따른 여론 변동 규칙 설정", "- Rules for how economic indicators, policies and political events move opinion"],
  ["- 자동 여론 변동 기능 켜기·끄기 — 기존 수동 지지율 편집 방식 유지", "- Turn automatic opinion shifts on or off — manual support editing stays as it is"],
  ["- 기사 목록과 여론 그래프 이미지 내보내기", "- Export the article list and opinion charts as images"],
  ["- 세계 › 경제권 탭 신설", "- New World › Economic blocs tab"],
  ["- 경제권 생성·수정·삭제", "- Create, edit and delete economic blocs"],
  ["- 경제권 유형 설정 — 자유무역지대·관세동맹·공동시장·통화동맹·경제연합", "- Bloc types — free trade area, customs union, common market, currency union, economic union"],
  ["- 경제권 이름·약칭·상징·회원국 설정", "- Set a bloc's name, abbreviation, emblem and members"],
  ["- 회원국 가입·탈퇴 및 회원 자격 정지", "- Members join, leave or are suspended"],
  ["- 경제권별 공동 관세율과 무역 규칙 설정", "- Common tariffs and trade rules per bloc"],
  ["- 통화동맹의 공동 통화·기준금리 설정", "- Common currency and policy rate for currency unions"],
  ["- 경제권 가입에 따른 무역량·물가·성장률 보정", "- Bloc membership adjusts trade volume, prices and growth"],
  ["- 경제권 관련 조약과 가입·탈퇴 기록", "- Record of bloc treaties, accessions and withdrawals"],
  ["- 경제권별 회원국 경제지표 비교표 추가", "- Table comparing member economies within each bloc"]
 ]
};
