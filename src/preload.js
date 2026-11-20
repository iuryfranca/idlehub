'use strict';
// Ponte minima entre a interface (sem Node) e o processo principal.
const electron = require('electron');
const call = (channel) => (...args) => electron.ipcRenderer.invoke(channel, ...args);
const listen = (channel) => (callback) => electron.ipcRenderer.on(channel, (_event, value) => callback(value));

electron.contextBridge.exposeInMainWorld('hub', {
  load: call('state:load'),
  save: call('state:save'),
  clearAccount: call('account:clear'),
  toggleFullscreen: call('window:fullscreen'),
  openExternal: call('open:external'),
  onHotkey: listen('hotkey'),
  onFullscreen: listen('fullscreen')
});
