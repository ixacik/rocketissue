import { useState, useEffect, useCallback, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState
} from '@tanstack/react-table'
import { useSearchIssues, useDeleteIssue, useUpdateIssue } from '@/hooks/useIssues'
import { IssueDetailsModal } from './IssueDetailsModal'
import { EditIssueModal } from './EditIssueModal'
import { Issue, IssuePriority, IssueStatus, IssueEffort } from '@/types/issue'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface IssueListProps {
  searchQuery: string
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

export function IssueList({ searchQuery }: IssueListProps): React.JSX.Element {
  const { data: issues = [], isLoading, error } = useSearchIssues(searchQuery)
  const deleteIssue = useDeleteIssue()
  const updateIssue = useUpdateIssue()
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])

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
    }
  }, [selectionMode])

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

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this issue?')) {
        deleteIssue.mutate(id)
      }
      setIsModalOpen(false)
    },
    [deleteIssue]
  )

  const handleRowClick = useCallback((issue: Issue) => {
    setSelectedIssue(issue)
    setIsModalOpen(true)
  }, [])

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

      const hasMeaningfulMovement =
        Math.max(deltaFromStored, deltaFromEvent) >= MOVEMENT_THRESHOLD

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
      if (isModalOpen || isEditModalOpen) return
      const activeElement = document.activeElement
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return

      // Get the active issue based on current mode
      const activeIssue = activeRowId ? issues.find((i) => i.id === activeRowId) : null
      const currentIndex = activeIssue ? issues.findIndex((i) => i.id === activeRowId) : -1

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (issues.length > 0) {
            // Switch to keyboard mode
            switchToKeyboardMode()
            const newIndex = currentIndex > 0 ? currentIndex - 1 : 0
            setKeyboardSelectedId(issues[newIndex].id)
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (issues.length > 0) {
            // Switch to keyboard mode
            switchToKeyboardMode()
            const newIndex = currentIndex < issues.length - 1 ? currentIndex + 1 : issues.length - 1
            setKeyboardSelectedId(issues[newIndex].id)
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
    cycleStatus,
    handleEdit,
    handleDelete,
    handleRowClick,
    switchToKeyboardMode
  ])

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
        const issue = row.original
        const aiPending = issue._aiPending
        const priority = row.getValue('priority') as IssuePriority

        if (aiPending) {
          return <Skeleton className="h-5 w-16" />
        }

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
        const issue = row.original
        const aiPending = issue._aiPending
        const effort = row.getValue('effort') as IssueEffort | undefined

        if (aiPending) {
          return <Skeleton className="h-5 w-16" />
        }

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
        return (
          <div>
            <div className="font-medium">{issue.title}</div>
            {issue.description && (
              <div className="text-xs text-muted-foreground line-clamp-1">{issue.description}</div>
            )}
          </div>
        )
      }
    },
    {
      id: 'tags',
      accessorFn: (row) => row.tags?.join(' '),
      header: 'Tags',
      cell: ({ row }) => {
        const issue = row.original
        const aiPending = issue._aiPending

        if (aiPending) {
          return (
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-14" />
            </div>
          )
        }

        return (
          <div className="flex gap-1 flex-wrap">
            {issue.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {issue.tags && issue.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{issue.tags.length - 2}
              </Badge>
            )}
          </div>
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

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4 opacity-20">📋</div>
        <h3 className="text-lg font-medium text-muted-foreground">
          {searchQuery ? 'No matching issues found' : 'No issues yet'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {searchQuery
            ? 'Try adjusting your search terms'
            : 'Create your first issue to get started'}
        </p>
      </div>
    )
  }

  return (
    <>
      <Table className="group" data-selection-mode={selectionMode}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    header.column.id === 'priority'
                      ? 'w-[120px]'
                      : header.column.id === 'effort'
                        ? 'w-[100px]'
                        : header.column.id === 'tags'
                          ? 'w-[200px]'
                          : header.column.id === 'status'
                            ? 'w-[120px]'
                            : ''
                  }
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

            return (
              <TableRow
                key={row.id}
                className={`cursor-pointer transition-colors ${
                  row.original._isOptimistic ? 'opacity-90' : ''
                } ${isActive ? 'bg-accent' : ''}`}
                onMouseEnter={() => {
                  setHoveredRowId(rowId)
                }}
                onMouseLeave={() =>
                  setHoveredRowId((current) => (current === rowId ? null : current))
                }
                onClick={() => handleRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
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
    </>
  )
}
