import { useEffect, useState, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Project } from '@/types/project'

interface SpaceNavigatorProps {
  projects: Project[]
  activeProjectId: number | null
}

export function SpaceNavigator({ projects, activeProjectId }: SpaceNavigatorProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [itemWidths, setItemWidths] = useState<number[]>([])

  // Gap between items
  const GAP = 32 // Increased gap for better spacing

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

  // Measure item widths after render
  useEffect(() => {
    const widths = itemRefs.current.map(ref => ref?.offsetWidth || 0)
    setItemWidths(widths)
  }, [projects])

  // Calculate the translation to center the active item
  const translateX = useMemo(() => {
    if (itemWidths.length === 0) return 0

    let offset = 0

    // Calculate position up to active index
    for (let i = 0; i < activeIndex; i++) {
      offset += (itemWidths[i] || 0) + GAP
    }

    // Add half of the active item width to center it
    const activeItemWidth = itemWidths[activeIndex] || 0
    offset += activeItemWidth / 2

    // Return negative offset to slide left, adjusted for centering
    return -offset
  }, [activeIndex, itemWidths])

  return (
    <div className="relative w-full overflow-hidden">
      {/* Container that slides */}
      <motion.div
        className="flex items-center"
        initial={false}
        animate={{ x: `calc(50% + ${translateX}px)` }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
        style={{ gap: `${GAP}px` }}
      >
        {/* Project spaces */}
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            ref={el => { itemRefs.current[index] = el }}
            className="inline-block origin-center flex-shrink-0"
            initial={false}
            animate={{
              opacity: index === activeIndex ? 1 : 0.4,
              scale: index === activeIndex ? 1.1 : 0.9
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <span className="text-sm font-medium whitespace-nowrap select-none block px-2">
              {project.name}
            </span>
          </motion.div>
        ))}

        {/* Create new space - Plus icon */}
        <motion.div
          ref={el => { itemRefs.current[projects.length] = el }}
          className="inline-block origin-center flex-shrink-0"
          initial={false}
          animate={{
            opacity: activeIndex === projects.length ? 1 : 0.4,
            scale: activeIndex === projects.length ? 1.1 : 0.9
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="px-2">
            <Plus className="h-4 w-4" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}