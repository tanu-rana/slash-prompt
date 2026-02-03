# Favorites Feature - Implementation Plan

## Phase 1: Data Layer (Foundation)

### New Storage Keys
```javascript
{
  favoritePromptIds: [], // Array of prompt IDs
  favoritePromptOrder: [], // Custom sort order
  promptUsageStats: {
    // prompt_id: { useCount: number, lastUsed: timestamp }
  }
}
```

### Helper Functions
- `addToFavorites(promptId)` - Add to favorites
- `removeFromFavorites(promptId)` - Remove from favorites
- `logPromptUsage(promptId)` - Track usage stats
- `loadFavoritesData()` - Load favorites from storage
- `saveFavoritesData()` - Save favorites to storage

## Phase 2: UI - Main Prompts Tab

### Changes to Prompt Cards
1. Add favorite button (heart icon) to each card
2. Apply `.is-favorite` class for favorited prompts
3. Add toggle functionality on click
4. Track usage when copy button is clicked

### Icon States
- **Unfavorited**: Hollow heart (outline)
- **Favorited**: Solid cyan heart

## Phase 3: UI - New Favorites Tab

### Tab Structure
```html
<button class="tab-btn" data-tab="favorites">
  <svg><!-- heart icon --></svg>
  <span>Favorites</span>
</button>
```

### Tab Content
- Search bar (filters favorites only)
- Manage Prompts button
- Sort dropdown (4 options)
- Prompt cards (reuse existing component)
- Empty state message

### Empty State
- Hide search and manage button
- Show: "Your favorite prompts will appear here"

## Phase 4: Sorting & Advanced Features

### Sort Dropdown Options
1. **Most Used** (default) - Sort by useCount DESC
2. **Recently Used** - Sort by lastUsed DESC
3. **Date Added** - Sort by createdAt ASC
4. **My Custom Order** - Manual drag-drop order

### Drag-and-Drop
- Only enabled when "My Custom Order" is selected
- Use HTML5 Drag and Drop API
- Save new order to `favoritePromptOrder`
- Smooth animations during drag

## Phase 5: Real-time Synchronization

### Cross-Tab Updates
- When favorited in Prompts tab → Updates Favorites tab
- When unfavorited in Favorites tab → Updates Prompts tab heart icon
- Immediate UI updates without page reload

## File Changes Required

### Files to Modify
1. `popup-panel-refined.html` - Add Favorites tab
2. `popup-panel-refined.js` - Core logic (largest changes)
3. `popup-panel-refined.css` - Styling for new elements

### New CSS Classes
- `.favorite-btn` - Heart button styling
- `.favorite-btn.is-favorite` - Filled heart
- `.sort-dropdown-container` - Sort dropdown wrapper
- `.sort-dropdown` - Dropdown styling
- `.dragging` - Card being dragged
- `.drag-over` - Drop target indicator

## Implementation Order

### Step 1: Data Layer (15 min)
- Add storage keys
- Create helper functions
- Update loadData()

### Step 2: Favorite Button in Prompts Tab (20 min)
- Add heart button to createPromptCard()
- Add toggle functionality
- Add CSS styling

### Step 3: Usage Tracking (5 min)
- Update copy button click handler
- Call logPromptUsage()

### Step 4: Favorites Tab UI (25 min)
- Add tab HTML
- Create renderFavorites() function
- Add empty state

### Step 5: Sorting (20 min)
- Add sort dropdown HTML
- Implement sort functions
- Add event handlers

### Step 6: Drag-and-Drop (25 min)
- Add drag event handlers
- Implement reordering logic
- Add visual feedback

### Step 7: Real-time Sync (10 min)
- Test cross-tab updates
- Add UI refresh logic

### Total Estimated Time: ~2 hours

## Testing Checklist

- [ ] Add/remove favorites in Prompts tab
- [ ] Verify heart icon updates immediately
- [ ] Switch to Favorites tab, see favorited items
- [ ] Test search in Favorites tab
- [ ] Test all 4 sort options
- [ ] Drag-and-drop reordering
- [ ] Unfavorite from Favorites tab
- [ ] Verify Prompts tab updates
- [ ] Test empty state display
- [ ] Test usage tracking on copy
- [ ] Test data persistence across sessions
- [ ] Test with 0, 1, many favorites

## Edge Cases to Handle

1. **Empty favorites** - Show empty state
2. **All prompts favorited** - Handle gracefully
3. **Deleted prompt** - Remove from favorites
4. **No usage stats** - Default to 0
5. **Custom order not set** - Fall back to date added
6. **Concurrent updates** - Last write wins

## Design Principles

### Consistency
- Reuse existing prompt card component
- Maintain cyan color scheme
- Follow existing animation patterns

### Performance
- Efficient filtering and sorting
- Minimal DOM manipulation
- Debounced search

### User Experience
- Instant feedback on actions
- Clear visual states
- Smooth transitions
- Intuitive interactions

---

**Status**: Ready for Implementation
**Priority**: High
**Breaking Changes**: None
