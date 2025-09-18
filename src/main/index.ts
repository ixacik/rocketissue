import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, issueOperations } from './db/database'
import type { Issue } from './db/schema'
import { analyzeIssue } from './services/ai'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, // Keep sandbox disabled for now - there are known issues with sandbox + contextBridge in some Electron versions
      contextIsolation: true,
      nodeIntegration: false // Explicitly disable node integration for security
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Initialize database
  initDatabase()

  // Set up IPC handlers for database operations
  ipcMain.handle('issues:getAll', async () => {
    try {
      return issueOperations.getAll()
    } catch (error) {
      console.error('IPC: Error in issues:getAll:', error)
      throw error
    }
  })

  ipcMain.handle('issues:getById', (_, id: number) => {
    return issueOperations.getById(id)
  })

  ipcMain.handle('issues:create', (_, issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
    return issueOperations.create(issue)
  })

  // AI-enhanced issue creation
  ipcMain.handle(
    'issues:createWithAI',
    async (_, issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        // Try to get AI suggestions
        const analysis = await analyzeIssue(issue.title, issue.description || undefined)

        // Use AI suggestions, with fallbacks
        const enhancedIssue = {
          ...issue,
          priority: analysis?.priority || 'medium', // AI first, then default
          effort: analysis?.effort || 'medium', // AI first, then default
          tags: analysis?.tags || [] // AI first, then empty
        }

        // Log AI enhancement if it happened
        if (analysis) {
          console.log(
            'AI: Enhanced issue with priority:',
            analysis.priority,
            ', effort:',
            analysis.effort,
            'and tags:',
            analysis.tags
          )
        } else {
          console.log('AI: No analysis available, using defaults')
        }

        return issueOperations.create(enhancedIssue)
      } catch (error) {
        console.error('IPC: Error in issues:createWithAI:', error)
        // Fallback to default values
        return issueOperations.create({
          ...issue,
          priority: 'medium',
          effort: 'medium',
          tags: []
        })
      }
    }
  )

  ipcMain.handle(
    'issues:update',
    (_, id: number, updates: Partial<Omit<Issue, 'id' | 'createdAt'>>) => {
      return issueOperations.update(id, updates)
    }
  )

  ipcMain.handle('issues:delete', (_, id: number) => {
    return issueOperations.delete(id)
  })

  ipcMain.handle('issues:search', (_, query: string) => {
    return issueOperations.search(query)
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
