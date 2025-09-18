import { DragOverlay } from '@dnd-kit/core'
import { IssueCard } from './IssueCard'
import { Badge } from '@/components/ui/badge'
import { Issue } from '@/types/issue'
import { cn } from '@/lib/utils'

interface IssueDragOverlayProps {
  activeIssue: Issue | null
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20'
}

const statusBgColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700'
}

const formatStatus = (status: string): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Table row overlay component
function TableRowOverlay({ issue }: { issue: Issue }) {
  return (
    <div className="bg-background border border-border rounded-md p-2 shadow-lg opacity-90 min-w-[400px]">
      <div className="flex items-center gap-2">
        <Badge className={cn('text-xs', priorityColors[issue.priority])}>{issue.priority}</Badge>
        <span className="font-medium text-sm truncate flex-1">{issue.title}</span>
        <Badge className={cn('text-xs', statusBgColors[issue.status])}>
          {formatStatus(issue.status)}
        </Badge>
      </div>
    </div>
  )
}

export function IssueDragOverlay({ activeIssue }: IssueDragOverlayProps) {
  if (!activeIssue) return null

  return (
    <DragOverlay
      dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
      }}
    >
      {activeIssue.status === 'open' ? (
        <TableRowOverlay issue={activeIssue} />
      ) : (
        <div className="opacity-90 shadow-2xl">
          <IssueCard issue={activeIssue} isDragging />
        </div>
      )}
    </DragOverlay>
  )
}
