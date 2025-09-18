import { Variants } from 'framer-motion'

export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '-105%' : '105%',
    opacity: 1
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '-105%' : '105%',
    opacity: 1
  })
}

export const slideTransition = {
  x: { type: 'tween' as const, ease: 'easeOut' as const, duration: 0.2 },
  opacity: { duration: 0 }
}

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

export const scaleVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1 }
}
