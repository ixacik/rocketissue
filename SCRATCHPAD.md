## PLAN

### Overview
Transform the current single-table issue tracker into a three-zone drag-and-drop interface:
- **Zone 1 (Left)**: Open issues table with draggable rows
- **Zone 2 (Middle)**: In-progress issues gallery view
- **Zone 3 (Right)**: Done drop zone

### Phase 1: Dependencies & Core Setup

#### 1.1 Install dnd-kit packages
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### 1.2 Create Zustand store for DnD state
- File: `src/renderer/src/stores/dndStore.ts`
- State:
  - `activeId: string | null` - Currently dragging issue ID
  - `overId: string | null` - Container being hovered
  - `isDragging: boolean` - Drag state flag
- Actions:
  - `setActiveId(id: string | null)`
  - `setOverId(id: string | null)`
  - `setIsDragging(dragging: boolean)`
- Use selectors pattern per CLAUDE.md for performance

### Phase 2: Layout Restructure

#### 2.1 Update App.tsx layout
- Convert from single scrollable area to three-zone flex layout
- Structure:
  ```
  <div className="h-screen flex flex-col">
    <Header /> (existing, flex-shrink-0)
    <div className="flex-1 flex gap-4 p-4 overflow-hidden">
      <OpenIssuesZone />    // 40% width
      <InProgressZone />    // 40% width
      <DoneDropZone />      // 20% width
    </div>
    <CommandPalette />
  </div>
  ```

#### 2.2 Create zone wrapper components
- `OpenIssuesZone.tsx` - Wraps existing table
- `InProgressZone.tsx` - New gallery component
- `DoneDropZone.tsx` - New drop target

### Phase 3: DnD Context Implementation

#### 3.1 Setup DndContext at App level
- Wrap entire app content in `<DndContext>`
- Configure:
  - Sensors (PointerSensor, KeyboardSensor)
  - Collision detection (closestCenter)
  - onDragStart, onDragEnd, onDragOver handlers

#### 3.2 Define droppable containers
- Container IDs:
  - `"open-table"` - Open issues table
  - `"in-progress"` - In-progress gallery
  - `"done"` - Done drop zone

### Phase 4: Make Table Rows Draggable

#### 4.1 Refactor IssueList component
- Wrap table in `<DroppableContainer id="open-table">`
- Keep existing table structure

#### 4.2 Create DraggableTableRow component
- Wrap existing TableRow with `useSortable` hook
- Preserve all existing functionality:
  - Click to open details
  - Keyboard navigation
  - Hover states
- Add drag handle or full-row dragging
- Apply transform styles during drag

### Phase 5: In-Progress Gallery Component

#### 5.1 Create IssueCard component
- File: `src/renderer/src/components/IssueCard.tsx`
- Card design matching screenshot:
  - Title
  - Priority/effort badges
  - Tags
  - Compact layout

#### 5.2 Create InProgressGallery component
- File: `src/renderer/src/components/InProgressGallery.tsx`
- Features:
  - Grid layout (responsive 2-3 columns)
  - Card spacing per CLAUDE.md (8px gaps)
  - DroppableContainer wrapper
  - Filter to show only in_progress issues
  - Each card is draggable with `useSortable`

### Phase 6: Done Drop Zone

#### 6.1 Create DoneDropZone component
- File: `src/renderer/src/components/DoneDropZone.tsx`
- Visual design:
  - Dashed border (muted color)
  - Large drop icon/text centered
  - Highlight on drag over
  - Animation on successful drop

#### 6.2 Drop behavior
- Auto-update status to "completed"
- Fade-out animation
- Remove from view after animation

### Phase 7: Drag and Drop Logic

#### 7.1 Handle onDragStart
- Store activeId in Zustand
- Create DragOverlay with issue preview
- Add visual feedback to source container

#### 7.2 Handle onDragOver
- Detect container changes
- Update visual feedback
- Show drop zone highlights

#### 7.3 Handle onDragEnd
- Determine source and destination containers
- Update issue status based on drop zone:
  - `open-table` → `in-progress`: Change status to "in_progress"
  - `in-progress` → `done`: Change status to "completed"
  - Within same container: Reorder if applicable
- Use existing `useUpdateIssue` mutation
- Optimistic updates with rollback on failure

### Phase 8: Polish & Animations

#### 8.1 DragOverlay component
- Semi-transparent clone of dragged item
- Follows cursor smoothly
- Different appearance for cards vs table rows

#### 8.2 Drop animations
- Smooth transitions when dropping
- Fade out when dropping to done zone
- Spring animations for reordering

#### 8.3 Visual feedback
- Container highlights on hover
- Cursor changes during drag
- Drop zone activation states

### Phase 9: Performance Optimization

#### 9.1 Zustand selectors
- Create specific selectors for each component
- Avoid full store destructuring
- Use shallow equality checks

#### 9.2 React.memo where needed
- Memoize IssueCard components
- Memoize table rows not being dragged
- Optimize re-renders during drag

### Phase 10: Testing & Edge Cases

#### 10.1 Test scenarios
- Drag between all zones
- Keyboard navigation still works
- Search/filter compatibility
- Multiple rapid drags
- Network failure handling

#### 10.2 Edge cases
- Empty containers
- Single item in container
- Dragging during data refresh
- Modal interactions during drag

### File Structure
```
src/renderer/src/
├── components/
│   ├── IssueList.tsx (modified)
│   ├── DraggableTableRow.tsx (new)
│   ├── IssueCard.tsx (new)
│   ├── InProgressGallery.tsx (new)
│   ├── DoneDropZone.tsx (new)
│   └── DragOverlay.tsx (new)
├── stores/
│   └── dndStore.ts (new)
└── App.tsx (modified)
```

### Success Criteria
- ✅ Table shows only open issues
- ✅ Gallery shows only in-progress issues
- ✅ Drag from table to gallery changes status to "in_progress"
- ✅ Drag to done zone changes status to "completed" and removes item
- ✅ Smooth animations and visual feedback
- ✅ Existing functionality preserved (keyboard nav, search, modals)
- ✅ Performance optimized with Zustand selectors
- ✅ 8px-based spacing per CLAUDE.md