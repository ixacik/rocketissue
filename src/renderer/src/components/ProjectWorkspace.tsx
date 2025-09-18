import { ReactNode, useEffect, useState, useMemo, useCallback } from 'react'
import { IssueList } from '@/components/IssueList'
import { InProgressGallery } from '@/components/InProgressGallery'
import { DoneDropZone } from '@/components/DoneDropZone'
import { CreateProjectModal } from '@/components/CreateProjectModal'
import { Issue, IssueType, IssuePriority, IssueEffort } from '@/types/issue'
import { Project } from '@/types/project'
import { Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSetActiveProject } from '@/stores/projectStore'

interface ProjectWorkspaceProps {
  projectId: number | null
  project?: Project | null
  issues: Issue[]
  searchQuery: string
  onIssueClick: (issue: Issue) => void
  isEmptyProject?: boolean
  children?: ReactNode
}

export function ProjectWorkspace({
  projectId,
  issues,
  searchQuery,
  onIssueClick,
  isEmptyProject = false
}: ProjectWorkspaceProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const setActiveProject = useSetActiveProject()
  // View and filter states
  const [issueView, setIssueView] = useState<'open' | 'all'>('open')
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all')
  const [effortFilter, setEffortFilter] = useState<IssueEffort | 'all'>('all')
  const [keyboardContext, setKeyboardContext] = useState<'table' | 'gallery' | null>(null)
  const [keyboardIssueId, setKeyboardIssueId] = useState<string | null>(null)

  // Filter issues for this project (always return empty array if no projectId)
  const projectIssues = projectId ? issues.filter((i) => i.projectId === projectId) : []

  // Calculate counts for tabs
  const openIssuesCount = useMemo(
    () => projectIssues.filter((i) => i.status === 'open').length,
    [projectIssues]
  )
  const allIssuesCount = projectIssues.length
  const inProgressIssues = useMemo(
    () => projectIssues.filter((i) => i.status === 'in_progress'),
    [projectIssues]
  )

  // Filter issues based on view
  const viewFilteredIssues = useMemo(
    () => (issueView === 'open' ? projectIssues.filter((i) => i.status === 'open') : projectIssues),
    [projectIssues, issueView]
  )

  // Handle Enter key for empty project
  useEffect(() => {
    if (!isEmptyProject) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault()
        setShowCreateModal(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEmptyProject])

  const handleProjectCreated = (newProjectId: number) => {
    setActiveProject(newProjectId)
    setShowCreateModal(false)
  }

  // If this is an empty project slot, show create state
  if (isEmptyProject) {
    return (
      <>
        <div className="h-4/5 flex items-center justify-center">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Create New Project</h2>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Press Enter to create a new project and start organizing your work.
            </p>
            <Button size="lg" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProjectCreated}
        />
      </>
    )
  }

  useEffect(() => {
    if (isEmptyProject) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      if (!event.ctrlKey || event.metaKey || event.altKey) return

      const target = event.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return
      }

      const blockingDialog = document.querySelector<HTMLElement>(
        '[data-state="open"][data-slot$="dialog-content"]'
      )
      if (blockingDialog) return

      event.preventDefault()
      setIssueView((prev) => (prev === 'open' ? 'all' : 'open'))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEmptyProject, setIssueView])

  const handleTableKeyboardBoundary = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'up') {
        if (inProgressIssues.length === 0) return
        setKeyboardContext('gallery')
        setKeyboardIssueId(inProgressIssues.at(-1)?.id ?? null)
      }
    },
    [inProgressIssues]
  )

  const handleGalleryKeyboardBoundary = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'down') {
        if (viewFilteredIssues.length === 0) {
          setKeyboardContext(null)
          setKeyboardIssueId(null)
          return
        }
        setKeyboardContext('table')
        setKeyboardIssueId(null)
      }
    },
    [viewFilteredIssues]
  )

  const handleTableKeyboardChange = useCallback((issueId: string | null) => {
    if (issueId) {
      setKeyboardContext('table')
      setKeyboardIssueId(issueId)
    } else {
      setKeyboardIssueId(null)
      setKeyboardContext((current) => (current === 'table' ? null : current))
    }
  }, [])

  const handleGalleryKeyboardChange = useCallback((issueId: string | null) => {
    if (issueId) {
      setKeyboardContext('gallery')
      setKeyboardIssueId(issueId)
    } else {
      setKeyboardIssueId(null)
      setKeyboardContext((current) => (current === 'gallery' ? null : current))
    }
  }, [])

  // Always show the full issue tracker UI, even with 0 issues
  return (
    <div className="flex-1 flex flex-col gap-4 overflow-visible">
      {/* Top section: In Progress and Done zones */}
      <div className="flex gap-4 h-[35%] min-h-[200px]">
        {/* In-Progress Gallery (70% of top section) */}
        <div className="flex-[7] min-w-0">
          <InProgressGallery
            issues={projectIssues}
            onIssueClick={onIssueClick}
            keyboardContext={keyboardContext}
            keyboardIssueId={keyboardContext === 'gallery' ? keyboardIssueId : null}
            onKeyboardIssueChange={handleGalleryKeyboardChange}
            onKeyboardBoundary={handleGalleryKeyboardBoundary}
          />
        </div>

        {/* Done Drop Zone (30% of top section) */}
        <div className="flex-[3] min-w-[200px]">
          <DoneDropZone />
        </div>
      </div>

      {/* Bottom section: Issues Table */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tabs
              value={issueView}
              onValueChange={(v) => setIssueView(v as 'open' | 'all')}
              className="h-7"
            >
              <TabsList className="h-7 p-0.5">
                <TabsTrigger value="open" className="h-6 px-3 text-xs data-[state=active]:text-xs">
                  Open ({openIssuesCount})
                </TabsTrigger>
                <TabsTrigger value="all" className="h-6 px-3 text-xs data-[state=active]:text-xs">
                  All ({allIssuesCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-muted-foreground text-xs">(Ctrl+Tab)</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-7 px-2 text-xs"
          >
            <Filter className="size-2.5 mr-1" />
            Filters
            {(typeFilter !== 'all' || priorityFilter !== 'all' || effortFilter !== 'all') && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs h-4">
                {
                  [typeFilter !== 'all', priorityFilter !== 'all', effortFilter !== 'all'].filter(
                    Boolean
                  ).length
                }
              </Badge>
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-auto scrollbar-hide">
          <IssueList
            searchQuery={searchQuery}
            onIssueClick={onIssueClick}
            projectId={projectId}
            issues={viewFilteredIssues}
            showFilters={showFilters}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            effortFilter={effortFilter}
            setEffortFilter={setEffortFilter}
            keyboardContext={keyboardContext}
            keyboardIssueId={keyboardContext === 'table' ? keyboardIssueId : null}
            onKeyboardIssueChange={handleTableKeyboardChange}
            onKeyboardBoundary={handleTableKeyboardBoundary}
          />
        </div>
      </div>
    </div>
  )
}
