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
import { initAdBlocker } from './adBlocker';

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
    initWindowSettingsEffects();

    const webSession = session.fromPartition('persist:web');
    configureSession(webSession);
    initAdBlocker(webSession).catch((err) => log.error('[main] ad blocker init failed:', err));
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
  app.on('before-quit', () => {
    markQuitting();
    saveSessionNow();
    flushSettings();
    closeDatabase();
    flushLogsSync();
  });
}
