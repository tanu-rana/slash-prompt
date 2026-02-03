# 📁 Folder System - Technical Specification (Part 2)

**UI Components & Implementation Phases**

---

## 🎨 UI Components

### 1. Folders Tab Layout
```
┌─────────────────────────────────────┐
│ [Search Folders...]         [+ New] │
├─────────────────────────────────────┤
│ ▼ 💼 Work Projects (12)      [...]  │
│   ▼ 📊 Client Projects (8)   [...]  │
│     ▶ 🏢 Acme Corp (5)       [...]  │
│   ▶ 🛠️ Internal Tools (4)    [...]  │
│ ▶ 🎓 Learning (15)           [...]  │
└─────────────────────────────────────┘
```

### 2. Folder Tree Item HTML
```html
<div class="folder-tree-item" data-folder-id="f-123" draggable="true">
  <div class="folder-item-content">
    <span class="folder-toggle">▼</span>
    <span class="folder-icon">💼</span>
    <span class="folder-name">Work Projects</span>
    <span class="folder-count">(12)</span>
    <button class="folder-menu-btn">...</button>
  </div>
  <div class="folder-children"></div>
</div>
```

### 3. Folder Modal
```html
<div class="modal-overlay">
  <div class="modal-content folder-modal">
    <h2>Create New Folder</h2>
    <div class="form-group">
      <label>Folder Name *</label>
      <input type="text" id="folderName" maxlength="50" required>
    </div>
    <div class="form-group">
      <label>Parent Folder</label>
      <select id="folderParent">
        <option value="">Root Level</option>
        <option value="f-123">💼 Work Projects</option>
        <option value="f-456">&nbsp;&nbsp;📊 Client Projects</option>
      </select>
    </div>
    <div class="form-group">
      <label>Icon</label>
      <div class="icon-picker">
        <button>📁</button> <button>💼</button> <button>📊</button>
      </div>
    </div>
    <div class="form-group">
      <label>Color</label>
      <input type="color" id="folderColor" value="#22B8CF">
    </div>
    <div class="modal-actions">
      <button class="btn-secondary">Cancel</button>
      <button class="btn-primary">Create Folder</button>
    </div>
  </div>
</div>
```

### 4. Delete Confirmation Dialog
```html
<div class="modal-overlay">
  <div class="modal-content delete-modal">
    <h2>Confirm Delete</h2>
    <p>Are you sure you want to permanently delete the 
    <strong>'Work Projects'</strong> folder?</p>
    <p class="danger-text">This will also delete:
      <ul>
        <li><strong>3 subfolders</strong></li>
        <li><strong>24 prompts</strong></li>
      </ul>
    </p>
    <p class="small-text">This action cannot be undone.</p>
    <div class="modal-actions">
      <button class="btn-secondary">Cancel</button>
      <button class="btn-danger">Delete</button>
    </div>
  </div>
</div>
```

**Styling:** `.btn-danger` has cyan background #22B8CF (per spec)

### 5. Folder Dropdown (in Prompt Modal)
```html
<select id="promptFolder">
  <option value="">📂 Uncategorized</option>
  <option value="__create__">➕ Create New Folder</option>
  <option value="">──────────</option>
  <option value="f-123">💼 Work Projects</option>
  <option value="f-456">&nbsp;&nbsp;📊 Client Projects</option>
</select>
```

### 6. Move to Folder Submenu
```html
<div class="submenu move-to-menu">
  <div class="submenu-header">Move to Folder</div>
  <button data-folder-id="">📂 Uncategorized</button>
  <button data-folder-id="__create__">➕ Create New Folder</button>
  <div class="submenu-divider"></div>
  <button data-folder-id="f-123">💼 Work Projects</button>
  <button data-folder-id="f-456" class="indented-1">📊 Client Projects</button>
</div>
```

---

## 🚀 Implementation Phases

### Phase 1: Data Layer (Session 1) - 1-2 hours
**Files:** `popup-panel-refined.js`, `background.js`

**Tasks:**
1. Create `FolderManager` class
2. Implement CRUD operations
3. Add validation functions
4. Migration for existing prompts
5. Unit test algorithms

**Deliverables:**
```javascript
class FolderManager {
  async createFolder(data)
  async updateFolder(id, updates)
  async deleteFolder(id, cascade)
  async moveFolder(id, newParentId)
  async getFolders()
  buildFolderTree()
  canNestFolder(id, parentId)
  getAllDescendants(id)
}
```

**Success:** All existing features work, folders in storage, no UI changes

---

### Phase 2: Core UI (Sessions 1-2) - 2-3 hours
**Files:** `popup-panel-refined.html`, `.css`, `.js`

**Tasks:**
1. Add Folders tab
2. Create folder tree view
3. Build folder modal
4. Add icons & colors
5. Expand/collapse
6. Empty state

**Success:** Folders tab visible, can create/view/edit folders

---

### Phase 3: Drag & Drop (Session 2) - 2-3 hours
**Files:** `popup-panel-refined.js`, `.css`

**Tasks:**
1. Drag event listeners
2. Visual feedback
3. Prevent invalid drops
4. Update hierarchy
5. Reorder/move folders

**Success:** Drag-drop works reliably, no data corruption

---

### Phase 4: Prompt Integration (Sessions 2-3) - 2-3 hours
**Files:** `popup-panel-refined.js`, `.html`, `.css`

**Tasks:**
1. Folder dropdown in prompt modal
2. Show prompts in folder view
3. "Move to..." submenu
4. Filter by folder
5. Handle uncategorized

**Success:** Prompts move between folders, favorites still work

---

### Phase 5: Delete & Confirmation (Session 3) - 1-2 hours
**Files:** `popup-panel-refined.js`, `.css`

**Tasks:**
1. Delete confirmation modal
2. Cascade delete
3. Calculate counts
4. Replace all confirm() dialogs
5. Style per spec

**Success:** Modal works, cascade delete functional, no accidental deletions

---

### Phase 6: Advanced Features (Sessions 3-4) - 2-3 hours
**Files:** `popup-panel-refined.js`, `background.js`, `manifest.json`

**Tasks:**
1. Deep search
2. Context menu quick-add
3. Quick-add modal
4. Search within folders
5. Folder filtering

**Success:** Search finds nested content, context menu works

---

### Phase 7: Testing & Polish (Session 4) - 1-2 hours
**Files:** All

**Tasks:**
1. Regression test all features
2. Performance optimization
3. Edge case testing
4. UI polish
5. Documentation

**Test Cases:**
- [ ] Create/edit/delete folders
- [ ] Drag-drop nesting
- [ ] Circular dependency prevention
- [ ] Cascade delete
- [ ] Deep search
- [ ] Prompt assignment
- [ ] Existing features (Favorites, Search, Tags)
- [ ] Storage limits
- [ ] Performance (100+ folders, 1000+ prompts)

**Success:** Zero regressions, all features work, excellent performance

---

## ⚡ Performance Requirements

| Operation | Max Time |
|-----------|----------|
| Load folders | < 100ms |
| Render tree (100 folders) | < 200ms |
| Search (1000 prompts) | < 300ms |
| Drag-drop update | < 50ms |
| Cascade delete | < 500ms |
| Expand/collapse | < 50ms |

**Optimizations:**
- Virtual scrolling for 200+ folders
- Debounced search (300ms)
- CSS transforms for animations
- Cached tree structures
- Batch storage operations

---

## 🛡️ Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data corruption | Atomic operations, validation |
| Performance issues | Virtual scrolling, indexing |
| Storage limit | Monitor size, warn at 80% |
| Circular dependencies | Validation before save |
| Regressions | Comprehensive testing |

---

## ✅ Ready to Start

**Phase 1 begins now:**
- Low risk (no UI changes)
- Foundation for all features
- Estimated: 1-2 hours

**Next:** Create `FolderManager` class
