# Fix Delete Issue Functionality

## Problem
- handleDelete in App.tsx is just a stub that closes modal without deleting
- No delete confirmation dialog at App level
- Keyboard support (Enter key) doesn't work in AlertDialog

## Solution
1. Import useDeleteIssue hook in App.tsx
2. Add deleteConfirmId state
3. Implement proper handleDelete that shows confirmation
4. Add AlertDialog at App level
5. Add autoFocus to delete button for Enter key support

## Notes
- Keep it simple - just fix the existing pattern
- Don't over-engineer with global stores