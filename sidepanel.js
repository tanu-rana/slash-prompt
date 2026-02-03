// Side Panel JavaScript - Manages the fixed right panel interface

class SidePanelManager {
  constructor() {
    this.prompts = [];
    this.tags = [];
    this.filteredPrompts = [];
    this.selectedTags = new Set();
    this.currentTab = 'prompts';
    this.editingPrompt = null;
    this.debounceTimer = null;
    
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderPrompts();
    this.renderTags();
    this.applySettings();
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
    // Close and minimize buttons
    document.getElementById('closeBtn').addEventListener('click', () => {
      this.closePanel();
    });

    document.getElementById('minimizeBtn').addEventListener('click', () => {
      this.minimizePanel();
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

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

    // Import/Export
    document.getElementById('importBtn').addEventListener('click', () => {
      this.importPrompts();
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

    // Settings toggles
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
      this.saveSetting('darkMode', e.target.checked);
    });

    document.getElementById('fuzzySearchToggle').addEventListener('change', (e) => {
      this.saveSetting('fuzzySearchEnabled', e.target.checked);
    });

    document.getElementById('autoSuggestToggle').addEventListener('change', (e) => {
      this.saveSetting('autoSuggest', e.target.checked);
    });

    // Tag management
    document.getElementById('addTagBtn').addEventListener('click', () => {
      // Open tag creation modal (simplified for now)
      const name = prompt('Enter tag name:');
      if (name) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#52C41A'];
        const newTag = {
          id: name.toLowerCase().replace(/\s+/g, '_'),
          name,
          color: colors[Math.floor(Math.random() * colors.length)]
        };
        this.tags.push(newTag);
        this.sendMessage({ action: 'saveTags', tags: this.tags });
        this.renderTags();
        this.showToast('Tag created!');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.getElementById('promptModal').style.display !== 'none') {
          this.closePromptModal();
        } else {
          this.minimizePanel();
        }
      }
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tab}Tab`);
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
      this.insertPrompt(prompt);
    });

    return card;
  }

  renderTags() {
    const tagFilter = document.getElementById('tagFilter');
    const tagsGrid = document.getElementById('tagsGrid');
    
    // Render tag filter buttons
    tagFilter.innerHTML = '';
    this.tags.forEach(tag => {
      const tagBtn = document.createElement('button');
      tagBtn.className = `tag-filter-btn ${this.selectedTags.has(tag.id) ? 'active' : ''}`;
      tagBtn.style.backgroundColor = this.selectedTags.has(tag.id) ? tag.color : 'transparent';
      tagBtn.style.borderColor = tag.color;
      tagBtn.style.color = this.selectedTags.has(tag.id) ? 'white' : tag.color;
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

    // Render tags grid
    tagsGrid.innerHTML = '';
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
      count.textContent = `${promptCount} prompts`;

      card.appendChild(colorIndicator);
      card.appendChild(name);
      card.appendChild(count);

      card.addEventListener('click', () => {
        // Filter by this tag
        this.selectedTags.clear();
        this.selectedTags.add(tag.id);
        this.switchTab('prompts');
        this.filterPrompts('');
        this.renderTags();
      });

      tagsGrid.appendChild(card);
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

  insertPrompt(prompt) {
    // Find active input on the page
    const activeElement = document.activeElement;
    
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'INPUT' || 
        activeElement.contentEditable === 'true')) {
      
      // Insert prompt content
      if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value;
        activeElement.value = text.substring(0, start) + prompt.content + text.substring(end);
        activeElement.selectionStart = activeElement.selectionEnd = start + prompt.content.length;
      } else {
        // ContentEditable
        document.execCommand('insertText', false, prompt.content);
      }
      
      // Track usage
      this.sendMessage({ action: 'incrementUseCount', id: prompt.id });
      
      // Show feedback
      this.showToast('Prompt inserted!');
      
      // Minimize panel after insertion
      setTimeout(() => {
        this.minimizePanel();
      }, 500);
    } else {
      // Copy to clipboard if no input is focused
      this.copyToClipboard(prompt.content);
      this.showToast('Copied to clipboard! Click in a text field to paste.');
    }
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
      tagChip.style.color = checkbox.checked ? 'white' : tag.color;
      tagChip.textContent = tag.name;

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          tagChip.style.backgroundColor = tag.color;
          tagChip.style.color = 'white';
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

  importPrompts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        
        if (!data.prompts || !Array.isArray(data.prompts)) {
          this.showToast('Invalid JSON format', 'error');
          return;
        }
        
        // Get current prompts to check for conflicts
        const currentPromptsResult = await this.sendMessage({ action: 'getPrompts' });
        const currentPrompts = currentPromptsResult || [];
        
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
            this.renderPrompts();
            
            const messages = [];
            if (result.imported > 0) messages.push(`${result.imported} new`);
            if (overwrite && conflicts.length > 0) messages.push(`${conflicts.length} updated`);
            this.showToast(`Import successful! ${messages.join(', ')} prompt${messages.length > 1 ? 's' : ''}`);
          }
        }
      } catch (error) {
        this.showToast('Invalid JSON file', 'error');
        console.error('Import error:', error);
      }
    });
    
    input.click();
  }

  async saveSetting(key, value) {
    await this.sendMessage({ action: 'saveSettings', settings: { [key]: value } });
    
    if (key === 'darkMode') {
      this.applySettings();
    }
  }

  applySettings() {
    // Apply dark mode
    const isDark = this.settings.darkMode !== false;
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('darkModeToggle').checked = isDark;
    
    // Apply other settings
    document.getElementById('fuzzySearchToggle').checked = this.settings.fuzzySearchEnabled !== false;
    document.getElementById('autoSuggestToggle').checked = this.settings.autoSuggest !== false;
  }

  closePanel() {
    // Send message to parent to remove the panel
    window.parent.postMessage({ action: 'closePromptPanel' }, '*');
  }

  minimizePanel() {
    // Send message to parent to minimize the panel
    window.parent.postMessage({ action: 'minimizePromptPanel' }, '*');
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

// Initialize side panel manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SidePanelManager();
});
