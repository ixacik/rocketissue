import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SortingState, Updater } from '@tanstack/react-table'

interface SortState {
  sorting: SortingState
  setSorting: (updater: Updater<SortingState>) => void
  resetSorting: () => void
}

const defaultSorting: SortingState = []

export const useSortStore = create<SortState>()(
  persist(
    (set) => ({
      sorting: defaultSorting,
      setSorting: (updater) => {
        set((state) => {
          const next = typeof updater === 'function' ? updater(state.sorting) : updater
          return { sorting: next }
        })
      },
      resetSorting: () => set({ sorting: defaultSorting })
    }),
    {
      name: 'issue-tracker-sorting',
      partialize: (state) => ({ sorting: state.sorting })
    }
  )
)

export const useSorting = () => useSortStore((state) => state.sorting)
export const useSetSorting = () => useSortStore((state) => state.setSorting)
export const useResetSorting = () => useSortStore((state) => state.resetSorting)
