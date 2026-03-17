// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openNewWindow: (url) => ipcRenderer.send('open-new-window',url),
  getPrinters: () => ipcRenderer.invoke('get-printers')
});
