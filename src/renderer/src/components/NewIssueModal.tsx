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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateIssue } from '@/hooks/useIssues'

interface NewIssueModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewIssueModal({ isOpen, onClose }: NewIssueModalProps): React.JSX.Element {
  const createIssue = useCreateIssue()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Reset form when modal opens
  if (isOpen && !title && !description) {
    // Form is already empty, good to go
  }

  const handleSubmit = (): void => {
    if (!title.trim()) return

    // Fire the mutation
    createIssue.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      status: 'open', // New issues always start as open
      priority: 'medium', // Temporary, will be replaced by AI
      tags: [] // Temporary, will be replaced by AI
    })

    // Close modal immediately (optimistic UI)
    setTitle('')
    setDescription('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Describe your issue and AI will automatically assign priority and tags.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide more details about the issue (optional)"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Create Issue (↵)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
