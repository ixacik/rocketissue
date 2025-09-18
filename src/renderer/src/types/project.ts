export interface Project {
  id: number
  name: string
  slug: string
  color: string
  icon: string | null
  isDefault: boolean | null
  createdAt: Date
  updatedAt: Date
}

export type NewProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
