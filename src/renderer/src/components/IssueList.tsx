import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState
} from '@tanstack/react-table'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  useSearchIssues,
  useDeleteIssue,
  useUpdateIssue,
  useSearchIssuesInProject
} from '@/hooks/useIssues'
import { IssueDetailsModal } from './IssueDetailsModal'
import { EditIssueModal } from './EditIssueModal'
import { Issue, IssuePriority, IssueStatus, IssueEffort, IssueType } from '@/types/issue'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface IssueListProps {
  searchQuery: string
  onIssueClick?: (issue: Issue) => void
  projectId?: number | null
  issues?: Issue[] // Pre-filtered issues from parent
  showFilters?: boolean
  typeFilter?: IssueType | 'all'
  setTypeFilter?: (value: IssueType | 'all') => void
  priorityFilter?: IssuePriority | 'all'
  setPriorityFilter?: (value: IssuePriority | 'all') => void
  effortFilter?: IssueEffort | 'all'
  setEffortFilter?: (value: IssueEffort | 'all') => void
  keyboardContext?: 'table' | 'gallery' | null
  keyboardIssueId?: string | null
  onKeyboardIssueChange?: (issueId: string | null) => void
  onKeyboardBoundary?: (direction: 'up' | 'down', issueId: string | null) => void
}

const priorityOrder: Record<IssuePriority, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4
}

const statusOrder: Record<IssueStatus, number> = {
  open: 1,
  in_progress: 2,
  completed: 3,
  closed: 4
}

const statusBgColors: Record<IssueStatus, string> = {
  open: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  completed: 'bg-green-100 text-green-700 hover:bg-green-200',
  closed: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
}

const priorityColors: Record<IssuePriority, string> = {
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20'
}

const effortColors: Record<IssueEffort, string> = {
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20'
}

const effortOrder: Record<IssueEffort, number> = {
  low: 1,
  medium: 2,
  high: 3
}

const formatStatus = (status: IssueStatus): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface DraggableRowProps {
  issue: Issue
  isActive: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  children: React.ReactNode
}

function DraggableRow({
  issue,
  isActive,
  onMouseEnter,
  onMouseLeave,
  onClick,
  children
}: DraggableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `open-${issue.id}`
  }) // Namespaced ID

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer transition-colors ${
        issue._isOptimistic ? 'opacity-90' : ''
      } ${isActive ? 'bg-accent' : ''} ${isDragging ? 'opacity-50' : ''}`}
      data-active={isActive ? 'true' : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {children}
    </TableRow>
  )
}

export function IssueList({
  searchQuery,
  onIssueClick,
  projectId,
  issues: propsIssues, // Pre-filtered issues from parent
  showFilters = false,
  typeFilter: externalTypeFilter,
  setTypeFilter: externalSetTypeFilter,
  priorityFilter: externalPriorityFilter,
  setPriorityFilter: externalSetPriorityFilter,
  effortFilter: externalEffortFilter,
  setEffortFilter: externalSetEffortFilter,
  keyboardContext = null,
  keyboardIssueId = null,
  onKeyboardIssueChange,
  onKeyboardBoundary
}: IssueListProps): React.JSX.Element {
  // Only fetch issues if not provided via props
  const {
    data: fetchedIssuesAll = [],
    isLoading: isLoadingAll,
    error: errorAll
  } = useSearchIssues(propsIssues ? '' : searchQuery)
  const {
    data: fetchedIssuesProject = [],
    isLoading: isLoadingProject,
    error: errorProject
  } = useSearchIssuesInProject(
    propsIssues ? null : projectId || null,
    propsIssues ? '' : searchQuery
  )

  // Use provided issues or fetch them
  const allIssues = propsIssues || (projectId ? fetchedIssuesProject : fetchedIssuesAll)
  const isLoading = propsIssues ? false : projectId ? isLoadingProject : isLoadingAll
  const error = propsIssues ? null : projectId ? errorProject : errorAll

  const deleteIssue = useDeleteIssue()
  const updateIssue = useUpdateIssue()
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Filter states - use external props if provided, otherwise use local state
  const [localTypeFilter, setLocalTypeFilter] = useState<IssueType | 'all'>('all')
  const [localPriorityFilter, setLocalPriorityFilter] = useState<IssuePriority | 'all'>('all')
  const [localEffortFilter, setLocalEffortFilter] = useState<IssueEffort | 'all'>('all')

  const typeFilter = externalTypeFilter ?? localTypeFilter
  const setTypeFilter = externalSetTypeFilter ?? setLocalTypeFilter
  const priorityFilter = externalPriorityFilter ?? localPriorityFilter
  const setPriorityFilter = externalSetPriorityFilter ?? setLocalPriorityFilter
  const effortFilter = externalEffortFilter ?? localEffortFilter
  const setEffortFilter = externalSetEffortFilter ?? setLocalEffortFilter

  // Apply only type/priority/effort filters (not status - that's handled by parent)
  const issues = useMemo(
    () =>
      allIssues.filter((issue) => {
        // Apply type filter
        if (typeFilter !== 'all' && issue.issueType !== typeFilter) return false

        // Apply priority filter
        if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false

        // Apply effort filter
        if (effortFilter !== 'all' && issue.effort !== effortFilter) return false

        return true
      }),
    [allIssues, typeFilter, priorityFilter, effortFilter]
  )

  // Unified selection state
  const [selectionMode, setSelectionMode] = useState<'keyboard' | 'mouse'>('mouse')
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [keyboardSelectedId, setKeyboardSelectedId] = useState<string | null>(null)
  const lastMouseMoveTime = useRef(Date.now())
  const lastMousePosition = useRef<{ x: number; y: number } | null>(null)
  const selectionModeRef = useRef<'keyboard' | 'mouse'>(selectionMode)

  const switchToMouseMode = useCallback(() => {
    if (selectionMode !== 'mouse') {
      selectionModeRef.current = 'mouse'
      setSelectionMode('mouse')
      setKeyboardSelectedId(null)
      onKeyboardIssueChange?.(null)
    }
  }, [selectionMode, onKeyboardIssueChange])

  const switchToKeyboardMode = useCallback(() => {
    if (selectionMode !== 'keyboard') {
      selectionModeRef.current = 'keyboard'
      setSelectionMode('keyboard')
    }
    setHoveredRowId(null)
  }, [selectionMode])

  useEffect(() => {
    selectionModeRef.current = selectionMode
  }, [selectionMode])

  const setKeyboardSelection = useCallback(
    (issueId: string | null) => {
      setKeyboardSelectedId((prev) => (prev === issueId ? prev : issueId))
      if (keyboardSelectedId !== issueId) {
        onKeyboardIssueChange?.(issueId)
      }
    },
    [keyboardSelectedId, onKeyboardIssueChange]
  )

  useEffect(() => {
    if (keyboardContext !== 'table') {
      if (keyboardSelectedId !== null) {
        setKeyboardSelectedId(null)
      }
      return
    }

    if (!keyboardIssueId) {
      if (keyboardSelectedId !== null) {
        setKeyboardSelectedId(null)
      }
      return
    }

    selectionModeRef.current = 'keyboard'
    setSelectionMode((current) => (current === 'keyboard' ? current : 'keyboard'))
    setKeyboardSelectedId((current) => (current === keyboardIssueId ? current : keyboardIssueId))
  }, [keyboardContext, keyboardIssueId, keyboardSelectedId])

  // Active row is determined by current mode
  const activeRowId = selectionMode === 'mouse' ? hoveredRowId : keyboardSelectedId

  const handleEdit = useCallback(
    (id?: string) => {
      const issueToEdit = id ? issues.find((i) => i.id === id) : null
      if (issueToEdit) {
        setEditingIssue(issueToEdit)
        setIsEditModalOpen(true)
      }
      setIsModalOpen(false)
    },
    [issues]
  )

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmId(id)
    setIsModalOpen(false)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deleteConfirmId) {
      deleteIssue.mutate(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }, [deleteConfirmId, deleteIssue])
  const deleteActionButtonRef = useRef<HTMLButtonElement | null>(null)

  const handleRowClick = useCallback(
    (issue: Issue) => {
      if (onIssueClick) {
        onIssueClick(issue)
      } else {
        setSelectedIssue(issue)
        setIsModalOpen(true)
      }
    },
    [onIssueClick]
  )

  // Cycle through statuses: open -> in_progress -> completed -> open
  const cycleStatus = useCallback(
    (issue: Issue) => {
      const statusCycle: Record<IssueStatus, IssueStatus> = {
        open: 'in_progress',
        in_progress: 'completed',
        completed: 'open',
        closed: 'closed' // Don't cycle closed issues
      }
      const newStatus = statusCycle[issue.status]
      updateIssue.mutate({ id: issue.id, updates: { status: newStatus } })
    },
    [updateIssue]
  )

  // Switch to mouse mode on mouse movement
  useEffect(() => {
    const MOVEMENT_THRESHOLD = 4
    const handleMouseMove = (event: MouseEvent): void => {
      const now = Date.now()
      const lastPosition = lastMousePosition.current
      const deltaFromStored = lastPosition
        ? Math.hypot(event.clientX - lastPosition.x, event.clientY - lastPosition.y)
        : 0
      const deltaFromEvent = Math.hypot(event.movementX, event.movementY)

      lastMousePosition.current = { x: event.clientX, y: event.clientY }

      const hasMeaningfulMovement = Math.max(deltaFromStored, deltaFromEvent) >= MOVEMENT_THRESHOLD

      // Only switch if mouse actually moved (debounce + movement threshold)
      if (
        (selectionModeRef.current === 'mouse' || hasMeaningfulMovement) &&
        now - lastMouseMoveTime.current > 50
      ) {
        lastMouseMoveTime.current = now
        switchToMouseMode()
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [switchToMouseMode])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't handle keyboard shortcuts when modals are open or when typing in inputs
      if (isModalOpen || isEditModalOpen || deleteConfirmId) return
      if (keyboardContext === 'gallery') return
      const activeElement = document.activeElement
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return

      // Get the active issue based on current mode
      const activeIssue = activeRowId ? issues.find((i) => i.id === activeRowId) : null
      const currentIndex = activeIssue ? issues.findIndex((i) => i.id === activeRowId) : -1

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (issues.length === 0) {
            onKeyboardBoundary?.('up', null)
            return
          }

          switchToKeyboardMode()
          if (!activeIssue) {
            setKeyboardSelection(issues[0].id)
            return
          }

          if (currentIndex > 0) {
            setKeyboardSelection(issues[currentIndex - 1].id)
          } else {
            onKeyboardBoundary?.('up', activeIssue.id)
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (issues.length === 0) {
            onKeyboardBoundary?.('down', null)
            return
          }

          switchToKeyboardMode()
          if (!activeIssue) {
            setKeyboardSelection(issues[0].id)
            return
          }

          if (currentIndex < issues.length - 1) {
            setKeyboardSelection(issues[currentIndex + 1].id)
          } else {
            onKeyboardBoundary?.('down', activeIssue.id)
          }
          break

        case 'd':
        case 'D':
          if (activeIssue) {
            e.preventDefault()
            handleDelete(activeIssue.id)
          }
          break

        case 'e':
        case 'E':
          if (activeIssue) {
            e.preventDefault()
            handleEdit(activeIssue.id)
          }
          break

        case 't':
        case 'T':
          if (activeIssue) {
            e.preventDefault()
            cycleStatus(activeIssue)
          }
          break

        case 'Enter':
          if (activeIssue) {
            e.preventDefault()
            handleRowClick(activeIssue)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    issues,
    activeRowId,
    isModalOpen,
    isEditModalOpen,
    deleteConfirmId,
    keyboardContext,
    cycleStatus,
    handleEdit,
    handleDelete,
    handleRowClick,
    switchToKeyboardMode,
    setKeyboardSelection,
    onKeyboardBoundary
  ])

  const columnWidthClasses: Record<string, string> = {
    priority: 'w-[120px]',
    effort: 'w-[100px]',
    title: 'flex-1 min-w-0', // Take remaining space, allow truncation
    type: 'w-[120px]',
    status: 'w-[120px]'
  }

  const columns: ColumnDef<Issue>[] = [
    {
      accessorKey: 'priority',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        const sortIndex = column.getSortIndex()
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground/80"
            onClick={(e) => {
              const isMultiSort = e.shiftKey || e.metaKey
              column.toggleSorting(column.getIsSorted() === 'asc', isMultiSort)
            }}
            title="Click to sort, Shift+Click to add multi-sort"
          >
            Priority
            <div className="flex items-center gap-0.5">
              {isSorted ? (
                <>
                  {isSorted === 'asc' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {sortIndex > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {sortIndex + 1}
                    </span>
                  )}
                </>
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-50" />
              )}
            </div>
          </button>
        )
      },
      cell: ({ row }) => {
        const priority = row.getValue('priority') as IssuePriority

        return (
          <Badge className={`${priorityColors[priority]} font-medium capitalize`}>
            {priority === 'critical'
              ? '!!! Critical'
              : priority === 'high'
                ? '!! High'
                : priority === 'medium'
                  ? '! Medium'
                  : 'Low'}
          </Badge>
        )
      },
      sortingFn: (rowA, rowB) => {
        const a = priorityOrder[rowA.original.priority]
        const b = priorityOrder[rowB.original.priority]
        return a - b
      }
    },
    {
      accessorKey: 'effort',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        const sortIndex = column.getSortIndex()
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground/80"
            onClick={(e) => {
              const isMultiSort = e.shiftKey || e.metaKey
              column.toggleSorting(column.getIsSorted() === 'asc', isMultiSort)
            }}
            title="Click to sort, Shift+Click to add multi-sort"
          >
            Effort
            <div className="flex items-center gap-0.5">
              {isSorted ? (
                <>
                  {isSorted === 'asc' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {sortIndex > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {sortIndex + 1}
                    </span>
                  )}
                </>
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-50" />
              )}
            </div>
          </button>
        )
      },
      cell: ({ row }) => {
        const effort = row.getValue('effort') as IssueEffort | undefined

        // Handle undefined effort with a default
        const displayEffort = effort || 'medium'
        return (
          <Badge className={`${effortColors[displayEffort]} font-medium capitalize`}>
            {displayEffort}
          </Badge>
        )
      },
      sortingFn: (rowA, rowB) => {
        const a = effortOrder[rowA.original.effort || 'medium']
        const b = effortOrder[rowB.original.effort || 'medium']
        return a - b
      }
    },
    {
      accessorKey: 'title',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        const sortIndex = column.getSortIndex()
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground/80"
            onClick={(e) => {
              const isMultiSort = e.shiftKey || e.metaKey
              column.toggleSorting(column.getIsSorted() === 'asc', isMultiSort)
            }}
            title="Click to sort, Shift+Click to add multi-sort"
          >
            Title
            <div className="flex items-center gap-0.5">
              {isSorted ? (
                <>
                  {isSorted === 'asc' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {sortIndex > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {sortIndex + 1}
                    </span>
                  )}
                </>
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-50" />
              )}
            </div>
          </button>
        )
      },
      cell: ({ row }) => {
        const issue = row.original
        return <span className="block truncate font-medium">{issue.title}</span>
      }
    },
    {
      id: 'type',
      accessorKey: 'issueType',
      header: 'Type',
      cell: ({ row }) => {
        const issue = row.original
        const typeColors: Record<IssueType, string> = {
          bug: 'bg-red-500/10 text-red-500 border-red-500/20',
          feature: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
          enhancement: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          task: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
          documentation: 'bg-green-500/10 text-green-500 border-green-500/20',
          chore: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        }

        return (
          <Badge
            className={cn('text-xs whitespace-nowrap px-2 py-0.5', typeColors[issue.issueType])}
          >
            {issue.issueType}
          </Badge>
        )
      },
      enableSorting: false
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        const sortIndex = column.getSortIndex()
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground/80"
            onClick={(e) => {
              const isMultiSort = e.shiftKey || e.metaKey
              column.toggleSorting(column.getIsSorted() === 'asc', isMultiSort)
            }}
            title="Click to sort, Shift+Click to add multi-sort"
          >
            Status
            <div className="flex items-center gap-0.5">
              {isSorted ? (
                <>
                  {isSorted === 'asc' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {sortIndex > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {sortIndex + 1}
                    </span>
                  )}
                </>
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-50" />
              )}
            </div>
          </button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as IssueStatus
        return <Badge className={`${statusBgColors[status]}`}>{formatStatus(status)}</Badge>
      },
      sortingFn: (rowA, rowB) => {
        const a = statusOrder[rowA.original.status]
        const b = statusOrder[rowB.original.status]
        return a - b
      }
    }
  ]

  const table = useReactTable({
    data: issues,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    },
    enableMultiSort: true,
    maxMultiSortColCount: 3
  })

  // Setup droppable for the table - MUST be before any returns
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: 'open-table'
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading issues...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-destructive">Failed to load issues</div>
      </div>
    )
  }

  // Removed sortedIssueIds as we're not using SortableContext

  if (issues.length === 0) {
    return (
      <div
        ref={setDroppableRef}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <h3 className="text-lg font-medium text-muted-foreground">
          {searchQuery ? 'No matching open issues' : 'No open issues'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {searchQuery
            ? 'Try adjusting your search terms'
            : 'Create a new issue or drag from in-progress'}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Filters Bar - only show if filters are visible */}
      {showFilters && (
        <div className="mb-3">
          <div className="flex gap-2 flex-wrap">
            {/* Type Filter */}
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as IssueType | 'all')}
            >
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="enhancement">Enhancement</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="chore">Chore</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as IssuePriority | 'all')}
            >
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Effort Filter */}
            <Select
              value={effortFilter}
              onValueChange={(value) => setEffortFilter(value as IssueEffort | 'all')}
            >
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder="All Efforts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Efforts</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(typeFilter !== 'all' || priorityFilter !== 'all' || effortFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('all')
                  setPriorityFilter('all')
                  setEffortFilter('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      <div
        ref={setDroppableRef}
        className={cn(
          'rounded-lg transition-colors',
          isOver && 'ring-2 ring-primary/50 bg-primary/5'
        )}
      >
        <Table className="group table-fixed w-full" data-selection-mode={selectionMode}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap',
                      columnWidthClasses[header.column.id ?? '']
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const rowId = row.original.id
              const isActive =
                (selectionMode === 'keyboard' && keyboardSelectedId === rowId) ||
                (selectionMode === 'mouse' && hoveredRowId === rowId)

              // Show single skeleton for entire row if AI is pending
              if (row.original._aiPending) {
                return (
                  <TableRow key={row.id}>
                    <TableCell colSpan={columns.length} className="px-3 py-2">
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                )
              }

              return (
                <DraggableRow
                  key={row.id}
                  issue={row.original}
                  isActive={isActive}
                  onMouseEnter={() => setHoveredRowId(rowId)}
                  onMouseLeave={() =>
                    setHoveredRowId((current) => (current === rowId ? null : current))
                  }
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'px-3 py-2 align-middle whitespace-nowrap text-sm',
                        columnWidthClasses[cell.column.id ?? '']
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </DraggableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {editingIssue && (
        <EditIssueModal
          issue={editingIssue}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingIssue(null)
          }}
        />
      )}

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            deleteActionButtonRef.current?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the issue from your
              tracker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction ref={deleteActionButtonRef} onClick={confirmDelete}>
              Delete Issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
