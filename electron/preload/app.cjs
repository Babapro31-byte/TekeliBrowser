'use strict';
/**
 * Preload for the chrome UI and tekeli:// internal pages. Web pages get NOTHING:
 * the bridge is only exposed when the document origin is tekeli://.
 */
const { contextBridge, ipcRenderer } = require('electron');

if (location.protocol === 'tekeli:') {
  const INVOKE = new Set([
    'settings:get', 'settings:set',
    'tabs:state', 'tabs:do', 'find:do',
    'bookmarks:is', 'bookmarks:toggle', 'bookmarks:list', 'bookmarks:add', 'bookmarks:remove',
    'history:list', 'history:delete', 'history:clear',
    'omnibox:suggest',
    'app:copy', 'app:openExternal', 'app:info',
  ]);
  const ON = new Set([
    'tabs:state', 'settings:changed', 'chrome:focus-omnibox', 'chrome:open-find', 'find:result',
    'bookmarks:changed', 'history:changed',
  ]);

  let boot = null;
  try { boot = ipcRenderer.sendSync('app:bootstrap'); } catch (e) { boot = null; }

  contextBridge.exposeInMainWorld('tekeli', {
    boot,
    invoke(channel, ...args) {
      if (!INVOKE.has(channel)) return Promise.reject(new Error('Blocked channel: ' + channel));
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel, callback) {
      if (!ON.has(channel) || typeof callback !== 'function') return () => {};
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
  });
}
