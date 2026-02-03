# 📚 Folder System User Guide

**Version:** 1.0  
**Last Updated:** 2025-10-08  

---

## 🎯 Quick Start

### **1. Creating Your First Folder**

**Option A: From Folders Tab**
1. Click **"Folders"** tab
2. Click **"+"** button (top right)
3. Enter folder name
4. Choose icon and color (optional)
5. Click **"Create Folder"**

**Option B: From Empty State**
1. Click **"Folders"** tab
2. Click **"Create First Folder"** button
3. Fill in details
4. Save

### **2. Organizing Prompts**

**When Creating/Editing a Prompt:**
1. Click **"New Prompt"** or edit existing
2. Find **"Folder"** dropdown (below Content)
3. Select destination folder
4. Save prompt

**Quick Move (After Creation):**
1. Hover over prompt card
2. Click **folder icon** (📁)
3. Select destination folder
4. Done!

---

## 📂 Folder Management

### **Creating Folders**

**Basic Folder:**
```
Name: Work Projects
Icon: 💼 (choose from 12 options)
Color: #22B8CF (cyan)
Parent: Root Level
```

**Nested Folder:**
```
Name: Client Projects
Icon: 📊
Color: Custom
Parent: Work Projects ← Choose parent
```

### **Editing Folders**

1. Go to **Folders** tab
2. Click **⋯** menu on folder
3. Select **"Edit"**
4. Update properties
5. **"Save Changes"**

### **Deleting Folders**

**Empty Folder:**
- Click **⋯** → **"Delete"**
- Confirms deletion

**Folder with Contents:**
- Shows warning:
  ```
  Delete "Work Projects"?
  
  This will also delete:
  • 3 subfolder(s)
  • 12 prompt(s)
  
  This cannot be undone.
  ```
- Confirm to proceed

---

## 🗂️ Organizing Prompts

### **Assign to Folder (New Prompt)**

1. Click **"+ New Prompt"**
2. Fill in Title, Content, Tags
3. **Folder dropdown** (between Content and Tags):
   - 📂 Uncategorized
   - ➕ Create New Folder
   - ──────────
   - 💼 Work Projects
   - 📊 Client Projects (indented)
4. Select folder
5. **"Save Prompt"**

### **Move to Folder (Existing Prompt)**

**Option 1: Edit Modal**
1. Click prompt to edit
2. Change **"Folder"** dropdown
3. **"Update Prompt"**

**Option 2: Folder Button (Quick)**
1. Hover over prompt card
2. Click **📁 folder icon** (5th button)
3. Menu appears with folder list
4. Click destination folder
5. Toast: "Moved to [Folder Name]"

### **View Prompts in Folder**

1. Go to **Folders** tab
2. Click on any folder name
3. Switches to **Prompts** tab
4. Shows only prompts in that folder
5. Breadcrumb: **[←] 📂 Folder Name**
6. Click **[←]** to view all prompts

### **View Uncategorized Prompts**

1. Go to **Folders** tab
2. Look for **📂 Uncategorized** (dashed border)
3. Click it
4. Shows all prompts without folders

---

## 🎨 Customization

### **Icons** (12 Options)
```
📁 Folder (default)
💼 Briefcase
📊 Chart
🏢 Office
🎓 Graduation
💡 Lightbulb
🛠️ Tools
📚 Books
🎯 Target
⚡ Lightning
🔧 Wrench
📦 Package
```

### **Colors**
- **Hex Input:** #22B8CF (cyan)
- **Common Colors:**
  - Cyan: #22B8CF
  - Blue: #3B82F6
  - Green: #10B981
  - Yellow: #F59E0B
  - Red: #EF4444
  - Purple: #8B5CF6

### **Parent Folder**
- **Root Level:** No parent (top level)
- **Nested:** Choose existing folder
- **Hierarchy:** Up to unlimited depth

---

## 🔄 Reorganizing Folders

### **Drag-and-Drop**

**Moving a Folder:**
1. Go to **Folders** tab
2. Click and hold folder name
3. Drag to target folder
4. Drop when highlighted in cyan
5. Folder becomes child of target

**Visual Feedback:**
- **Dragging:** Semi-transparent (50% opacity)
- **Valid Target:** Cyan border + light background
- **Invalid Target:** No highlight (can't drop)

**Rules:**
- ❌ Can't drop on itself
- ❌ Can't drop parent into child
- ❌ Can't create circular dependencies
- ✅ Can reorder siblings
- ✅ Can move to root level
- ✅ Can nest infinitely

### **Using Edit Modal**

**Alternative to Drag-and-Drop:**
1. Click **⋯** on folder
2. Select **"Edit"**
3. Change **"Parent Folder"** dropdown
4. **"Save Changes"**

---

## 🔍 Search & Filter

### **Search Folders**

1. Go to **Folders** tab
2. Type in **search bar**
3. Searches:
   - Folder names
   - Prompts in folders (deep search)
4. Shows matching folders expanded
5. Clear search to reset

### **Filter by Folder**

**Method 1: Click Folder**
- Click folder name
- Views prompts in that folder

**Method 2: Breadcrumb Navigation**
- After viewing folder prompts
- Breadcrumb shows: **[←] 📂 Folder Name**
- Click **[←]** to clear filter

---

## ⌨️ Keyboard Shortcuts

### **Global**
| Key | Action |
|-----|--------|
| **ESC** | Close modal/menu |
| **ESC** (2x) | Close all overlays |

### **Within Modals**
| Key | Action |
|-----|--------|
| **Tab** | Navigate fields |
| **Enter** | Submit form |
| **ESC** | Cancel/close |

### **Future Enhancements**
```
Ctrl+N  - New folder
Ctrl+E  - Edit selected
Del     - Delete selected
↑↓      - Navigate folders
→       - Expand folder
←       - Collapse folder
```

---

## 📊 Folder Statistics

### **Count Badges**

**On Folders:**
```
💼 Work Projects (12)
                  ↑
      Total prompts (including subfolders)
```

**On Uncategorized:**
```
📂 Uncategorized (5)
                  ↑
      Prompts without folders
```

**In Footer:**
```
15 folders
```

### **Recursive Counting**

Folder counts include:
- Direct child prompts
- Prompts in subfolders
- Prompts in sub-subfolders (all descendants)

Example:
```
💼 Work Projects (20)
  📊 Client Projects (12)
    🏢 Acme Corp (8)
    🏢 Beta Inc (4)
  🛠️ Internal (8)

Work Projects shows: 20 total
= 12 (Client Projects) + 8 (Internal)
= 8 (Acme) + 4 (Beta) + 8 (Internal)
```

---

## 🎯 Best Practices

### **Folder Structure**

**Good:**
```
📂 Work
  📊 Projects
    🏢 Client A
    🏢 Client B
  🛠️ Internal
📂 Personal
  🎓 Learning
  💡 Ideas
```

**Avoid:**
```
📂 Folder1
  📂 Folder2
    📂 Folder3
      📂 Folder4
        📂 Folder5
          📂 Too Deep!
```

**Recommendations:**
- **Max Depth:** 3-4 levels
- **Folders per Level:** 5-10
- **Prompts per Folder:** 10-50
- **Total Folders:** 20-30

### **Naming Conventions**

**Clear Names:**
- ✅ "Client Projects"
- ✅ "Code Review Templates"
- ✅ "API Documentation"

**Avoid:**
- ❌ "Stuff"
- ❌ "Things"
- ❌ "Misc"
- ❌ "Folder123"

### **Icon Usage**

**Match Purpose:**
- 💼 Business/Work
- 📊 Data/Analytics
- 🎓 Learning/Education
- 🛠️ Tools/Utilities
- 💡 Ideas/Brainstorming
- 📚 Documentation

### **Color Coding**

**Create System:**
- **Blue:** Personal projects
- **Green:** Approved/final
- **Yellow:** In progress
- **Red:** Urgent/important
- **Purple:** Templates

---

## 💡 Tips & Tricks

### **Quick Organization**

**Batch Creation:**
1. Create folder structure first
2. Then assign prompts
3. Use folder button for quick moves

**Favorites + Folders:**
- Folders for organization
- Favorites for quick access
- Use both together!

### **Efficient Navigation**

**Breadcrumbs:**
- View folder → Auto breadcrumb
- Click back → Clears filter
- Fast navigation between folders

**Search:**
- Search finds nested prompts
- No need to navigate deep folders
- Quick access to any prompt

### **Maintenance**

**Regular Cleanup:**
1. Review uncategorized prompts
2. Assign to folders
3. Delete unused folders
4. Merge similar folders

**Folder Audit:**
- Keep structure simple
- Remove empty folders
- Consolidate if too many
- Regular reorganization

---

## ❓ FAQ

### **Q: How many folders can I create?**
A: Unlimited! But recommend 20-30 for best performance.

### **Q: How deep can I nest folders?**
A: Unlimited depth, but recommend 3-4 levels maximum.

### **Q: What happens if I delete a folder?**
A: All subfolders and prompts in it are also deleted (with confirmation).

### **Q: Can I move multiple prompts at once?**
A: Not yet - planned for future enhancement.

### **Q: How do I unassign a prompt from a folder?**
A: Edit prompt → Set folder to "📂 Uncategorized" → Save.

### **Q: Can I share folders?**
A: Not yet - currently only individual prompt sharing works.

### **Q: Do folders sync across devices?**
A: Yes! Using Chrome sync storage (if sync enabled).

### **Q: Can I export folders?**
A: Not yet - planned for future enhancement.

### **Q: How do I reorder folders?**
A: Drag-and-drop to reorder siblings or change parents.

### **Q: Can I have duplicate folder names?**
A: Yes, but not recommended for clarity.

---

## 🆘 Troubleshooting

### **Folder Not Saving**

**Issue:** Folder modal shows error  
**Fix:**
1. Check folder name is not empty
2. Ensure parent folder exists
3. Try refreshing extension

### **Can't Drag Folder**

**Issue:** Drag-and-drop not working  
**Fix:**
1. Make sure you're dragging by the name
2. Don't click toggle arrow or menu button
3. Try clicking folder item content area

### **Prompts Not Showing**

**Issue:** View folder shows no prompts  
**Fix:**
1. Click breadcrumb back button
2. Check prompts are assigned correctly
3. Try refreshing view

### **Circular Dependency Error**

**Issue:** Can't drop folder into target  
**Reason:** Would create circular dependency  
**Example:** Can't move parent into its own child  
**Fix:** Choose different target

### **Performance Issues**

**Issue:** Slow with many folders  
**Fix:**
1. Reduce total folder count (< 50)
2. Limit nesting depth (< 5)
3. Clean up unused folders
4. Restart browser

---

## 🎓 Video Tutorials

### **Coming Soon:**
1. Getting Started with Folders
2. Advanced Organization Techniques
3. Drag-and-Drop Mastery
4. Power User Tips

---

## 📞 Support

### **Having Issues?**

1. Check this guide
2. Review FAQ section
3. Check console for errors (F12)
4. Report issue on GitHub

### **Feature Requests?**

We'd love to hear your ideas!
- GitHub Issues
- Feedback tab in extension

---

**Happy Organizing! 📂✨**
