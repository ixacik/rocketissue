import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query'
import type { Issue } from '@/types/issue'

// Database issue type (from the schema)
type DbIssue = {
  id: number
  title: string
  description: string | null
  status: 'open' | 'in_progress' | 'completed' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  effort: 'low' | 'medium' | 'high'
  tags: string[] | null
  createdAt: Date
  updatedAt: Date
}

// Convert database Issue to frontend Issue type
function convertIssue(dbIssue: DbIssue): Issue {
  return {
    ...dbIssue,
    id: dbIssue.id.toString(), // Convert number ID to string for compatibility
    effort: dbIssue.effort || 'medium', // Provide default for undefined effort
    createdAt: new Date(dbIssue.createdAt),
    updatedAt: new Date(dbIssue.updatedAt),
    tags: dbIssue.tags || [],
    description: dbIssue.description || undefined
  }
}

// Query key factory
const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters: string) => [...issueKeys.lists(), { filters }] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const
}

// Fetch all issues
export function useIssues(): UseQueryResult<Issue[], Error> {
  return useQuery({
    queryKey: issueKeys.lists(),
    queryFn: async () => {
      if (!window.api?.issues?.getAll) {
        throw new Error('API not available: window.api.issues.getAll is not exposed')
      }
      const issues = await window.api.issues.getAll()
      return issues.map(convertIssue)
    }
  })
}

// Fetch single issue
export function useIssue(id: string): UseQueryResult<Issue | undefined, Error> {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: async () => {
      const issue = await window.api.issues.getById(parseInt(id))
      return issue ? convertIssue(issue) : undefined
    },
    enabled: !!id
  })
}

// Create issue mutation (with AI enhancement and optimistic updates)
export function useCreateIssue(): UseMutationResult<
  Issue,
  Error,
  Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Convert undefined to null for database compatibility
      const dbIssue: Omit<DbIssue, 'id' | 'createdAt' | 'updatedAt'> = {
        ...issue,
        description: issue.description === undefined ? null : issue.description,
        tags: issue.tags && issue.tags.length > 0 ? issue.tags : null
      }
      // Use AI-enhanced creation
      const created = await window.api.issues.createWithAI(dbIssue)
      return convertIssue(created)
    },
    onMutate: async (newIssue) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: issueKeys.all })

      // Snapshot the previous values for all issue queries
      const previousQueries = queryClient.getQueriesData<Issue[]>({ queryKey: issueKeys.all })

      // Optimistically update with a temporary issue
      const optimisticIssue: Issue = {
        ...newIssue,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        _isOptimistic: true,
        _aiPending: true // AI will fill in priority, effort and tags
      }

      // Update ALL issue list caches (including search queries)
      queryClient.setQueriesData<Issue[]>({ queryKey: issueKeys.all }, (old) => {
        if (!old) return [optimisticIssue]
        return [optimisticIssue, ...old]
      })

      // Return context with the snapshot for potential rollback
      return { previousQueries, optimisticIssue }
    },
    onError: (_err, _newIssue, context) => {
      // Rollback all queries to their previous state if mutation fails
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSuccess: (data, _variables, context) => {
      // Replace the optimistic issue with the real one from the server in ALL caches
      queryClient.setQueriesData<Issue[]>({ queryKey: issueKeys.all }, (old) => {
        if (!old) return [data]
        return old.map((issue) => (issue.id === context?.optimisticIssue.id ? data : issue))
      })
    },
    onSettled: () => {
      // Always refetch all issue queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: issueKeys.all })
    }
  })
}

// Update issue mutation
export function useUpdateIssue(): UseMutationResult<
  Issue | undefined,
  Error,
  { id: string; updates: Partial<Omit<Issue, 'id' | 'createdAt'>> }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Partial<Omit<Issue, 'id' | 'createdAt'>>
    }) => {
      // Convert undefined to null for database compatibility
      const dbUpdates: Partial<Omit<DbIssue, 'id' | 'createdAt'>> = {}

      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.status !== undefined) dbUpdates.status = updates.status
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority
      if (updates.description !== undefined) {
        dbUpdates.description = updates.description === undefined ? null : updates.description
      }
      if (updates.tags !== undefined) {
        dbUpdates.tags = updates.tags && updates.tags.length > 0 ? updates.tags : null
      }

      const updated = await window.api.issues.update(parseInt(id), dbUpdates)
      return updated ? convertIssue(updated) : undefined
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() })
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.id) })
    }
  })
}

// Delete issue mutation
export function useDeleteIssue(): UseMutationResult<boolean, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await window.api.issues.delete(parseInt(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() })
    }
  })
}

// Search issues
export function useSearchIssues(query: string): UseQueryResult<Issue[], Error> {
  return useQuery({
    queryKey: issueKeys.list(query),
    queryFn: async () => {
      if (!window.api?.issues) {
        throw new Error('API not available: window.api.issues is not exposed')
      }

      if (!query) {
        const issues = await window.api.issues.getAll()
        return issues.map(convertIssue)
      }
      const issues = await window.api.issues.search(query)
      return issues.map(convertIssue)
    }
  })
}
