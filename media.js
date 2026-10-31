'use strict';
// ---------------------------------------------------------------------------
// Now-playing info and transport controls for the music panel (main process).
// Reads the title, position and volume from the operating system's media session and
// sends play/pause, next, previous, seek and volume commands back to it.
//   Windows: a small persistent PowerShell helper (Windows media session + Core Audio volume)
//   macOS:   Spotify / Music via osascript
//   Linux:   MPRIS via playerctl, volume via pactl
// Only the fixed commands below are accepted. Nothing from the web or the model reaches a shell.
// ---------------------------------------------------------------------------
const { spawn, execFile } = require('child_process');

const PLATFORM = process.platform;
const ACTIONS = new Set(['playpause', 'next', 'prev', 'seek', 'vol']);
const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null; };

const PS_SCRIPT = [
  "$ErrorActionPreference = 'SilentlyContinue'",
  'Add-Type -AssemblyName System.Runtime.WindowsRuntime',
  'Add-Type @"',
  'using System; using System.Runtime.InteropServices;',
  'public class BloopMedia {',
  '  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr e);',
  '  public static void Key(byte vk) { keybd_event(vk, 0, 1, UIntPtr.Zero); keybd_event(vk, 0, 3, UIntPtr.Zero); }',
  '}',
  '[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]',
  'interface IAudioEndpointVolume {',
  '  int RegisterControlChangeNotify(IntPtr p); int UnregisterControlChangeNotify(IntPtr p); int GetChannelCount(out uint n);',
  '  int SetMasterVolumeLevel(float l, ref Guid g); int SetMasterVolumeLevelScalar(float l, ref Guid g);',
  '  int GetMasterVolumeLevel(out float l); int GetMasterVolumeLevelScalar(out float l);',
  '}',
  '[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]',
  'interface IMMDevice { int Activate(ref Guid id, int ctx, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object o); }',
  '[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]',
  'interface IMMDeviceEnumerator { int EnumAudioEndpoints(int f, int s, out IntPtr d); int GetDefaultAudioEndpoint(int f, int r, out IMMDevice d); }',
  '[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }',
  'public class BloopVol {',
  '  static IAudioEndpointVolume Ep() {',
  '    var en = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());',
  '    IMMDevice dev; en.GetDefaultAudioEndpoint(0, 1, out dev);',
  '    Guid iid = typeof(IAudioEndpointVolume).GUID; object o; dev.Activate(ref iid, 23, IntPtr.Zero, out o);',
  '    return (IAudioEndpointVolume)o;',
  '  }',
  '  public static float Get() { float v; Ep().GetMasterVolumeLevelScalar(out v); return v; }',
  '  public static void Set(float v) { Guid g = Guid.Empty; Ep().SetMasterVolumeLevelScalar(v, ref g); }',
  '}',
  '"@',
  "$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]",
  'function Await($op, $type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); [void]$t.Wait(4000); $t.Result }',
  '$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]',
  '$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])',
  'function Emit {',
  "  $o = @{ title = ''; artist = ''; status = 'none'; pos = 0; dur = 0; vol = -1 }",
  '  try {',
  '    $s = $mgr.GetCurrentSession()',
  '    if ($s) {',
  '      $p = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])',
  '      $o.title = [string]$p.Title; $o.artist = [string]$p.Artist',
  '      $o.status = ([string]$s.GetPlaybackInfo().PlaybackStatus).ToLower()',
  '      $tl = $s.GetTimelineProperties()',
  '      $o.dur = [double]($tl.EndTime - $tl.StartTime).TotalSeconds',
  '      $pos = [double]($tl.Position - $tl.StartTime).TotalSeconds',
  "      if ($o.status -eq 'playing') { $pos += ([DateTimeOffset]::UtcNow - $tl.LastUpdatedTime).TotalSeconds }",
  '      if ($o.dur -gt 0 -and $pos -gt $o.dur) { $pos = $o.dur }',
  '      if ($pos -lt 0) { $pos = 0 }',
  '      $o.pos = $pos',
  '    }',
  '  } catch { }',
  '  try { $o.vol = [double][BloopVol]::Get() } catch { }',
  '  [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress)); [Console]::Out.Flush()',
  '}',
  'function Cmd($line) {',
  "  $parts = $line.Trim().Split(' ')",
  '  $s = $mgr.GetCurrentSession()',
  '  switch ($parts[0]) {',
  "    'playpause' { if ($s) { [void](Await ($s.TryTogglePlayPauseAsync()) ([bool])) } else { [BloopMedia]::Key(0xB3) } }",
  "    'next' { if ($s) { [void](Await ($s.TrySkipNextAsync()) ([bool])) } else { [BloopMedia]::Key(0xB0) } }",
  "    'prev' { if ($s) { [void](Await ($s.TrySkipPreviousAsync()) ([bool])) } else { [BloopMedia]::Key(0xB1) } }",
  "    'seek' { if ($s) { $ticks = [long]([double]$parts[1] * 10000000); [void](Await ($s.TryChangePlaybackPositionAsync($ticks)) ([bool])) } }",
  "    'vol' { [BloopVol]::Set([float]$parts[1]) }",
  '  }',
  '}',
  '$readTask = [Console]::In.ReadLineAsync()',
  '$last = 0',
  'while ($true) {',
  '  if ($readTask.IsCompleted) {',
  '    $line = $readTask.Result',
  '    if ($line -eq $null) { exit }',
  '    Cmd $line',
  '    $readTask = [Console]::In.ReadLineAsync()',
  '    Emit; $last = [Environment]::TickCount',
  '  }',
  '  if (([Environment]::TickCount - $last) -ge 1000) { Emit; $last = [Environment]::TickCount }',
  '  Start-Sleep -Milliseconds 120',
  '}',
].join('\n');

const MAC_POLL = [
  'on run',
  '  set out to ""',
  '  if application "Spotify" is running then',
  '    tell application "Spotify"',
  '      if player state is not stopped then set out to "Spotify|" & (player state as string) & "|" & (name of current track) & "|" & (artist of current track) & "|" & (player position as string) & "|" & (((duration of current track) / 1000) as string)',
  '    end tell',
  '  end if',
  '  if out is "" and application "Music" is running then',
  '    tell application "Music"',
  '      if player state is not stopped then set out to "Music|" & (player state as string) & "|" & (name of current track) & "|" & (artist of current track) & "|" & (player position as string) & "|" & ((duration of current track) as string)',
  '    end tell',
  '  end if',
  '  return out & "|" & ((output volume of (get volume settings)) as string)',
  'end run',
].join('\n');

module.exports = function createMedia({ send }) {
  let proc = null;
  let timer = null;
  let buf = '';
  let macApp = 'Spotify';
  let running = false;

  const emit = (s) => { try { send(s); } catch { /* window closed */ } };
  const toNum = (s) => { const n = parseFloat(String(s).replace(',', '.')); return Number.isFinite(n) ? n : 0; };

  // ------------------------------------------------------------------ Windows
  function startWin() {
    proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', Buffer.from(PS_SCRIPT, 'utf16le').toString('base64')],
      { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
    proc.stdout.on('data', (d) => {
      buf += d.toString('utf8');
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          const o = JSON.parse(line);
          const st = String(o.status || 'none').toLowerCase();
          // playing / paused are definite; "changing" and "opened" are transitions the UI should ride through
          emit({ title: o.title || '', artist: o.artist || '', status: st === 'playing' ? 'playing' : (st === 'paused' || st === 'stopped') ? 'paused' : (st === 'changing' || st === 'opened') ? 'changing' : 'none', pos: +o.pos || 0, dur: +o.dur || 0, vol: o.vol >= 0 ? +o.vol : -1 });
        } catch { /* partial line */ }
      }
    });
    proc.on('error', () => { proc = null; });
    proc.on('exit', () => { proc = null; });
  }
  const writeWin = (line) => { try { if (proc && proc.stdin.writable) proc.stdin.write(line + '\n'); } catch { /* ignore */ } };

  // -------------------------------------------------------------------- macOS
  function pollMac() {
    execFile('osascript', ['-e', MAC_POLL], { timeout: 4000 }, (err, out) => {
      if (!running) return;
      if (err) return emit({ title: '', artist: '', status: 'none', pos: 0, dur: 0, vol: -1 });
      const p = String(out).trim().split('|');
      const vol = p.length ? toNum(p[p.length - 1]) / 100 : -1;
      if (p.length >= 6 && p[0]) {
        macApp = p[0];
        emit({ title: p[2], artist: p[3], status: /playing/i.test(p[1]) ? 'playing' : 'paused', pos: toNum(p[4]), dur: toNum(p[5]), vol });
      } else emit({ title: '', artist: '', status: 'none', pos: 0, dur: 0, vol });
    });
  }

  // -------------------------------------------------------------------- Linux
  function pollLinux() {
    const SEP = '\x1f';
    execFile('playerctl', ['metadata', '--format', ['{{status}}', '{{title}}', '{{artist}}', '{{position}}', '{{mpris:length}}'].join(SEP)], { timeout: 3000 }, (err, out) => {
      if (!running) return;
      const missing = err && err.code === 'ENOENT';
      const base = { title: missing ? 'Install playerctl for song info' : '', artist: '', status: 'none', pos: 0, dur: 0, vol: -1 };
      execFile('pactl', ['get-sink-volume', '@DEFAULT_SINK@'], { timeout: 3000 }, (e2, vout) => {
        if (!running) return;
        const m = !e2 && /(\d+)%/.exec(String(vout));
        const vol = m ? Math.min(1, +m[1] / 100) : -1;
        if (err) return emit({ ...base, vol });
        const p = String(out).trim().split(SEP);
        emit({ title: p[1] || '', artist: p[2] || '', status: /playing/i.test(p[0]) ? 'playing' : 'paused', pos: toNum(p[3]) / 1e6, dur: toNum(p[4]) / 1e6, vol });
      });
    });
  }

  // ------------------------------------------------------------------- public
  function start() {
    if (running) return;
    running = true;
    if (PLATFORM === 'win32') startWin();
    else {
      const poll = PLATFORM === 'darwin' ? pollMac : pollLinux;
      poll();
      timer = setInterval(poll, PLATFORM === 'darwin' ? 1500 : 1000);
    }
  }
  function stop() {
    running = false;
    clearInterval(timer); timer = null;
    if (proc) { try { proc.stdin.end(); } catch { /* ignore */ } try { proc.kill(); } catch { /* ignore */ } proc = null; }
    buf = '';
  }
  function cmd(action, value) {
    if (!running || !ACTIONS.has(action)) return;
    if (PLATFORM === 'win32') {
      if (action === 'seek') { const s = num(value, 0, 86400); if (s != null) writeWin('seek ' + s.toFixed(2)); }
      else if (action === 'vol') { const v = num(value, 0, 1); if (v != null) writeWin('vol ' + v.toFixed(3)); }
      else writeWin(action);
      // The player takes a moment to settle, so look again shortly after to catch its real state.
      setTimeout(() => writeWin('poll'), 600);
      setTimeout(() => writeWin('poll'), 1600);
    } else if (PLATFORM === 'darwin') {
      const app = macApp === 'Music' ? 'Music' : 'Spotify';
      let script = null;
      if (action === 'playpause') script = `tell application "${app}" to playpause`;
      else if (action === 'next') script = `tell application "${app}" to next track`;
      else if (action === 'prev') script = `tell application "${app}" to previous track`;
      else if (action === 'seek') { const s = num(value, 0, 86400); if (s != null) script = `tell application "${app}" to set player position to ${s.toFixed(2)}`; }
      else if (action === 'vol') { const v = num(value, 0, 1); if (v != null) script = `set volume output volume ${Math.round(v * 100)}`; }
      if (script) execFile('osascript', ['-e', script], { timeout: 4000 }, () => { setTimeout(pollMac, 250); setTimeout(pollMac, 1000); });
    } else {
      let file = 'playerctl', args = null;
      if (action === 'playpause') args = ['play-pause'];
      else if (action === 'next') args = ['next'];
      else if (action === 'prev') args = ['previous'];
      else if (action === 'seek') { const s = num(value, 0, 86400); if (s != null) args = ['position', s.toFixed(2)]; }
      else if (action === 'vol') { const v = num(value, 0, 1); if (v != null) { file = 'pactl'; args = ['set-sink-volume', '@DEFAULT_SINK@', Math.round(v * 100) + '%']; } }
      if (args) execFile(file, args, { timeout: 4000 }, () => { setTimeout(pollLinux, 250); setTimeout(pollLinux, 1000); });
    }
  }
  return { start, stop, cmd };
};
