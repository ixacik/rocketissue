import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Rocket, Search } from 'lucide-react'
import { NewIssueModal } from './NewIssueModal'
import { SpaceNavigator } from './SpaceNavigator'
import { useProjects } from '@/hooks/useProjects'
import { useIsNavigating } from '@/stores/projectStore'
import { motion, AnimatePresence } from 'framer-motion'

interface HeaderProps {
  searchValue: string
  onSearchChange: (value: string) => void
  activeProjectId: number | null
}

export function Header({ searchValue, onSearchChange, activeProjectId }: HeaderProps): React.JSX.Element {
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
        {/* Left side - Rocket */}
        <div className="flex items-center">
          <Rocket size={20} className="ml-1 text-foreground fill-foreground" />
        </div>

        {/* Center content - Absolutely positioned */}
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md">
          <AnimatePresence mode="wait">
            {!isNavigating ? (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative"
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
            ) : (
              <motion.div
                key="navigator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex justify-center"
              >
                <SpaceNavigator
                  projects={projects}
                  activeProjectId={activeProjectId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side - New button */}
        <Button
          onClick={() => setIsModalOpen(true)}
          className="ml-auto rounded-full bg-secondary text-white disabled:opacity-50"
          title={canCreateIssue ? "Create new issue (Press N)" : "Select a project first"}
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
