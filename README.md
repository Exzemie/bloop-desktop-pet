# Bloop

A small dot-matrix companion that lives on your desktop. It reacts to your mouse, your music, your typing and
your scrolling. It naps when you leave, keeps your time, and has an **AI brain** you can talk to and hand tasks to:
free and private on your own computer, or plugged into a cloud AI such as Claude, OpenAI or Gemini.

Twelve looks: three dot-matrix ones (a color **cat**, a white-on-black **mono** cat, and an **OLED eyes** face) and
nine smooth pets (**blob, kitty, pup, bunny, fox, panda, penguin, frog, ghost**). Everything is drawn in code and
customizable.

**Contents:** [Install](#install) · [First run](#first-run) · [Settings](#make-it-yours-settings) ·
[What it does by itself](#things-it-does-by-itself) · [Your cat's pattern](#your-cats-pattern) · [Play and care](#play-and-care) · [Music](#listening-to-music) ·
[Typing and scrolling](#typing-and-scrolling-reactions) · [Chat](#chat) · [AI brains](#ai-brains-local-or-cloud) · [Commands](#commands) ·
[AI actions](#ai-actions) · [Computer control](#computer-control) · [Safety](#prompt-injection-safety-model) ·
[Privacy](#privacy-in-one-place) · [Coding-agent hook](#make-it-react-to-your-ai-coding-agent-optional) ·
[Updating](#updating) · [Building](#building-an-installer) · [Hacking on it](#hacking-on-it) ·
[Troubleshooting](#troubleshooting)

## Local or cloud: your choice

By default Bloop thinks **on your own computer** through [Ollama](https://ollama.com): no account, no API key, no
cap, works offline. The trade-off is that answers are only as good as the model your machine can run.

If you want a smarter brain, plug in a **cloud AI** with your own API key (see [AI brains](#ai-brains-local-or-cloud)).
You can switch back and forth any time with `/ai`.

## Install

**Easiest:** download the installer for your system from the
[Releases page](https://github.com/Exzemie/bloop-desktop-pet/releases) (`.exe` for Windows, `.dmg` for macOS,
`.AppImage` for Linux) and run it. Unsigned builds show an "unknown publisher" warning on Windows and need
right-click > Open on macOS the first time.

**From source:**

1. Install **Node.js** 20+: https://nodejs.org
2. `git clone https://github.com/Exzemie/bloop-desktop-pet.git`
3. In that folder: `npm install`, then `npm start`
   (On Windows PowerShell, if it says scripts are disabled, use `npm.cmd install` and `npm.cmd start`.)

On Windows you can also double-click `Start Bloop.vbs` to start it from the source folder with no terminal window.

## First run

1. Install **Ollama**: https://ollama.com/download (or click Bloop and type `/setup`).
2. Click Bloop and type `/pull llama3.2:3b` (or any other model). It downloads the AI model for you, about 2 GB, once.
3. Ask it anything. Type `/` to browse every command.

Prefer a cloud AI? Skip steps 1 and 2: type `/ai claude` (or `/ai openai`, `/ai gemini`, …), paste your API key into
the box that opens, and press Save.

## Make it yours: Settings

Click Bloop to open chat, then press **SET** at the top (or type `/settings`, or right-click then **Settings…**).

| | |
|-|-|
|**AI brain**|Local or cloud provider, API key, model, thinking effort or creativity, reply length, personality, reply style, custom instructions, memory, cloud safety and a daily limit|
|**Body**|Size (50 to 200%), opacity, walking speed|
|**Look and color**|Look (twelve of them), drawn as pixel / dots / smooth, theme (Classic, Paper, Ember, TTY), pattern, fur or casing color (any color), dot color (eyes and mono), accent color|
|**Behavior**|Wander, random antics, AI thoughts, react to typing and scrolling, listen to music, peek mode, nap when you're away, hunger and mood|
|**Care**|Stretch and water reminders, your name|
|**Computer control**|What the AI may do on your computer, and how often it must ask|
|**Apps**|Which apps the AI may open|
|**System**|Sound and volume, always on top, start at login, update checks, reset everything|

Everything is saved. There's also a **tray icon** (Show/hide, Bring to front, Settings, Quit), so Bloop can never get lost.

## Things it does by itself

| | |
|-|-|
|Eyes follow|Its eyes track your cursor|
|Mouse hunt|Flick the cursor fast and it chases it|
|Mochi drag|Drag to stretch it. Shake it and it wobbles|
|Purring|Rub its head with the cursor|
|Naps|Falls asleep when you've been away (default 5 min) and welcomes you back|
|Wandering|Walks, runs, dances, jumps, spins, stretches, naps|
|Antics|Yawns, scratches, sneezes, reads a book, sips coffee, chases a butterfly, plays with a ball, waves when your cursor first visits|
|Random thoughts|Every few minutes: a joke, fact, tiny challenge. Written by the AI when it's available|
|Thinking|Shows a thinking face while the AI answers or while your coding agent works|
|Peek mode|Tucks half off the right or left edge of the screen (`/peek left`), and steps out only for reminders and timers|

## Your cat's pattern

Give Bloop the markings of the cat you live with. Open **Settings > Paint your own pattern** (or type `/paint`):
a big copy of the pixel cat appears, and you click or drag to paint it.

* Two colors, any shade (click the round swatches), plus an eraser.
* **Mirror left and right** paints both sides at once.
* **Start from…** copies tabby, calico, tuxedo or points so you can adjust instead of starting blank.
* Bloop changes as you paint. The painting is saved, and stays even if you switch to a built-in pattern and back.

Painted patterns apply to the pixel cat; the built-in patterns also work on kitty and pup.

## Play and care

| | |
|-|-|
|`/feed` `/play` `/pet` `/hug`|Feed it, play ball, pet it, hug it. It gets hungry over time (turn off in Settings)|
|`/status`|Mood, tummy, affection and bond level (Stranger to Soulmate)|
|`/trick <name>`|wave, bow, backflip, roll, beg, peekaboo, yawn, sneeze, hiccup, read, coffee, butterfly, disco, scratch, groom, hug…|
|`/wear <item>`|party, crown, wizard, bow, shades, halo, or `off`|
|`/look <name>`|cat, mono, eyes, blob, kitty, pup, bunny, fox, panda, penguin, frog, ghost|
|`/render pixel\|dots\|smooth`|All twelve looks can be drawn as square pixels or a dot-matrix; the nine new pets also have smooth|
|`/rps` `/guess` `/fortune`|Rock paper scissors, number guessing, fortune cookie|

## Listening to music

Turn on **Listen to music** in Settings (or `/listen`). While sound is playing, Bloop closes its eyes, grooves on the
beat, floats music notes, and shows a little equalizer with the tempo, the song name, transport buttons, a seek bar
and a volume slider (each part can be switched off in Settings; drag the panel's outer top corner to resize it).

* It uses your **system audio output** (what you hear), not the microphone. On Windows this just works.
* Only the **volume and beat** are analysed, live. **Nothing is recorded, saved, or sent anywhere**, and the audio is never played back.
* `/listen mic` uses the microphone instead, as a fallback. Same rule: levels only.
* On macOS (and some Linux setups), system audio capture usually isn't available when running with `npm start`. Use `/listen mic` there.
* Song info and controls come from your media session: Windows (any app that reports to the system media controls), macOS (Spotify or Music), Linux (needs `playerctl`).
* If it can't start, Bloop tells you why.

## Typing and scrolling reactions

Off by default. Turn on **React to typing and scrolling** in Settings (or `/input on`).

* Typing: it kneads. Type very fast and it overheats and steams.
* Scrolling: it pulls out a long strip of paper while you scroll.
* **Scrolling with the pointer on Bloop itself always works**, even with this turned off.
* Anywhere else on screen needs a system-wide input listener (`uiohook-napi`, an optional dependency).
  Bloop only learns that *a key was pressed* or *the wheel moved*. It never reads, stores or logs which keys
  or what text. On macOS, allow Accessibility access when asked.
* Not sure it's working? Type `/input`. It shows whether the listener is running and how many keys and
  scrolls it has felt.

## Chat

Click Bloop (or press **Ctrl/Cmd + Shift + P** from anywhere) to open the chat.

* **Type `/`** and a list of matching commands appears. Up/Down to choose, Tab or Enter to fill it in, Esc to close it.
* **Up arrow** in an empty box brings back what you sent before, like a terminal.
* **Enter** sends, **Shift+Enter** adds a line. The box grows as you type.
* Replies are formatted: code comes in a block with a **Copy** button, and `inline code` and **bold** are drawn properly.
* **■** (or Esc) stops a reply. `/retry` asks the last question again.
* Drag the chat's top edge, right edge or top-right corner to resize it. The size is remembered.
* **Esc** closes settings, then stops a streaming reply, then closes chat. Right-click Bloop for the full menu.

### Changing the AI model

* **Dropdown** at the top of the chat, or right-click then **AI model**.
* `/model` lists what's installed. `/model 2` or `/model qwen2.5:7b` switches.
* `/pull <name>` downloads a new one with progress (for example `/pull llama3.1:8b`). Browse https://ollama.com/library.
* `/think on` shows the model's reasoning above the answer (reasoning models such as qwen3 or deepseek-r1).
* `/selftest` checks what the current model can do (tools, images) and times a tiny reply.

Bigger models are smarter but slower and need more RAM (about 8 GB for the 7 to 8B ones). With a cloud brain, `/model`
lists that provider's models and `/model <name>` takes any name it offers.

## AI brains: local or cloud

Pick the brain in **Settings > 00 / AI BRAIN**, with `/ai`, or right-click Bloop > **AI brain**.

| Brain | Where it runs | Needs |
|-|-|-|
|Ollama|Your computer|[Ollama](https://ollama.com) and a model (`/pull`)|
|LM Studio|Your computer|[LM Studio](https://lmstudio.ai) with its local server started|
|Anthropic Claude|Cloud|API key|
|OpenAI|Cloud|API key|
|Google Gemini|Cloud|API key|
|OpenRouter|Cloud|API key (one key, hundreds of models)|
|Groq|Cloud|API key|
|Mistral|Cloud|API key|
|DeepSeek|Cloud|API key|
|xAI Grok|Cloud|API key|
|Together AI|Cloud|API key|
|Custom|Wherever you point it|Any server that speaks the OpenAI chat API (vLLM, llama.cpp server, Jan, LocalAI, a company gateway…)|

**Connecting one:** choose it, press **Get a key** to open the provider's key page, paste the key and press **Save**.
Bloop checks the key right away and tells you if it was rejected. Cloud use is billed by the provider to your account.

**Keys are kept safe:** they are encrypted with your operating system's keychain, never shown again (only the last
four characters), and only ever sent to that provider. **Remove key** deletes it.

**Options** (Settings > 00 / AI BRAIN):

* **Model**: any model the provider offers, with its list as suggestions (↻ refreshes it).
* **API address**: for the custom server, LM Studio or Ollama on another port, or a company proxy.
* **Thinking effort** (Claude): from Low (fastest, cheapest) to Max. **Creativity** and **Max reply length** (other providers).
* **Context window** (Ollama): bigger remembers more but needs more RAM.
* **Personality**: Friendly, Playful, Calm, Nerdy, Sassy, Professional or Pirate.
* **Reply style**: Short, Balanced or Detailed.
* **Custom instructions**: anything you want it to always know or do ("Call me Captain. Answer in Spanish.").
* **Memory**: how many recent messages are sent with each question (4 to 40).
* **Show AI reasoning**: works with Claude and with reasoning models on other providers.

**Cloud safety and cost:**

* **Let cloud AI see screenshots** is off by default: computer control still works, but pictures of your screen are
  never uploaded unless you turn it on.
* **Cloud AI for random thoughts** is off by default, so the unprompted jokes and fortunes do not cost anything.
* **If the cloud fails, use Ollama**: when the cloud cannot answer (offline, out of credit), your local model does.
* **Daily cloud request limit**: Bloop stops sending cloud requests after this many per day. One question can take
  several requests while Bloop uses tools.
* `/usage` shows today's requests and tokens per provider.

With Claude, Bloop uses Anthropic's official SDK, lets Claude decide how much to think, and turns on Anthropic's
automatic fallback to another Claude model if one declines a request. Claude ignores Creativity and Max reply length.

## Commands

|Command|What it does|
|-|-|
|`/help` `/abilities`|Every command, grouped; what the AI can do for you|
|`/settings`|Open settings|
|`/todo add <task>` `list` `done <n>` `undo <n>` `remove <n>` `clear`|To-do list (saved; the AI can see it). `clear` removes finished tasks|
|`/remind 10m <msg>` / `/remind 14:30 <msg>` / `/remind 2pm <msg>`|Reminder with a chime and notification. `list`, `remove <n>`, `clear` too. Saved across restarts|
|`/timer 25m [label]`|Same thing, for durations|
|`/pomo [focus] [break]` / `pause` `resume` `status` `stop`|Pomodoro loop (default 25 / 5), shown in the pill above its head. Counts today's sessions and survives a restart|
|`/pin <note>` / `/unpin`|Pins a note above its head|
|`/clip [what to do]`|Ask the AI about whatever you just copied (only reads the clipboard when you ask)|
|`/retry` `/clear`|Ask the last question again; empty the chat|
|`/ai` `/ai <brain>` `/ai key`|See or switch the AI brain (ollama, lmstudio, claude, openai, gemini, openrouter, groq, mistral, deepseek, grok, together, custom); open its settings|
|`/usage`|Today's AI requests and tokens, per provider|
|`/model` `/pull <name>` `/think on\|off`|See, switch, or download AI models; show reasoning|
|`/listen` `/listen mic` `/listen off`|Music listening|
|`/input on\|off`|Typing and scroll reactions; `/input` shows status|
|`/look <name>` `/render pixel\|dots\|smooth`|Switch look and drawing style|
|`/paint`|Paint your own cat's markings|
|`/peek` `/peek left\|right\|off`|Peek mode|
|`/agent` `/agent claude\|codex\|cursor\|other\|test`|Coding-agent reactions: status, setup snippets, a demo|
|`/theme classic\|paper\|ember\|tty\|surprise`|Themes|
|`/fur …` `/pattern …` `/wear …`|Presets and accessories (use Settings for any color)|
|`/feed` `/play` `/pet` `/hug` `/status` `/trick <name>`|Play and care|
|`/stretch <min\|off>` `/water <min\|off>`|Stretch and water nudges|
|`/sound on\|off`|The synthesized voice (each look has its own)|
|`/roll 2d6` `/flip` `/8ball <question>` `/rps` `/guess` `/fortune` `/joke`|Dice, coin, magic 8-ball, games|
|`/name <you>`|It uses your name in reminders|
|`/obsidian` `/obsidian off`|Connect or disconnect an Obsidian vault|
|`/apps …`|Which apps the AI may open (see below)|
|`/control` `/control on\|off\|revoke`|Computer-control status and switches|
|`/selftest`|Check the model, notes folder, Obsidian and computer control|
|`/update` `/update now` `/version`|Check for and install a new version|
|`/front`|Bring Bloop back on top (also **Ctrl/Cmd + Shift + B**)|
|`/dance` `/sleep` `/setup`|Extras|

Mistype one and Bloop suggests the closest match. Everything that isn't a command goes to the AI: drafts,
explanations, brainstorming, plans, code questions.

## AI actions

Bloop can call a small set of local tools through Ollama when you ask it to do something. For example:

* "Search the web for the latest Raspberry Pi 5 specs and summarize reputable sources."
* "Open https://ollama.com."
* "Make a note called Printer ideas with these bullet points…"
* "List my Bloop notes" or "Read my Printer ideas note."
* "Copy this draft to my clipboard."
* "Open Spotify."

Tool calling needs an Ollama model that supports tools; newer Qwen and Llama 3.1+ models work better than very small
older ones. If your model only answers in text, chat still works, and Bloop tells you it cannot take actions with it.

**Notes.** Stored as `.md` files in `Documents/Bloop Notes` (open that folder as an Obsidian vault if you like). Bloop
never overwrites an existing note and the AI cannot choose arbitrary filesystem paths.

**Obsidian.** Type `/obsidian` and choose your vault folder. Bloop can list, search and read Markdown notes in that
vault, and create a new `.md` note after a confirmation. It never overwrites one. `/obsidian off` disconnects it.

**Web search and Bloop Browser.**

* `search_web` fetches DuckDuckGo result titles, URLs and snippets after a confirmation, for the model to summarize.
* "Open <site>" uses your normal browser. The separate, visible **Bloop Browser** window is used only when Bloop has
  to read or click through a page for you. It has no Node integration or preload bridge, and only HTTP/HTTPS
  navigation is allowed.
* It can read visible page text, links and non-sensitive field labels; find text; scroll; follow a uniquely matched
  visible link (after a confirmation); and go back.
* It can fill visible text/search/URL fields after a confirmation. It cannot fill password, hidden, email or
  telephone fields, and filling never submits.
* Submitting a form is possible only when your own latest message explicitly asks to submit/send/apply/book/purchase/
  publish. It shows the destination and field summary in a confirmation, and refuses forms that appear to contain
  password or payment fields.

**Apps** (Settings > Apps, or `/apps mode`).

* **Blacklist** (default): Bloop opens any installed app by name without asking, except names on your blocklist
  (terminals, shells and the registry editor by default; edit with `/apps block <name>` / `/apps unblock <name>`).
* **Whitelist**: only apps you approved with `/apps`, with a confirmation every launch. `/apps list` and
  `/apps remove <name>` inspect and revoke approvals.
* Bloop only ever passes an app name, never a path or arguments.

## Computer control

Off until you turn it on. Bloop can look at your screen, move/click the mouse, type, press shortcuts, change
volume/brightness, open files and folders, read the clipboard, lock/sleep, and run shell commands. Ask in chat, e.g.
"take a screenshot and tell me what's open" or "set my volume to 30".

**Permissions** (Settings > Computer control, or `/control`):

* Mouse, Keyboard, See the screen, System: Off, Ask once per session, or Ask every time. "Once" shows a native dialog
  with an "Allow for this session" button; the approval lasts until you quit Bloop or press the panic key.
* Shell commands: Off or Ask every time, showing the exact command and folder.
* Risky actions always ask every time (or can be blocked): Delete/Alt+F4/Win/Cmd shortcuts, sleep, opening programs
  or scripts, and every shell command. Pressing Enter / submitting has its own setting.
* **How Bloop works:** *On its own* (default) asks once per task, then looks, clicks, types and verifies by itself
  for up to 40 steps; *Step by step* asks per category.
* Panic key **Ctrl+Shift+K** stops Bloop, kills running commands and revokes all session approvals.
  `/control off` disables everything.

**Setup:** screenshots need a vision model (`/pull qwen2.5vl` or `llava`, then `/model`). Windows uses built-in
PowerShell. macOS asks for Accessibility and Screen Recording permission. Linux mouse/keyboard needs `xdotool` and an
X11 session (Wayland usually blocks it); volume uses `pactl`/`amixer`, brightness `brightnessctl`.

## Prompt-injection safety model

Prompt injection is when a webpage, note, file, email or quoted text tries to trick the AI into ignoring its rules or
taking actions. No prompt wording can guarantee that a model will never be fooled, so Bloop uses several layers:

1. The system prompt treats notes, clipboard text, web pages, screenshots, command output and tool results as
   untrusted data, not instructions.
2. The main process enforces fixed boundaries: note tools only touch `Documents/Bloop Notes` and Markdown files inside
   the vault you selected; path traversal and symlinks are rejected; note writes never overwrite.
3. External actions (searching, opening a website, clipboard writes, creating notes, following links, filling and
   submitting forms) need a native confirmation at the moment of action.
4. Apps are launched by name only, subject to your blocklist or approved list. Shell commands exist only inside
   computer control, which is off by default, and each one shows the exact command and asks every time.
5. The tool loop is bounded, repeated identical actions stop it, and Stop / the panic key are always respected.

These controls reduce risk but cannot make an AI agent injection-proof. Read permission dialogs; do not approve an
action you did not ask for. Keep "ask every time" on for anything you would not want done unattended. Do not connect
a vault containing secrets you do not want the local model to read.

## Privacy, in one place

* With Ollama or LM Studio, AI inference runs on your computer. With a cloud brain, what you type, and anything Bloop
  reads for you (web pages, notes, clipboard text you share, tool results), is sent to that provider, under their
  pricing and privacy policy. Screenshots are only sent if you allow it. When you explicitly ask for web search or
  browsing, the search query goes to DuckDuckGo and the browser makes normal requests to the websites you open. Do not
  ask Bloop to search or browse private information.
* API keys are encrypted with your system keychain and only sent to the provider they belong to.
* Music: volume and beat only, live, never recorded or saved. The screen video that Windows hands over with system
  audio is discarded immediately and never read.
* Typing and scrolling: only "something happened", never which keys or what text. Off by default.
* Idle nap: uses only the system's idle time.
* Clipboard: read only when you run `/clip`, choose the menu item, or (with computer control on) approve the AI
  reading it. The **Copy** button on a code block writes only that code.
* Updates: only the latest release number is fetched from api.github.com, at most once a day (turn off in Settings).
* Bloop opens one local-only port (47321) for the optional coding-agent pings, and talks to Ollama on your own
  machine. Requests to that port from web pages are refused.
* Your settings live in a small `state.json` in the app's data folder. It is written atomically with a rolling backup,
  so a crash mid-save cannot wipe your to-dos, reminders or bond level.

## Make it react to your AI coding agent (optional)

Bloop listens on `127.0.0.1:47321` (local only). Send it a POST and it reacts:

```bash
curl -s -X POST "http://127.0.0.1:47321/working?agent=claude"    # thinking face
curl -s -X POST "http://127.0.0.1:47321/done?agent=claude"       # hops and says "Claude Code is done"
curl -s -X POST "http://127.0.0.1:47321/idle?agent=claude"       # back to normal
```

`?agent=` is optional. With it, Bloop says which agent finished and how long it took, and if several are working
it keeps thinking until the last one is done.

**The quick way:** type `/agent claude`, `/agent codex`, `/agent cursor` or `/agent other` in Bloop and copy the
snippet it gives you. `/agent` shows who is working and the last ping; `/agent test` shows the reaction.

Claude Code, for example, uses hooks in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "curl -s -X POST \"http://127.0.0.1:47321/working?agent=claude\"" }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "curl -s -X POST \"http://127.0.0.1:47321/done?agent=claude\"" }] }]
  }
}
```

Hook formats differ between tools and change between versions, so check the tool's own docs if Bloop does not react.

## Updating

Type `/update` in Bloop. It checks GitHub, shows the release notes, and `/update now` installs it:

* installed app: downloads the new version and restarts itself
* git clone: `git pull --ff-only` + `npm install` + restart
* unzipped download: opens the release page

Bloop also mentions a new version once (Settings > Check for updates daily).

## Building an installer

* **On your own PC:** `npm install` once, then `npm run dist:win` (macOS: `dist:mac`, Linux: `dist:linux`).
  The installer appears in the `dist` folder (for example `Bloop Setup 3.11.0.exe`). Double-click it: Bloop installs,
  gets a Start menu entry, and can start with Windows (Settings > Start at login).
  On Windows, if the build stops with "Cannot create symbolic link", turn on *Developer Mode* (Settings > For
  developers) or run the terminal as administrator once.
* **Let GitHub build it:** bump `version` in `package.json`, commit, then `git tag v3.11.0 && git push --tags`.
  The *release* workflow builds the Windows, macOS and Linux installers and attaches them to a GitHub Release.
* **Forks:** set `"bloop": { "updateRepo": "owner/repo" }` in `package.json` so `/update` looks at your releases.

## Hacking on it

| File | What lives there |
|-|-|
|`main.js`|Electron main process: the window, tray, saving, the chat loop and the AI's tools|
|`providers.js`|Every AI brain (Ollama, LM Studio, Claude via the Anthropic SDK, OpenAI-compatible clouds), API keys, usage|
|`control.js`|Computer control and its permission checks|
|`renderer.js`|Behavior, chat, commands, settings, music, care|
|`cat.js` `smooth.js` `fx.js`|The looks: every pet is drawn from small grids of dots or vector shapes|
|`md.js`|The small, safe formatter for AI replies|
|`media.js` `updater.js`|Media-session controls; `/update`|
|`style.css`|Themes (variables at the top) and all animation|

* **Personality:** `buildSystem()` in `renderer.js`
* **Colors and themes:** the variables at the top of `style.css`
* **Behavior odds:** `pickBehavior()` in `renderer.js`
* **A new command:** add a `case` in `handleCommand()` and a row in `COMMANDS` (that feeds the `/` list)

`npm test` runs the unit tests and `npm run check` syntax-checks every script and smoke-tests the renderers. Both run
in CI on every push. To try the cloud code without a real key, run `node scripts/fake-ai-server.js` and set a brain's
API address to `http://127.0.0.1:47999` (Claude) or `http://127.0.0.1:47999/v1` (custom), with any key.

## Troubleshooting

* **"AI offline":** start the Ollama app (or run `ollama serve`), then reopen chat.
* **"Can't find model":** type `/pull <name>` as shown in the message.
* **Slow replies:** try `/pull llama3.2:1b`, or close heavy apps. `/selftest` times a tiny reply.
* **Replies never end:** press **■**. Bloop also gives up on a model that stalls.
* **It says it did something but nothing happened:** the model probably can't use tools. `/selftest` tells you; try
  qwen3, llama3.1 or qwen2.5.
* **Bloop is hidden behind a window:** **Ctrl/Cmd + Shift + B**, the tray menu, or `/front`.
* **Music not detected:** make sure sound is actually playing through your speakers or headphones. Protected or
  exclusive-mode audio can't be captured. Try `/listen mic`.
* **Scrolling does nothing:** type `/input`. If the listener isn't running, run `npm install` again (it's an optional
  package), or scroll with the pointer on Bloop.
* **Linux:** needs a compositing desktop for the transparent window. On Wayland, window moving can be restricted; an
  X11 session fixes that. Click-through on the transparent area isn't available on Linux.
* **Start at login** registers this app with Windows or macOS. Turn it off in Settings to undo it.
* Reminders fire only while Bloop is running. Any that came due while it was closed show up as "Missed" at launch.

## License

MIT. See [LICENSE](LICENSE).
