import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

export function DoneDropZone() {
  const { isOver, setNodeRef } = useDroppable({
    id: 'done'
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Done</h2>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-lg border-2 border-dashed transition-all duration-200',
          'flex flex-col items-center justify-center gap-2',
          isOver
            ? 'border-green-500 bg-green-500/10 scale-[1.02]'
            : 'border-border/50 hover:border-border'
        )}
      >
        <CheckCircle2
          className={cn(
            'h-12 w-12 transition-all duration-200',
            isOver ? 'text-green-500 scale-110' : 'text-muted-foreground/30'
          )}
        />
        <p className={cn(
          'text-sm font-medium transition-colors duration-200',
          isOver ? 'text-green-600' : 'text-muted-foreground'
        )}>
          Drop here to complete
        </p>
        <p className="text-xs text-muted-foreground/60">
          Issues will be marked as done
        </p>
      </div>
    </div>
  )
}