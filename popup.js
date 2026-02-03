// Popup JavaScript - Main popup interface logic

class PopupManager {
  constructor() {
    this.prompts = [];
    this.tags = [];
    this.filteredPrompts = [];
    this.selectedTags = new Set();
    this.editingPrompt = null;
    this.importedData = null;
    this.debounceTimer = null;
    
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderPrompts();
    this.renderTags();
    this.checkPendingPrompt();
    this.applyTheme();
  }

  async loadData() {
    // Load prompts
    const prompts = await this.sendMessage({ action: 'getPrompts' });
    this.prompts = prompts || [];
    this.filteredPrompts = [...this.prompts];
    
    // Load tags
    const tags = await this.sendMessage({ action: 'getTags' });
    this.tags = tags || [];
    
    // Load settings
    const settings = await this.sendMessage({ action: 'getSettings' });
    this.settings = settings || {};
  }

  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.filterPrompts(e.target.value);
      }, 200);
    });

    // Add prompt button
    document.getElementById('addPromptBtn').addEventListener('click', () => {
      this.openPromptModal();
    });

    // Manage button - opens options page
    document.getElementById('manageBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Settings button - opens options page
    document.getElementById('settingsBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Import/Export
    document.getElementById('importBtn').addEventListener('click', () => {
      this.openImportModal();
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportPrompts();
    });

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closePromptModal();
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.closePromptModal();
    });

    document.getElementById('savePromptBtn').addEventListener('click', () => {
      this.savePrompt();
    });

    // Import modal controls
    document.getElementById('closeImportModal').addEventListener('click', () => {
      this.closeImportModal();
    });

    document.getElementById('cancelImportBtn').addEventListener('click', () => {
      this.closeImportModal();
    });

    document.getElementById('confirmImportBtn').addEventListener('click', () => {
      this.confirmImport();
    });

    // Import zone
    const importZone = document.getElementById('importZone');
    const fileInput = document.getElementById('fileInput');

    importZone.addEventListener('click', () => {
      fileInput.click();
    });

    importZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      importZone.classList.add('dragover');
    });

    importZone.addEventListener('dragleave', () => {
      importZone.classList.remove('dragover');
    });

    importZone.addEventListener('drop', (e) => {
      e.preventDefault();
      importZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/json') {
        this.handleFileImport(file);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFileImport(file);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.openPromptModal();
      }
      if (e.key === 'Escape') {
        this.closePromptModal();
        this.closeImportModal();
      }
    });
  }

  renderPrompts() {
    const promptsList = document.getElementById('promptsList');
    const emptyState = document.getElementById('emptyState');
    const promptCount = document.getElementById('promptCount');

    promptsList.innerHTML = '';
    
    if (this.filteredPrompts.length === 0) {
      promptsList.style.display = 'none';
      emptyState.style.display = 'flex';
      promptCount.textContent = '0 prompts';
      return;
    }

    promptsList.style.display = 'block';
    emptyState.style.display = 'none';
    promptCount.textContent = `${this.prompts.length} prompt${this.prompts.length !== 1 ? 's' : ''}`;

    this.filteredPrompts.forEach(prompt => {
      const promptCard = this.createPromptCard(prompt);
      promptsList.appendChild(promptCard);
    });
  }

  createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.promptId = prompt.id;

    // Title
    const title = document.createElement('div');
    title.className = 'prompt-card-title';
    title.textContent = prompt.title;
    card.appendChild(title);

    // Content preview
    const preview = document.createElement('div');
    preview.className = 'prompt-card-preview';
    preview.textContent = this.truncateText(prompt.content, 100);
    card.appendChild(preview);

    // Tags
    if (prompt.tags && prompt.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'prompt-card-tags';
      
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
      
      card.appendChild(tagsContainer);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'prompt-card-actions';

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'card-action-btn';
    copyBtn.title = 'Copy to clipboard';
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyToClipboard(prompt.content);
      this.showToast('Copied to clipboard!');
    });

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'card-action-btn';
    editBtn.title = 'Edit prompt';
    editBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openPromptModal(prompt);
    });

    actions.appendChild(copyBtn);
    actions.appendChild(editBtn);
    card.appendChild(actions);

    // Click to insert
    card.addEventListener('click', () => {
      // Send message to content script to insert prompt
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'insertPrompt',
            prompt: prompt.content
          });
          
          // Track usage
          this.sendMessage({ action: 'incrementUseCount', id: prompt.id });
          
          // Close popup
          window.close();
        }
      });
    });

    return card;
  }

  renderTags() {
    const tagFilter = document.getElementById('tagFilter');
    tagFilter.innerHTML = '';

    this.tags.forEach(tag => {
      const tagBtn = document.createElement('button');
      tagBtn.className = `tag-filter-btn ${this.selectedTags.has(tag.id) ? 'active' : ''}`;
      tagBtn.style.backgroundColor = this.selectedTags.has(tag.id) ? tag.color : 'transparent';
      tagBtn.style.borderColor = tag.color;
      tagBtn.style.color = this.selectedTags.has(tag.id) ? '#000' : tag.color;
      tagBtn.textContent = tag.name;
      
      tagBtn.addEventListener('click', () => {
        if (this.selectedTags.has(tag.id)) {
          this.selectedTags.delete(tag.id);
        } else {
          this.selectedTags.add(tag.id);
        }
        this.filterPrompts(document.getElementById('searchInput').value);
        this.renderTags();
      });

      tagFilter.appendChild(tagBtn);
    });
  }

  filterPrompts(searchText) {
    let filtered = [...this.prompts];

    // Filter by tags
    if (this.selectedTags.size > 0) {
      filtered = filtered.filter(prompt => {
        return prompt.tags && prompt.tags.some(tag => this.selectedTags.has(tag));
      });
    }

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(prompt => {
        return prompt.title.toLowerCase().includes(search) ||
               prompt.content.toLowerCase().includes(search);
      });
    }

    this.filteredPrompts = filtered;
    this.renderPrompts();
  }

  openPromptModal(prompt = null) {
    const modal = document.getElementById('promptModal');
    const modalTitle = document.getElementById('modalTitle');
    const titleInput = document.getElementById('promptTitle');
    const contentInput = document.getElementById('promptContent');
    const saveBtn = document.getElementById('savePromptBtn');

    this.editingPrompt = prompt;

    if (prompt) {
      modalTitle.textContent = 'Edit Prompt';
      titleInput.value = prompt.title;
      contentInput.value = prompt.content;
      saveBtn.textContent = 'Update Prompt';
    } else {
      modalTitle.textContent = 'Add New Prompt';
      titleInput.value = '';
      contentInput.value = '';
      saveBtn.textContent = 'Save Prompt';
    }

    this.renderTagSelector(prompt ? prompt.tags : []);
    modal.style.display = 'flex';
    titleInput.focus();
  }

  closePromptModal() {
    document.getElementById('promptModal').style.display = 'none';
    this.editingPrompt = null;
  }

  renderTagSelector(selectedTags = []) {
    const tagSelector = document.getElementById('tagSelector');
    tagSelector.innerHTML = '';

    this.tags.forEach(tag => {
      const label = document.createElement('label');
      label.className = 'tag-selector-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = tag.id;
      checkbox.checked = selectedTags.includes(tag.id);
      checkbox.className = 'tag-checkbox';
      
      const tagChip = document.createElement('span');
      tagChip.className = 'tag-selector-chip';
      tagChip.style.backgroundColor = checkbox.checked ? tag.color : 'transparent';
      tagChip.style.borderColor = tag.color;
      tagChip.style.color = checkbox.checked ? '#000' : tag.color;
      tagChip.textContent = tag.name;

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          tagChip.style.backgroundColor = tag.color;
          tagChip.style.color = '#000';
        } else {
          tagChip.style.backgroundColor = 'transparent';
          tagChip.style.color = tag.color;
        }
      });

      label.appendChild(checkbox);
      label.appendChild(tagChip);
      tagSelector.appendChild(label);
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
      // Update existing prompt
      promptData.id = this.editingPrompt.id;
      await this.sendMessage({ action: 'updatePrompt', prompt: promptData });
      this.showToast('Prompt updated successfully!');
    } else {
      // Create new prompt
      await this.sendMessage({ action: 'savePrompt', prompt: promptData });
      this.showToast('Prompt saved successfully!');
    }

    await this.loadData();
    this.filterPrompts(document.getElementById('searchInput').value);
    this.closePromptModal();
  }

  async exportPrompts() {
    const data = await this.sendMessage({ action: 'exportPrompts' });
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('Prompts exported successfully!');
  }

  openImportModal() {
    document.getElementById('importModal').style.display = 'flex';
    document.getElementById('fileInput').value = '';
    document.getElementById('overwriteCheck').checked = false;
    document.getElementById('confirmImportBtn').disabled = true;
    this.importedData = null;
  }

  closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
    this.importedData = null;
  }

  handleFileImport(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.prompts || !Array.isArray(data.prompts)) {
          throw new Error('Invalid file format');
        }
        
        this.importedData = data;
        document.getElementById('confirmImportBtn').disabled = false;
        
        // Show preview
        const zone = document.getElementById('importZone');
        zone.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p class="success-text">${data.prompts.length} prompts ready to import</p>
        `;
      } catch (error) {
        this.showToast('Invalid JSON file', 'error');
        document.getElementById('confirmImportBtn').disabled = true;
      }
    };
    reader.readAsText(file);
  }

  async confirmImport() {
    if (!this.importedData) return;
    
    const overwrite = document.getElementById('overwriteCheck').checked;
    const result = await this.sendMessage({
      action: 'importPrompts',
      data: this.importedData,
      overwrite
    });

    if (result.success) {
      this.showToast(`Successfully imported ${result.imported} prompts!`);
      await this.loadData();
      this.filterPrompts('');
      this.closeImportModal();
    } else {
      this.showToast('Import failed: ' + result.error, 'error');
    }
  }

  async checkPendingPrompt() {
    // Check if there's a pending prompt from context menu
    chrome.storage.local.get('pendingPrompt', (result) => {
      if (result.pendingPrompt) {
        const { content, timestamp } = result.pendingPrompt;
        
        // Only use if it's recent (within last 5 seconds)
        if (Date.now() - timestamp < 5000) {
          this.openPromptModal();
          document.getElementById('promptContent').value = content;
        }
        
        // Clear pending prompt
        chrome.storage.local.remove('pendingPrompt');
      }
    });
  }

  applyTheme() {
    const isDark = this.settings.darkMode !== false; // Default to dark
    document.body.classList.toggle('light-theme', !isDark);
  }

  toggleTheme() {
    const isDark = !document.body.classList.contains('light-theme');
    document.body.classList.toggle('light-theme', isDark);
    
    this.sendMessage({
      action: 'saveSettings',
      settings: { darkMode: !isDark }
    });
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

  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize popup manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
