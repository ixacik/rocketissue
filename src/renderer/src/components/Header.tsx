import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Rocket, Search } from 'lucide-react'
import { NewIssueModal } from './NewIssueModal'

interface HeaderProps {
  searchValue: string
  onSearchChange: (value: string) => void
}

export function Header({ searchValue, onSearchChange }: HeaderProps): React.JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Handle keyboard shortcut for new issue (N key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      // Only trigger if not typing in an input/textarea
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      if (e.key === 'n' && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setIsModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <>
      <div className="flex bg-card rounded-full px-3 py-2 shadow-xl border-white/5 border-1 items-center justify-between gap-2">
        <Rocket size={20} className="ml-1 text-foreground fill-foreground" />

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search issues... (⌘K)"
              className="pl-10 border-0 rounded-full"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-secondary text-white"
          title="Create new issue (Press N)"
        >
          <Plus className="h-4 w-4" />
          New (N)
        </Button>
      </div>

      <NewIssueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
