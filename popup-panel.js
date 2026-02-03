// Popup Panel JavaScript - Works on all pages including restricted ones

class PopupPanelManager {
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
    this.checkCurrentPage();
  }

  async checkCurrentPage() {
    // Check if we're on a page where side panel can work
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab && currentTab.url) {
      const restrictedPage = currentTab.url.startsWith('chrome://') ||
                           currentTab.url.startsWith('edge://') ||
                           currentTab.url.startsWith('about:') ||
                           currentTab.url.startsWith('chrome-extension://') ||
                           currentTab.url.includes('chrome/newtab') ||
                           currentTab.url.endsWith('.pdf');
      
      // Hide side panel button on restricted pages
      const sidePanelBtn = document.getElementById('openSidePanelBtn');
      if (restrictedPage) {
        sidePanelBtn.style.display = 'none';
      }
    }
  }

  async loadData() {
    // Load prompts
    const prompts = await chrome.storage.local.get('prompts');
    this.prompts = prompts.prompts || [];
    this.filteredPrompts = [...this.prompts];
    
    // Load tags
    const tags = await chrome.storage.local.get('tags');
    this.tags = tags.tags || [];
    
    // Load settings
    const settings = await chrome.storage.local.get('settings');
    this.settings = settings.settings || { fileFormat: 'json' };
  }

  setupEventListeners() {
    // Open as side panel button
    document.getElementById('openSidePanelBtn').addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (currentTab && currentTab.id) {
        // Try to inject and open side panel
        chrome.runtime.sendMessage({ 
          action: 'openSidePanel', 
          tabId: currentTab.id 
        });
        
        // Close popup after a delay
        setTimeout(() => {
          window.close();
        }, 100);
      }
    });

    // Popout button - open in new window
    document.getElementById('popoutBtn').addEventListener('click', () => {
      chrome.windows.create({
        url: chrome.runtime.getURL('popup-panel.html'),
        type: 'popup',
        width: 400,
        height: 600
      });
      window.close();
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

    document.getElementById('preferSidePanelToggle').addEventListener('change', (e) => {
      this.saveSetting('preferSidePanel', e.target.checked);
    });

    document.getElementById('fuzzySearchToggle').addEventListener('change', (e) => {
      this.saveSetting('fuzzySearchEnabled', e.target.checked);
    });

    document.getElementById('autoSuggestToggle').addEventListener('change', (e) => {
      this.saveSetting('autoSuggest', e.target.checked);
    });

    // Tag management
    document.getElementById('addTagBtn').addEventListener('click', () => {
      const name = prompt('Enter tag name:');
      if (name) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#52C41A'];
        const newTag = {
          id: name.toLowerCase().replace(/\s+/g, '_'),
          name,
          color: colors[Math.floor(Math.random() * colors.length)]
        };
        this.tags.push(newTag);
        chrome.storage.local.set({ tags: this.tags });
        this.renderTags();
        this.showToast('Tag created!');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.getElementById('promptModal').style.display !== 'none') {
          this.closePromptModal();
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

    // Click to copy (since we can't directly insert from popup)
    card.addEventListener('click', () => {
      this.copyToClipboard(prompt.content);
      this.showToast('Copied! Paste in your chat window.');
      
      // Track usage
      chrome.runtime.sendMessage({ action: 'incrementUseCount', id: prompt.id });
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
      tags: selectedTags,
      createdAt: this.editingPrompt ? this.editingPrompt.createdAt : Date.now(),
      updatedAt: Date.now(),
      useCount: this.editingPrompt ? this.editingPrompt.useCount : 0
    };

    if (this.editingPrompt) {
      // Update existing prompt
      promptData.id = this.editingPrompt.id;
      const index = this.prompts.findIndex(p => p.id === this.editingPrompt.id);
      if (index !== -1) {
        this.prompts[index] = promptData;
      }
    } else {
      // Create new prompt
      promptData.id = `prompt_${Date.now()}`;
      this.prompts.push(promptData);
    }

    await chrome.storage.local.set({ prompts: this.prompts });
    await this.loadData();
    this.filterPrompts(document.getElementById('searchInput').value);
    this.closePromptModal();
    this.showToast(this.editingPrompt ? 'Prompt updated!' : 'Prompt saved!');
  }

  async exportPrompts() {
    const data = {
      prompts: this.prompts,
      tags: this.tags,
      exportDate: new Date().toISOString()
    };
    
    const format = this.settings.fileFormat || 'json';
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
        
        if (data.prompts && Array.isArray(data.prompts)) {
          // Check for conflicts
          const conflicts = data.prompts.filter(imported => 
            this.prompts.some(existing => existing.title === imported.title)
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
            let importedCount = 0;
            let updatedCount = 0;
            
            data.prompts.forEach(importedPrompt => {
              const existingIndex = this.prompts.findIndex(p => p.title === importedPrompt.title);
              
              if (existingIndex !== -1) {
                if (overwrite) {
                  this.prompts[existingIndex] = {
                    ...importedPrompt,
                    id: this.prompts[existingIndex].id,
                    updatedAt: Date.now()
                  };
                  updatedCount++;
                }
              } else {
                this.prompts.push({
                  ...importedPrompt,
                  id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                });
                importedCount++;
              }
            });
            
            if (data.tags && Array.isArray(data.tags)) {
              data.tags.forEach(importedTag => {
                if (!this.tags.find(t => t.id === importedTag.id)) {
                  this.tags.push(importedTag);
                }
              });
            }
            
            await chrome.storage.local.set({ 
              prompts: this.prompts,
              tags: this.tags
            });
            
            await this.loadData();
            this.renderPrompts();
            this.renderTags();
            
            const messages = [];
            if (importedCount > 0) messages.push(`${importedCount} new`);
            if (updatedCount > 0) messages.push(`${updatedCount} updated`);
            this.showToast(`Import successful! ${messages.join(', ')} prompt${messages.length > 1 ? 's' : ''}`);
          }
        } else {
          this.showToast('Invalid JSON format', 'error');
        }
      } catch (error) {
        this.showToast('Error importing file', 'error');
        console.error('Import error:', error);
      }
    });
    
    input.click();
  }

  async saveSetting(key, value) {
    if (!this.settings) this.settings = {};
    this.settings[key] = value;
    await chrome.storage.local.set({ settings: this.settings });
    
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
    document.getElementById('preferSidePanelToggle').checked = this.settings.preferSidePanel !== false;
    document.getElementById('fuzzySearchToggle').checked = this.settings.fuzzySearchEnabled !== false;
    document.getElementById('autoSuggestToggle').checked = this.settings.autoSuggest !== false;
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

  // Format converters (same as refined version)
  convertToTxt(data) {
    let output = '# PROMPT LIBRARY EXPORT\n';
    output += `# Exported: ${data.exportDate}\n`;
    output += `# Total Prompts: ${data.prompts.length}\n`;
    output += '\n' + '='.repeat(80) + '\n\n';
    
    data.prompts.forEach((prompt, index) => {
      output += `PROMPT ${index + 1}\n`;
      output += `Title: ${prompt.title}\n`;
      if (prompt.tags && prompt.tags.length > 0) {
        const tagNames = prompt.tags.map(tagId => {
          const tag = this.tags.find(t => t.id === tagId);
          return tag ? tag.name : tagId;
        });
        output += `Tags: ${tagNames.join(', ')}\n`;
      }
      output += `\nContent:\n${prompt.content}\n`;
      output += '\n' + '-'.repeat(80) + '\n\n';
    });
    
    return output;
  }

  convertToMarkdown(data) {
    let output = '# Prompt Library Export\n\n';
    output += `**Exported:** ${data.exportDate}  \n`;
    output += `**Total Prompts:** ${data.prompts.length}\n\n`;
    output += '---\n\n';
    
    data.prompts.forEach((prompt, index) => {
      output += `## ${index + 1}. ${prompt.title}\n\n`;
      
      if (prompt.tags && prompt.tags.length > 0) {
        output += '**Tags:** ';
        prompt.tags.forEach(tagId => {
          const tag = this.tags.find(t => t.id === tagId);
          const tagName = tag ? tag.name : tagId;
          output += `\`${tagName}\` `;
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
        if (currentPrompt && contentLines.length > 0) {
          currentPrompt.content = contentLines.join('\n').trim();
          prompts.push(currentPrompt);
        }
        
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
        const tagNames = tagsStr.split(',').map(t => t.trim()).filter(t => t);
        // Convert tag names to IDs
        currentPrompt.tags = tagNames.map(name => {
          const tag = this.tags.find(t => t.name === name);
          return tag ? tag.id : name.toLowerCase().replace(/\s+/g, '_');
        });
      } else if (line === 'Content:' && currentPrompt) {
        inContent = true;
      } else if (inContent && !line.startsWith('-'.repeat(10))) {
        if (line || contentLines.length > 0) {
          contentLines.push(lines[i]);
        }
      }
    }
    
    if (currentPrompt && contentLines.length > 0) {
      currentPrompt.content = contentLines.join('\n').trim();
      prompts.push(currentPrompt);
    }
    
    return {
      prompts,
      tags: this.tags,
      exportDate: new Date().toISOString()
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
            const tagNames = tagsMatch.map(t => t.replace(/`/g, ''));
            // Convert tag names to IDs
            prompt.tags = tagNames.map(name => {
              const tag = this.tags.find(t => t.name === name);
              return tag ? tag.id : name.toLowerCase().replace(/\s+/g, '_');
            });
          }
        } else if (line.trim() === '```') {
          if (inCodeBlock) {
            break;
          } else {
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
      tags: this.tags,
      exportDate: new Date().toISOString()
    };
  }
}

// Initialize popup panel manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupPanelManager();
});
