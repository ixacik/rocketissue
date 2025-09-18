export type IssueStatus = 'open' | 'in_progress' | 'completed' | 'closed'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'
export type IssueEffort = 'low' | 'medium' | 'high'
export type IssueType = 'bug' | 'feature' | 'enhancement' | 'task' | 'documentation' | 'chore'

export interface Issue {
  id: string
  title: string
  description?: string
  status: IssueStatus
  priority: IssuePriority
  effort: IssueEffort
  issueType: IssueType
  projectId: number
  createdAt: Date
  updatedAt: Date
  // Optimistic update flags
  _isOptimistic?: boolean
  _aiPending?: boolean
}
