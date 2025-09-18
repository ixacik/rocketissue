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
import { Textarea } from '@/components/ui/textarea'
import { useCreateIssue } from '@/hooks/useIssues'

interface NewIssueModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewIssueModal({ isOpen, onClose }: NewIssueModalProps): React.JSX.Element {
  const createIssue = useCreateIssue()

  const [description, setDescription] = useState('')

  // Reset form when modal opens
  if (isOpen && !description) {
    // Form is already empty, good to go
  }

  const handleSubmit = (): void => {
    if (!description.trim()) return

    // Fire the mutation with raw input
    createIssue.mutate(description.trim())

    // Close modal immediately (optimistic UI)
    setDescription('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
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
            Describe what needs to be done. AI will automatically generate a title, format the description, and assign priority and tags.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="description">What needs to be done?</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue, bug, or feature request..."
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Be as descriptive as possible. AI will structure this into a proper issue.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!description.trim()}>
            Create Issue (⌘↵)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}