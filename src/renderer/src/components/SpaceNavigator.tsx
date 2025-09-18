import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Project } from '@/types/project'

interface SpaceNavigatorProps {
  projects: Project[]
  activeProjectId: number | null
}

export function SpaceNavigator({ projects, activeProjectId }: SpaceNavigatorProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Calculate the active index based on activeProjectId
  useEffect(() => {
    if (activeProjectId === -1 || activeProjectId === null) {
      // Create new space
      setActiveIndex(projects.length)
    } else {
      const index = projects.findIndex(p => p.id === activeProjectId)
      if (index !== -1) {
        setActiveIndex(index)
      }
    }
  }, [activeProjectId, projects])

  return (
    <div className="flex items-center gap-4">
      {/* Project spaces */}
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          className="relative"
          initial={false}
          animate={{
            opacity: index === activeIndex ? 1 : 0.4,
            scale: index === activeIndex ? 1 : 0.9
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <span className="text-sm font-medium whitespace-nowrap select-none">
            {project.name}
          </span>
        </motion.div>
      ))}

      {/* Create new space */}
      <motion.div
        className="relative"
        initial={false}
        animate={{
          opacity: activeIndex === projects.length ? 1 : 0.4,
          scale: activeIndex === projects.length ? 1 : 0.9
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <span className="text-sm font-medium whitespace-nowrap select-none">
          Create New
        </span>
      </motion.div>
    </div>
  )
}