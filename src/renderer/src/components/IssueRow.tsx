import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { Issue, IssueStatus, IssuePriority } from '@/types/issue'

interface IssueRowProps {
  issue: Issue
  onClick?: (issue: Issue) => void
}

const statusBgColors: Record<IssueStatus, string> = {
  open: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  completed: 'bg-green-100 text-green-700 hover:bg-green-200',
  closed: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
}

const priorityColors: Record<IssuePriority, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  critical: 'text-red-500'
}

const formatStatus = (status: IssueStatus): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function IssueRow({ issue, onClick }: IssueRowProps): React.JSX.Element {
  const handleRowClick = (): void => {
    onClick?.(issue)
  }

  const isOptimistic = issue._isOptimistic
  const aiPending = issue._aiPending

  return (
    <TableRow
      className={`cursor-pointer group ${isOptimistic ? 'opacity-90' : ''}`}
      onClick={handleRowClick}
    >
      {/* Priority */}
      <TableCell className="w-[80px]">
        {aiPending ? (
          <Skeleton className="h-4 w-12" />
        ) : (
          <div className={`font-bold text-xs ${priorityColors[issue.priority]}`}>
            {issue.priority === 'critical'
              ? '!!!'
              : issue.priority === 'high'
                ? '!!'
                : issue.priority === 'medium'
                  ? '!'
                  : ''}
            <span className="ml-1 font-normal capitalize">{issue.priority}</span>
          </div>
        )}
      </TableCell>

      {/* Title */}
      <TableCell>
        <div className="font-medium">{issue.title}</div>
        {issue.description && (
          <div className="text-xs text-muted-foreground line-clamp-1">{issue.description}</div>
        )}
      </TableCell>

      {/* Tags */}
      <TableCell className="w-[200px]">
        {aiPending ? (
          <div className="flex gap-1">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-14" />
          </div>
        ) : (
          <div className="flex gap-1 flex-wrap">
            {issue.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {issue.tags && issue.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{issue.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className="w-[100px]">
        <Badge className={`${statusBgColors[issue.status]}`}>{formatStatus(issue.status)}</Badge>
      </TableCell>
    </TableRow>
  )
}
