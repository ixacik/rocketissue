import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useUpdateIssue } from '@/hooks/useIssues'
import { Issue, IssueStatus, IssuePriority, IssueEffort, IssueType } from '@/types/issue'

interface EditIssueModalProps {
  issue: Issue
  isOpen: boolean
  onClose: () => void
}

export function EditIssueModal({ issue, isOpen, onClose }: EditIssueModalProps): React.JSX.Element {
  const updateIssue = useUpdateIssue()

  const [title, setTitle] = useState(issue.title)
  const [description, setDescription] = useState(issue.description || '')
  const [status, setStatus] = useState<IssueStatus>(issue.status)
  const [priority, setPriority] = useState<IssuePriority>(issue.priority)
  const [effort, setEffort] = useState<IssueEffort>(issue.effort || 'medium')
  const [issueType, setIssueType] = useState<IssueType>(issue.issueType || 'task')

  // Reset form when issue changes
  useEffect(() => {
    setTitle(issue.title)
    setDescription(issue.description || '')
    setStatus(issue.status)
    setPriority(issue.priority)
    setEffort(issue.effort || 'medium')
    setIssueType(issue.issueType || 'task')
  }, [issue])

  const handleSubmit = (): void => {
    if (!title.trim()) return

    updateIssue.mutate({
      id: issue.id,
      updates: {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        effort,
        issueType
      }
    })

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
          <DialogTitle>Edit Issue</DialogTitle>
          <DialogDescription>Update the issue details below.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Provide more details about the issue"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as IssueStatus)}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select value={issueType} onValueChange={(value) => setIssueType(value as IssueType)}>
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="enhancement">Enhancement</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="chore">Chore</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as IssuePriority)}
              >
                <SelectTrigger id="edit-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-effort">Effort</Label>
              <Select value={effort} onValueChange={(value) => setEffort(value as IssueEffort)}>
                <SelectTrigger id="edit-effort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Update Issue (⌘↵)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
