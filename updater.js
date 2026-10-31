'use strict';
/*
 * /update support. Three kinds of install, one command:
 *   1. Installed app (from a GitHub Release installer)  -> electron-updater downloads and installs it
 *   2. Source checkout (a git clone running `npm start`)   -> `git pull --ff-only` + `npm install`, then restart
 *   3. Unzipped download                                   -> opens the release page to download the new version
 * Only fixed commands run (never anything from the network), and each one asks first in a native dialog.
 * The only network contact is api.github.com for the latest release (turn off in Settings).
 */
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const parse = (v) => String(v || '').replace(/^v/i, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
function newer(a, b) { // is version a newer than b?
  const A = parse(a), B = parse(b);
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const d = (A[i] || 0) - (B[i] || 0);
    if (d) return d > 0;
  }
  return false;
}

module.exports = function createUpdater({ app, shell, dialog, getWin, send }) {
  let pkg = {};
  try { pkg = require('./package.json'); } catch { /* ignore */ }
  const repo = (pkg.bloop && pkg.bloop.updateRepo) || '';
  const configured = /^[\w.-]+\/[\w.-]+$/.test(repo) && !/^OWNER\//.test(repo);
  const root = app.getAppPath();
  const isGit = () => { try { return fs.existsSync(path.join(root, '.git')); } catch { return false; } };

  let autoUpdater = null;
  if (app.isPackaged) {
    try {
      ({ autoUpdater } = require('electron-updater'));
      autoUpdater.autoDownload = false;
      autoUpdater.on('download-progress', (p) => send('update:progress', { percent: Math.round(p.percent || 0) }));
    } catch { autoUpdater = null; }
  }

  const kind = () => (autoUpdater ? 'installed' : isGit() ? 'git' : 'download');

  async function check() {
    const current = app.getVersion();
    if (!configured) return { ok: false, error: 'not-configured', current, repo };
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: { 'User-Agent': 'Bloop-Updater', Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(10000),
      });
      if (r.status === 404) return { ok: true, current, latest: current, available: false, note: 'no-releases', kind: kind() };
      if (!r.ok) return { ok: false, error: 'GitHub answered ' + r.status, current };
      const j = await r.json();
      const latest = String(j.tag_name || '').replace(/^v/i, '');
      return {
        ok: true, current, latest, available: newer(latest, current), kind: kind(),
        url: String(j.html_url || ''), notes: String(j.body || '').slice(0, 1200), name: j.name || j.tag_name,
      };
    } catch (e) {
      return { ok: false, error: 'Could not reach GitHub (' + (e.message || e) + ')', current };
    }
  }

  const run = (cmd) => new Promise((resolve) => {
    exec(cmd, { cwd: root, timeout: 300000, windowsHide: true }, (err, stdout, stderr) => resolve({ err, out: String(stdout || '') + String(stderr || '') }));
  });

  async function confirm(message, detail, buttons) {
    const r = await dialog.showMessageBox(getWin(), { type: 'question', buttons, defaultId: 0, cancelId: buttons.length - 1, message, detail, noLink: true });
    return r.response;
  }

  async function apply() {
    const info = await check();
    if (!info.ok) return info;
    if (!info.available) return { ok: true, upToDate: true, current: info.current };
    const k = kind();

    if (k === 'installed') {
      const pick = await confirm(`Update Bloop to ${info.latest}?`, `You have ${info.current}. It downloads in the background, then Bloop restarts.`, ['Update', 'Not now']);
      if (pick !== 0) return { ok: true, cancelled: true };
      try {
        await autoUpdater.checkForUpdates();
        await autoUpdater.downloadUpdate();
        setTimeout(() => autoUpdater.quitAndInstall(), 800);
        return { ok: true, installing: true, latest: info.latest };
      } catch (e) {
        // e.g. macOS builds that are not code-signed cannot update themselves: fall back to the download page
        if (info.url && /^https:\/\/github\.com\//.test(info.url)) shell.openExternal(info.url);
        return { ok: false, error: 'Automatic install failed (' + (e.message || e) + '). Opened the download page instead.' };
      }
    }

    if (k === 'git') {
      const pick = await confirm(`Update Bloop to ${info.latest}?`,
        `This runs these two commands in ${root}:\n\n  git pull --ff-only\n  npm install\n\nthen restarts Bloop. Your settings and notes are not touched.`, ['Update', 'Not now']);
      if (pick !== 0) return { ok: true, cancelled: true };
      const pull = await run('git pull --ff-only');
      if (pull.err) return { ok: false, error: 'git pull failed:\n' + pull.out.slice(-600) };
      const inst = await run('npm install');
      if (inst.err) return { ok: false, error: 'npm install failed:\n' + inst.out.slice(-600) };
      const again = await confirm('Updated. Restart Bloop now?', `Now on ${info.latest}.`, ['Restart', 'Later']);
      if (again === 0) { app.relaunch(); app.exit(0); }
      return { ok: true, updated: true, latest: info.latest };
    }

    // plain unzipped download
    if (info.url && /^https:\/\/github\.com\//.test(info.url)) {
      shell.openExternal(info.url);
      return { ok: true, opened: true, latest: info.latest };
    }
    return { ok: false, error: 'No download link found.' };
  }

  return { check, apply, configured, repo };
};
