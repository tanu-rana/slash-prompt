# Modal Height & Recent Folders Fix

## Issue 1: Reduce Modal Height by 30%

### Change Applied
**Reduced max-height from 700px to 490px (30% reduction)**

```css
/* BEFORE */
.move-to-folder-modal {
  max-height: 700px;
}

/* AFTER */
.move-to-folder-modal {
  max-height: 490px;
}
```

### Result
- ✅ Modal is now 30% shorter (490px instead of 700px)
- ✅ More compact and fits better on screen
- ✅ Maintains scrolling for long folder lists

---

## Issue 2: Recent Folders Section Missing After First Use

### Problem
After moving a prompt to a folder, the next time you open the modal:
- Recent folders section was missing
- Only "All Folders" section displayed
- This happened because the recent folder was the same as the current folder and got filtered out

### Root Cause
The logic was:
1. Move prompt to Folder A → Add Folder A to `recentFolderIds`
2. Open modal again for a prompt in Folder A → Filter out Folder A (current folder)
3. Result: `recentFolders.length === 0` → Section doesn't display

### Fix Applied
**Restructured logic to always show recent folders or fallback:**

```javascript
// BEFORE (flawed logic):
if (this.recentFolderIds.length === 0) {
  // Show folders by prompt count
} else {
  // Show recent folders (might be empty after filtering)
}

// AFTER (fixed logic):
// Always try to get recent folders first
const recentFolders = recentIds
  .map(id => this.folderManager.folders.find(f => f.id === id))
  .filter(f => f && f.id !== currentFolderId)
  .slice(0, 3);

// If we have recent folders after filtering, return them
if (recentFolders.length > 0) {
  return recentFolders;
}

// Fallback: Show folders with most prompts
return foldersWithCounts;
```

### How It Works Now

**Scenario 1: First time opening modal**
- `recentFolderIds` is empty
- Shows folders sorted by prompt count
- "RECENTLY USED" section displays

**Scenario 2: After moving prompt to Folder A**
- `recentFolderIds = ['folder-a-id']`
- Open modal for prompt in Folder B
- Shows Folder A in "RECENTLY USED"
- Section displays ✅

**Scenario 3: After moving prompt to Folder A, open modal for prompt in Folder A**
- `recentFolderIds = ['folder-a-id']`
- Folder A gets filtered out (current folder)
- `recentFolders.length === 0`
- Falls back to folders by prompt count
- "RECENTLY USED" section still displays ✅

**Scenario 4: After using multiple folders**
- `recentFolderIds = ['folder-c-id', 'folder-b-id', 'folder-a-id']`
- Open modal for prompt in Folder B
- Shows Folder C and Folder A (Folder B filtered out)
- "RECENTLY USED" section displays ✅

### Key Improvement
**Always ensures "RECENTLY USED" section has content:**
- First checks actual recent folders (excluding current)
- If none available, falls back to folders with most prompts
- Section never disappears after first use

---

## Testing Instructions

### Test 1: Modal Height
1. Refresh extension
2. Open Move to Folder modal
3. **Expected**: Modal is noticeably shorter (490px instead of 700px)
4. **Expected**: Still scrollable if many folders

### Test 2: Recent Folders - First Time
1. Fresh install or clear data
2. Open Move to Folder modal
3. **Expected**: "RECENTLY USED" section shows folders with prompts
4. **Console**: "No recent folders available, showing folders by prompt count"

### Test 3: Recent Folders - After Moving
1. Move "Prompt A" to "Business" folder
2. Open modal for "Prompt B" (in different folder)
3. **Expected**: "RECENTLY USED" shows "Business"
4. **Console**: "Recent folders: ['Business']"

### Test 4: Recent Folders - Same Folder
1. Move "Prompt A" to "Business" folder
2. Open modal for "Prompt A" again (already in Business)
3. **Expected**: "RECENTLY USED" still shows (other folders)
4. **Console**: "No recent folders available, showing folders by prompt count"
5. **Expected**: Section displays folders with prompts

### Test 5: Recent Folders - Multiple Uses
1. Move prompts to different folders: Business → Writing → Productivity
2. Open modal for prompt in "test" folder
3. **Expected**: "RECENTLY USED" shows Productivity, Writing, Business
4. **Console**: "Recent folders: ['Productivity', 'Writing', 'Business']"

---

## Console Logs Reference

### When recent folders available:
```
Recent folder IDs: ['folder-c-id', 'folder-b-id']
Recent folders after filtering: 2
Recent folders: ['Productivity', 'Writing']
```

### When recent folders filtered out:
```
Recent folder IDs: ['folder-a-id']
Recent folders after filtering: 0
No recent folders available, showing folders by prompt count
Folders by prompt count: ['Business', 'Writing', 'Productivity']
```

---

## Files Modified

### popup-panel-refined.css
**Line 5324**: Reduced modal height
- `max-height: 700px` → `max-height: 490px`

### popup-panel-refined.js
**Lines 6048-6085**: Fixed recent folders logic
- Restructured to always check recent folders first
- Added fallback to folders by prompt count
- Ensures section always has content

---

## Success Criteria

✅ Modal height reduced by 30% (700px → 490px)
✅ Recent folders section always displays
✅ Shows actual recent folders when available
✅ Falls back to popular folders when needed
✅ Never shows empty recent section
✅ Works correctly across all scenarios
