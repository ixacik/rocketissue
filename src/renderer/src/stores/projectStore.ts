import { create } from 'zustand'
import { Project } from '@/types/project'

interface ProjectStore {
  // State
  activeProjectId: number | null
  projects: Project[]
  isTransitioning: boolean
  isNavigating: boolean
  slideDirection: -1 | 0 | 1

  // Actions
  setActiveProject: (id: number) => void
  setProjects: (projects: Project[]) => void
  setTransitioning: (transitioning: boolean) => void
  setIsNavigating: (navigating: boolean) => void
  setSlideDirection: (direction: -1 | 0 | 1) => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial state
  activeProjectId: null,
  projects: [],
  isTransitioning: false,
  isNavigating: false,
  slideDirection: 0,

  // Actions
  setActiveProject: (id) => {
    const state = get()
    const currentId = state.activeProjectId

    // Calculate indices in virtual array [project1, project2, ..., create_new]
    const getIndex = (projectId: number | null) => {
      if (projectId === -1 || projectId === null) {
        return state.projects.length // create_new is at the end
      }
      return state.projects.findIndex((p) => p.id === projectId)
    }

    const currentIndex = getIndex(currentId)
    const newIndex = getIndex(id)

    // Calculate direction based on array movement
    // Moving right in array = content slides left (direction -1)
    // Moving left in array = content slides right (direction 1)
    let direction: -1 | 0 | 1 = 0

    const totalSlots = state.projects.length + 1

    if (currentIndex !== -1 && newIndex !== -1) {
      // Check if it's a wrap-around case
      const forwardDistance = (newIndex - currentIndex + totalSlots) % totalSlots
      const backwardDistance = (currentIndex - newIndex + totalSlots) % totalSlots

      if (forwardDistance <= backwardDistance) {
        // Moving forward (right) in array
        direction = -1
      } else {
        // Moving backward (left) in array
        direction = 1
      }
    }

    set({ slideDirection: direction, activeProjectId: id })
  },

  setProjects: (projects) => set({ projects }),

  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

  setIsNavigating: (navigating) => set({ isNavigating: navigating }),

  setSlideDirection: (direction) => set({ slideDirection: direction })
}))

// Selectors (performance optimized per CLAUDE.md)
export const useActiveProjectId = () => useProjectStore((state) => state.activeProjectId)
export const useActiveProject = () =>
  useProjectStore((state) => state.projects.find((p) => p.id === state.activeProjectId) || null)
export const useProjects = () => useProjectStore((state) => state.projects)
export const useSlideDirection = () => useProjectStore((state) => state.slideDirection)
export const useIsTransitioning = () => useProjectStore((state) => state.isTransitioning)
export const useIsNavigating = () => useProjectStore((state) => state.isNavigating)

// Complex selectors
export const useNextProject = () =>
  useProjectStore((state) => {
    const currentIndex = state.projects.findIndex((p) => p.id === state.activeProjectId)
    if (currentIndex === -1 || currentIndex === state.projects.length - 1) return null
    return state.projects[currentIndex + 1]
  })

export const usePrevProject = () =>
  useProjectStore((state) => {
    const currentIndex = state.projects.findIndex((p) => p.id === state.activeProjectId)
    if (currentIndex <= 0) return null
    return state.projects[currentIndex - 1]
  })

// Actions selectors
export const useSetActiveProject = () => useProjectStore((state) => state.setActiveProject)
export const useSetProjects = () => useProjectStore((state) => state.setProjects)
export const useSetTransitioning = () => useProjectStore((state) => state.setTransitioning)
export const useSetIsNavigating = () => useProjectStore((state) => state.setIsNavigating)
