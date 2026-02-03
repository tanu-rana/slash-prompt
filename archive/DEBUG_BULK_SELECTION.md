# Debug Bulk Selection - Step by Step

## CRITICAL: Reload Extension First!

**Before testing anything:**
1. Go to `chrome://extensions`
2. Find "Pro Prompter" 
3. Click the **RELOAD** button (circular arrow icon)
4. Close the popup if it's open
5. Open the popup again fresh

## Step 1: Open Console

1. **Right-click** on the Pro Prompter popup
2. Click **"Inspect"**
3. Go to the **Console** tab
4. Keep this open while testing

## Step 2: Test Basic Click

1. **Without holding any keys**, click on a prompt card
2. **Check console** - you should see:
   ```
   🖱️ CARD CLICKED! {shiftKey: false, ctrlKey: false, metaKey: false, ...}
   ✏️ Opening edit modal from card click
   ```

**If you DON'T see this:**
- The click event handler isn't attached
- Extension wasn't reloaded properly
- Try reloading extension again

**If you DO see this:**
- Click events are working! ✅
- Move to Step 3

## Step 3: Test Shift+Click

1. **Hold down Shift key**
2. **Click on a prompt card**
3. **Check console** - you should see:
   ```
   🖱️ CARD CLICKED! {shiftKey: true, ctrlKey: false, metaKey: false, ...}
   🔲 Bulk selection toggle for prompt: [some-id]
   ✅ Selected prompt: [some-id]
   📊 Total selected prompts: 1
   📊 Selected IDs: ['some-id']
   🎨 Updating selection UI...
   📇 Found X prompt cards
   ✅ Added is-selected class to card: [some-id]
   ✓ Selection indicator found for card: [some-id]
   ```

**If you see "shiftKey: false" even though you're holding Shift:**
- Your keyboard might not be registering Shift properly
- Try **Ctrl** instead (Windows) or **Cmd** (Mac)
- Try the other Shift key (left vs right)

**If you see "shiftKey: true" but nothing else:**
- The togglePromptSelection function isn't being called
- Check for JavaScript errors in console (red text)

## Step 4: Visual Check

After Shift+Click, **look at the prompt card**:

**You should see:**
- ✅ **Cyan checkmark badge** in bottom-right corner (28px circle)
- ✅ **Cyan border** around the card (2px)
- ✅ **Subtle cyan tint** on the card background
- ✅ **Selection counter banner** at the top saying "1 prompt selected"

**If you DON'T see the checkmark:**
1. Right-click on the card → Inspect
2. Look for `<div class="selection-indicator">` in the HTML
3. Check if it has `opacity: 1` in the Styles panel
4. Check if the card has class `is-selected`

## Step 5: Test Multi-Selection

1. **Keep holding Shift**
2. **Click on another prompt card**
3. **Check console** - should show:
   ```
   📊 Total selected prompts: 2
   ```
4. **Check visual** - both cards should have checkmarks
5. **Check banner** - should say "2 prompts selected"

## Step 6: Test Right-Click

1. With cards selected, **right-click on a selected card**
2. **Check console** - should show:
   ```
   🖱️ Right-click on prompt card
   📋 Showing bulk actions menu
   ```
3. **Check visual** - should see menu with:
   - "2 PROMPTS SELECTED" header
   - Download Selection
   - Add Selection to Favorites
   - Move Selection to Folder
   - Delete Selection

**If you see the normal menu instead:**
- Check console for what it says
- Verify the card has `is-selected` class
- Check if `selectedPromptIds.size > 0`

## Common Problems & Solutions

### Problem: No console logs at all
**Solution:**
- Extension not reloaded
- JavaScript file not loaded
- Go to chrome://extensions → Reload → Try again

### Problem: "CARD CLICKED" shows but nothing else
**Solution:**
- Check for JavaScript errors (red text in console)
- The event handler is working but something is failing
- Look for error messages

### Problem: "shiftKey: false" when holding Shift
**Solution:**
- Keyboard issue
- Try Ctrl (Windows) or Cmd (Mac) instead
- Try clicking with mouse while holding key
- Don't use trackpad gestures

### Problem: Checkmark not visible
**Solution:**
1. Inspect the card element
2. Check if `.selection-indicator` exists in DOM
3. Check if card has class `is-selected`
4. Check CSS - should have `opacity: 1 !important`
5. Check z-index - should be 100

### Problem: Text gets highlighted
**Solution:**
- CSS not applied
- Reload extension
- Check if `.prompt-card` has `user-select: none`

### Problem: Wrong menu appears
**Solution:**
- Selection state not being tracked
- Check `selectedPromptIds` in console:
  ```javascript
  // Type this in console:
  window.panelManager.selectedPromptIds
  ```
- Should show a Set with the selected IDs

## Manual Console Test

If nothing is working, try this in the console:

```javascript
// Check if the manager exists
console.log('Manager:', window.panelManager);

// Check selected IDs
console.log('Selected IDs:', window.panelManager.selectedPromptIds);

// Try selecting manually
window.panelManager.togglePromptSelection('some-prompt-id');

// Check if it worked
console.log('After manual toggle:', window.panelManager.selectedPromptIds);
```

## What to Report

If it's still not working, please provide:

1. **Console output** when you Shift+Click (copy/paste all logs)
2. **Any error messages** (red text in console)
3. **Browser version** (Chrome/Edge version number)
4. **Operating system** (Windows/Mac/Linux)
5. **What you see** vs **what you expect to see**
6. **Screenshots** if possible

## Quick Fix Attempts

### Attempt 1: Hard Reload
1. Remove extension completely
2. Re-add from folder
3. Test again

### Attempt 2: Clear Console
1. Click the 🚫 icon in console to clear
2. Try Shift+Click again
3. See if logs appear

### Attempt 3: Check Files
1. Open `popup-panel-refined.js`
2. Search for "CARD CLICKED"
3. Verify the console.log is there
4. Save file if needed
5. Reload extension

### Attempt 4: Test in Incognito
1. Enable extension in incognito mode
2. Open popup in incognito window
3. Test Shift+Click
4. See if it works there

## Success Indicators

✅ **Working correctly when you see:**
- Console logs appearing on every click
- "shiftKey: true" when holding Shift
- "Total selected prompts" increasing
- Checkmark badges appearing
- Selection counter banner showing
- Bulk actions menu on right-click

❌ **Not working if:**
- No console logs at all
- Logs stop after "CARD CLICKED"
- JavaScript errors in console
- No visual changes on cards
- Normal menu instead of bulk menu
