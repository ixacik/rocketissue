export type IssueStatus = 'open' | 'in_progress' | 'completed' | 'closed'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'
export type IssueEffort = 'low' | 'medium' | 'high'

export interface Issue {
  id: string
  title: string
  description?: string
  status: IssueStatus
  priority: IssuePriority
  effort: IssueEffort
  projectId: number
  createdAt: Date
  updatedAt: Date
  tags?: string[]
  // Optimistic update flags
  _isOptimistic?: boolean
  _aiPending?: boolean
}
