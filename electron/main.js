const { app, BrowserWindow, Menu, ipcMain, dialog, shell, spawn } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

// Keep a global reference of the window object
let mainWindow
let nextServer = null

function createWindow() {
  // Start Next.js server in production
  if (!isDev) {
    console.log('Starting Next.js server in production mode...')
    // In packaged app, use resourcesPath
    const resourcesPath = process.resourcesPath
    const appPath = path.join(resourcesPath, '..')
    const nextBinPath = path.join(resourcesPath, 'app.asar.unpacked', 'node_modules', '.bin', 'next')

    console.log('Resources path:', resourcesPath)
    console.log('App path:', appPath)
    console.log('Next.js binary path:', nextBinPath)

    try {
      nextServer = spawn(nextBinPath, ['start'], {
        cwd: appPath,
        stdio: 'pipe',
        env: { ...process.env, PORT: '3000' }
      })

      nextServer.stdout.on('data', (data) => {
        console.log('Next.js stdout:', data.toString())
      })

      nextServer.stderr.on('data', (data) => {
        console.error('Next.js stderr:', data.toString())
      })

      nextServer.on('error', (error) => {
        console.error('Failed to start Next.js server:', error)
      })

      nextServer.on('close', (code) => {
        console.log('Next.js server exited with code:', code)
      })

      // Wait for server to start
      setTimeout(() => {
        console.log('Timeout reached, attempting to create browser window...')
        createBrowserWindow()
      }, 5000)
    } catch (error) {
      console.error('Error spawning Next.js server:', error)
      // Fallback: try to create window anyway
      createBrowserWindow()
    }
  } else {
    createBrowserWindow()
  }
}

function createBrowserWindow() {
  console.log('Creating browser window...')
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false, // Make window frameless
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: isDev
        ? path.join(__dirname, 'preload.js')
        : path.join(process.resourcesPath, 'app.asar', 'electron', 'preload.js')
    },
    icon: isDev
      ? path.join(__dirname, '../public/favicon.ico')
      : path.join(process.resourcesPath, 'app.asar', 'public', 'favicon.ico'),
    show: false, // Don't show until ready-to-show
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true, // Hide the menu bar
  })

  console.log('Loading URL: http://localhost:3000')
  // Load the app - always localhost since we start the server
  mainWindow.loadURL('http://localhost:3000')

  // Add error handling for page load
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM ready')
  })

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Listen for window state changes and notify renderer
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:unmaximized')
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow()

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  // Kill the Next.js server
  if (nextServer) {
    nextServer.kill()
    nextServer = null
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})

// IPC handlers for file operations
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result
})

ipcMain.handle('dialog:saveFile', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result
})

// IPC handlers for window controls
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close()
})

// Handle app updates in production
if (!isDev) {
  // Auto-updater setup would go here
  // For now, we'll implement basic update checking
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })
}