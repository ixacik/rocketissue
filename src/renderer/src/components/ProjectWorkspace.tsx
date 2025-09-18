import { ReactNode, useEffect, useState } from 'react'
import { IssueList } from '@/components/IssueList'
import { InProgressGallery } from '@/components/InProgressGallery'
import { DoneDropZone } from '@/components/DoneDropZone'
import { CreateProjectModal } from '@/components/CreateProjectModal'
import { Issue } from '@/types/issue'
import { Project } from '@/types/project'
import { Plus, CircleDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  project,
  issues,
  searchQuery,
  onIssueClick,
  isEmptyProject = false
}: ProjectWorkspaceProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const setActiveProject = useSetActiveProject()
  // Filter issues for this project (always return empty array if no projectId)
  const projectIssues = projectId ? issues.filter(i => i.projectId === projectId) : []

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
            <h2 className="text-xl font-semibold mb-2">
              Create New Project
            </h2>
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

  // Always show the full issue tracker UI, even with 0 issues
  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {/* Top section: In Progress and Done zones */}
      <div className="flex gap-4 h-[35%] min-h-[200px]">
        {/* In-Progress Gallery (70% of top section) */}
        <div className="flex-[7] min-w-0">
          <InProgressGallery issues={projectIssues} onIssueClick={onIssueClick} />
        </div>

        {/* Done Drop Zone (30% of top section) */}
        <div className="flex-[3] min-w-[200px]">
          <DoneDropZone />
        </div>
      </div>

      {/* Bottom section: Open Issues Table */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <CircleDot className="h-3.5 w-3.5" />
            Open Issues ({projectIssues.filter(i => i.status === 'open').length})
          </h2>
        </div>
        <div className="flex-1 overflow-auto scrollbar-hide">
          <IssueList
            searchQuery={searchQuery}
            onIssueClick={onIssueClick}
            projectId={projectId}
          />
        </div>
      </div>
    </div>
  )
}