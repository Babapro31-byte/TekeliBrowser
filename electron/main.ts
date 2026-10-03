import './app/protocol'; // registers the tekeli:// scheme (must happen before app ready)
import { app, session } from 'electron';
import path from 'node:path';
import { installConsoleLogging, flushLogsSync, log } from './core/logger';
import { closeDatabase, initDatabase } from './db';
import { registerAppIpc } from './app/ipc';
import { registerTekeliProtocol } from './app/protocol';
import { applyDoh, configureSession } from './app/sessions';
import { flushSettings, getSettings, initSettings, onSettingsChanged } from './app/settingsStore';
import { allContexts, createWindow, initWindowSettingsEffects, markQuitting, readSession, saveSessionNow } from './app/window';
import { initAdblock } from './privacy/adblock';
import { installCertHandler } from './privacy/certs';
import { registerDownloadsIpc } from './app/downloads';
import { registerPermissionsIpc } from './privacy/permissions';
import { clearOnExitIfNeeded, registerClearDataIpc } from './privacy/clearData';
import { initPasswordManager } from './passwordManager';
import { initUpdater } from './app/updater';
import { registerPasswordPrompt } from './privacy/passwordPrompt';

// Dev builds never touch the installed app's profile.
if (process.env.TEKELI_USER_DATA) app.setPath('userData', process.env.TEKELI_USER_DATA);
else if (!app.isPackaged) app.setPath('userData', path.join(app.getPath('appData'), 'tekeli-browser-dev'));

installConsoleLogging();
app.setAppUserModelId('com.tekeli.browser');

const firstUrlFromArgs = (argv: string[]): string | null => argv.find((a) => /^https?:\/\//i.test(a)) ?? null;

process.on('uncaughtException', (error) => log.error('[main] uncaught exception:', error));
process.on('unhandledRejection', (reason) => log.error('[main] unhandled rejection:', reason));

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    const ctx = allContexts().find((c) => !c.isPrivate) ?? allContexts()[0] ?? createWindow();
    if (ctx.win.isMinimized()) ctx.win.restore();
    ctx.win.show();
    ctx.win.focus();
    const url = firstUrlFromArgs(argv);
    if (url) ctx.tabs.create(url, { activate: true });
  });

  app.on('web-contents-created', (_e, contents) => {
    contents.on('will-attach-webview', (e) => e.preventDefault());
  });

  app.whenReady().then(async () => {
    const settings = initSettings();
    if (!(await initDatabase())) log.error('[main] database unavailable; history and bookmarks are disabled');

    registerTekeliProtocol(path.join(__dirname, '../dist'));
    registerAppIpc();
    registerDownloadsIpc();
    registerPermissionsIpc();
    registerClearDataIpc();
    initPasswordManager();
    registerPasswordPrompt();
    initUpdater();
    initWindowSettingsEffects();
    installCertHandler();

    const webSession = session.fromPartition('persist:web');
    configureSession(webSession);
    void initAdblock();
    applyDoh(settings);
    onSettingsChanged((s, changed) => { if (changed.includes('dohMode') || changed.includes('dohProvider')) applyDoh(s); });

    const ctx = createWindow();
    const launchUrl = firstUrlFromArgs(process.argv);
    const saved = getSettings().restoreSession ? readSession() : null;
    if (saved) ctx.tabs.restore(saved.tabs, saved.active);
    if (launchUrl) ctx.tabs.create(launchUrl, { activate: true });
    else if (!saved) ctx.tabs.create('tekeli://newtab', { focusOmnibox: true });

    log.info('[main] ready');
  });

  app.on('activate', () => { if (allContexts().length === 0 && app.isReady()) createWindow().tabs.create('tekeli://newtab'); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', (event) => {
    if (clearOnExitIfNeeded(() => app.quit())) { event.preventDefault(); return; }
    markQuitting();
    saveSessionNow();
    flushSettings();
    closeDatabase();
    flushLogsSync();
  });
}
