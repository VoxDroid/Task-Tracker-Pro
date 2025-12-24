const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File dialog operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (defaultName) => ipcRenderer.invoke('dialog:saveFile', defaultName),

  // App information
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Platform information
  platform: process.platform,

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Window state listeners
  onWindowMaximized: (callback) => ipcRenderer.on('window:maximized', callback),
  onWindowUnmaximized: (callback) => ipcRenderer.on('window:unmaximized', callback),

  // Listen for app updates (future implementation)
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
})