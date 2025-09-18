import { create } from 'zustand'

interface DndState {
  activeId: string | null
  overId: string | null
  isDragging: boolean
  draggedItem: unknown | null
  setActiveId: (id: string | null) => void
  setOverId: (id: string | null) => void
  setIsDragging: (dragging: boolean) => void
  setDraggedItem: (item: unknown | null) => void
  reset: () => void
}

const useDndStore = create<DndState>((set) => ({
  activeId: null,
  overId: null,
  isDragging: false,
  draggedItem: null,

  setActiveId: (id) => set({ activeId: id }),
  setOverId: (id) => set({ overId: id }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setDraggedItem: (item) => set({ draggedItem: item }),
  reset: () =>
    set({
      activeId: null,
      overId: null,
      isDragging: false,
      draggedItem: null
    })
}))

// Performance-optimized selectors as per CLAUDE.md
export const useActiveId = () => useDndStore((state) => state.activeId)
export const useOverId = () => useDndStore((state) => state.overId)
export const useIsDragging = () => useDndStore((state) => state.isDragging)
export const useDraggedItem = () => useDndStore((state) => state.draggedItem)
export const useSetActiveId = () => useDndStore((state) => state.setActiveId)
export const useSetOverId = () => useDndStore((state) => state.setOverId)
export const useSetIsDragging = () => useDndStore((state) => state.setIsDragging)
export const useSetDraggedItem = () => useDndStore((state) => state.setDraggedItem)
export const useResetDnd = () => useDndStore((state) => state.reset)

export default useDndStore
