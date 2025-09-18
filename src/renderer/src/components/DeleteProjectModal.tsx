import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AlertTriangle } from 'lucide-react'
import { Project } from '@/types/project'
import { useDeleteProject } from '@/hooks/useProjects'

interface DeleteProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onDeleted?: () => void
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  project,
  onDeleted
}: DeleteProjectModalProps): React.JSX.Element {
  const deleteProject = useDeleteProject()
  const [confirmName, setConfirmName] = useState('')

  // Reset form when modal opens/closes
  if (!isOpen && confirmName) {
    setConfirmName('')
  }

  const handleDelete = async () => {
    if (!project || confirmName !== project.name) return

    try {
      await deleteProject.mutateAsync(project.id)
      setConfirmName('')
      onClose()
      onDeleted?.()
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && confirmName === project?.name) {
      e.preventDefault()
      handleDelete()
    }
  }

  if (!project) return <></>

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            This will permanently delete the project "{project.name}" and all its issues. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmName">
              Type <span className="font-semibold">{project.name}</span> to confirm
            </Label>
            <Input
              id="confirmName"
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter project name"
              autoFocus
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmName !== project.name || deleteProject.isPending}
          >
            {deleteProject.isPending ? 'Deleting...' : 'Yes, Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
