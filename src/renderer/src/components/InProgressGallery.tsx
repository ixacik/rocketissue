import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IssueCard } from './IssueCard'
import { Issue } from '@/types/issue'
import { cn } from '@/lib/utils'
import { Folder } from 'lucide-react'

interface InProgressGalleryProps {
  issues: Issue[]
  onIssueClick?: (issue: Issue) => void
}

function DraggableIssueCard({ issue, onIssueClick }: { issue: Issue; onIssueClick?: (issue: Issue) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `progress-${issue.id}` }) // Namespaced ID

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
    />
  )
}

export function InProgressGallery({ issues, onIssueClick }: InProgressGalleryProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'in-progress'
  })

  // Filter only in_progress issues
  const inProgressIssues = useMemo(
    () => issues.filter(issue => issue.status === 'in_progress'),
    [issues]
  )

  // No need for itemIds anymore since we're not using SortableContext

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
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
            <Folder className="h-12 w-12 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Drag issues here to mark as in progress
            </p>
          </div>
        ) : (
          <div className="grid gap-2 p-2 auto-rows-min grid-cols-1 lg:grid-cols-2">
            {inProgressIssues.map((issue) => (
              <DraggableIssueCard
                key={issue.id}
                issue={issue}
                onIssueClick={onIssueClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}