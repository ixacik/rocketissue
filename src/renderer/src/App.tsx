import { useState, useEffect, useCallback, useMemo } from 'react'
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
import {
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import { IssueList } from '@/components/IssueList'
import { InProgressGallery } from '@/components/InProgressGallery'
import { DoneDropZone } from '@/components/DoneDropZone'
import { IssueDragOverlay } from '@/components/IssueDragOverlay'
import { IssueDetailsModal } from '@/components/IssueDetailsModal'
import { EditIssueModal } from '@/components/EditIssueModal'
import { Header } from '@/components/Header'
import { CommandPalette } from '@/components/CommandPalette'
import { useSearchIssues, useUpdateIssue } from '@/hooks/useIssues'
import { Issue } from '@/types/issue'
import {
  useActiveId,
  useSetActiveId,
  useSetIsDragging,
  useSetDraggedItem,
  useResetDnd
} from '@/stores/dndStore'

function App(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: issues = [] } = useSearchIssues(searchQuery)
  const updateIssue = useUpdateIssue()

  // Modal states
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)

  // DnD state from Zustand
  const activeId = useActiveId()
  const setActiveId = useSetActiveId()
  const setIsDragging = useSetIsDragging()
  const setDraggedItem = useSetDraggedItem()
  const resetDnd = useResetDnd()

  // Find the active issue being dragged
  const activeIssue = useMemo(
    () => (activeId ? issues.find(i => i.id === activeId) ?? null : null),
    [activeId, issues]
  )

  // Custom collision detection: pointer for containers, closest center for items
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // First, check if pointer is over a droppable container
    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        ({ id }) => ['done', 'open-table', 'in-progress'].includes(id as string)
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

  const handleDelete = useCallback(
    (_id: string) => {
      // This would be handled by the details modal
      setIsDetailsModalOpen(false)
    },
    []
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const activeIdStr = active.id as string

    // Extract the real issue ID from namespaced ID (e.g., 'open-123' -> '123')
    const issueId = activeIdStr.replace(/^(open|progress)-/, '')
    const draggedIssue = issues.find(i => i.id === issueId)

    if (draggedIssue) {
      setActiveId(issueId) // Store the clean ID
      setDraggedItem(draggedIssue)
      setIsDragging(true)
    }
  }, [issues, setActiveId, setDraggedItem, setIsDragging])

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Could add visual feedback here if needed
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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
  }, [activeIssue, updateIssue, resetDnd])

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
        {/* Header */}
        <div className="flex-shrink-0 p-4 pb-2">
          <Header searchValue={searchQuery} onSearchChange={setSearchQuery} />
        </div>

        {/* Main content area with vertical layout */}
        <div className="flex-1 flex flex-col gap-4 p-4 pt-2 overflow-hidden">
          {/* Top section: In Progress and Done zones */}
          <div className="flex gap-4 h-[35%] min-h-[200px]">
            {/* In-Progress Gallery (70% of top section) */}
            <div className="flex-[7] min-w-0">
              <InProgressGallery issues={issues} onIssueClick={handleIssueClick} />
            </div>

            {/* Done Drop Zone (30% of top section) */}
            <div className="flex-[3] min-w-[200px]">
              <DoneDropZone />
            </div>
          </div>

          {/* Bottom section: Open Issues Table */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Open Issues ({issues.filter(i => i.status === 'open').length})
              </h2>
            </div>
            <div className="flex-1 overflow-auto scrollbar-hide">
              <IssueList searchQuery={searchQuery} onIssueClick={handleIssueClick} />
            </div>
          </div>
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
      </div>
    </DndContext>
  )
}

export default App
