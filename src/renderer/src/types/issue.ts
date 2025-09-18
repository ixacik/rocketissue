export type IssueStatus = 'open' | 'in_progress' | 'completed' | 'closed'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'

export interface Issue {
  id: string
  title: string
  description?: string
  status: IssueStatus
  priority: IssuePriority
  createdAt: Date
  updatedAt: Date
  tags?: string[]
  // Optimistic update flags
  _isOptimistic?: boolean
  _aiPending?: boolean
}
