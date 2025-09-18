import { useState, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  CollisionDetection
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { ProjectWorkspace } from '@/components/ProjectWorkspace'
import { IssueDragOverlay } from '@/components/IssueDragOverlay'
import { IssueDetailsModal } from '@/components/IssueDetailsModal'
import { EditIssueModal } from '@/components/EditIssueModal'
import { Header } from '@/components/Header'
import { CommandPalette } from '@/components/CommandPalette'
import { DeleteProjectModal } from '@/components/DeleteProjectModal'
import { useSearchIssues, useUpdateIssue } from '@/hooks/useIssues'
import { Issue } from '@/types/issue'
import { useProjects } from '@/hooks/useProjects'
import { slideVariants, slideTransition } from '@/lib/animations'
import {
  useActiveId,
  useSetActiveId,
  useSetIsDragging,
  useSetDraggedItem,
  useResetDnd
} from '@/stores/dndStore'
import {
  useActiveProjectId,
  useSetActiveProject,
  useSetProjects,
  useSlideDirection,
  useSetTransitioning,
  useIsNavigating,
  useSetIsNavigating
} from '@/stores/projectStore'

function App(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: issues = [] } = useSearchIssues(searchQuery)
  const updateIssue = useUpdateIssue()

  // Project state
  const { data: projects = [] } = useProjects()
  const activeProjectId = useActiveProjectId()
  const setActiveProject = useSetActiveProject()
  const setProjects = useSetProjects()
  const slideDirection = useSlideDirection()
  const setTransitioning = useSetTransitioning()
  const isNavigating = useIsNavigating()
  const setIsNavigating = useSetIsNavigating()

  // Modal states
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false)

  // DnD state from Zustand
  const activeId = useActiveId()
  const setActiveId = useSetActiveId()
  const setIsDragging = useSetIsDragging()
  const setDraggedItem = useSetDraggedItem()
  const resetDnd = useResetDnd()

  // Find the active issue being dragged
  const activeIssue = useMemo(
    () => (activeId ? (issues.find((i) => i.id === activeId) ?? null) : null),
    [activeId, issues]
  )

  // Custom collision detection: pointer for containers, closest center for items
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // First, check if pointer is over a droppable container
    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: args.droppableContainers.filter(({ id }) =>
        ['done', 'open-table', 'in-progress'].includes(id as string)
      )
    })

    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    // If no container collision, check for item collisions
    return closestCenter(args)
  }, [])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Ensure dark mode is always active
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  // Initialize projects
  useEffect(() => {
    setProjects(projects)
    // Start with create_new slot if no projects exist, or first project
    if (!activeProjectId) {
      if (projects.length === 0) {
        setActiveProject(-1) // Start at create_new
      } else {
        setActiveProject(projects[0].id) // Use first project
      }
    }
  }, [projects, activeProjectId, setProjects, setActiveProject])

  // Calculate current index in the virtual array [project1, project2, ..., create_new]
  const getCurrentIndex = () => {
    if (activeProjectId === -1) {
      return projects.length // create_new is at the end
    }
    return projects.findIndex((p) => p.id === activeProjectId)
  }

  const currentIndex = getCurrentIndex()
  const currentProject =
    activeProjectId === -1 ? null : projects.find((p) => p.id === activeProjectId) || null
  const isEmptyProject = activeProjectId === -1

  // Separate effect for auto-hiding navigator after timeout
  useEffect(() => {
    if (isNavigating) {
      const timeout = setTimeout(() => {
        setIsNavigating(false)
      }, 2000)

      return () => clearTimeout(timeout)
    }
    return undefined
  }, [isNavigating, setIsNavigating])

  // Global arrow key navigation for projects (circular)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't navigate if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      const totalSlots = projects.length + 1 // +1 for create_new slot
      if (totalSlots === 1) return // Only create_new exists, nowhere to navigate

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()

        // Show navigator immediately
        setIsNavigating(true)

        if (e.key === 'ArrowLeft') {
          // Move left in array (with wrap around)
          const newIndex = (currentIndex - 1 + totalSlots) % totalSlots

          if (newIndex === projects.length) {
            // This is the create_new slot
            setActiveProject(-1)
          } else {
            // This is a project slot
            setActiveProject(projects[newIndex].id)
          }
        } else if (e.key === 'ArrowRight') {
          // Move right in array (with wrap around)
          const newIndex = (currentIndex + 1) % totalSlots

          if (newIndex === projects.length) {
            // This is the create_new slot
            setActiveProject(-1)
          } else {
            // This is a project slot
            setActiveProject(projects[newIndex].id)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [projects, currentIndex, setActiveProject, setIsNavigating])

  // Shift+D to delete current project
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if typing in an input or if no valid project
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // Check for Shift+D
      if (e.key === 'D' && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Can't delete if on create new slot or no project
        if (!currentProject || activeProjectId === -1 || activeProjectId === null) return

        e.preventDefault()
        setIsDeleteProjectModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentProject, activeProjectId])

  const handleIssueClick = useCallback((issue: Issue) => {
    setSelectedIssue(issue)
    setIsDetailsModalOpen(true)
  }, [])

  const handleEdit = useCallback(
    (id?: string) => {
      const issueToEdit = id ? issues.find((i) => i.id === id) : null
      if (issueToEdit) {
        setEditingIssue(issueToEdit)
        setIsEditModalOpen(true)
      }
      setIsDetailsModalOpen(false)
    },
    [issues]
  )

  const handleDelete = useCallback((_id: string) => {
    // This would be handled by the details modal
    setIsDetailsModalOpen(false)
  }, [])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const activeIdStr = active.id as string

      // Extract the real issue ID from namespaced ID (e.g., 'open-123' -> '123')
      const issueId = activeIdStr.replace(/^(open|progress)-/, '')
      const draggedIssue = issues.find((i) => i.id === issueId)

      if (draggedIssue) {
        setActiveId(issueId) // Store the clean ID
        setDraggedItem(draggedIssue)
        setIsDragging(true)
      }
    },
    [issues, setActiveId, setDraggedItem, setIsDragging]
  )

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Could add visual feedback here if needed
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (!over || !activeIssue) {
        resetDnd()
        return
      }

      const overId = over.id as string
      const activeIdStr = active.id as string
      // Extract the real issue ID from namespaced ID
      const activeIssueId = activeIdStr.replace(/^(open|progress)-/, '')

      // Determine the new status based on the drop zone
      let newStatus: Issue['status'] | null = null

      if (overId === 'open-table') {
        newStatus = 'open'
      } else if (overId === 'in-progress') {
        newStatus = 'in_progress'
      } else if (overId === 'done') {
        newStatus = 'completed'
      } else if (overId.startsWith('open-') || overId.startsWith('progress-')) {
        // Dropped on another issue, determine container by its prefix
        if (overId.startsWith('open-')) {
          newStatus = 'open'
        } else if (overId.startsWith('progress-')) {
          newStatus = 'in_progress'
        }
      }

      // Update the issue status if it changed
      if (newStatus && newStatus !== activeIssue.status) {
        updateIssue.mutate({
          id: activeIssueId,
          updates: { status: newStatus }
        })
      }

      resetDnd()
    },
    [activeIssue, updateIssue, resetDnd]
  )

  const handleDragCancel = useCallback(() => {
    resetDnd()
  }, [resetDnd])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        {/* Custom titlebar - draggable area */}
        <div
          className="h-[26px] bg-muted/50 select-none text-foreground/50 text-xs flex justify-center items-center"
          style={
            {
              WebkitAppRegion: 'drag'
            } as React.CSSProperties
          }
        >
          {currentProject ? `RocketIssue - ${currentProject.name}` : `RocketIssue`}
        </div>

        {/* Header - static, outside animation */}
        <div className="flex-shrink-0 p-4 pb-2">
          <Header
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            activeProjectId={activeProjectId}
          />
        </div>

        {/* Main content area with slide transitions */}
        <div className="flex-1 p-4 pt-2 overflow-hidden relative">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={activeProjectId || 'empty'}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="h-full"
              onAnimationStart={() => setTransitioning(true)}
              onAnimationComplete={() => setTransitioning(false)}
            >
              <ProjectWorkspace
                projectId={isEmptyProject ? null : activeProjectId}
                project={currentProject}
                issues={issues}
                searchQuery={searchQuery}
                onIssueClick={handleIssueClick}
                isEmptyProject={isEmptyProject}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <CommandPalette />

        {/* Drag Overlay */}
        <IssueDragOverlay activeIssue={activeIssue} />

        {/* Modals */}
        {selectedIssue && (
          <IssueDetailsModal
            issue={selectedIssue}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        {editingIssue && (
          <EditIssueModal
            issue={editingIssue}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setEditingIssue(null)
            }}
          />
        )}

        {/* Delete Project Modal */}
        <DeleteProjectModal
          isOpen={isDeleteProjectModalOpen}
          onClose={() => setIsDeleteProjectModalOpen(false)}
          project={currentProject}
          onDeleted={() => {
            // After deletion, move to first project or create new
            if (projects.length > 1) {
              const remainingProjects = projects.filter((p) => p.id !== currentProject?.id)
              if (remainingProjects.length > 0) {
                setActiveProject(remainingProjects[0].id)
              }
            } else {
              // No projects left, go to create new
              setActiveProject(-1)
            }
          }}
        />
      </div>
    </DndContext>
  )
}

export default App
