import { useState } from 'react'
import { useSearchIssues, useDeleteIssue } from '@/hooks/useIssues'
import { IssueRow } from './IssueRow'
import { IssueDetailsModal } from './IssueDetailsModal'
import { Issue } from '@/types/issue'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface IssueListProps {
  searchQuery: string
}

export function IssueList({ searchQuery }: IssueListProps): React.JSX.Element {
  const { data: issues = [], isLoading, error } = useSearchIssues(searchQuery)
  const deleteIssue = useDeleteIssue()
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleEdit = (): void => {
    // TODO: Implement edit functionality
    setIsModalOpen(false)
  }

  const handleDelete = (id: string): void => {
    deleteIssue.mutate(id)
    setIsModalOpen(false)
  }

  const handleRowClick = (issue: Issue): void => {
    setSelectedIssue(issue)
    setIsModalOpen(true)
  }

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
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[80px]">Priority</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-[200px]">Tags</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} onClick={handleRowClick} />
          ))}
        </TableBody>
      </Table>
      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  )
}
