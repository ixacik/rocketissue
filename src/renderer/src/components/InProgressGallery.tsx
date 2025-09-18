import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IssueCard } from './IssueCard'
import { Issue, IssueStatus } from '@/types/issue'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { useDeleteIssue, useUpdateIssue } from '@/hooks/useIssues'
import { IssueDetailsModal } from './IssueDetailsModal'
import { EditIssueModal } from './EditIssueModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface InProgressGalleryProps {
  issues: Issue[]
  onIssueClick?: (issue: Issue) => void
  keyboardContext?: 'table' | 'gallery' | null
  keyboardIssueId?: string | null
  onKeyboardIssueChange?: (issueId: string | null) => void
  onKeyboardBoundary?: (direction: 'up' | 'down', issueId: string | null) => void
}

function DraggableIssueCard({
  issue,
  onIssueClick,
  isActive
}: {
  issue: Issue
  onIssueClick?: (issue: Issue) => void
  isActive?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `progress-${issue.id}`
  }) // Namespaced ID

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <IssueCard
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      issue={issue}
      isDragging={isDragging}
      onClick={() => onIssueClick?.(issue)}
      className={cn(isActive && 'ring-2 ring-primary/60 border-primary/60')}
    />
  )
}

export function InProgressGallery({
  issues,
  onIssueClick,
  keyboardContext = null,
  keyboardIssueId = null,
  onKeyboardIssueChange,
  onKeyboardBoundary
}: InProgressGalleryProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'in-progress'
  })

  const inProgressIssues = useMemo(
    () => issues.filter((issue) => issue.status === 'in_progress'),
    [issues]
  )

  const deleteIssue = useDeleteIssue()
  const updateIssue = useUpdateIssue()
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const deleteActionButtonRef = useRef<HTMLButtonElement | null>(null)

  const setKeyboardSelection = useCallback(
    (issueId: string | null) => {
      if (keyboardIssueId !== issueId) {
        onKeyboardIssueChange?.(issueId)
      }
    },
    [keyboardIssueId, onKeyboardIssueChange]
  )

  useEffect(() => {
    if (keyboardContext !== 'gallery') return

    if (inProgressIssues.length === 0) {
      if (keyboardIssueId) {
        onKeyboardIssueChange?.(null)
      }
      return
    }

    if (!keyboardIssueId || !inProgressIssues.some((issue) => issue.id === keyboardIssueId)) {
      setKeyboardSelection(inProgressIssues[inProgressIssues.length - 1]?.id ?? null)
    }
  }, [keyboardContext, keyboardIssueId, inProgressIssues, onKeyboardIssueChange, setKeyboardSelection])

  const handleCardClick = useCallback(
    (issue: Issue) => {
      if (onIssueClick) {
        onIssueClick(issue)
      } else {
        setSelectedIssue(issue)
        setIsModalOpen(true)
      }
    },
    [onIssueClick]
  )

  const handleEdit = useCallback(
    (id?: string) => {
      const issueToEdit = id ? inProgressIssues.find((i) => i.id === id) : null
      if (issueToEdit) {
        setEditingIssue(issueToEdit)
        setIsEditModalOpen(true)
      }
      setIsModalOpen(false)
    },
    [inProgressIssues]
  )

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmId(id)
    setIsModalOpen(false)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deleteConfirmId) {
      deleteIssue.mutate(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }, [deleteConfirmId, deleteIssue])

  const cycleStatus = useCallback(
    (issue: Issue) => {
      const statusCycle: Record<IssueStatus, IssueStatus> = {
        open: 'in_progress',
        in_progress: 'completed',
        completed: 'open',
        closed: 'closed'
      }
      const newStatus = statusCycle[issue.status]
      updateIssue.mutate({ id: issue.id, updates: { status: newStatus } })
    },
    [updateIssue]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (keyboardContext !== 'gallery') return
      if (isModalOpen || isEditModalOpen || deleteConfirmId) return
      const activeElement = document.activeElement
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return

      const activeIssue = keyboardIssueId
        ? inProgressIssues.find((issue) => issue.id === keyboardIssueId)
        : null
      const currentIndex = activeIssue
        ? inProgressIssues.findIndex((issue) => issue.id === activeIssue.id)
        : -1

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          if (inProgressIssues.length === 0) {
            onKeyboardBoundary?.('up', null)
            return
          }

          if (currentIndex === -1) {
            setKeyboardSelection(inProgressIssues[inProgressIssues.length - 1]?.id ?? null)
            return
          }

          if (currentIndex > 0) {
            setKeyboardSelection(inProgressIssues[currentIndex - 1].id)
          } else {
            onKeyboardBoundary?.('up', inProgressIssues[currentIndex].id)
          }
          break

        case 'ArrowDown':
          event.preventDefault()
          if (inProgressIssues.length === 0) {
            onKeyboardBoundary?.('down', null)
            return
          }

          if (currentIndex === -1) {
            setKeyboardSelection(inProgressIssues[inProgressIssues.length - 1]?.id ?? null)
            return
          }

          if (currentIndex < inProgressIssues.length - 1) {
            setKeyboardSelection(inProgressIssues[currentIndex + 1].id)
          } else {
            onKeyboardBoundary?.('down', inProgressIssues[currentIndex].id)
          }
          break

        case 'd':
        case 'D':
          if (activeIssue) {
            event.preventDefault()
            handleDelete(activeIssue.id)
          }
          break

        case 'e':
        case 'E':
          if (activeIssue) {
            event.preventDefault()
            handleEdit(activeIssue.id)
          }
          break

        case 't':
        case 'T':
          if (activeIssue) {
            event.preventDefault()
            cycleStatus(activeIssue)
          }
          break

        case 'Enter':
          if (activeIssue) {
            event.preventDefault()
            handleCardClick(activeIssue)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    keyboardContext,
    keyboardIssueId,
    inProgressIssues,
    handleCardClick,
    handleEdit,
    handleDelete,
    cycleStatus,
    onKeyboardBoundary,
    setKeyboardSelection,
    isModalOpen,
    isEditModalOpen,
    deleteConfirmId
  ])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          In Progress ({inProgressIssues.length})
        </h2>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-auto scrollbar-hide rounded-lg border-2 border-dashed transition-colors',
          isOver ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border',
          inProgressIssues.length === 0 && 'flex items-center justify-center'
        )}
      >
        {inProgressIssues.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground">Drag issues here to mark as in progress</p>
          </div>
        ) : (
          <div className="grid gap-2 p-2 auto-rows-min grid-cols-1 lg:grid-cols-2">
            {inProgressIssues.map((issue) => (
              <DraggableIssueCard
                key={issue.id}
                issue={issue}
                onIssueClick={handleCardClick}
                isActive={keyboardContext === 'gallery' && keyboardIssueId === issue.id}
              />
            ))}
          </div>
        )}
      </div>

      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
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

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            deleteActionButtonRef.current?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the issue from your
              tracker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction ref={deleteActionButtonRef} onClick={confirmDelete}>
              Delete Issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
