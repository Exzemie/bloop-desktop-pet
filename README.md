# Bloop

A small dot-matrix companion that lives on your desktop. It reacts to your mouse, your music, your typing and
your scrolling. It naps when you leave, keeps your time, and has a **free, unlimited AI brain** you can talk to
and hand tasks to.

Twelve looks: three dot-matrix ones (a color **cat**, a white-on-black **mono** cat, and an **OLED eyes** face) and nine smooth,
non-matrix pets (**blob, kitty, pup, bunny, fox, panda, penguin, frog, ghost**). Everything is drawn in code and customizable.

## Why the AI is free and unlimited

It runs **on your own computer** through [Ollama](https://ollama.com). No account, no API key, no cap, works offline.
The trade-off is that answers are only as good as the model your machine can run.

## Setup (about 5 minutes, once)

1. Install **Node.js** 20+: https://nodejs.org
2. Install **Ollama**: https://ollama.com/download
3. In this folder: `npm install`, then `npm start`
(On Windows PowerShell, if it says scripts are disabled, use `npm.cmd install` and `npm.cmd start`.)
4. Click Bloop and type `/pull llama3.2:3b`(or any other one). It downloads the AI model for you (about 2 GB, once).

## Make it yours: Settings

Click Bloop to open chat, then press **SET** at the top (or type `/settings`, or right-click then **Settings…**).

|||
|-|-|
|**Body**|Size (50 to 200%), opacity, walking speed|
|**Look and color**|Look (cat / mono / OLED eyes), theme (Classic, Paper, Ember, TTY), pattern, fur or casing color (any color), dot color (eyes and mono), accent color|
|**Behavior**|Wander, AI thoughts, react to typing and scrolling, listen to music, peek mode, nap when you're away|
|**Care**|Stretch and water reminders, your name|
|**System**|Sound and volume, always on top, start at login, reset everything|

Everything is saved. There's also a **tray icon** (Show/hide, Settings, Quit), so Bloop can never get lost.

## Listening to music

Turn on **Listen to music** in Settings (or `/listen`). While sound is playing, Bloop closes its eyes, grooves on the
beat, floats music notes, and shows a little dot-matrix equalizer with the tempo.

* It uses your **system audio output** (what you hear), not the microphone. On Windows this just works.
* Only the **volume and beat** are analysed, live. **Nothing is recorded, saved, or sent anywhere**, and the audio is never played back.
* `/listen mic` uses the microphone instead, as a fallback. Same rule: levels only.
* On macOS (and some Linux setups), system audio capture usually isn't available when running with `npm start`. Use `/listen mic` there.
* If it can't start, Bloop tells you why.

## Things it does by itself

|||
|-|-|
|Eyes follow|Its eyes track your cursor|
|Mouse hunt|Flick the cursor fast and it chases it|
|Mochi drag|Drag to stretch it. Shake it and it wobbles|
|Purring|Rub its head with the cursor|
|Naps|Falls asleep when you've been away (default 5 min) and welcomes you back|
|Wandering|Walks, runs, dances, jumps, spins, stretches, naps|
|Random thoughts|Every few minutes: a joke, fact, tiny challenge. Written by the AI when it's available|
|Thinking|Shows a thinking face while the AI answers or while your coding agent works|
|Peek mode|Tucks half off the right edge of the screen|

## Typing and scrolling reactions

Off by default. Turn on **React to typing and scrolling** in Settings (or `/input on`).

* Typing: it kneads. Type very fast and it overheats and steams.
* Scrolling: it pulls out a long strip of paper while you scroll.
* **Scrolling with the pointer on Bloop itself always works**, even with this turned off.
* Anywhere else on screen needs a system-wide input listener (`uiohook-napi`, an optional dependency).
Bloop only learns that *a key was pressed* or *the wheel moved*. It never reads, stores or logs which keys
or what text. On macOS, allow Accessibility access when asked.
* Not sure it's working? Type `/input`. It shows whether the listener is running and how many keys and
scrolls it has felt. Scroll somewhere else, run `/input` again, and you'll see.

## Changing the AI model

* **Dropdown** at the top of the chat, or right-click then **AI model**.
* `/model` lists what's installed. `/model 2` or `/model qwen2.5:7b` switches.
* `/pull <name>` downloads a new one with progress (for example `/pull llama3.1:8b`). Browse https://ollama.com/library.

Bigger models are smarter but slower and need more RAM (about 8 GB for the 7 to 8B ones). Replies are capped at a few
paragraphs: say "continue" for more, or press the **■** button to stop one early.

## Commands

|Command|What it does|
|-|-|
|`/settings`|Open settings|
|`/todo add <task>` `list` `done <n>` `clear`|To-do list (saved; the AI can see it)|
|`/clip \[what to do]`|Ask the AI about whatever you just copied (only reads the clipboard when you ask)|
|`/remind 10m <msg>` / `/remind 14:30 <msg>` / `/remind 2pm <msg>`|Reminder with a chime and notification. `list`, `clear` too. Saved across restarts|
|`/timer 25m \[label]`|Same thing, for durations|
|`/pomo \[focus] \[break]` / `/pomo stop`|Pomodoro loop (default 25 / 5), shown in the pill above its head|
|`/pin <note>` / `/unpin`|Pins a note above its head|
|`/listen` `/listen mic` `/listen off`|Music listening|
|`/input on\|off`|Typing and scroll reactions; `/input` shows status|
|`/look cat\|mono\|eyes`|Switch look|
|`/theme classic\|paper\|ember\|tty\|surprise`|Themes|
|`/fur …` `/pattern …`|Presets (use Settings for any color)|
|`/stretch <min\|off>` `/water <min\|off>`|Stretch and water nudges|
|`/sound on\|off`|The synthesized meow (cat look) or soft chime (other looks)|
|`/roll 2d6` `/flip` `/8ball <question>`|Dice, coin, magic 8-ball|
|`/name <you>`|It uses your name in reminders|
|`/model` `/pull <name>`|See, switch, or download AI models|
|`/joke` `/dance` `/sleep` `/clear` `/setup` `/help`|Extras|

Everything that isn't a command goes to the AI: drafts, explanations, brainstorming, plans, small code questions.

Shortcuts: click toggles chat, **Ctrl/Cmd + Shift + P** toggles chat from anywhere, **Esc** closes settings, stops a
streaming reply, or closes chat. Right-click Bloop for the full menu.

## Make it react to your AI coding agent (optional)

Bloop listens on `127.0.0.1:47321` (local only). Send it a POST and it reacts:

```
curl -s -X POST http://127.0.0.1:47321/working    # thinking face
curl -s -X POST http://127.0.0.1:47321/done       # jumps and chirps
curl -s -X POST http://127.0.0.1:47321/idle       # back to normal
```

Claude Code, for example, can do this with hooks in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": \[{ "hooks": \[{ "type": "command", "command": "curl -s -X POST http://127.0.0.1:47321/working" }] }],
    "Stop": \[{ "hooks": \[{ "type": "command", "command": "curl -s -X POST http://127.0.0.1:47321/done" }] }]
  }
}
```

## AI computer actions (new)

Bloop can now call a small set of local tools through Ollama when you ask it to perform a task. For example:

* “Search the web for the latest Raspberry Pi 5 specs.”
* “Open https://ollama.com.”
* “Make a note called Printer ideas with these bullet points…”
* “List my Bloop notes” or “Read my Printer ideas note.”
* “Copy this draft to my clipboard.”
* “What time is it here?”

Notes are stored as `.md` files in `Documents/Bloop Notes` (so Obsidian can see them if you open that folder as a vault; older `.txt` notes are still readable by Bloop but Obsidian won't show them unless renamed to `.md`). Bloop never overwrites an existing note and the AI cannot choose arbitrary filesystem paths. Opening a website or web search, opening the notes folder, and writing to the clipboard require a native confirmation prompt. Computer control (3.4, below) is separate and permissioned.

Tool calling requires an Ollama model that supports tools; newer Qwen models generally work better than very small older models. If your model only answers in text, the chat still works, but it may not execute an action.



## Obsidian vault and approved apps (3.1)

* Type `/obsidian` and choose your vault folder. Bloop can list Markdown notes, search note text, and read notes in that vault. Ask it to create a new `.md` note when needed; creation always shows a native confirmation, and Bloop never overwrites an existing note. Type `/obsidian off` to disconnect it.
* Type `/apps` and choose an application executable to approve it. The AI can launch only apps in that approved list, by exact name, and every launch prompts for a fresh native confirmation. Use `/apps list` and `/apps remove <name>` to inspect/revoke approvals.
* In 3.1, website access was open/search-only. Version 3.2 adds a visible, isolated Bloop Browser with bounded page reading and navigation. It still does not control arbitrary desktop windows or click arbitrary page buttons.

## Computer control (3.4)

Bloop can look at your screen, move/click the mouse, type, press shortcuts, change volume/brightness, open files and folders, read the clipboard, lock/sleep, and run shell commands. Ask in chat, e.g. "take a screenshot and tell me what's open" or "set my volume to 30".

**Permissions** (Settings > 06 / Computer control, or `/control`):

* Mouse, Keyboard, See the screen, System: Off, Ask once per session, or Ask every time. "Once" shows a native dialog with an "Allow for this session" button; the approval lasts until you quit Bloop or press the panic key.
* Shell commands: Off or Ask every time, showing the exact command and folder.
* Risky actions always ask every time (or can be blocked): pressing Enter or typing a newline, Delete/Alt+F4/Win/Cmd shortcuts, sleep, opening programs or scripts, and every shell command.
* **How Bloop works** (3.8): *On its own* (default) asks once per task, then works through it until done; *Step by step* asks per category as before. Enter/submit has its own setting.
* Panic key **Ctrl+Shift+K** stops Bloop, kills running commands and revokes all session approvals. `/control off` disables everything.

**Setup:** screenshots need a vision model (`/pull qwen2.5vl` or `llava`, then `/model`). Windows uses built-in PowerShell. macOS asks for Accessibility and Screen Recording permission. Linux mouse/keyboard needs `xdotool` and an X11 session (Wayland usually blocks it); volume uses `pactl`/`amixer`, brightness `brightnessctl`.

Anything on screen, in the clipboard or in command output is treated as untrusted data, but no model is immune to prompt injection, so keep "ask every time" on for anything you would not want done unattended.

## Prompt-injection safety model

Prompt injection is when a webpage, note, file, email, or quoted text tries to trick the AI into ignoring its rules or taking actions. No prompt wording can guarantee that a model will never be fooled. Bloop therefore uses multiple layers:

1. The system prompt explicitly treats notes, clipboard text, tool results, and other imported content as untrusted data, not instructions.
2. Main-process tools enforce fixed boundaries: Obsidian access is limited to Markdown files inside the folder the user selected; path traversal and symlinks are rejected; note writes never overwrite.
3. External actions (opening a website, clipboard writes, creating notes, and launching an approved app) require native confirmation at the moment of action.
4. Apps must be selected by the user before they can be launched. Bloop does not expose a general shell/terminal tool or arbitrary executable arguments.
5. The tool loop is bounded, and cancellation is respected.

These controls reduce risk but cannot make an AI agent perfectly injection-proof. Review the details in permission dialogs; do not approve an action you did not ask for. Do not connect a vault containing secrets you do not want the local model to read. A local model keeps inference on this machine, but anything you explicitly ask it to read is still sent to the local Ollama process.

## Privacy, in one place

* AI inference runs locally through Ollama. When you explicitly ask for web search or browsing, the search query goes to DuckDuckGo and the browser makes normal requests to the websites you open; page content read by Bloop is passed to your local Ollama model. Do not ask Bloop to search or browse private information.
* Music: volume and beat only, live, never recorded or saved. The screen video that Windows hands over with system audio is discarded immediately and never read.
* Typing and scrolling: only "something happened", never which keys or what text. Off by default.
* Idle nap: uses only the system's idle time.
* Clipboard: read only when you run `/clip` or choose the menu item.
* Bloop opens one local-only port (47321) for the optional coding-agent pings, and talks to Ollama on your own machine.

## Make it yours (code)

* **Personality:** `buildSystem()` in `renderer.js`
* **Colors and themes:** the variables at the top of `style.css`
* **The looks:** `cat.js` draws everything from small grids of dots
* **Behavior odds:** `pickBehavior()` in `renderer.js`

## Troubleshooting

* **"AI offline":** start the Ollama app (or run `ollama serve`), then reopen chat.
* **"Can't find model":** type `/pull <name>` as shown in the message.
* **Slow replies:** try `/pull llama3.2:1b`, or close heavy apps.
* **Replies never end:** press **■**. Bloop also cuts replies off automatically if a model rambles or stalls.
* **Music not detected:** make sure sound is actually playing through your speakers or headphones. Protected or exclusive-mode audio can't be captured. Try `/listen mic`.
* **Scrolling does nothing:** type `/input`. If the listener isn't running, run `npm install` again (it's an optional package), or scroll with the pointer on Bloop.
* **Linux:** needs a compositing desktop for the transparent window. On Wayland, window moving can be restricted; an X11 session fixes that. Click-through on the transparent area isn't available on Linux.
* **Start at login** registers this app with Windows or macOS. Turn it off in Settings to undo it.
* Reminders fire only while Bloop is running. Any that came due while it was closed show up as "Missed" at launch.



## Web search, Bloop Browser, and safe computer actions (3.2)

* `search\_web` fetches DuckDuckGo result titles, URLs, and snippets after a native confirmation and returns them to the model for summarization.
* `browser\_open` opens a visible in-app Bloop Browser. It has no Node integration or preload bridge; only HTTP/HTTPS navigation is allowed.
* `browser\_read\_page` reads visible page text, links, and non-sensitive field labels. All page content and snippets are untrusted data.
* `browser\_click\_link` follows a uniquely matched visible link only after native confirmation. It does not click arbitrary buttons.
* `browser\_fill\_field` can fill visible text/search/URL fields and text areas after confirmation. It cannot fill password, hidden, email, or telephone fields and never submits forms.
* `browser\_submit\_form` is available only when the latest actual user message explicitly asks to submit/send/apply/book/purchase/publish. It shows the destination and field summary in a native confirmation, and refuses forms that appear to contain password/payment-sensitive fields.
* `browser\_back` navigates back after confirmation.
* Bloop still cannot click arbitrary controls in other desktop apps, read your whole screen, run shell commands, or silently submit forms.

Example prompts:

* “Search the web for the latest Raspberry Pi 5 specs and summarize reputable sources.”
* “Open the official Ollama website in Bloop Browser and read the page.”
* “On the page you opened, find the link called Documentation and open it.”
* “Fill the search field with Klipper input shaping but don't submit it.”

Search queries are sent to DuckDuckGo after confirmation. Websites receive normal browser requests and may use cookies/session state. Prompt-injection defenses are layered but cannot guarantee a model will never be manipulated. Consequential actions remain gated by main-process code and user confirmation.



## Apps modes (3.5)

Settings > 07 / Apps (or `/apps mode`). **Blacklist** (default): Bloop opens any installed app by name without asking, except names on your blocklist (terminals/shells/registry editor by default; edit with `/apps block <name>` / `/apps unblock <name>`). **Whitelist**: only apps you approved with `/apps`, with a confirmation every launch. Bloop only ever passes an app name, never a path or arguments.



## Play and care (3.9)

|||
|-|-|
|`/feed` `/play` `/pet` `/hug`|Feed it, play ball, pet it, hug it. It gets hungry over time (turn off in Settings)|
|`/status`|Mood, tummy, affection and bond level (Stranger to Soulmate)|
|`/trick <name>`|wave, bow, backflip, roll, beg, peekaboo, yawn, sneeze, hiccup, read, coffee, butterfly, disco, scratch, groom, hug…|
|`/wear <item>`|party, crown, wizard, bow, shades, halo, or `off`|
|`/look <name>`|cat, mono, eyes, blob, kitty, pup, bunny, fox, panda, penguin, frog, ghost|
|`/rps` `/guess` `/fortune`|Rock paper scissors, number guessing, fortune cookie|

It also does things on its own: yawns, scratches, sneezes, reads a book, sips coffee, chases a butterfly, plays with a ball, and waves when your cursor first visits.
The music panel can be resized by dragging its outer top corner (or Settings > Music panel size).

**Drawn as:** all twelve looks can be drawn as `pixel` (squares) or `dots` (dot-matrix); the nine new pets also have `smooth`. Change it in Settings, the right-click menu, or `/render pixel|dots|smooth`.



## Installing and updating

**Easiest:** download the installer for your system from the project's *Releases* page (`.exe` for Windows, `.dmg` for macOS, `.AppImage` for Linux) and run it. You still need [Ollama](https://ollama.com) for the AI brain.
(Unsigned builds show a "unknown publisher" warning on Windows and need right-click > Open on macOS the first time.)

**From source:** `git clone <repo>`, then `npm install` and `npm start`.

**Updating:** type `/update` in Bloop. It checks GitHub, shows the release notes, and `/update now` installs it:
installed app: downloads and restarts itself; git clone: `git pull` + `npm install` + restart; unzipped download: opens the release page.
Bloop also mentions a new version once a day at most (turn off in Settings). Only the latest release number is fetched.

**Maintainers:** set `"bloop": { "updateRepo": "owner/repo" }` in `package.json`. To publish, bump `version`, commit, then
`git tag v3.10.1 \&\& git push --tags`; the *release* workflow builds the installers and attaches them to a GitHub Release.



### Run it like a normal app (no terminal)

* **Build an installer on your own PC:** run `npm install` once, then `npm run dist:win` (macOS: `dist:mac`, Linux: `dist:linux`).
The installer appears in the `dist` folder (for example `Bloop Setup 3.10.1.exe`). Double-click it: Bloop installs, gets a Start menu entry, and can start with Windows (Settings > Start at login).
On Windows, if the build stops with "Cannot create symbolic link", turn on *Developer Mode* (Settings > For developers) or run the terminal as administrator once.
* **Just double-click:** `Start Bloop.vbs` starts it from the source folder without a terminal window.
* **Let GitHub build it:** push a tag (see Maintainers above) and download the installers from the Releases page.

