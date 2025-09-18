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
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Done
        </h2>
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