// Preload script for Electron security
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any Electron-specific APIs here if needed
  platform: process.platform,
  version: process.versions.electron,
  
  // カスタムアラートダイアログ
  showErrorDialog: (title, message) => ipcRenderer.invoke('show-error-dialog', title, message),
  showAlertDialog: (title, message, type) => ipcRenderer.invoke('show-alert-dialog', title, message, type)
});