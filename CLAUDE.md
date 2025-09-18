# Issue Tracker - Project Conventions

## Project Philosophy

Alpha project for single developer. Prioritize:

- Robust production-grade simplicity over theoretical enterprise solutions
- Fast iteration and development speed
- Full TypeScript safety - no `any` types
- Clean, maintainable code

## Tech Stack

- **Framework**: Electron + React 19 + TypeScript
- **Build**: Electron Vite
- **UI**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand with performance selectors
- **Forms**: React Hook Form + Zod validation

## Spacing System

Consistent 8px-based spacing throughout the application:

- **Window edges**: 16px (`p-4`)
- **Element gaps**: 8px (`gap-2`, `space-y-2`)
- **Card internal padding**: 12px (`p-3`)
- **Small gaps**: 4px (`gap-1`)
- **All spacing in 4px or 8px increments**

## Layout Principles

- **Full window height**: App uses `h-screen` with flex layout
- **Header**: Fixed height with `flex-shrink-0`
- **Content area**: Scrollable with `flex-1 overflow-auto`
- **Dark mode**: Always active via `dark` class on root element
- **Responsive grid**: 1-4 columns based on screen size

## Component Guidelines

- Use shadcn/ui components as base
- Keep components focused and single-purpose
- Implement proper TypeScript types for all props
- Use Zustand selectors to avoid unnecessary re-renders

## Development Workflow

1. Take time to implement properly
2. Clean up console logs before committing
3. Run type checking and linting
4. Test in app before finalizing

## Performance

- Use Zustand selectors instead of destructuring entire store
- Implement React.memo where beneficial
- Keep bundle size minimal
