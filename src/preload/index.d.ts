import { ElectronAPI } from '@electron-toolkit/preload'
import type { Issue, Project } from '../main/db/schema'

interface IssuesAPI {
  getAll: () => Promise<Issue[]>
  getByProject: (projectId: number) => Promise<Issue[]>
  getById: (id: number) => Promise<Issue | undefined>
  create: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Issue>
  createWithAI: (rawInput: string) => Promise<Issue>
  update: (
    id: number,
    updates: Partial<Omit<Issue, 'id' | 'createdAt'>>
  ) => Promise<Issue | undefined>
  delete: (id: number) => Promise<boolean>
  search: (query: string) => Promise<Issue[]>
  searchInProject: (projectId: number, query: string) => Promise<Issue[]>
}

interface ProjectsAPI {
  getAll: () => Promise<Project[]>
  getById: (id: number) => Promise<Project | undefined>
  create: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  update: (
    id: number,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ) => Promise<Project | undefined>
  delete: (id: number) => Promise<boolean>
  setDefault: (id: number) => Promise<boolean>
  getDefault: () => Promise<Project | undefined>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      issues: IssuesAPI
      projects: ProjectsAPI
    }
  }
}
