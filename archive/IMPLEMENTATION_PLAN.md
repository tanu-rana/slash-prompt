# Comprehensive Implementation Plan
## Chrome Extension Keyboard Shortcuts & Search Highlighting

---

## PART 1: Global Modal Keyboard Shortcuts

### Current State Analysis:
- **Existing Handler**: Global keydown listener exists (line 544)
- **Current Escape Logic**: Checks modals in sequence, but NOT dropdowns first
- **Current Enter Logic**: No global Enter-to-submit implementation
- **Modal Count**: 9 modals identified
- **Dropdown Types**: 
  - `.custom-folder-dropdown` (Prompt Folder, Parent Folder)
  - `.context-menu` (Move to Folder, right-click menus)

### Implementation Strategy:

#### Phase 1: Escape Key - Hierarchical Closing
**Priority Order**:
1. **Close Dropdown** → Check `.custom-folder-dropdown.open` OR `.context-menu` exists
2. **Close Modal** → Check any modal with `display: flex`
3. **Close Command Palette** → Check `this.commandPaletteOpen`
4. **Close Main Panel** → Final fallback

**Implementation**:
```javascript
if (e.key === 'Escape') {
  e.preventDefault();
  
  // Priority 1: Close open dropdown
  const openDropdown = document.querySelector('.custom-folder-dropdown.open');
  if (openDropdown) {
    openDropdown.classList.remove('open');
    return;
  }
  
  // Priority 1b: Close context menu
  const contextMenu = document.querySelector('.context-menu');
  if (contextMenu) {
    contextMenu.remove();
    return;
  }
  
  // Priority 2: Close active modal (check all 9 modals)
  const modalIds = ['promptModal', 'folderModal', 'deletePromptModal', 
                    'deleteAllModal', 'deleteFavoritesModal', 'downloadFavouritesModal',
                    'deleteFoldersModal', 'confirmModal', 'shareModal'];
  
  for (const modalId of modalIds) {
    const modal = document.getElementById(modalId);
    if (modal && modal.style.display === 'flex') {
      // Call appropriate close method
      this[`close${modalId.charAt(0).toUpperCase() + modalId.slice(1, -5)}Modal`]();
      return;
    }
  }
  
  // Priority 3: Close command palette
  if (this.commandPaletteOpen) {
    this.closeCommandPalette();
    return;
  }
  
  // Priority 4: Close main panel (if in side panel mode)
  window.close();
}
```

#### Phase 2: Enter Key - Smart Submit
**Conditions to Check**:
1. Modal is open
2. No dropdown is open
3. Focus is NOT on textarea, input (except search), or button

**Implementation**:
```javascript
if (e.key === 'Enter') {
  // Check if any modal is open
  const modalIds = ['promptModal', 'folderModal', 'deletePromptModal', 
                    'deleteAllModal', 'deleteFavoritesModal', 'downloadFavouritesModal',
                    'deleteFoldersModal', 'confirmModal', 'shareModal'];
  
  const activeModal = modalIds.find(id => {
    const modal = document.getElementById(id);
    return modal && modal.style.display === 'flex';
  });
  
  if (!activeModal) return;
  
  // Check if dropdown is open
  const openDropdown = document.querySelector('.custom-folder-dropdown.open');
  const contextMenu = document.querySelector('.context-menu');
  if (openDropdown || contextMenu) return;
  
  // Check focused element
  const activeElement = document.activeElement;
  const isTextarea = activeElement.tagName === 'TEXTAREA';
  const isInput = activeElement.tagName === 'INPUT' && activeElement.type !== 'search';
  const isButton = activeElement.tagName === 'BUTTON';
  
  if (isTextarea || isInput || isButton) return;
  
  // Find and click primary button in active modal
  const modal = document.getElementById(activeModal);
  const primaryBtn = modal.querySelector('.btn-primary, #savePromptBtn, #saveFolderBtn, #confirmDeleteBtn, #confirmDeleteFavoritesBtn, #confirmDeleteFoldersBtn, #confirmBtn');
  
  if (primaryBtn) {
    e.preventDefault();
    primaryBtn.click();
  }
}
```

---

## PART 2: Type-to-Navigate in Move to Folder Dropdown

### Current State:
- `showFolderMenuForPrompt()` creates menuItems array
- `showContextMenu()` renders items as `.context-menu-item`
- NO keyboard navigation currently implemented

### Implementation Strategy:

#### Add Data Attributes to Context Menu Items:
```javascript
// In showContextMenu() - add data attributes to items
btn.dataset.itemLabel = item.label;
btn.dataset.folderId = item.folderId || '';
```

#### Add Keyboard Navigation to Context Menu:
```javascript
// New method: setupContextMenuKeyboardNavigation(menu)
// Store items with data attributes
// Handle keydown events for letter keys
// Highlight matching items
// Support Enter key selection
```

#### Integration Points:
- Call `setupContextMenuKeyboardNavigation(menu)` in `showContextMenu()`
- Use same highlighting logic as custom dropdown
- Support cycling through matches

---

## PART 3: Elite Search Highlighting System

### Current State:
- `searchPrompts()` filters prompts (line 1118)
- Uses `includes()` for exact match
- Has `fuzzyMatch()` function (line 1136)
- Renders results without highlighting

### Implementation Strategy:

#### Create Highlighting Utility Function:
```javascript
/**
 * Highlights search query matches in text with <mark> tags
 * @param {string} text - Original text to highlight
 * @param {string} query - Search query (can be multiple words)
 * @param {boolean} isFuzzy - Whether to use fuzzy matching
 * @returns {string} HTML string with <mark> tags
 */
highlightSearchMatches(text, query, isFuzzy = false) {
  if (!query || !text) return text;
  
  // Split query into keywords
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
  
  let result = text;
  
  keywords.forEach(keyword => {
    if (isFuzzy) {
      // Fuzzy highlighting: highlight characters that match
      // More complex - requires tracking matched positions
    } else {
      // Exact highlighting: case-insensitive replace
      const regex = new RegExp(`(${keyword})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    }
  });
  
  return result;
}
```

#### Modify Search Function to Track Query:
```javascript
searchPrompts(query) {
  this.currentSearchQuery = query; // Store for highlighting
  
  if (!query) {
    this.filteredPrompts = [...this.prompts];
  } else {
    const search = query.toLowerCase();
    this.filteredPrompts = this.prompts.filter(prompt => {
      if (prompt.title.toLowerCase().includes(search)) return true;
      if (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(search))) return true;
      if (this.settings.fuzzySearch && this.fuzzyMatch(prompt.title.toLowerCase(), search)) return true;
      return false;
    });
  }
  this.renderPrompts();
}
```

#### Apply Highlighting in Render Functions:
```javascript
// In renderPrompts() - when creating title element:
const titleText = this.currentSearchQuery 
  ? this.highlightSearchMatches(prompt.title, this.currentSearchQuery, this.settings.fuzzySearch)
  : prompt.title;

titleEl.innerHTML = titleText; // Use innerHTML instead of textContent
```

#### Add CSS for Highlighting:
```css
mark, .search-highlight {
  background-color: rgba(34, 184, 207, 0.2); /* Semi-transparent cyan */
  color: inherit;
  padding: 1px 2px;
  border-radius: 3px;
  font-weight: 600;
}
```

#### Apply to All Tabs:
1. **Prompts Tab**: `renderPrompts()` - highlight title
2. **Favorites Tab**: `renderFavorites()` - highlight title  
3. **Folders Tab**: `renderFolders()` - highlight folder names during search

---

## Implementation Order:

1. **First**: Add CSS for `<mark>` tag (low risk)
2. **Second**: Implement search highlighting (isolated, testable)
3. **Third**: Add type-to-navigate for context menu (medium complexity)
4. **Fourth**: Implement global keyboard shortcuts (highest complexity)

## Testing Strategy:

### Keyboard Shortcuts:
- Open modal → Press Escape → Modal closes
- Open modal → Open dropdown → Press Escape → Only dropdown closes
- Open dropdown → Press Escape → Dropdown closes
- Press Escape with nothing open → Nothing happens
- Open modal → Press Enter → Primary action triggers (if conditions met)
- Open modal → Focus textarea → Press Enter → New line inserted (not submit)

### Type-to-Navigate:
- Open move to folder menu → Type 'p' → Productivity highlighted
- Press 'p' again → Cycles to next P folder
- Press Enter → Moves prompt to highlighted folder

### Search Highlighting:
- Search "code" → "Code Review" shows "Code" highlighted
- Search "code review" → Both words highlighted separately
- Enable fuzzy → Search "emial" → "email" highlighted
- Clear search → No highlighting remains

---

## Risk Mitigation:

1. **Preserve existing functionality**: All current keyboard shortcuts must continue working
2. **No breaking changes**: Existing code paths remain unchanged
3. **Graceful degradation**: If highlighting fails, show unhighlighted text
4. **Performance**: Highlighting runs AFTER filtering, doesn't slow search
5. **Console logging**: Add debug logs for troubleshooting

---

## Files to Modify:

1. `popup-panel-refined.js`:
   - Modify keyboard event listener (line 544)
   - Add `highlightSearchMatches()` method
   - Modify `searchPrompts()` to track query
   - Modify `renderPrompts()` to apply highlighting
   - Modify `renderFavorites()` to apply highlighting
   - Modify `showContextMenu()` to add keyboard navigation
   
2. `popup-panel-refined.css`:
   - Add `mark` tag styling

---

## Success Criteria:

✅ All 9 modals close with Escape key (hierarchical)
✅ Dropdowns close first, then modals
✅ Enter key submits modal forms (when conditions met)
✅ Move to folder menu supports type-to-navigate
✅ Search results show highlighted matches
✅ Multi-word search highlights all words
✅ Fuzzy search shows intelligent highlighting
✅ All existing functionality preserved
✅ No new bugs introduced
