# Comprehensive Fix Plan - 6 Major Issues

## ISSUE 1: Type-to-Navigate in "Move to Folder" Context Menu

### Problem:
- Only searches visible items
- Does NOT search nested children
- Does NOT cycle through ALL folders starting with typed letter
- Different from "Prompt Folder" dropdown behavior

### Root Cause:
- `setupContextMenuKeyboardNavigation()` only gets `.context-menu-item` elements
- Does NOT build comprehensive list including nested children
- Context menu items for nested folders are dynamically created on expand

### Solution:
1. Build comprehensive folder list when context menu opens
2. Store all folders (including nested) in `menu.dataset.keyboardItems`
3. Update keyboard handler to:
   - Search through ALL folders (not just visible ones)
   - Auto-expand parent folders to reveal nested matches
   - Scroll matched item into view
   - Remove cyan border (use only hover highlight)

### Implementation:
```javascript
// In showFolderMenuForPrompt() after menu creation:
const allFoldersForSearch = [];
this.folderManager.folders.forEach(folder => {
  allFoldersForSearch.push({
    folderId: folder.id,
    name: folder.name,
    parentId: folder.parentId
  });
});
menu.dataset.keyboardItems = JSON.stringify(allFoldersForSearch);
```

---

## ISSUE 2: Search Highlighting Missing in Multiple Places

### Problems:
A) **Favorites Tab**: No search highlighting on titles
B) **Tag Search**: Tags not highlighted when they match search
C) **Folders Tab**: No highlighting on folder names during search

### Root Cause:
- `searchFavorites()` doesn't use `currentSearchQuery`
- Tags are not checked for highlighting
- Folder search doesn't store query for highlighting

### Solution:

#### A) Favorites Tab Highlighting:
1. `searchFavorites()` should work like `searchPrompts()`
2. Store `this.currentSearchQuery` in favorites search
3. Filter favorites based on search
4. Apply highlighting via `createPromptCard()`

#### B) Tag Highlighting:
1. In `createPromptCard()`, check each tag against `currentSearchQuery`
2. Apply `highlightSearchMatches()` to matching tags
3. Use innerHTML for highlighted tags

#### C) Folders Tab Highlighting:
Already implemented in previous fix - verify it works

---

## ISSUE 3: Fuzzy Search Not Applied Universally

### Problem:
- Fuzzy search only works in Prompts tab
- NOT applied to Favorites tab
- NOT applied to Folders tab
- Fuzzy algorithm is too strict (doesn't handle typos well)

### Solution:

#### Improve Fuzzy Algorithm:
```javascript
fuzzyMatch(str, pattern) {
  // Use Levenshtein distance or more forgiving algorithm
  // Allow 1-2 character differences for typos
  // Example: "optiimizer" should match "optimizer"
}
```

#### Apply to All Tabs:
1. **Favorites Tab**: Add fuzzy check in searchFavorites()
2. **Folders Tab**: Add fuzzy check in deepSearch()

---

## ISSUE 4: Enter Key Not Working on Specific Modals

### Problem:
- Works on some modals (promptModal, folderModal)
- Does NOT work on:
  - deletePromptModal (should trigger delete)
  - downloadFavouritesModal (should trigger download)
  - shareModal (should trigger share)

### Root Cause:
- Primary button selector doesn't match all modals
- Current selector: `.btn-primary, #savePromptBtn, #saveFolderBtn, ...`
- Missing specific button IDs for these modals

### Solution:
1. Find correct button IDs for each modal
2. Update selector in Enter key handler (line 648):
```javascript
const primaryBtn = modal.querySelector(`
  .btn-primary,
  #savePromptBtn,
  #saveFolderBtn,
  #confirmDeleteBtn,
  #confirmDeleteFavoritesBtn,
  #confirmDeleteFoldersBtn,
  #confirmBtn,
  #downloadFavoritesBtn,      // ADD
  #confirmShareBtn             // ADD
`);
```

---

## ISSUE 5: Child Folder Not Visible by Default in Search

### Problem (from screenshot):
- Search for "peacock" shows "Productivity" folder
- But "peacock" child folder is NOT visible
- User cannot see the actual match

### Root Cause:
- Recent folders section shows parent folder
- But doesn't expand to show matching child

### Solution:
Already implemented in previous fix. Need to verify:
1. `directMatches` set identifies child folders correctly
2. Parent folders auto-expand when children match
3. Only matching children are shown (not all siblings)

---

## ISSUE 6: Smart Edit Modal (Disable Update Until Changes)

### Implementation Plan:

#### A) Add Debounce Utility:
```javascript
debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

#### B) Store Original State in openPromptModal():
```javascript
openPromptModal(prompt = null, autoFavorite = false) {
  this.originalPromptState = null;
  
  if (prompt) {
    // EDIT MODE
    this.originalPromptState = JSON.parse(JSON.stringify({
      title: prompt.title,
      content: prompt.content,
      tags: prompt.tags || [],
      folderId: prompt.folderId || null
    }));
    
    // Disable save button initially
    saveBtn.disabled = true;
    saveBtn.classList.add('is-disabled');
  } else {
    // CREATE MODE - button enabled
    saveBtn.disabled = false;
    saveBtn.classList.remove('is-disabled');
  }
}
```

#### C) Create Change Detection Function:
```javascript
hasPromptChanges() {
  if (!this.originalPromptState) return true; // Create mode
  
  const titleInput = document.getElementById('promptTitle');
  const contentInput = document.getElementById('promptContent');
  const currentFolderId = this.currentPromptFolderId;
  const currentTags = this.selectedTags;
  
  // Check each field
  if (titleInput.value !== this.originalPromptState.title) return true;
  if (contentInput.value !== this.originalPromptState.content) return true;
  if (currentFolderId !== this.originalPromptState.folderId) return true;
  
  // Check tags (order-independent)
  if (currentTags.length !== this.originalPromptState.tags.length) return true;
  const originalTagsSet = new Set(this.originalPromptState.tags);
  for (const tag of currentTags) {
    if (!originalTagsSet.has(tag)) return true;
  }
  
  return false;
}
```

#### D) Update Button State Function:
```javascript
updatePromptSaveButtonState() {
  const saveBtn = document.getElementById('savePromptBtn');
  if (!saveBtn) return;
  
  if (this.hasPromptChanges()) {
    saveBtn.disabled = false;
    saveBtn.classList.remove('is-disabled');
  } else {
    saveBtn.disabled = true;
    saveBtn.classList.add('is-disabled');
  }
}
```

#### E) Attach Event Listeners:
```javascript
// In openPromptModal() after populating fields:

// Create debounced version for typing
const debouncedUpdate = this.debounce(() => {
  this.updatePromptSaveButtonState();
}, 250);

// Title and content - use debounce
titleInput.addEventListener('input', debouncedUpdate);
contentInput.addEventListener('input', debouncedUpdate);

// Folder dropdown - immediate
// (attached in dropdown's select handler)

// Tags - immediate
// (attached in tag add/remove handlers)
```

#### F) CSS Styling:
```css
#savePromptBtn.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #2A2A2A !important;
}

#savePromptBtn {
  transition: opacity 0.2s ease, background-color 0.2s ease;
}
```

---

## Implementation Order (Priority):

1. **ISSUE 4** - Enter key modals (quick fix, high impact)
2. **ISSUE 2A** - Favorites search highlighting (medium complexity)
3. **ISSUE 2B** - Tag highlighting (medium complexity)
4. **ISSUE 3** - Fuzzy search improvements (medium complexity)
5. **ISSUE 1** - Context menu type-to-navigate (complex, requires careful refactor)
6. **ISSUE 5** - Verify folder search expansion (may already be fixed)
7. **ISSUE 6** - Smart edit modal (complex, many moving parts)

---

## Testing Protocol:

### Issue 1:
- Right-click prompt → Move to Folder
- Type "p" → Should cycle through ALL "P" folders (root + nested)
- No cyan border on highlighted item

### Issue 2A:
- Go to Favorites
- Search "code"
- Verify "Code" highlighted in titles

### Issue 2B:
- Search "marketing"
- Verify "marketing" tag highlighted on cards

### Issue 3:
- Search "optiimizer" (typo)
- Should show "Optimizer" prompt
- Test in all 3 tabs

### Issue 4:
- Open delete confirmation → Press Enter → Prompt deleted
- Open download favorites → Press Enter → Download starts
- Open share modal → Press Enter → Link copied

### Issue 5:
- Search "peacock" in Folders tab
- "Productivity" folder should be expanded
- "Peacock" child folder visible and highlighted

### Issue 6:
- Edit prompt → Don't change anything → Button disabled
- Edit prompt → Change title → Button enabled
- Edit prompt → Revert title → Button disabled again
- Create new prompt → Button always enabled

---

## Files to Modify:

1. `popup-panel-refined.js`:
   - Enter key handler (Issue 4)
   - searchFavorites() (Issue 2A)
   - createPromptCard() tag rendering (Issue 2B)
   - fuzzyMatch() algorithm (Issue 3)
   - searchFolders() fuzzy logic (Issue 3)
   - setupContextMenuKeyboardNavigation() (Issue 1)
   - showFolderMenuForPrompt() (Issue 1)
   - openPromptModal() (Issue 6)
   - New: hasPromptChanges() (Issue 6)
   - New: updatePromptSaveButtonState() (Issue 6)

2. `popup-panel-refined.css`:
   - .is-disabled styling (Issue 6)
   - Remove .keyboard-focused border for context menu (Issue 1)
