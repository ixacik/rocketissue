import { useState, useEffect } from 'react'
import { useCreateProject } from '@/hooks/useProjects'
import { useSetActiveProject, useSetProjects, useProjects } from '@/stores/projectStore'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (projectId: number) => void
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const createProject = useCreateProject()
  const setActiveProject = useSetActiveProject()
  const setProjects = useSetProjects()
  const projects = useProjects()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    const isFirstProject = projects.length === 0

    try {
      const result = await createProject.mutateAsync({
        name: name.trim(),
        slug,
        color: '#0077ff', // Default color
        icon: null, // No icon for now
        isDefault: isFirstProject // First project becomes default
      })

      if (result) {
        // Invalidate projects query to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['projects'] })

        // Update local state
        const updatedProjects = await queryClient.fetchQuery({
          queryKey: ['projects'],
          queryFn: async () => window.api.projects.getAll()
        })

        if (updatedProjects) {
          setProjects(updatedProjects)
        }

        // Navigate to the new project
        setActiveProject(result.id)

        if (onSuccess) {
          onSuccess(result.id)
        }
      }

      onClose()
      setName('')
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My Project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
