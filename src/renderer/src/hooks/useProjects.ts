import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Project } from '@/types/project'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const projects = await window.api.projects.getAll()
      return projects as Project[]
    }
  })
}

export function useProject(id: number | null) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      if (!id) return null
      const project = await window.api.projects.getById(id)
      return project as Project | null
    },
    enabled: !!id
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await window.api.projects.create(project)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: number
      updates: Partial<Omit<Project, 'id' | 'createdAt'>>
    }) => {
      return await window.api.projects.update(id, updates)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] })
    }
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      return await window.api.projects.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}
