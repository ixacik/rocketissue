import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Rocket, Search } from 'lucide-react'
import { NewIssueModal } from './NewIssueModal'
import { SpaceNavigator } from './SpaceNavigator'
import { useProjects } from '@/hooks/useProjects'
import { useIsNavigating } from '@/stores/projectStore'
import { motion } from 'framer-motion'

interface HeaderProps {
  searchValue: string
  onSearchChange: (value: string) => void
  activeProjectId: number | null
}

export function Header({
  searchValue,
  onSearchChange,
  activeProjectId
}: HeaderProps): React.JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: projects = [] } = useProjects()
  const isNavigating = useIsNavigating()

  // Check if we can create issues (valid project selected)
  const canCreateIssue = activeProjectId !== null && activeProjectId !== -1

  // Handle keyboard shortcut for new issue (N key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      // Only trigger if not typing in an input/textarea
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      if (e.key === 'n' && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey && canCreateIssue) {
        e.preventDefault()
        setIsModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canCreateIssue])

  return (
    <>
      <div className="relative flex bg-card rounded-full px-3 py-2 shadow-xl border-white/5 border-1 items-center">
        {/* Left side - Rocket and dot indicators */}
        <div className="flex items-center gap-3">
          <Rocket size={20} className="ml-1 text-foreground fill-foreground" />

          {/* Dot indicators for spaces */}
          <div className="flex items-center gap-1.5 z-50 relative">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                className="w-1 h-1 rounded-full z-50"
                initial={{ backgroundColor: 'rgba(100, 100, 100, 0.5)' }}
                animate={{
                  backgroundColor:
                    project.id === activeProjectId
                      ? 'rgba(255, 255, 255, 1)'
                      : 'rgba(100, 100, 100, 0.5)'
                }}
                transition={{ duration: 0.15 }}
              />
            ))}
            {/* Dot for create new space */}
            <motion.div
              className="w-1 h-1 rounded-full z-50"
              initial={{ backgroundColor: 'rgba(100, 100, 100, 0.5)' }}
              animate={{
                backgroundColor:
                  activeProjectId === -1 ? 'rgba(255, 255, 255, 1)' : 'rgba(100, 100, 100, 0.5)'
              }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>

        {/* Center content - Absolutely positioned */}
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md">
          {/* Search box */}
          <motion.div
            className="relative"
            animate={{ opacity: isNavigating ? 0 : 1 }}
            transition={{ duration: 0.15 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search issues... (⌘K)"
              className="pl-10 border-0 rounded-full"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </motion.div>

          {/* Space Navigator - Always mounted, opacity controlled */}
          <motion.div
            className="absolute inset-0 flex justify-center items-center"
            animate={{ opacity: isNavigating ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            style={{ pointerEvents: isNavigating ? 'auto' : 'none' }}
          >
            <SpaceNavigator projects={projects} activeProjectId={activeProjectId} />
          </motion.div>
        </div>

        {/* Right side - New button */}
        <Button
          onClick={() => setIsModalOpen(true)}
          className="ml-auto rounded-full bg-secondary text-white disabled:opacity-50"
          title={canCreateIssue ? 'Create new issue (Press N)' : 'Select a project first'}
          disabled={!canCreateIssue}
        >
          <Plus className="h-4 w-4" />
          New (N)
        </Button>
      </div>

      <NewIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={activeProjectId}
      />
    </>
  )
}
