# 🐛 Menu Visibility Debug Guide

## ✅ **Confirmed Working:**
- Folder button **IS** being created ✅
- Folder button **IS** being clicked ✅  
- `showMoveToFolderMenu` **IS** being called ✅
- Menu **IS** being appended to body ✅

## ❌ **Problem:**
- Menu is **NOT visible** to user

---

## 🔍 Step-by-Step Debugging

### **Step 1: Reload Extension**
```
1. chrome://extensions
2. Find "Pro Prompter"
3. Click 🔄 reload
4. Close popup
```

### **Step 2: Open Console & Click Folder Button**

After clicking the 📁 folder icon, you should see these new logs:

```
🎯 showMoveToFolderMenu called for prompt: [Title]
🗑️ Removing existing menus...
📁 Building folder tree. Total folders: X, Tree nodes: Y
  📂 Adding folder to menu: [Folder 1] Level: 0
  📂 Adding folder to menu: [Folder 2] Level: 0
✅ Menu appended to body. Position: { left: "XXXpx", top: "YYYpx", ... }
⏰ Setting up click-outside listener for menu
```

---

## 📊 **What Each Log Tells Us:**

### **A. If "Total folders: 0"**
```
Problem: No folders exist in storage
Solution: Create a test folder first
```

### **B. If "visible: false" in menu position log**
```
Problem: Menu has no height/width
Possible causes:
- No content in menu
- display: none
- height: 0
```

### **C. If position shows negative numbers or > 1000**
```
Problem: Menu positioned off-screen
Fix: Check getBoundingClientRect values
```

### **D. If everything looks correct but menu not visible**
```
Problem: Z-index or opacity issue
Solution: Inspect element in DevTools
```

---

## 🔬 **Advanced Inspection (If Still Not Visible)**

### **In Console, After Clicking Folder Button:**

**Check if menu exists in DOM:**
```javascript
document.querySelector('.move-folder-menu')
```
**Expected:** Should return `<div class="move-folder-menu">...</div>`  
**If null:** Menu was removed immediately

**Check menu computed styles:**
```javascript
let menu = document.querySelector('.move-folder-menu');
let styles = window.getComputedStyle(menu);
console.log('Display:', styles.display);
console.log('Visibility:', styles.visibility);
console.log('Opacity:', styles.opacity);
console.log('Z-index:', styles.zIndex);
console.log('Position:', styles.position);
console.log('Top:', styles.top);
console.log('Left:', styles.left);
```

**Check menu dimensions:**
```javascript
let menu = document.querySelector('.move-folder-menu');
console.log('Width:', menu.offsetWidth, 'Height:', menu.offsetHeight);
console.log('BoundingRect:', menu.getBoundingClientRect());
```

---

## 🎯 **Most Likely Issues:**

### **1. Menu Being Removed Immediately**
**Symptom:** "❌ Click outside menu detected" appears right after creation  
**Cause:** Click event propagating to document  
**Fix:** Already added event.preventDefault()

### **2. Menu Positioned Off-Screen**
**Symptom:** Position shows very large or negative numbers  
**Cause:** Button rect calculation wrong  
**Fix:** Adjust positioning logic

### **3. Menu Has No Content**
**Symptom:** visible: false, height: 0  
**Cause:** No folders to display  
**Fix:** Create test folders

### **4. Z-Index Too Low**
**Symptom:** Menu exists but covered by other elements  
**Cause:** Z-index: 10000 not high enough  
**Fix:** Increase z-index

### **5. CSS Not Applied**
**Symptom:** Menu has no background, border, etc  
**Cause:** CSS class not matching  
**Fix:** Check class name spelling

---

## 🛠️ **Quick Fixes to Try:**

### **Fix 1: Force Menu Visible (Temporary Test)**

**In console after clicking:**
```javascript
let menu = document.querySelector('.move-folder-menu');
if (menu) {
  menu.style.position = 'fixed';
  menu.style.top = '100px';
  menu.style.left = '100px';
  menu.style.zIndex = '99999';
  menu.style.background = 'red'; // Make it obvious
  menu.style.padding = '20px';
  menu.style.border = '5px solid yellow';
}
```
**If this makes it visible:** Positioning issue  
**If still not visible:** DOM or CSS issue

### **Fix 2: Check for Overlays**

```javascript
// Check what's at the menu position
let menu = document.querySelector('.move-folder-menu');
let rect = menu.getBoundingClientRect();
let elementAtPoint = document.elementFromPoint(rect.left + 10, rect.top + 10);
console.log('Element at menu position:', elementAtPoint);
```
**If not the menu:** Something is covering it

---

## 📸 **What to Share:**

1. **Full console output** after clicking folder button
2. **Result of:**
   ```javascript
   document.querySelector('.move-folder-menu')
   ```
3. **Screenshot of Elements tab** showing the `.move-folder-menu` element
4. **Computed styles** from DevTools

---

## 💡 **Emergency Workaround:**

If menu still not working, try opening folder modal instead:

**Temporary change in `createPromptCard`:**
```javascript
const folderBtn = this.createActionButton('folder', 'Move to folder', (e) => {
  // Temporary: Open edit modal instead
  this.openPromptModal(prompt);
  // Original: this.showMoveToFolderMenu(e, prompt);
});
```

This will let you change folder via the edit modal while we debug the menu.

---

**Let's find out exactly what's happening! 🔍**
