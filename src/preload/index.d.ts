import { ElectronAPI } from '@electron-toolkit/preload'
import type { Issue } from '../main/db/schema'

interface IssuesAPI {
  getAll: () => Promise<Issue[]>
  getById: (id: number) => Promise<Issue | undefined>
  create: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Issue>
  createWithAI: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Issue>
  update: (
    id: number,
    updates: Partial<Omit<Issue, 'id' | 'createdAt'>>
  ) => Promise<Issue | undefined>
  delete: (id: number) => Promise<boolean>
  search: (query: string) => Promise<Issue[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      issues: IssuesAPI
    }
  }
}
