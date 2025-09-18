import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Circle } from 'lucide-react'
import { useSearchIssues } from '@/hooks/useIssues'
import { Issue, IssueStatus, IssuePriority } from '@/types/issue'
import { IssueDetailsModal } from './IssueDetailsModal'

const statusColors: Record<IssueStatus, string> = {
  open: 'text-blue-600',
  in_progress: 'text-yellow-600',
  completed: 'text-green-600',
  closed: 'text-gray-500'
}

const priorityColors: Record<IssuePriority, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  critical: 'text-red-500'
}

const formatStatus = (status: IssueStatus): string => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function CommandPalette(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const { data: issues = [] } = useSearchIssues('')

  // Set up fuzzy search with Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(issues, {
        keys: ['title', 'description', 'issueType'],
        threshold: 0.4,
        includeScore: true
      }),
    [issues]
  )

  // Handle keyboard shortcut Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelectIssue = (issue: Issue): void => {
    setSelectedIssue(issue)
    setOpen(false)
    setIsDetailsModalOpen(true)
  }

  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = useMemo(() => {
    if (!searchQuery) return issues
    return fuse.search(searchQuery).map((result) => result.item)
  }, [searchQuery, fuse, issues])

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Issues"
        description="Search for issues by title, description, or type"
      >
        <CommandInput
          placeholder="Type to search issues..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No issues found.</CommandEmpty>
          <CommandGroup heading="Issues">
            {searchResults.map((issue) => (
              <CommandItem
                key={issue.id}
                onSelect={() => handleSelectIssue(issue)}
                className="flex items-center gap-2"
              >
                <Circle className={`h-2 w-2 fill-current ${statusColors[issue.status]}`} />
                <span className={`text-xs font-medium ${priorityColors[issue.priority]}`}>
                  {issue.priority.toUpperCase()}
                </span>
                <span className="flex-1 truncate">{issue.title}</span>
                <Badge variant="outline" className="ml-2">
                  {formatStatus(issue.status)}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </>
  )
}
