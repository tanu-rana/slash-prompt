# 📁 Folder System - Technical Specification (Part 1)

**Version:** 1.0 | **Date:** 2025-10-08 | **Implementation:** Phased Multi-Session

---

## 🎯 Executive Summary

### Objective
Build hierarchical folder organization for prompts with unlimited nesting, drag-and-drop, deep search, zero cost (chrome.storage only), and zero regression.

### Key Features
1. CRUD Operations for folders
2. Hierarchical structure via `parentId`
3. Visual management (icons, colors, drag-drop)
4. Deep search (folders + nested prompts)
5. Cascading deletes
6. Full integration

---

## 📊 Data Model

### Folder Object
```javascript
{
  id: string,              // "f-{timestamp}-{random}"
  name: string,            // 1-50 characters
  parentId: string | null, // Parent ID or null for root
  icon: string,            // Emoji (optional)
  color: string,           // Hex color (default: #22B8CF)
  createdAt: number,       // Unix timestamp
  updatedAt: number,       // Unix timestamp
  order: number            // Display order for drag-drop
}
```

### Updated Prompt Object
```javascript
{
  // ... existing fields ...
  folderId: string | null  // NEW: Reference to folder, null = uncategorized
}
```

### Storage Keys
- `folders` → `chrome.storage.sync` (NEW)
- `prompts` → `chrome.storage.local` (add `folderId` field)
- `folderExpandedStates` → `chrome.storage.local` (UI state)

---

## ⚙️ Core Algorithms

### 1. Build Folder Tree (O(n))
```javascript
function buildFolderTree(folders) {
  const folderMap = new Map();
  const rootFolders = [];
  
  folders.forEach(f => folderMap.set(f.id, { ...f, children: [] }));
  
  folders.forEach(folder => {
    const node = folderMap.get(folder.id);
    if (folder.parentId === null) {
      rootFolders.push(node);
    } else {
      const parent = folderMap.get(folder.parentId);
      if (parent) parent.children.push(node);
      else rootFolders.push(node); // Orphaned
    }
  });
  
  return rootFolders.sort((a, b) => a.order - b.order);
}
```

### 2. Get All Descendants (O(n))
```javascript
function getAllDescendantIds(folderId, folders) {
  const descendants = [];
  const stack = [folderId];
  
  while (stack.length > 0) {
    const currentId = stack.pop();
    folders
      .filter(f => f.parentId === currentId)
      .forEach(child => {
        descendants.push(child.id);
        stack.push(child.id);
      });
  }
  
  return descendants;
}
```

### 3. Validate Nesting
```javascript
function canNestFolder(folderId, targetParentId, folders) {
  if (folderId === targetParentId) return false;
  const descendants = getAllDescendantIds(folderId, folders);
  return !descendants.includes(targetParentId);
}
```

### 4. Cascade Delete
```javascript
async function cascadeDeleteFolder(folderId, folders, prompts) {
  const descendantIds = getAllDescendantIds(folderId, folders);
  const allFolderIds = [folderId, ...descendantIds];
  
  const remainingFolders = folders.filter(f => !allFolderIds.includes(f.id));
  const remainingPrompts = prompts.filter(p => !allFolderIds.includes(p.folderId));
  
  await chrome.storage.sync.set({ folders: remainingFolders });
  await chrome.storage.local.set({ prompts: remainingPrompts });
  
  return {
    deletedFolders: allFolderIds.length,
    deletedPrompts: prompts.length - remainingPrompts.length
  };
}
```

### 5. Deep Search
```javascript
function deepSearch(query, folders, prompts) {
  const lowerQuery = query.toLowerCase();
  const matchingIds = new Set();
  
  folders.forEach(f => {
    if (f.name.toLowerCase().includes(lowerQuery)) {
      matchingIds.add(f.id);
      addAncestors(f.id, folders, matchingIds);
    }
  });
  
  prompts.forEach(p => {
    const matches = p.title.toLowerCase().includes(lowerQuery) ||
                   p.content.toLowerCase().includes(lowerQuery);
    if (matches && p.folderId) {
      matchingIds.add(p.folderId);
      addAncestors(p.folderId, folders, matchingIds);
    }
  });
  
  return Array.from(matchingIds);
}
```

---

**See Part 2 for UI Components and Implementation Phases**
