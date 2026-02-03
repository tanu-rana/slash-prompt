// Options Page JavaScript - Full library management interface

class OptionsManager {
  constructor() {
    this.prompts = [];
    this.tags = [];
    this.filteredPrompts = [];
    this.selectedPrompts = new Set();
    this.currentPage = 'library';
    this.viewMode = 'grid';
    this.editingPrompt = null;
    this.editingTag = null;
    this.selectedTagColor = '#45B7D1';
    this.debounceTimer = null;
    this.draggedElement = null;
    
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.applyTheme();
    this.renderCurrentPage();
  }

  async loadData() {
    const [prompts, tags, settings] = await Promise.all([
      this.sendMessage({ action: 'getPrompts' }),
      this.sendMessage({ action: 'getTags' }),
      this.sendMessage({ action: 'getSettings' })
    ]);
    
    this.prompts = prompts || [];
    this.tags = tags || [];
    this.settings = settings || {};
    this.filteredPrompts = [...this.prompts];
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = btn.dataset.page;
        this.switchPage(page);
      });
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Library page events
    this.setupLibraryEvents();
    
    // Tags page events
    this.setupTagsEvents();
    
    // Settings page events
    this.setupSettingsEvents();
    
    // Modal events
    this.setupModalEvents();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
      if (e.ctrlKey && e.key === 'a' && this.currentPage === 'library') {
        e.preventDefault();
        this.selectAll();
      }
    });
  }

  setupLibraryEvents() {
    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.filterPrompts(e.target.value);
      }, 200);
    });

    // Add prompt
    document.getElementById('addPromptBtn').addEventListener('click', () => {
      this.openPromptModal();
    });

    document.getElementById('emptyStateBtn')?.addEventListener('click', () => {
      this.openPromptModal();
    });

    // Select all
    document.getElementById('selectAllBtn').addEventListener('click', () => {
      this.selectAll();
    });

    // Bulk delete
    document.getElementById('bulkDeleteBtn').addEventListener('click', () => {
      this.bulkDelete();
    });

    // Import/Export
    document.getElementById('importBtn').addEventListener('click', () => {
      this.importPrompts();
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportPrompts();
    });

    // View mode
    document.getElementById('gridViewBtn').addEventListener('click', () => {
      this.setViewMode('grid');
    });

    document.getElementById('listViewBtn').addEventListener('click', () => {
      this.setViewMode('list');
    });
  }

  setupTagsEvents() {
    document.getElementById('addTagBtn').addEventListener('click', () => {
      this.openTagModal();
    });
  }

  setupSettingsEvents() {
    // Dark mode
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
      this.saveSetting('darkMode', e.target.checked);
    });

    // Fuzzy search
    document.getElementById('fuzzySearchToggle').addEventListener('change', (e) => {
      this.saveSetting('fuzzySearchEnabled', e.target.checked);
    });

    // Auto suggest
    document.getElementById('autoSuggestToggle').addEventListener('change', (e) => {
      this.saveSetting('autoSuggest', e.target.checked);
    });

    // Max suggestions
    document.getElementById('maxSuggestions').addEventListener('change', (e) => {
      this.saveSetting('maxSuggestions', parseInt(e.target.value));
    });

    // File format
    document.getElementById('fileFormatSelect').addEventListener('change', (e) => {
      this.saveSetting('fileFormat', e.target.value);
    });

    // Export data
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      this.exportAllData();
    });

    // Clear data
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      this.clearAllData();
    });

    // Variable syntax
    document.getElementById('variableSyntaxSelect').addEventListener('change', (e) => {
      const value = e.target.value;
      const customContainer = document.getElementById('customSyntaxContainer');
      
      if (value === 'custom') {
        customContainer.style.display = 'flex';
        this.updateSyntaxPreview();
      } else {
        customContainer.style.display = 'none';
        this.saveSetting('variableSyntax', value);
      }
    });

    // Custom delimiter inputs
    document.getElementById('customStartDelimiter').addEventListener('input', () => {
      this.updateSyntaxPreview();
      this.saveCustomSyntax();
    });

    document.getElementById('customEndDelimiter').addEventListener('input', () => {
      this.updateSyntaxPreview();
      this.saveCustomSyntax();
    });
  }

  setupModalEvents() {
    // Prompt modal
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closePromptModal();
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.closePromptModal();
    });

    document.getElementById('savePromptBtn').addEventListener('click', () => {
      this.savePrompt();
    });

    // Insert variable button
    document.getElementById('insertVariableBtn').addEventListener('click', () => {
      this.insertVariable();
    });

    // Tag modal
    document.getElementById('closeTagModal').addEventListener('click', () => {
      this.closeTagModal();
    });

    document.getElementById('cancelTagBtn').addEventListener('click', () => {
      this.closeTagModal();
    });

    document.getElementById('saveTagBtn').addEventListener('click', () => {
      this.saveTag();
    });

    // Color picker
    document.querySelectorAll('.color-option').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectColor(btn.dataset.color);
      });
    });
  }

  switchPage(page) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === `${page}Page`);
    });

    this.currentPage = page;
    this.renderCurrentPage();
  }

  renderCurrentPage() {
    switch (this.currentPage) {
      case 'library':
        this.renderLibrary();
        break;
      case 'tags':
        this.renderTags();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
  }

  renderLibrary() {
    const grid = document.getElementById('promptsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (this.filteredPrompts.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = '';
    grid.className = this.viewMode === 'grid' ? 'prompts-grid' : 'prompts-list-view';

    this.filteredPrompts.forEach(prompt => {
      const card = this.createPromptCard(prompt);
      grid.appendChild(card);
    });

    // Render filter tags
    this.renderFilterTags();
  }

  createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.promptId = prompt.id;
    card.draggable = true;

    // Selection checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'prompt-checkbox';
    checkbox.checked = this.selectedPrompts.has(prompt.id);
    checkbox.addEventListener('change', () => {
      this.toggleSelection(prompt.id);
    });

    // Content
    const content = document.createElement('div');
    content.className = 'prompt-card-content';

    const title = document.createElement('h3');
    title.className = 'prompt-card-title';
    title.textContent = prompt.title;

    const preview = document.createElement('p');
    preview.className = 'prompt-card-preview';
    preview.textContent = this.truncateText(prompt.content, 150);

    // Tags
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'prompt-card-tags';
    
    if (prompt.tags && prompt.tags.length > 0) {
      prompt.tags.forEach(tagId => {
        const tagData = this.tags.find(t => t.id === tagId);
        if (tagData) {
          const tag = document.createElement('span');
          tag.className = 'tag-chip';
          tag.style.backgroundColor = tagData.color;
          tag.textContent = tagData.name;
          tagsContainer.appendChild(tag);
        }
      });
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'prompt-card-actions';

    const copyBtn = this.createActionButton('copy', 'Copy to clipboard');
    copyBtn.addEventListener('click', () => {
      this.copyToClipboard(prompt.content);
      this.showToast('Copied to clipboard!');
    });

    const downloadBtn = this.createActionButton('download', 'Download as JSON');
    downloadBtn.addEventListener('click', () => {
      this.downloadPrompt(prompt);
    });

    const editBtn = this.createActionButton('edit', 'Edit prompt');
    editBtn.addEventListener('click', () => {
      this.openPromptModal(prompt);
    });

    const deleteBtn = this.createActionButton('delete', 'Delete prompt');
    deleteBtn.addEventListener('click', () => {
      this.deletePrompt(prompt.id);
    });

    actions.appendChild(copyBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    content.appendChild(title);
    content.appendChild(preview);
    content.appendChild(tagsContainer);

    card.appendChild(checkbox);
    card.appendChild(content);
    card.appendChild(actions);

    // Drag and drop
    card.addEventListener('dragstart', (e) => {
      this.draggedElement = card;
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedElement && this.draggedElement !== card) {
        const rect = card.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (e.clientY < midpoint) {
          card.parentNode.insertBefore(this.draggedElement, card);
        } else {
          card.parentNode.insertBefore(this.draggedElement, card.nextSibling);
        }
      }
    });

    return card;
  }

  createActionButton(type, title) {
    const btn = document.createElement('button');
    btn.className = 'card-action-btn';
    btn.title = title;

    const icons = {
      copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
      download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
      edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
      delete: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
    };

    btn.innerHTML = icons[type];
    return btn;
  }

  renderFilterTags() {
    const container = document.getElementById('filterTags');
    container.innerHTML = '';

    this.tags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'filter-tag';
      btn.style.borderColor = tag.color;
      btn.textContent = tag.name;
      btn.addEventListener('click', () => {
        this.filterByTag(tag.id);
      });
      container.appendChild(btn);
    });
  }

  renderTags() {
    const grid = document.getElementById('tagsGrid');
    grid.innerHTML = '';

    this.tags.forEach(tag => {
      const card = document.createElement('div');
      card.className = 'tag-card';
      card.style.borderColor = tag.color;

      const colorIndicator = document.createElement('div');
      colorIndicator.className = 'tag-color-indicator';
      colorIndicator.style.backgroundColor = tag.color;

      const name = document.createElement('h3');
      name.textContent = tag.name;

      const count = document.createElement('p');
      const promptCount = this.prompts.filter(p => p.tags && p.tags.includes(tag.id)).length;
      count.textContent = `${promptCount} prompt${promptCount !== 1 ? 's' : ''}`;

      const actions = document.createElement('div');
      actions.className = 'tag-card-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'card-action-btn';
      editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
      editBtn.addEventListener('click', () => {
        this.openTagModal(tag);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'card-action-btn';
      deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      deleteBtn.addEventListener('click', () => {
        this.deleteTag(tag.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      card.appendChild(colorIndicator);
      card.appendChild(name);
      card.appendChild(count);
      card.appendChild(actions);
      
      grid.appendChild(card);
    });
  }

  filterPrompts(search) {
    search = search.toLowerCase();
    this.filteredPrompts = this.prompts.filter(prompt => {
      return prompt.title.toLowerCase().includes(search) ||
             prompt.content.toLowerCase().includes(search);
    });
    this.renderLibrary();
  }

  filterByTag(tagId) {
    this.filteredPrompts = this.prompts.filter(prompt => {
      return prompt.tags && prompt.tags.includes(tagId);
    });
    this.renderLibrary();
  }

  renderSettings() {
    // Apply saved settings
    document.getElementById('darkModeToggle').checked = this.settings.darkMode !== false;
    document.getElementById('fuzzySearchToggle').checked = this.settings.fuzzySearchEnabled !== false;
    document.getElementById('autoSuggestToggle').checked = this.settings.autoSuggest !== false;
    document.getElementById('maxSuggestions').value = this.settings.maxSuggestions || 10;
    document.getElementById('fileFormatSelect').value = this.settings.fileFormat || 'md';
    
    // Load variable syntax settings
    const variableSyntax = this.settings.variableSyntax || '{{}}';
    document.getElementById('variableSyntaxSelect').value = variableSyntax;
    
    // Show/hide custom syntax container based on selection
    const customContainer = document.getElementById('customSyntaxContainer');
    if (variableSyntax === 'custom') {
      customContainer.style.display = 'flex';
      document.getElementById('customStartDelimiter').value = this.settings.customStartDelimiter || '{{';
      document.getElementById('customEndDelimiter').value = this.settings.customEndDelimiter || '}}';
      this.updateSyntaxPreview();
    } else {
      customContainer.style.display = 'none';
    }
  }

  selectAll() {
    if (this.selectedPrompts.size === this.filteredPrompts.length) {
      this.selectedPrompts.clear();
    } else {
      this.filteredPrompts.forEach(p => this.selectedPrompts.add(p.id));
    }
    this.updateSelectionUI();
  }

  toggleSelection(promptId) {
    if (this.selectedPrompts.has(promptId)) {
      this.selectedPrompts.delete(promptId);
    } else {
      this.selectedPrompts.add(promptId);
    }
    this.updateSelectionUI();
  }

  updateSelectionUI() {
    document.querySelectorAll('.prompt-checkbox').forEach(checkbox => {
      const promptId = checkbox.closest('.prompt-card').dataset.promptId;
      checkbox.checked = this.selectedPrompts.has(promptId);
    });

    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    bulkDeleteBtn.disabled = this.selectedPrompts.size === 0;
    
    const selectAllBtn = document.getElementById('selectAllBtn');
    selectAllBtn.textContent = this.selectedPrompts.size === this.filteredPrompts.length
      ? 'Deselect All' : 'Select All';
  }

  async bulkDelete() {
    if (this.selectedPrompts.size === 0) return;

    if (confirm(`Delete ${this.selectedPrompts.size} selected prompts?`)) {
      for (const promptId of this.selectedPrompts) {
        await this.sendMessage({ action: 'deletePrompt', id: promptId });
      }
      this.selectedPrompts.clear();
      await this.loadData();
      this.renderLibrary();
      this.showToast(`Deleted ${this.selectedPrompts.size} prompts`);
    }
  }

  async deletePrompt(promptId) {
    if (confirm('Delete this prompt?')) {
      await this.sendMessage({ action: 'deletePrompt', id: promptId });
      await this.loadData();
      this.renderLibrary();
      this.showToast('Prompt deleted');
    }
  }

  async deleteTag(tagId) {
    if (confirm('Delete this tag? Prompts will not be deleted.')) {
      this.tags = this.tags.filter(t => t.id !== tagId);
      await this.sendMessage({ action: 'saveTags', tags: this.tags });
      this.renderTags();
      this.showToast('Tag deleted');
    }
  }

  downloadPrompt(prompt) {
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      prompt: prompt
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async exportPrompts() {
    const data = await this.sendMessage({ action: 'exportPrompts' });
    const format = this.settings.fileFormat || 'md';
    
    let content, mimeType, extension;
    
    switch (format) {
      case 'txt':
        content = this.convertToTxt(data);
        mimeType = 'text/plain';
        extension = 'txt';
        break;
      case 'md':
        content = this.convertToMarkdown(data);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      case 'json':
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_export_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast(`Prompts exported as ${extension.toUpperCase()}!`);
  }

  importPrompts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,.md';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      const fileName = file.name.toLowerCase();
      let data;
      
      try {
        // Detect format and parse
        if (fileName.endsWith('.json')) {
          data = JSON.parse(text);
        } else if (fileName.endsWith('.txt')) {
          data = this.parseFromTxt(text);
        } else if (fileName.endsWith('.md')) {
          data = this.parseFromMarkdown(text);
        } else {
          this.showToast('Unsupported file format', 'error');
          return;
        }
        
        if (!data.prompts || !Array.isArray(data.prompts)) {
          this.showToast('Invalid file format', 'error');
          return;
        }
        
        // Get current prompts to check for conflicts
        const currentPrompts = await this.sendMessage({ action: 'getPrompts' });
        
        // Check for conflicts
        const conflicts = data.prompts.filter(imported => 
          currentPrompts.some(existing => existing.title === imported.title)
        );
        
        let shouldProceed = true;
        let overwrite = false;
        
        // If conflicts exist, ask user
        if (conflicts.length > 0) {
          const pluralPrompt = conflicts.length === 1 ? 'prompt' : 'prompts';
          const message = `Found ${conflicts.length} existing ${pluralPrompt} with the same title.\n\n` +
                        `Click OK to overwrite them, or Cancel to abort the import.`;
          overwrite = confirm(message);
          
          // If user cancelled, abort
          if (!overwrite) {
            shouldProceed = false;
            this.showToast('Import cancelled', 'info');
          }
        }
        
        // Only proceed if user didn't cancel
        if (shouldProceed) {
          const result = await this.sendMessage({
            action: 'importPrompts',
            data: data,
            overwrite: overwrite
          });
          
          if (result.success) {
            await this.loadData();
            this.renderLibrary();
            
            const messages = [];
            if (result.imported > 0) messages.push(`${result.imported} new`);
            if (overwrite && conflicts.length > 0) messages.push(`${conflicts.length} updated`);
            this.showToast(`Import successful! ${messages.join(', ')} prompt${messages.length > 1 ? 's' : ''}`);
          }
        }
      } catch (error) {
        this.showToast('Error importing file', 'error');
        console.error('Import error:', error);
      }
    });
    
    input.click();
  }

  async exportAllData() {
    const [prompts, tags, settings] = await Promise.all([
      this.sendMessage({ action: 'getPrompts' }),
      this.sendMessage({ action: 'getTags' }),
      this.sendMessage({ action: 'getSettings' })
    ]);
    
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      prompts,
      tags,
      settings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('All data exported successfully!');
  }

  async clearAllData() {
    if (!confirm('This will delete all prompts, tags, and settings. Are you sure?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;
    
    await chrome.storage.local.clear();
    await this.loadData();
    this.renderCurrentPage();
    this.showToast('All data cleared');
  }

  openPromptModal(prompt = null) {
    const modal = document.getElementById('promptModal');
    const modalTitle = document.getElementById('modalTitle');
    const titleInput = document.getElementById('promptTitle');
    const contentInput = document.getElementById('promptContent');

    this.editingPrompt = prompt;

    if (prompt) {
      modalTitle.textContent = 'Edit Prompt';
      titleInput.value = prompt.title;
      contentInput.value = prompt.content;
    } else {
      modalTitle.textContent = 'Add New Prompt';
      titleInput.value = '';
      contentInput.value = '';
    }

    // Update placeholder with current variable syntax
    this.updatePromptPlaceholder();

    this.renderTagSelector(prompt ? prompt.tags : []);
    modal.style.display = 'flex';
    titleInput.focus();
  }

  closePromptModal() {
    document.getElementById('promptModal').style.display = 'none';
    this.editingPrompt = null;
  }

  openTagModal(tag = null) {
    const modal = document.getElementById('tagModal');
    const modalTitle = document.getElementById('tagModalTitle');
    const nameInput = document.getElementById('tagName');

    this.editingTag = tag;

    if (tag) {
      modalTitle.textContent = 'Edit Tag';
      nameInput.value = tag.name;
      this.selectColor(tag.color);
    } else {
      modalTitle.textContent = 'Add New Tag';
      nameInput.value = '';
      this.selectColor('#45B7D1');
    }

    modal.style.display = 'flex';
    nameInput.focus();
  }

  closeTagModal() {
    document.getElementById('tagModal').style.display = 'none';
    this.editingTag = null;
  }

  selectColor(color) {
    this.selectedTagColor = color;
    document.querySelectorAll('.color-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.color === color);
    });
  }

  renderTagSelector(selectedTags = []) {
    const container = document.getElementById('tagSelector');
    container.innerHTML = '';

    this.tags.forEach(tag => {
      const label = document.createElement('label');
      label.className = 'tag-selector-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = tag.id;
      checkbox.checked = selectedTags.includes(tag.id);
      checkbox.className = 'tag-checkbox';
      
      const chip = document.createElement('span');
      chip.className = 'tag-selector-chip';
      chip.style.backgroundColor = checkbox.checked ? tag.color : 'transparent';
      chip.style.borderColor = tag.color;
      chip.style.color = checkbox.checked ? '#000' : tag.color;
      chip.textContent = tag.name;

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          chip.style.backgroundColor = tag.color;
          chip.style.color = '#000';
        } else {
          chip.style.backgroundColor = 'transparent';
          chip.style.color = tag.color;
        }
      });

      label.appendChild(checkbox);
      label.appendChild(chip);
      container.appendChild(label);
    });
  }

  async savePrompt() {
    const title = document.getElementById('promptTitle').value.trim();
    const content = document.getElementById('promptContent').value.trim();
    const selectedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked'))
      .map(cb => cb.value);

    if (!title || !content) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    const promptData = {
      title,
      content,
      tags: selectedTags
    };

    if (this.editingPrompt) {
      promptData.id = this.editingPrompt.id;
      await this.sendMessage({ action: 'updatePrompt', prompt: promptData });
      this.showToast('Prompt updated successfully!');
    } else {
      await this.sendMessage({ action: 'savePrompt', prompt: promptData });
      this.showToast('Prompt saved successfully!');
    }

    await this.loadData();
    this.renderLibrary();
    this.closePromptModal();
  }

  async saveTag() {
    const name = document.getElementById('tagName').value.trim();
    
    if (!name) {
      this.showToast('Please enter a tag name', 'error');
      return;
    }

    if (this.editingTag) {
      this.editingTag.name = name;
      this.editingTag.color = this.selectedTagColor;
    } else {
      const newTag = {
        id: name.toLowerCase().replace(/\s+/g, '_'),
        name,
        color: this.selectedTagColor
      };
      this.tags.push(newTag);
    }

    await this.sendMessage({ action: 'saveTags', tags: this.tags });
    this.renderTags();
    this.closeTagModal();
    this.showToast(this.editingTag ? 'Tag updated!' : 'Tag created!');
  }

  async saveSetting(key, value) {
    this.settings[key] = value;
    await this.sendMessage({ action: 'saveSettings', settings: { [key]: value } });
    
    if (key === 'darkMode') {
      this.applyTheme();
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    document.getElementById('gridViewBtn').classList.toggle('active', mode === 'grid');
    document.getElementById('listViewBtn').classList.toggle('active', mode === 'list');
    this.renderLibrary();
  }

  applyTheme() {
    const isDark = this.settings.darkMode !== false;
    document.body.classList.toggle('light-theme', !isDark);
  }

  toggleTheme() {
    const isDark = !document.body.classList.contains('light-theme');
    document.body.classList.toggle('light-theme', isDark);
    this.saveSetting('darkMode', !isDark);
  }

  closeAllModals() {
    this.closePromptModal();
    this.closeTagModal();
  }

  copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Format converters
  convertToTxt(data) {
    let output = '# PROMPT LIBRARY EXPORT\n';
    output += `# Exported: ${data.exportDate || new Date().toISOString()}\n`;
    output += `# Total Prompts: ${data.prompts.length}\n`;
    output += '\n' + '='.repeat(80) + '\n\n';
    
    data.prompts.forEach((prompt, index) => {
      output += `PROMPT ${index + 1}\n`;
      output += `Title: ${prompt.title}\n`;
      if (prompt.tags && prompt.tags.length > 0) {
        output += `Tags: ${prompt.tags.join(', ')}\n`;
      }
      output += `\nContent:\n${prompt.content}\n`;
      output += '\n' + '-'.repeat(80) + '\n\n';
    });
    
    return output;
  }

  convertToMarkdown(data) {
    let output = '# Prompt Library Export\n\n';
    output += `**Exported:** ${data.exportDate || new Date().toISOString()}  \n`;
    output += `**Total Prompts:** ${data.prompts.length}\n\n`;
    output += '---\n\n';
    
    data.prompts.forEach((prompt, index) => {
      output += `## ${index + 1}. ${prompt.title}\n\n`;
      
      if (prompt.tags && prompt.tags.length > 0) {
        output += '**Tags:** ';
        prompt.tags.forEach(tag => {
          output += `\`${tag}\` `;
        });
        output += '\n\n';
      }
      
      output += '**Prompt:**\n\n';
      output += '```\n';
      output += prompt.content;
      output += '\n```\n\n';
      output += '---\n\n';
    });
    
    return output;
  }

  parseFromTxt(text) {
    const prompts = [];
    const lines = text.split('\n');
    let currentPrompt = null;
    let inContent = false;
    let contentLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('PROMPT ') && /PROMPT \d+/.test(line)) {
        // Save previous prompt
        if (currentPrompt && contentLines.length > 0) {
          currentPrompt.content = contentLines.join('\n').trim();
          prompts.push(currentPrompt);
        }
        
        // Start new prompt
        currentPrompt = {
          id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: '',
          content: '',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          useCount: 0
        };
        contentLines = [];
        inContent = false;
      } else if (line.startsWith('Title: ') && currentPrompt) {
        currentPrompt.title = line.substring(7);
      } else if (line.startsWith('Tags: ') && currentPrompt) {
        const tagsStr = line.substring(6);
        currentPrompt.tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
      } else if (line === 'Content:' && currentPrompt) {
        inContent = true;
      } else if (inContent && !line.startsWith('-'.repeat(10))) {
        if (line || contentLines.length > 0) {
          contentLines.push(lines[i]);
        }
      }
    }
    
    // Save last prompt
    if (currentPrompt && contentLines.length > 0) {
      currentPrompt.content = contentLines.join('\n').trim();
      prompts.push(currentPrompt);
    }
    
    return {
      prompts,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
  }

  parseFromMarkdown(text) {
    const prompts = [];
    const sections = text.split(/^## \d+\. /m).filter(s => s.trim());
    
    sections.forEach(section => {
      const lines = section.split('\n');
      const titleLine = lines[0];
      
      if (!titleLine) return;
      
      const prompt = {
        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: titleLine.trim(),
        content: '',
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0
      };
      
      let inCodeBlock = false;
      let contentLines = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('**Tags:**')) {
          const tagsMatch = line.match(/`([^`]+)`/g);
          if (tagsMatch) {
            prompt.tags = tagsMatch.map(t => t.replace(/`/g, ''));
          }
        } else if (line.trim() === '```') {
          if (inCodeBlock) {
            // End of code block
            break;
          } else {
            // Start of code block
            inCodeBlock = true;
          }
        } else if (inCodeBlock) {
          contentLines.push(line);
        }
      }
      
      prompt.content = contentLines.join('\n').trim();
      
      if (prompt.title && prompt.content) {
        prompts.push(prompt);
      }
    });
    
    return {
      prompts,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
  }

  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  // ============================================================
  // VARIABLE SYNTAX HELPER METHODS
  // ============================================================

  /**
   * Get the current variable syntax delimiters
   */
  getVariableSyntax() {
    const syntax = this.settings.variableSyntax || '{{}}';
    
    if (syntax === 'custom') {
      const start = this.settings.customStartDelimiter || '{{';
      const end = this.settings.customEndDelimiter || '}}';
      return { start, end };
    }
    
    const syntaxMap = {
      '{{}}': { start: '{{', end: '}}' },
      '<>': { start: '<', end: '>' },
      '[]': { start: '[', end: ']' },
      '__': { start: '__', end: '__' }
    };
    
    return syntaxMap[syntax] || syntaxMap['{{}}'];
  }

  /**
   * Update syntax preview in settings
   */
  updateSyntaxPreview() {
    const start = document.getElementById('customStartDelimiter').value || '$$';
    const end = document.getElementById('customEndDelimiter').value || '$$';
    const preview = document.getElementById('syntaxPreview');
    
    preview.innerHTML = `Your variables will look like: <strong>${start}VARIABLE${end}</strong>`;
  }

  /**
   * Save custom syntax to settings
   */
  async saveCustomSyntax() {
    const start = document.getElementById('customStartDelimiter').value;
    const end = document.getElementById('customEndDelimiter').value;
    
    if (start && end) {
      await this.saveSetting('variableSyntax', 'custom');
      await this.saveSetting('customStartDelimiter', start);
      await this.saveSetting('customEndDelimiter', end);
    }
  }

  /**
   * Insert variable placeholder at cursor position
   */
  insertVariable() {
    const textarea = document.getElementById('promptContent');
    const syntax = this.getVariableSyntax();
    const placeholder = `${syntax.start}VARIABLE${syntax.end}`;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    // Insert at cursor position
    const before = text.substring(0, start);
    const after = text.substring(end);
    textarea.value = before + placeholder + after;
    
    // Set cursor position to select "VARIABLE" text
    const variableStart = start + syntax.start.length;
    const variableEnd = variableStart + 8; // "VARIABLE".length
    textarea.setSelectionRange(variableStart, variableEnd);
    textarea.focus();
  }

  /**
   * Update prompt modal placeholder text dynamically
   */
  updatePromptPlaceholder() {
    const textarea = document.getElementById('promptContent');
    const syntax = this.getVariableSyntax();
    const example = `${syntax.start}variables${syntax.end}`;
    
    textarea.placeholder = `Enter your prompt template. Use ${example} for creating customized and reusable context aware prompts. Variable syntax can be customized in 'Settings'.`;
  }
}

// Initialize options manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
