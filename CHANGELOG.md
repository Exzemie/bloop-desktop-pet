# Changelog

## 3.1.0
- Added explicit Obsidian vault selection and bounded Markdown list/search/read/create tools.
- Added user-managed app allowlist and confirmation before every app launch.
- Added prompt-injection guidance for untrusted imported content, plus path/symlink boundaries and no-overwrite note creation.
- Added `/obsidian`, `/obsidian off`, `/apps`, `/apps list`, and `/apps remove <name>`.
- Website access remains open/search-only with native confirmation; browser DOM automation and arbitrary shell access are intentionally not included.


## 3.2.0
- Web search now returns DuckDuckGo result titles, URLs, and snippets to the local model after confirmation.
- Added a visible isolated Bloop Browser with page reading, text finding, scrolling, safe field filling, link navigation, and guarded form submission.
- Browser page content and search snippets are explicitly treated as untrusted data.
- Browser has no Node integration or preload; navigation is restricted to HTTP/HTTPS.
- Form submission requires an explicit submit-like action in the latest user message plus a native confirmation; password/payment-sensitive forms are blocked.
- Kept arbitrary shell execution and unrestricted desktop control unavailable.

## 3.3.0
- Notes Bloop creates are now Markdown (`.md`), so they show up in Obsidian when `Documents/Bloop Notes` is opened as a vault. Old `.txt` notes still list/read fine.
- Removed the reply length cutoff and the "[Cut short]" message; replies run until finished or until you press Stop.
- Speech/thought bubble is larger (wider, taller, scrolls if extremely long) and no longer truncates text at 200 characters. The window got a bit taller/wider to fit it.

## 3.4.0
- New computer control: see the screen (screenshots for vision models), mouse, keyboard, system (volume, brightness, open files/folders, clipboard read, lock, sleep) and shell commands.
- Adjustable permissions in Settings > 06 / Computer control: each category can be Off, Ask once per session, or Ask every time. Shell commands are Off or Ask every time.
- Risky actions (Enter / submit, delete and close shortcuts, Win/Cmd shortcuts, sleep, opening programs or scripts, shell commands) always ask every time and can never be approved for a whole session; they can also be blocked entirely.
- `/control` shows status, `/control on|off` toggles, `/control revoke` clears session approvals. Panic key Ctrl+Shift+K stops Bloop, kills running commands and revokes approvals.
- More tool rounds per request (14) so Bloop can look, act and verify. Only the newest screenshot is kept in context.
- Needs: Windows (PowerShell, built in), macOS (Accessibility + Screen Recording permission), Linux (xdotool, X11).

## 3.4.1
- Fixed "action successful but nothing happened": some models only *say* they did something. Bloop now (a) recovers tool calls that models print as JSON text and runs them, (b) shows a warning when a reply claims an action but no tool ran, and (c) tells you when the selected model cannot use tools at all.
- New `/selftest` checks the model's tool/vision support, Obsidian vault, notes folder and computer-control helpers (including a test screenshot).

## 3.4.2
- Bloop Browser now opens centered and in front of other windows (it used to hide behind the always-on-top pet/other apps). "Open <site>" now uses your normal browser; Bloop Browser is only used when Bloop must read or click through a page.
- Multi-step tasks: if a model announces the next step but stops, Bloop nudges it to continue (up to 3 times per request), and the prompt now asks for every step to be finished.

## 3.5.0
- Apps: new Blacklist mode (default). Bloop can open any installed app by name with no prompt, except a blocklist you edit (terminals, shells and the registry editor are blocked by default). Whitelist mode keeps the old approved-apps-only behaviour with a confirmation each time. Switch in Settings > 07 / Apps, or `/apps mode whitelist|blacklist`, `/apps block <name>`, `/apps unblock <name>`.
- Fewer "brain hiccuped: unknown error" messages: thinking is turned off (it left some models with an empty reply), empty replies and malformed tool calls are retried, timeouts are more generous, and real error reasons are shown (for example when Ollama is unreachable or out of memory).

## 3.5.1
- Fixes chat "loading forever" on slower PCs: the prompt had grown very large (about 35 tool definitions plus a long rulebook sent with every message). Now only the tools a request could need are sent (plain chat sends none), the long rules are only sent for action-type requests, and the context window is set explicitly so the prompt is not cut off.
- Shows a "still waking up" note after 10 s with no reply, so a slow first load is not mistaken for a hang.
- `/selftest` now times a tiny chat test and suggests a smaller model if the PC is slow.
- If a model rejects the "thinking off" option, Bloop retries without it.

## 3.6.0
- BPM: new tempo detector. It measures how the music's spectrum rises (about 100 times a second), finds the repeating beat over the last ~8 seconds, prefers everyday tempos, and only changes the shown number after several readings agree. Result: far steadier and more accurate.
- The message box is now multi-line: it grows as you type (up to ~8 lines, then scrolls). Enter sends, Shift+Enter adds a new line.
- New "Show AI reasoning in chat" toggle (Settings, or `/think on|off`). Shows a dashed THINKING block above the answer that folds away when the answer starts; click it to reopen. Needs a reasoning model (qwen3, deepseek-r1).
- The chat window is resizable: drag its top edge, right edge, or top-right corner. The size is remembered. (Reset all settings restores 360x580.)

## 3.7.0
- Bigger reasoning block: it is full chat width, shows about 4 lines folded, and opens to as much as 460 px while streaming or when clicked.
- Music panel upgrade: while music plays, the panel is wider and has the song name above previous / play-pause / next buttons on the left, a seekable time bar under them, and the spectrum with BPM and a volume slider on the right. The window widens automatically while it is shown (so it never covers the cat), and the panel flips to the left side when Bloop is on the right half of the screen.
- Each part can be switched on or off in Settings (song name + controls, time bar, volume slider). With all three off you get the original small spectrum and BPM.
- Song info and controls come from your media session: Windows (any app that reports to the system media controls), macOS (Spotify or Music), Linux (needs playerctl). The volume slider sets system volume.

## 3.8.0
- Music panel sync: the play/pause button and time bar now stay in step with the player. A button press updates the panel instantly and ignores the player's stale "old state" reply for a moment, time freezes exactly where it was when you pause, small timing jitter is smoothed, seeks are held until the player catches up, and Bloop re-checks the player shortly after each command.
- Computer control, middle ground ("On its own", now the default): when a request needs the computer, Bloop asks ONCE ("Let Bloop carry out this task by itself?") and then looks, clicks, types and verifies on its own for up to 40 steps without walking it through each one. Switch back to the old behaviour in Settings > Computer control > How Bloop works.
- Pressing Enter / submitting is a separate setting (allowed during an approved task / ask every time / block). Delete and close shortcuts, Win/Cmd shortcuts, sleep, opening programs and shell commands still ask every time.
- It stops itself if it repeats the same action 3 times, nudges itself on when it announces a step or asks "shall I continue?", and condenses old steps so long tasks fit in the model's memory. Ctrl+Shift+K still stops everything.
- Goals like "play my workout playlist" or "turn the volume down" now get the full toolset even if they name no tool.



## 3.9.0
- **Smooth pets (not dot-matrix):** nine soft vector characters: blob, kitty, pup, bunny, fox, panda, penguin, frog and ghost. Pick one in Settings, the right-click menu (Look) or `/look <name>`. Fur colour, kitty/pup patterns, themes and size all work on them, and each has its own voice.
- **OLED eyes redrawn:** one even bezel instead of stacked borders, a recessed screen with a symmetric 20 x 14 dot grid (equal margins around the eyes and mouth), a soft glow, a status LED, and new faces (sad, heart eyes, blush).
- **About 20 new behaviours:** wave, yawn, scratch, sneeze, hiccup, groom, eat, play ball, read, sip coffee, chase a butterfly, look around, sad/hungry, startle, backflip, peekaboo, bow, beg, roll, disco, love. Bloop does them on its own (Settings > Random antics) and waves when your cursor first visits.
- **Things to do:** `/feed`, `/play`, `/pet`, `/hug`, `/trick <name>`, `/status` (mood and bond level), `/wear` (party hat, crown, wizard hat, bow, shades, halo), `/rps`, `/guess`, `/fortune`. Hunger and bond level are saved; turn them off with Settings > Hunger and mood.
- Right-click menu: Feed me, Play ball, Tricks, Dress up, grouped Look list.
- **Fixed:** the AI reasoning box shrinking to a sliver after a few questions (chat messages were allowed to flex-shrink).
- **New:** the music panel can be resized. Drag its outer top corner, or use Settings > Music panel size (70 to 160%).
- **Drawn as switch:** every pet can now be drawn as **pixelated** (square pixels) or **dot-matrix** (round dots); the new pets can also stay **smooth**. Settings > Drawn as, right-click > Drawn as, or `/render pixel|dots|smooth`. Works live with all animations.

## 3.9.2
- **Bloop now knows its abilities.** Every prompt (including plain chat) lists what it can do, and tells it to use its tools instead of saying it cannot. `/abilities` shows the same list.
- **Tools are picked up more often:** weather, latest news, prices, scores, "can you / please / for me" style requests, and more verbs now send the tools, so fewer requests fall through to a plain text answer.
- **Fixed the pet vanishing when you click another window:** it could end up underneath the other window. It now re-asserts its always-on-top position when focus changes and every second (without stealing focus), restores itself if minimized, and shows over full-screen apps on macOS. Turn off Settings > Always on top to disable.

## 3.9.3
- **Stronger stay-on-top.** Electron skips `setAlwaysOnTop(true)` when it is already on, so 3.9.2 could not win the top spot back from another window. Bloop now switches it off and on again when focus moves to another window (and again 0.2 s and 0.8 s later, once that window has settled) and every ~3 s, and nudges to the top every 0.7 s.
- **Bring to front, always works:** `Ctrl/Cmd+Shift+B` from anywhere, the tray menu item, or `/front`.
- macOS: runs as an accessory app (no Dock icon) so the pet can float over full-screen apps and every Space.

## 3.10.0
- **`/update`**: checks GitHub for a newer release and shows what's new; `/update now` installs it. It adapts to how you installed Bloop: an installer build updates itself (electron-updater), a git clone runs `git pull --ff-only` and `npm install` then restarts, and an unzipped download opens the release page. Every install step asks first in a native dialog. `/version` shows what you're on.
- Bloop mentions a new version once (Settings > Check for updates daily, on by default; contacts only api.github.com).
- **Installers:** `npm run dist` builds an installer locally, and the included GitHub Actions workflow builds Windows, macOS and Linux installers whenever you push a tag like `v3.10.0`.

## 3.10.1
- **App icon** (`build/icon.png`) used for the Windows/macOS/Linux installers.
- **`Start Bloop.vbs`**: double-click to start Bloop from a source folder with no terminal window.

## 3.10.2
- Installer build no longer needs Python or Visual Studio build tools: `npmRebuild` is off (the optional `uiohook-napi` module ships prebuilt binaries) and its files are kept unpacked so they load from the installed app.

## 3.10.3
- Update checks point at the project repo. Releases are published automatically (not left as drafts), so `/update` and the installed app's auto-update can see them.
