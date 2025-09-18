import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Issue } from '../main/db/schema'

// Custom APIs for renderer
const api = {
  issues: {
    getAll: () => ipcRenderer.invoke('issues:getAll'),
    getById: (id: number) => ipcRenderer.invoke('issues:getById', id),
    create: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) =>
      ipcRenderer.invoke('issues:create', issue),
    createWithAI: (rawInput: string) =>
      ipcRenderer.invoke('issues:createWithAI', rawInput),
    update: (id: number, updates: Partial<Omit<Issue, 'id' | 'createdAt'>>) =>
      ipcRenderer.invoke('issues:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('issues:delete', id),
    search: (query: string) => ipcRenderer.invoke('issues:search', query)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Preload: Error exposing APIs via contextBridge:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
