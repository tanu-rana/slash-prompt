# ✅ CONTEXT MENUS - CLOSE ON ANY CLICK OUTSIDE

**Date:** October 31, 2025 - 3:12 AM  
**Status:** LEFT & RIGHT CLICK OUTSIDE CLOSES MENUS ✅

---

## 🎯 Objective

Ensure all context menus close when the user clicks **anywhere** outside them, including both left-click and right-click, matching the behavior of modals.

---

## 📋 Previous Behavior

All context menus already had click-outside-to-close functionality, but they only listened for **left-click** events:

```javascript
document.addEventListener('click', closeMenu);
```

This meant:
- ✅ Left-click outside → Menu closes
- ❌ Right-click outside → Menu stays open

---

## ✅ Solution

Added **contextmenu** event listener (right-click) to all three menu functions, so they now close on both left and right clicks outside.

### Changes Made:

#### 1. `showContextMenu()` - Lines 5810-5823
**Used by:** Single prompt menu, folder menu, move to folder menu

**Before:**
```javascript
// More reliable "click outside to close" logic
const closeMenuOnClickOutside = (e) => {
  if (!menu.contains(e.target)) {
    menu.remove();
    document.removeEventListener('click', closeMenuOnClickOutside);
    document.removeEventListener('keydown', menu._keydownHandler);
  }
};

setTimeout(() => {
  document.addEventListener('click', closeMenuOnClickOutside);
}, 0);
```

**After:**
```javascript
// Close menu on click or right-click outside
const closeMenuOnClickOutside = (e) => {
  if (!menu.contains(e.target)) {
    menu.remove();
    document.removeEventListener('click', closeMenuOnClickOutside);
    document.removeEventListener('contextmenu', closeMenuOnClickOutside);
    document.removeEventListener('keydown', menu._keydownHandler);
  }
};

setTimeout(() => {
  document.addEventListener('click', closeMenuOnClickOutside);
  document.addEventListener('contextmenu', closeMenuOnClickOutside);
}, 0);
```

#### 2. `showBulkActionsMenu()` - Lines 9956-9967
**Used by:** Bulk prompt selection menu

**Before:**
```javascript
// Close menu when clicking outside (delay to prevent immediate closure)
setTimeout(() => {
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  document.addEventListener('click', closeMenu);
}, 200);
```

**After:**
```javascript
// Close menu on click or right-click outside (delay to prevent immediate closure)
setTimeout(() => {
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('contextmenu', closeMenu);
    }
  };
  document.addEventListener('click', closeMenu);
  document.addEventListener('contextmenu', closeMenu);
}, 200);
```

#### 3. `showBulkFolderActionsMenu()` - Lines 10437-10448
**Used by:** Bulk folder selection menu

**Before:**
```javascript
// Close menu on click outside
setTimeout(() => {
  document.addEventListener('click', function closeMenu(e) {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  });
}, 0);
```

**After:**
```javascript
// Close menu on click or right-click outside
setTimeout(() => {
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('contextmenu', closeMenu);
    }
  };
  document.addEventListener('click', closeMenu);
  document.addEventListener('contextmenu', closeMenu);
}, 0);
```

---

## 🎨 Behavior

### Before Fix:
```
1. Right-click on prompt → Context menu opens
2. Right-click outside menu → Menu stays open ❌
3. User must left-click or press Escape to close
```

### After Fix:
```
1. Right-click on prompt → Context menu opens
2. Right-click outside menu → Menu closes ✅
3. OR left-click outside → Menu closes ✅
4. OR press Escape → Menu closes ✅
```

---

## 📊 Coverage Summary

All context menu types now close on both left and right clicks outside:

| Menu Type | Function | Left-Click Outside | Right-Click Outside |
|-----------|----------|-------------------|---------------------|
| Single Prompt Menu | `showContextMenu()` | ✅ Closes | ✅ **Closes** |
| Folder Menu | `showContextMenu()` | ✅ Closes | ✅ **Closes** |
| Move to Folder Menu | `showContextMenu()` | ✅ Closes | ✅ **Closes** |
| Bulk Prompt Actions | `showBulkActionsMenu()` | ✅ Closes | ✅ **Closes** |
| Bulk Folder Actions | `showBulkFolderActionsMenu()` | ✅ Closes | ✅ **Closes** |

---

## 🧪 Testing Instructions

### Test 1: Single Prompt Menu
1. Right-click on a prompt
2. **Verify:** Context menu appears
3. Right-click outside the menu
4. **Expected:** Menu closes immediately

### Test 2: Bulk Actions Menu
1. Select multiple prompts (Shift + Click)
2. Right-click on a selected prompt
3. **Verify:** Bulk actions menu appears
4. Right-click outside the menu
5. **Expected:** Menu closes immediately

### Test 3: Folder Menu
1. Go to Folders tab
2. Right-click on a folder
3. **Verify:** Folder menu appears
4. Right-click outside the menu
5. **Expected:** Menu closes immediately

### Test 4: Left-Click Still Works
1. Open any context menu
2. Left-click outside the menu
3. **Expected:** Menu closes (existing behavior preserved)

### Test 5: Rapid Right-Clicks
1. Right-click on item A → Menu opens
2. Right-click on item B → Menu A closes, Menu B opens
3. Right-click on empty space → Menu B closes
4. **Expected:** Clean transitions, no orphaned menus

---

## 🎯 Consistency with Modals

Context menus now behave exactly like modals:

| Behavior | Modals | Context Menus |
|----------|--------|---------------|
| Left-click outside | ✅ Closes | ✅ Closes |
| Right-click outside | ✅ Closes | ✅ **Closes** |
| Escape key | ✅ Closes | ✅ Closes |
| Click inside | ✅ Stays open | ✅ Stays open |

---

## ✨ Summary

**Problem:** Context menus only closed on left-click outside, not right-click  
**Solution:** Added `contextmenu` event listener to all menu functions  
**Result:** Menus now close on both left and right clicks outside  

**Key Benefits:**
- ✅ Consistent with modal behavior
- ✅ More intuitive user experience
- ✅ Matches user expectations
- ✅ Prevents menu "sticking" when right-clicking elsewhere

**All context menus now close on any click outside, just like modals!** 🎯✨
