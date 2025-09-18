import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, issueOperations, projectOperations } from './db/database'
import type { Issue, Project } from './db/schema'
import { analyzeIssue } from './services/ai'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden', // Use compact traffic lights
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

  ipcMain.handle('issues:getByProject', async (_, projectId: number) => {
    try {
      return issueOperations.getByProject(projectId)
    } catch (error) {
      console.error('IPC: Error in issues:getByProject:', error)
      throw error
    }
  })

  ipcMain.handle('issues:getById', (_, id: number) => {
    return issueOperations.getById(id)
  })

  ipcMain.handle('issues:create', (_, issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
    return issueOperations.create(issue)
  })

  // AI-enhanced issue creation from raw input - now requires projectId
  ipcMain.handle('issues:createWithAI', async (_, rawInput: string, projectId: number) => {
    if (!projectId) {
      throw new Error('projectId is required to create an issue')
    }

    try {
      // Try to get AI analysis
      const analysis = await analyzeIssue(rawInput)

      let issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>

      if (analysis && analysis.title && analysis.description) {
        // Use AI-generated content (only if we have title and description)
        issueData = {
          title: analysis.title,
          description: analysis.description,
          status: 'open',
          priority: analysis.priority,
          effort: analysis.effort,
          issueType: analysis.issueType || 'task',
          projectId
        } as any
      } else {
        // Fallback: Use first line as title, rest as description
        const lines = rawInput.trim().split('\n')
        const title = lines[0].substring(0, 100) || 'New Issue'
        const description = lines.slice(1).join('\n').trim() || lines[0]

        issueData = {
          title,
          description,
          status: 'open',
          priority: 'medium',
          effort: 'medium',
          issueType: 'task',
          projectId
        } as any
      }

      return issueOperations.create(issueData)
    } catch (error) {
      console.error('IPC: Error in issues:createWithAI:', error)
      // Emergency fallback
      const title = rawInput.substring(0, 100) || 'New Issue'
      return issueOperations.create({
        title,
        description: rawInput,
        status: 'open',
        priority: 'medium',
        effort: 'medium',
        issueType: 'task',
        projectId
      } as any)
    }
  })

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

  ipcMain.handle('issues:searchInProject', (_, projectId: number, query: string) => {
    return issueOperations.searchInProject(projectId, query)
  })

  // Project IPC handlers
  ipcMain.handle('projects:getAll', async () => {
    try {
      return projectOperations.getAll()
    } catch (error) {
      console.error('IPC: Error in projects:getAll:', error)
      throw error
    }
  })

  ipcMain.handle('projects:getById', (_, id: number) => {
    return projectOperations.getById(id)
  })

  ipcMain.handle(
    'projects:create',
    (_, project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      return projectOperations.create(project)
    }
  )

  ipcMain.handle(
    'projects:update',
    (_, id: number, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
      return projectOperations.update(id, updates)
    }
  )

  ipcMain.handle('projects:delete', (_, id: number) => {
    return projectOperations.delete(id)
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
