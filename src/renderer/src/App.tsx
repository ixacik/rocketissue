import { useState, useEffect } from 'react'
import { IssueList } from '@/components/IssueList'
import { Header } from '@/components/Header'
import { CommandPalette } from '@/components/CommandPalette'

function App(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')

  // Ensure dark mode is always active
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 pb-2">
        <Header searchValue={searchQuery} onSearchChange={setSearchQuery} />
      </div>
      <div className="flex-1 px-4 pb-4 overflow-auto scrollbar-hide">
        <IssueList searchQuery={searchQuery} />
      </div>
      <CommandPalette />
    </div>
  )
}

export default App
