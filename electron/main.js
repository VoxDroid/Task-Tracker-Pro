const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron')
const { spawn, exec, execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const isDev = process.env.NODE_ENV === 'development'

// Configuration
const PORT = 3456

// Keep a global reference of the window object
let mainWindow
let nextServer = null
let isQuitting = false

// ============================================
// SINGLE INSTANCE LOCK
// Prevents multiple instances of the app from running
// ============================================
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // Another instance is already running - quit immediately
  // The dialog will be shown by the first instance via 'second-instance' event
  app.quit()
} else {
  // This is the first instance - handle when second instance tries to start
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance
    if (mainWindow) {
      // Show dialog to the user in the existing instance
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Task Tracker Pro Already Running',
        message: 'Another instance of Task Tracker Pro tried to start.',
        detail: 'This instance is already running. The new instance has been prevented from starting.\n\nYour existing window will now be focused.',
        buttons: ['OK'],
        defaultId: 0,
        noLink: true
      }).then(() => {
        // Restore and focus the existing window
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        mainWindow.show()
        mainWindow.focus()
      })
    }
  })
}

/**
 * Force kill any process using the specified port
 * Works on Windows, macOS, and Linux
 */
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32'
    
    try {
      if (isWindows) {
        // Windows: Find and kill process using netstat and taskkill
        exec(`netstat -ano | findstr :${port} | findstr LISTENING`, (error, stdout) => {
          if (stdout) {
            const lines = stdout.trim().split('\n')
            const pids = new Set()
            
            lines.forEach(line => {
              const parts = line.trim().split(/\s+/)
              const pid = parts[parts.length - 1]
              if (pid && !isNaN(parseInt(pid))) {
                pids.add(pid)
              }
            })
            
            pids.forEach(pid => {
              try {
                execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
                console.log(`Killed process with PID ${pid} on port ${port}`)
              } catch (e) {
                // Process might already be dead
              }
            })
          }
          resolve()
        })
      } else {
        // macOS/Linux: Use lsof to find and kill process
        exec(`lsof -ti :${port}`, (error, stdout) => {
          if (stdout) {
            const pids = stdout.trim().split('\n').filter(pid => pid)
            pids.forEach(pid => {
              try {
                // First try SIGTERM, then SIGKILL
                execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
                console.log(`Killed process with PID ${pid} on port ${port}`)
              } catch (e) {
                // Process might already be dead
              }
            })
          }
          resolve()
        })
      }
    } catch (error) {
      console.error('Error killing process on port:', error)
      resolve()
    }
  })
}

/**
 * Kill all child processes spawned by the app
 */
function killAllChildProcesses() {
  return new Promise((resolve) => {
    if (!nextServer) {
      resolve()
      return
    }

    const pid = nextServer.pid
    const isWindows = process.platform === 'win32'

    try {
      if (isWindows) {
        // Windows: Kill process tree using taskkill
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' })
          console.log(`Killed process tree for PID ${pid}`)
        } catch (e) {
          // Process might already be dead
        }
      } else {
        // macOS/Linux: Kill process group
        try {
          // Try to kill the process group
          process.kill(-pid, 'SIGKILL')
        } catch (e) {
          try {
            // Fallback: kill individual process
            process.kill(pid, 'SIGKILL')
          } catch (e2) {
            // Process might already be dead
          }
        }
        console.log(`Killed process group for PID ${pid}`)
      }
    } catch (error) {
      console.error('Error killing child processes:', error)
    }

    nextServer = null
    resolve()
  })
}

/**
 * Comprehensive cleanup function
 * Ensures all resources are freed before app exits
 */
async function performCleanup() {
  console.log('Performing cleanup...')
  
  // Kill the Next.js server process tree
  await killAllChildProcesses()
  
  // Force kill any remaining process on the port
  await killProcessOnPort(PORT)
  
  // Small delay to ensure port is fully released
  await new Promise(resolve => setTimeout(resolve, 100))
  
  console.log('Cleanup completed')
}

/**
 * Check if port is available before starting
 */
function waitForPortAvailable(port, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    const net = require('net')
    let attempts = 0

    function checkPort() {
      attempts++
      const server = net.createServer()
      
      server.once('error', async (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, attempting to free it (attempt ${attempts}/${maxAttempts})...`)
          await killProcessOnPort(port)
          
          if (attempts < maxAttempts) {
            setTimeout(checkPort, 500)
          } else {
            reject(new Error(`Port ${port} is still in use after ${maxAttempts} attempts`))
          }
        } else {
          reject(err)
        }
      })

      server.once('listening', () => {
        server.close(() => {
          console.log(`Port ${port} is available`)
          resolve()
        })
      })

      server.listen(port, '127.0.0.1')
    }

    checkPort()
  })
}

function createWindow() {
  // Start Next.js server in production
  if (!isDev) {
    console.log('Starting Next.js server in production mode...')
    // In packaged app, use resourcesPath
    const resourcesPath = process.resourcesPath
    
    // Path to the standalone server.js (in extraResources as 'standalone')
    const standaloneDir = path.join(resourcesPath, 'standalone')
    const serverPath = path.join(standaloneDir, 'server.js')
    
    // Handle renamed node_modules (_modules -> node_modules)
    // electron-builder excludes node_modules by default, so we rename it during build
    const modulesPath = path.join(standaloneDir, '_modules')
    const nodeModulesPath = path.join(standaloneDir, 'node_modules')
    
    if (fs.existsSync(modulesPath) && !fs.existsSync(nodeModulesPath)) {
      console.log('Renaming _modules to node_modules...')
      try {
        fs.renameSync(modulesPath, nodeModulesPath)
        console.log('Successfully renamed _modules to node_modules')
      } catch (e) {
        console.error('Failed to rename _modules:', e)
      }
    }
    
    console.log('Resources path:', resourcesPath)
    console.log('Standalone dir:', standaloneDir)
    console.log('Server path:', serverPath)

    // Check if server.js exists
    if (!fs.existsSync(serverPath)) {
      console.error('Server.js not found at:', serverPath)
      // Try alternative paths
      try {
        console.log('Available in resources:', fs.readdirSync(resourcesPath))
        if (fs.existsSync(standaloneDir)) {
          console.log('Available in standalone:', fs.readdirSync(standaloneDir))
        }
      } catch (e) {
        console.error('Error listing directories:', e)
      }
      createBrowserWindow()
      return
    }

    // Ensure port is available before starting server
    waitForPortAvailable(PORT)
      .then(() => {
        startNextServer(standaloneDir, serverPath)
      })
      .catch((error) => {
        console.error('Failed to acquire port:', error)
        // Try to start anyway
        startNextServer(standaloneDir, serverPath)
      })
  } else {
    createBrowserWindow()
  }
}

function startNextServer(standaloneDir, serverPath) {
  try {
    const isWindows = process.platform === 'win32'
    
    // Spawn the Next.js standalone server using node
    nextServer = spawn('node', [serverPath], {
      cwd: standaloneDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        PORT: String(PORT),
        NODE_ENV: 'production',
        HOSTNAME: 'localhost'
      },
      shell: isWindows,
      windowsHide: true,
      // On Unix, create a new process group so we can kill all children
      detached: !isWindows
    })

    let serverStarted = false

    nextServer.stdout.on('data', (data) => {
      const output = data.toString()
      console.log('Next.js stdout:', output)
      // When server is ready, create the window
      if (!serverStarted && (output.includes('Ready') || output.includes('started') || output.includes('listening') || output.includes(String(PORT)))) {
        console.log('Next.js server is ready!')
        serverStarted = true
        setTimeout(() => createBrowserWindow(), 500)
      }
    })

    nextServer.stderr.on('data', (data) => {
      console.error('Next.js stderr:', data.toString())
    })

    nextServer.on('error', (error) => {
      console.error('Failed to start Next.js server:', error)
      if (!serverStarted) {
        serverStarted = true
        createBrowserWindow()
      }
    })

    nextServer.on('close', (code) => {
      console.log('Next.js server exited with code:', code)
    })

    // Fallback: Wait for server to start (in case we miss the ready message)
    setTimeout(() => {
      if (!serverStarted && !mainWindow) {
        console.log('Timeout reached, attempting to create browser window...')
        serverStarted = true
        createBrowserWindow()
      }
    }, 10000)
  } catch (error) {
    console.error('Error spawning Next.js server:', error)
    // Fallback: try to create window anyway
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
      webSecurity: true, // Enable web security
      devTools: isDev, // Only allow dev tools in development
      preload: isDev
        ? path.join(__dirname, 'preload.js')
        : path.join(process.resourcesPath, 'app.asar', 'electron', 'preload.js')
    },
    icon: isDev
      ? path.join(__dirname, '../public/TaskTrackerPro.png')
      : path.join(process.resourcesPath, 'standalone', 'public', 'TaskTrackerPro.png'),
    show: false, // Don't show until ready-to-show
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true, // Hide the menu bar
  })

  console.log(`Loading URL: http://localhost:${PORT}`)
  // Load the app - always localhost since we start the server
  mainWindow.loadURL(`http://localhost:${PORT}`)

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

  // Handle keyboard shortcuts - works in both dev and production
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Handle F11 (Toggle Full Screen) - always allowed
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
      event.preventDefault()
      return
    }

    // Security: Disable DevTools and browser shortcuts in production only
    if (!isDev) {
      // Prevent Ctrl+Shift+I (DevTools)
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault()
      }
      // Prevent F12 (DevTools)
      if (input.key === 'F12') {
        event.preventDefault()
      }
      // Prevent Ctrl+Shift+C (Inspect element)
      if (input.control && input.shift && input.key.toLowerCase() === 'c') {
        event.preventDefault()
      }
      // Prevent Ctrl+U (View source)
      if (input.control && input.key.toLowerCase() === 'u') {
        event.preventDefault()
      }
      // Prevent Ctrl+Shift+J (Console)
      if (input.control && input.shift && input.key.toLowerCase() === 'j') {
        event.preventDefault()
      }
    }
  })

  // Security: Disable DevTools and context menu in production
  if (!isDev) {
    // Disable DevTools completely in production
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })

    // Disable context menu (right-click) in production
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault()
    })
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Security: Prevent navigation to external URLs in production
  if (!isDev) {
    mainWindow.webContents.on('will-navigate', (event, url) => {
      // Only allow navigation to localhost/127.0.0.1 in production
      const parsedUrl = new URL(url)
      if (!parsedUrl.hostname.includes('localhost') && parsedUrl.hostname !== '127.0.0.1') {
        event.preventDefault()
      }
    })

    // Prevent new window creation from links
    mainWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault()
      // Optionally open external URLs in default browser
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        shell.openExternal(url)
      }
    })
  }

  // Listen for window state changes and notify renderer
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:unmaximized')
  })

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window:entered-fullscreen')
  })

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window:left-fullscreen')
  })
}

// This method will be called when Electron has finished initialization
// Note: This will only run if we got the single instance lock (otherwise app.quit() was called above)
app.whenReady().then(() => {
  // Set up application menu
  if (!isDev) {
    // In production, create a minimal menu without developer tools
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools', visible: false } // Hide dev tools menu item
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ]

    // On macOS, add the app menu
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      })
    }

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  } else {
    // In development, use default menu
    Menu.setApplicationMenu(null)
  }

  createWindow()

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    // Perform cleanup before quitting
    await performCleanup()
    app.quit()
  }
})

// Handle before-quit to perform cleanup
app.on('before-quit', async (event) => {
  if (!isQuitting) {
    isQuitting = true
    event.preventDefault()
    
    console.log('App is quitting, performing cleanup...')
    await performCleanup()
    
    // Now actually quit
    app.quit()
  }
})

// Final cleanup on will-quit (synchronous, last resort)
app.on('will-quit', (event) => {
  // Synchronous cleanup as a last resort
  if (nextServer && nextServer.pid) {
    const isWindows = process.platform === 'win32'
    try {
      if (isWindows) {
        execSync(`taskkill /F /T /PID ${nextServer.pid}`, { stdio: 'ignore' })
      } else {
        try {
          process.kill(-nextServer.pid, 'SIGKILL')
        } catch (e) {
          process.kill(nextServer.pid, 'SIGKILL')
        }
      }
    } catch (e) {
      // Process already dead
    }
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

ipcMain.on('window:toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen())
  }
})

ipcMain.handle('window:is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false
})

// Handle app updates in production
if (!isDev) {
  // Auto-updater setup would go here
  // For now, we'll implement basic update checking
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })
}

// ============================================
// CRITICAL: Handle unexpected process termination
// ============================================

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('Received SIGINT, cleaning up...')
  await performCleanup()
  process.exit(0)
})

// Handle SIGTERM
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, cleaning up...')
  await performCleanup()
  process.exit(0)
})

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error)
  await performCleanup()
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)
  await performCleanup()
  process.exit(1)
})

// Windows-specific: Handle the process exit event
process.on('exit', () => {
  // Synchronous cleanup only - async operations won't complete here
  if (nextServer && nextServer.pid) {
    try {
      if (process.platform === 'win32') {
        require('child_process').execSync(`taskkill /F /T /PID ${nextServer.pid}`, { stdio: 'ignore' })
      } else {
        try {
          process.kill(-nextServer.pid, 'SIGKILL')
        } catch (e) {
          process.kill(nextServer.pid, 'SIGKILL')
        }
      }
    } catch (e) {
      // Process already dead
    }
  }
})