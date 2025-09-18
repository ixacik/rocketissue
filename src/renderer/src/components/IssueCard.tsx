import { forwardRef } from 'react'
import { Issue } from '@/types/issue'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface IssueCardProps extends React.HTMLAttributes<HTMLDivElement> {
  issue: Issue
  isDragging?: boolean
  isOver?: boolean
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20'
}

const effortColors: Record<string, string> = {
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20'
}

export const IssueCard = forwardRef<HTMLDivElement, IssueCardProps>(
  ({ issue, isDragging, isOver, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-card border border-border rounded-lg p-3 space-y-2 cursor-grab transition-all',
          isDragging && 'opacity-50 cursor-grabbing',
          isOver && 'ring-2 ring-primary/50 border-primary',
          className
        )}
        style={style}
        {...props}
      >
        {/* Title */}
        <h3 className="font-medium text-sm leading-tight line-clamp-2">
          {issue.title}
        </h3>

        {/* Priority and Effort badges */}
        <div className="flex items-center gap-1">
          <Badge className={cn('text-xs px-1.5 py-0', priorityColors[issue.priority])}>
            {issue.priority === 'critical' ? '!!!' : issue.priority === 'high' ? '!!' : issue.priority === 'medium' ? '!' : ''} {issue.priority}
          </Badge>
          {issue.effort && (
            <Badge className={cn('text-xs px-1.5 py-0', effortColors[issue.effort])}>
              {issue.effort}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {issue.tags && issue.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {issue.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-1.5 py-0"
              >
                {tag}
              </Badge>
            ))}
            {issue.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{issue.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    )
  }
)

IssueCard.displayName = 'IssueCard'