# Testing Guide - Premium Refinements

## 🔄 Quick Reload
1. Go to `chrome://extensions/`
2. Click refresh button on the extension
3. Refresh any ChatGPT tab

## ✅ Test Checklist

### 1. Prompt Cards
- [ ] Tags are visible by default with colors:
  - Coding: Red (#FF6B6B)
  - Learning/Simple: Teal (#4ECDC4)
  - Review/Analysis: Blue (#45B7D1)
  - Debug/Creative: Yellow (#F7DC6F)
- [ ] On hover: Single row of 4 actions appears (Copy | Edit | Delete | Share)
- [ ] Clicking a tag filters prompts
- [ ] Cards are sleek and properly spaced

### 2. Dynamic Buttons
- [ ] Empty state: Shows "New Prompt" and "Manage Prompts" text buttons
- [ ] With prompts: Shows only + and 🔧 icons in search bar
- [ ] Tooltips appear on icon hover

### 3. Add/Edit Modal
- [ ] Modal height is fixed at 480px
- [ ] No scrolling needed to see tags section
- [ ] Content textarea is ~160px height
- [ ] Tags input has border and max-height
- [ ] Hovering over tags shows X to remove

### 4. Share Feature
- [ ] Click share icon on any prompt
- [ ] Toast notification shows: "Link copied! This temporary link can be shared with anyone and will expire in 3 days."
- [ ] Link format: `chrome-extension://[id]/share.html?id=[share_id]`
- [ ] Opening link shows styled share page with:
  - Prompt title
  - Color-coded tags  
  - Copy button
  - 3-day expiration notice

### 5. Real-Time Search (`//` Command)
- [ ] Type `//` in ChatGPT → Shows top 10 prompts immediately
- [ ] Type `//co` → Shows only prompts starting with "co" (e.g., "Code Review Assistant")
- [ ] Type `//de` → Shows "Debug Helper" 
- [ ] Type `// ` (with space) → Hides dropdown
- [ ] Results update instantly as you type

### 6. Tabs
- [ ] Settings tab has gear icon ⚙️
- [ ] Feedback tab works and shows form
- [ ] No Tags tab (removed)

### 7. Footer
- [ ] "Delete All" button is visible
- [ ] Confirmation modal appears on click
- [ ] Import/Export buttons are visible

## 🐛 Common Issues

### Issue: Tags not showing colors
**Fix**: Reload extension, tags should have data-tag attributes

### Issue: // command not filtering properly  
**Fix**: Check console for "Prompt Manager:" logs

### Issue: Share link not working
**Fix**: Check that share.html is in manifest's web_accessible_resources

### Issue: Modal scrolling
**Fix**: Modal should be exactly 480px height with fixed layout

## 📊 Expected Behavior

### Empty State
```
[Search Bar]
[+ New Prompt] [Manage Prompts]
    (Empty state message)
[3 prompts] [Delete All] [Import] [Export]
```

### With Prompts
```
[Search Bar] [+] [🔧]
[Code Review Assistant]
  [coding] [review]        [📋][✏️][🗑️][🔗]
[Explain Like I'm 5]
  [learning] [simple]      [📋][✏️][🗑️][🔗]
```

## 🎯 Premium Experience Checklist

- [ ] All text uses Sora font
- [ ] Dark theme is consistent (Black/Steel/Platinum)
- [ ] Animations are smooth (150ms transitions)
- [ ] No blue accents anywhere
- [ ] Hover effects are subtle
- [ ] Spacing is consistent
- [ ] Icons are properly aligned
- [ ] Tooltips appear quickly

## 💡 Testing Tips

1. **Test in Different States**:
   - Empty library
   - 1-2 prompts
   - 10+ prompts

2. **Test Search**:
   ```
   //           → All prompts
   //c          → Code prompts
   //ex         → Explain prompts
   //review     → Review prompts
   // space     → Hidden
   ```

3. **Test Share Links**:
   - Copy a share link
   - Open in new tab
   - Verify expiration message
   - Test copy button

4. **Test Responsiveness**:
   - Resize window
   - Check panel at 60vh max
   - Verify modal at 480px

## 📝 Final Verification

Before considering complete:
1. All premium colors applied
2. Tags always visible with colors
3. Single row hover actions
4. Real-time // filtering
5. Share with 3-day expiration
6. No-scroll modal
7. Dynamic button states

---
**Version**: 3.0.0
**Date**: November 2024
**Status**: Premium Refinements Complete
