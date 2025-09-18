import { Issue, IssueStatus, IssuePriority, IssueEffort } from '@/types/issue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Edit, Trash2 } from 'lucide-react'

interface IssueDetailsModalProps {
  issue: Issue | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const statusColors: Record<IssueStatus, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
}

const priorityColors: Record<IssuePriority, string> = {
  low: 'border-gray-500/30 text-gray-500',
  medium: 'border-blue-500/30 text-blue-500',
  high: 'border-orange-500/30 text-orange-500',
  critical: 'border-red-500/30 text-red-500'
}

const effortColors: Record<IssueEffort, string> = {
  low: 'border-green-500/30 text-green-500',
  medium: 'border-yellow-500/30 text-yellow-500',
  high: 'border-red-500/30 text-red-500'
}

const formatStatus = (status: IssueStatus): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatPriority = (priority: IssuePriority): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

const formatEffort = (effort: IssueEffort): string => {
  return effort.charAt(0).toUpperCase() + effort.slice(1)
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function IssueDetailsModal({
  issue,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: IssueDetailsModalProps): React.JSX.Element {
  if (!issue) return <></>

  const handleEdit = (): void => {
    onEdit?.(issue.id)
    onClose()
  }

  const handleDelete = (): void => {
    onDelete?.(issue.id)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[80vw] !h-[80vh] !max-w-[80vw] sm:!max-w-[80vw] flex flex-col p-0 gap-0">
        {/* Header Section */}
        <div className="px-8 py-6 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight">{issue.title}</h2>
              <div className="flex items-center gap-3">
                <Badge className={`${statusColors[issue.status]} rounded-full px-3 py-1`}>
                  {formatStatus(issue.status)}
                </Badge>
                <Badge
                  className={`${priorityColors[issue.priority]} rounded-full px-3 py-1`}
                  variant="outline"
                >
                  {formatPriority(issue.priority)} Priority
                </Badge>
                <Badge
                  className={`${effortColors[issue.effort || 'medium']} rounded-full px-3 py-1`}
                  variant="outline"
                >
                  {formatEffort(issue.effort || 'medium')} Effort
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 hover:bg-destructive/10"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-6">
            {/* Description */}
            {issue.description && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {issue.tags && issue.tags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {issue.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-8 py-4 border-t bg-muted/30">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created: {formatDate(issue.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated: {formatDate(issue.updatedAt)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
