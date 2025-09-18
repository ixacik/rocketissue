import type { Issue } from '../db/schema'

export interface IssuesAPI {
  getAll: () => Promise<Issue[]>
  getById: (id: number) => Promise<Issue | undefined>
  create: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Issue>
  update: (
    id: number,
    updates: Partial<Omit<Issue, 'id' | 'createdAt'>>
  ) => Promise<Issue | undefined>
  delete: (id: number) => Promise<boolean>
  search: (query: string) => Promise<Issue[]>
}
