// Refined Popup Panel JavaScript - Premium Dark Theme Implementation

class RefinedPanelManager {
  constructor() {
    this.prompts = [];
    this.filteredPrompts = [];
    this.activeFilter = null;
    this.currentTab = 'prompts';
    this.editingPrompt = null;
    this.selectedTags = [];
    this.debounceTimer = null;
    this.originalPromptState = null; // For smart edit modal change detection
    
    // Favorites data
    this.favoritePromptIds = [];
    this.favoritePromptOrder = [];
    this.promptUsageStats = {};
    this.currentFavoriteSort = 'mostUsed'; // Default sort
    
    // Folder Manager (NEW - Phase 1)
    this.folderManager = new FolderManager();
    
    // Folders tab state (UPGRADED - Breadcrumb navigation system)
    this.folderPath = [{ id: null, name: 'All Folders' }]; // Navigation stack
    
    // Drag and drop state (Phase 3)
    this.draggedFolder = null;
    
    // Elite Features State
    this.recentFolders = []; // Track recent folder visits
    this.commandPaletteOpen = false;
    this.suggestedFolders = []; // For smart move menu
    this.folderSaveHistory = {}; // Track where prompts are saved
    this.expandedFolderSection = null; // Track which section is expanded ('starred', 'recent', 'all')
    
    // GitHub configuration (placeholder - replace with actual values)
    this.githubConfig = {
      owner: 'YOUR_GITHUB_USERNAME',
      repo: 'prompt-manager-feedback',
      token: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN' // Store securely in production
    };
    
    // Sharing service URL (placeholder - implement with your backend)
    this.sharingServiceUrl = 'https://your-sharing-service.com/api/share';
    
    // Tag color palette for dynamic assignment
    // All colors chosen for excellent visibility on white background
    this.tagColors = [
      { bg: 'rgba(255, 107, 107, 0.2)', color: '#FF6B6B', border: 'rgba(255, 107, 107, 0.3)' },   // Red
      { bg: 'rgba(78, 205, 196, 0.2)', color: '#4ECDC4', border: 'rgba(78, 205, 196, 0.3)' },    // Teal
      { bg: 'rgba(69, 183, 209, 0.2)', color: '#45B7D1', border: 'rgba(69, 183, 209, 0.3)' },    // Blue
      { bg: 'rgba(212, 160, 23, 0.2)', color: '#D4A017', border: 'rgba(212, 160, 23, 0.3)' },    // Gold (darker, more visible than light yellow)
      { bg: 'rgba(184, 134, 255, 0.2)', color: '#B886FF', border: 'rgba(184, 134, 255, 0.3)' },  // Purple
      { bg: 'rgba(255, 159, 67, 0.2)', color: '#FF9F43', border: 'rgba(255, 159, 67, 0.3)' },    // Orange
      { bg: 'rgba(108, 213, 130, 0.2)', color: '#6CD582', border: 'rgba(108, 213, 130, 0.3)' },  // Green
      { bg: 'rgba(255, 118, 164, 0.2)', color: '#FF76A4', border: 'rgba(255, 118, 164, 0.3)' }   // Pink
    ];
    
    // Flag: modal opened from "Save as Prompt" (cancel = close entire panel)
    this.openedFromSaveAsPrompt = false;
    
    // Bulk Selection State
    this.selectedPromptIds = new Set(); // Set of selected prompt IDs
    this.selectedFolderIds = new Set(); // Set of selected folder IDs
    this.selectionCounterBanner = null; // Reference to selection counter banner element
    
    this.init();
  }

  /**
   * Debounce utility for performance optimization
   * Delays function execution until after wait time has elapsed
   * @param {Function} func - Function to debounce
   * @param {number} wait - Milliseconds to wait (e.g., 250ms)
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Check if prompt has changes compared to original state
   * Used for smart edit modal button management
   * @returns {boolean} True if changes detected
   */
  hasPromptChanges() {
    if (!this.originalPromptState) return true; // Create mode - always enabled
    
    const titleInput = document.getElementById('promptTitle');
    const contentInput = document.getElementById('promptContent');
    const currentFolderId = this.currentPromptFolderId || null;
    const currentTags = this.selectedTags || [];
    
    // Compare each field
    if (titleInput && titleInput.value !== this.originalPromptState.title) return true;
    if (contentInput && contentInput.value !== this.originalPromptState.content) return true;
    if (currentFolderId !== this.originalPromptState.folderId) return true;
    
    // Compare tags (order-independent)
    if (currentTags.length !== this.originalPromptState.tags.length) return true;
    const originalTagsSet = new Set(this.originalPromptState.tags);
    for (const tag of currentTags) {
      if (!originalTagsSet.has(tag)) return true;
    }
    
    return false;
  }

  /**
   * Update save button state based on changes
   * Enables button only when changes detected
   */
  updatePromptSaveButtonState() {
    const saveBtn = document.getElementById('savePromptBtn');
    if (!saveBtn) return;
    
    if (this.hasPromptChanges()) {
      saveBtn.disabled = false;
      saveBtn.classList.remove('is-disabled');
    } else {
      saveBtn.disabled = true;
      saveBtn.classList.add('is-disabled');
    }
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.switchTab(this.currentTab); // Initialize tab and icon states
    this.updateUIState();
    this.renderPrompts();
    this.checkCurrentPage();
    
    // Check if there's a pending edit from dropdown
    this.checkPendingEdit();
    // Check if there's a pending prompt from "Save as Prompt" context menu
    this.checkPendingPrompt();
  }

  // Hash function to consistently assign colors to tag names
  getTagColor(tagName) {
    const normalizedTag = tagName.toLowerCase().trim();
    let hash = 0;
    
    // Generate hash from tag name
    for (let i = 0; i < normalizedTag.length; i++) {
      hash = ((hash << 5) - hash) + normalizedTag.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Get color from palette based on hash
    const colorIndex = Math.abs(hash) % this.tagColors.length;
    return this.tagColors[colorIndex];
  }

  async checkPendingEdit() {
    // Check if there's a pending edit request from content script
    const result = await chrome.storage.local.get('pendingEditPromptId');
    
    if (result.pendingEditPromptId) {
      console.log('Found pending edit for prompt ID:', result.pendingEditPromptId);
      
      // Find the prompt
      const prompt = this.prompts.find(p => p.id === result.pendingEditPromptId);
      
      if (prompt) {
        // Clear the pending edit flag
        await chrome.storage.local.remove('pendingEditPromptId');
        
        // Open the edit modal
        setTimeout(() => {
          this.openPromptModal(prompt);
        }, 300); // Small delay to ensure UI is ready
      } else {
        console.error('Prompt not found for ID:', result.pendingEditPromptId);
        await chrome.storage.local.remove('pendingEditPromptId');
      }
    }
  }

  /**
   * Check if there's a pending prompt from "Save as Prompt" context menu.
   * When user selects text on any webpage and right-clicks "Save as Prompt",
   * the selected text is stored. This opens the Create New Prompt modal with
   * the Prompt Template pre-filled, keeping the user on the current page.
   */
  async checkPendingPrompt() {
    const result = await chrome.storage.local.get('pendingPrompt');
    
    if (result.pendingPrompt && result.pendingPrompt.content) {
      const { content, timestamp } = result.pendingPrompt;
      
      // Use if recent (within 60 seconds) - allows for panel load delay
      if (Date.now() - timestamp < 60000) {
        // Clear immediately to prevent re-use
        await chrome.storage.local.remove('pendingPrompt');
        
        // Open Create New Prompt modal and pre-fill Prompt Template
        setTimeout(() => {
          this.openedFromSaveAsPrompt = true;
          this.openPromptModal(); // Opens modal in create mode
          const contentInput = document.getElementById('promptContent');
          if (contentInput) {
            contentInput.value = content;
            this.updatePromptSaveButtonState(); // Enable save since we have content
          }
        }, 300); // Small delay to ensure UI is ready
      } else {
        await chrome.storage.local.remove('pendingPrompt');
      }
    }
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
      if (restrictedPage && sidePanelBtn) {
        sidePanelBtn.style.display = 'none';
      }
    }
  }

  async loadData() {
    // Load prompts
    const promptsData = await chrome.storage.local.get('prompts');
    this.prompts = promptsData.prompts || [];
    this.filteredPrompts = [...this.prompts];
    
    // Load folders (NEW - Phase 1)
    console.log('🔄 RefinedPanelManager: Loading folders...');
    await this.folderManager.loadFolders();
    console.log('📁 RefinedPanelManager: Folders loaded:', this.folderManager.folders.length);
    console.log('📂 RefinedPanelManager: Folder details:', this.folderManager.folders);
    
    // Log first few folders for debugging
    console.log('🔍🔍🔍 CHECKING FOLDER COUNT 🔍🔍🔍');
    console.log('📊 Folder count:', this.folderManager.folders.length);
    if (this.folderManager.folders.length > 0) {
      console.log('🔍 First 3 folders:', this.folderManager.folders.slice(0, 3));
    }
    
    // Check if folders need migration (old folders without isStarred property)
    const needsMigration = this.folderManager.folders.length > 0 && 
                           this.folderManager.folders.some(f => f.isStarred === undefined);
    
    if (needsMigration) {
      console.log('🔄🔄🔄 OLD FOLDERS DETECTED - MIGRATING TO NEW STRUCTURE 🔄🔄🔄');
      console.log('📊 Old folders:', this.folderManager.folders);
      
      // Step 1: Create a map of old folder IDs to folder names
      const oldFolderIdToName = {};
      this.folderManager.folders.forEach(f => {
        oldFolderIdToName[f.id] = f.name;
      });
      console.log('📋 Old folder ID to name map:', oldFolderIdToName);
      
      // Step 2: Create a map of prompts by folder name
      const promptsByFolderName = {};
      this.prompts.forEach(prompt => {
        if (prompt.folderId) {
          const folderName = oldFolderIdToName[prompt.folderId];
          if (folderName) {
            if (!promptsByFolderName[folderName]) {
              promptsByFolderName[folderName] = [];
            }
            promptsByFolderName[folderName].push(prompt);
          }
        }
      });
      console.log('📋 Prompts by folder name:', Object.keys(promptsByFolderName).map(name => `${name}: ${promptsByFolderName[name].length} prompts`));
      
      // Step 3: Delete all old folders
      await chrome.storage.sync.remove('folders');
      this.folderManager.folders = [];
      console.log('🗑️ Old folders deleted');
      
      // Step 4: Create new default folders with proper structure
      await this.createDefaultFolders();
      console.log('✅ New folders created:', this.folderManager.folders.length);
      
      // Step 5: Create a map of new folder names to IDs
      const newFolderNameToId = {};
      this.folderManager.folders.forEach(f => {
        newFolderNameToId[f.name] = f.id;
      });
      console.log('📋 New folder name to ID map:', newFolderNameToId);
      
      // Step 6: Re-assign prompts to new folder IDs based on folder names
      let reassignedCount = 0;
      this.prompts.forEach(prompt => {
        if (prompt.folderId) {
          const oldFolderName = oldFolderIdToName[prompt.folderId];
          if (oldFolderName && newFolderNameToId[oldFolderName]) {
            prompt.folderId = newFolderNameToId[oldFolderName];
            reassignedCount++;
          }
        }
      });
      console.log(`✅ Re-assigned ${reassignedCount} prompts to new folder IDs`);
      
      // Step 7: Save updated prompts
      await chrome.storage.local.set({ prompts: this.prompts });
      console.log('💾 Prompts saved with new folder IDs');
      
      console.log('✅ Migration complete! New folder count:', this.folderManager.folders.length);
    }
    // Auto-create default folders on first install (with Business & Productivity starred)
    else if (this.folderManager.folders.length === 0) {
      console.log('🌱🌱🌱 NO FOLDERS FOUND - WILL CREATE DEFAULTS 🌱🌱🌱');
      await this.createDefaultFolders();
      console.log('🌱🌱🌱 AFTER createDefaultFolders, folder count:', this.folderManager.folders.length);
    } else {
      console.log('✅ Folders already exist with proper structure');
    }
    
    // Load settings
    const settingsData = await chrome.storage.local.get('settings');
    this.settings = settingsData.settings || {
      preferSidePanel: true,
      slashCommand: true,
      fuzzySearch: true,
      fileFormat: 'md',
      variableSyntax: '{{}}',
      customStartDelimiter: '{{',
      customEndDelimiter: '}}'
    };
    
    // Load favorites data
    const favoritesData = await chrome.storage.sync.get(['favoritePromptIds', 'favoritePromptOrder', 'promptUsageStats']);
    this.favoritePromptIds = favoritesData.favoritePromptIds || [];
    this.favoritePromptOrder = favoritesData.favoritePromptOrder || [];
    this.promptUsageStats = favoritesData.promptUsageStats || {};
    
    // Elite Feature: Load recent folders and folder save history
    const eliteData = await chrome.storage.local.get(['recentFolders', 'folderSaveHistory']);
    this.recentFolders = eliteData.recentFolders || [];
    this.folderSaveHistory = eliteData.folderSaveHistory || {};
    this.updateSuggestedFolders();
    
    // Update file format selector if it exists
    const fileFormatSelect = document.getElementById('fileFormatSelect');
    if (fileFormatSelect) {
      fileFormatSelect.value = this.settings.fileFormat || 'json';
    }
  }

  // Favorites Helper Functions
  async addToFavorites(promptId) {
    if (!this.favoritePromptIds.includes(promptId)) {
      this.favoritePromptIds.push(promptId);
      await chrome.storage.sync.set({ favoritePromptIds: this.favoritePromptIds });
      this.showToast('Added to favorites');
      // Update favorites tab to show new favorite
      if (this.currentTab === 'favorites') {
        this.renderFavorites();
      }
    }
  }

  async removeFromFavorites(promptId) {
    this.favoritePromptIds = this.favoritePromptIds.filter(id => id !== promptId);
    this.favoritePromptOrder = this.favoritePromptOrder.filter(id => id !== promptId);
    await chrome.storage.sync.set({ 
      favoritePromptIds: this.favoritePromptIds,
      favoritePromptOrder: this.favoritePromptOrder
    });
    this.showToast('Removed from favorites');
    // Update favorites tab to show removal (may trigger empty state)
    if (this.currentTab === 'favorites') {
      this.renderFavorites();
    }
  }

  async toggleFavorite(promptId) {
    const isFavorite = this.favoritePromptIds.includes(promptId);
    if (isFavorite) {
      await this.removeFromFavorites(promptId);
    } else {
      await this.addToFavorites(promptId);
    }
    return !isFavorite;
  }

  async logPromptUsage(promptId) {
    if (!this.promptUsageStats[promptId]) {
      this.promptUsageStats[promptId] = { useCount: 0, lastUsed: 0 };
    }
    this.promptUsageStats[promptId].useCount++;
    this.promptUsageStats[promptId].lastUsed = Date.now();
    await chrome.storage.sync.set({ promptUsageStats: this.promptUsageStats });
  }

  isFavorite(promptId) {
    return this.favoritePromptIds.includes(promptId);
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Search - Prompts tab
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        // Show/hide clear button
        if (clearSearchBtn) {
          clearSearchBtn.style.display = e.target.value ? 'flex' : 'none';
        }
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.searchPrompts(e.target.value);
        }, 200);
      });
    }
    
    // Clear prompts search button
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          clearSearchBtn.style.display = 'none';
          this.searchPrompts(''); // Clear search results
          searchInput.focus(); // Keep focus on input
        }
      });
    }

    // Dynamic action buttons
    document.getElementById('addPromptBtn')?.addEventListener('click', () => this.openPromptModal());
    document.getElementById('inlineAddBtn')?.addEventListener('click', () => this.openPromptModal());
    document.getElementById('favoritesAddBtn')?.addEventListener('click', () => this.openPromptModal(null, true)); // Auto-favorite
    document.getElementById('manageBtn')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
    document.getElementById('inlineManageBtn')?.addEventListener('click', () => chrome.runtime.openOptionsPage());

    // Header icon buttons
    document.getElementById('settingsHeaderBtn')?.addEventListener('click', () => this.switchTab('settings'));
    document.getElementById('feedbackHeaderBtn')?.addEventListener('click', () => this.switchTab('feedback'));
    document.getElementById('closePanelBtn')?.addEventListener('click', () => {
      if (window.top !== window.self) {
        window.parent.postMessage({ action: 'closePromptPanel' }, '*');
        chrome.runtime.sendMessage({ action: 'closeInjectedPanel' }).catch(() => {});
      } else {
        window.close();
      }
    });

    // Side panel and popout
    document.getElementById('openSidePanelBtn')?.addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.runtime.sendMessage({ 
          action: 'openSidePanel', 
          tabId: tabs[0].id 
        });
        setTimeout(() => window.close(), 100);
      }
    });

    document.getElementById('popoutBtn')?.addEventListener('click', () => {
      chrome.windows.create({
        url: chrome.runtime.getURL('popup-panel-refined.html'),
        type: 'popup',
        width: 400,
        height: Math.min(600, Math.floor(window.screen.height * 0.6))
      });
      window.close();
    });

    // Inline action buttons (import/export)
    document.getElementById('inlineImportBtn')?.addEventListener('click', () => this.importPrompts());
    document.getElementById('inlineExportBtn')?.addEventListener('click', () => this.exportPrompts());

    // Footer actions
    document.getElementById('deleteAllBtn')?.addEventListener('click', () => this.showDeleteAllModal());
    document.getElementById('deleteFavoritesBtn')?.addEventListener('click', () => this.showDeleteFavoritesModal());
    document.getElementById('deleteFoldersBtn')?.addEventListener('click', () => this.showDeleteFoldersModal());

    // Filter back button
    document.getElementById('filterBackBtn')?.addEventListener('click', () => this.clearFilter());

    // Modal controls
    document.getElementById('closeModal')?.addEventListener('click', () => this.closePromptModal());
    document.getElementById('cancelBtn')?.addEventListener('click', () => this.closePromptModal());
    document.getElementById('savePromptBtn')?.addEventListener('click', (e) => {
      // Prevent click if button is disabled
      if (e.currentTarget.disabled || e.currentTarget.classList.contains('is-disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.savePrompt();
    });
    
    // Insert Variable button
    document.getElementById('insertVariableBtn')?.addEventListener('click', () => this.insertVariable());

    // Delete All Prompts Modal
    document.getElementById('closeDeleteModal')?.addEventListener('click', () => this.closeDeleteAllModal());
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => this.closeDeleteAllModal());
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => this.deleteAllPrompts());

    // Delete All Favorites Modal
    document.getElementById('closeDeleteFavoritesModal')?.addEventListener('click', () => this.closeDeleteFavoritesModal());
    document.getElementById('cancelDeleteFavoritesBtn')?.addEventListener('click', () => this.closeDeleteFavoritesModal());
    document.getElementById('confirmDeleteFavoritesBtn')?.addEventListener('click', () => this.deleteAllFavorites());

    // Delete All Folders Modal
    document.getElementById('closeDeleteFoldersModal')?.addEventListener('click', () => this.closeDeleteFoldersModal());
    document.getElementById('cancelDeleteFoldersBtn')?.addEventListener('click', () => this.closeDeleteFoldersModal());
    document.getElementById('confirmDeleteFoldersBtn')?.addEventListener('click', () => this.deleteAllFolders());

    // Delete Single Prompt Modal
    document.getElementById('closeDeletePromptModal')?.addEventListener('click', () => this.closeDeletePromptModal());
    document.getElementById('cancelDeletePromptBtn')?.addEventListener('click', () => this.closeDeletePromptModal());
    document.getElementById('confirmDeletePromptBtn')?.addEventListener('click', () => this.confirmDeletePrompt());

    // Generic Confirm Modal
    document.getElementById('closeConfirmModal')?.addEventListener('click', () => this.closeConfirmModal());
    document.getElementById('cancelConfirmBtn')?.addEventListener('click', () => this.closeConfirmModal());

    // Tag input
    document.getElementById('newTagInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addTag(e.target.value.trim());
        e.target.value = '';
      }
    });

    // Settings toggles
    document.getElementById('preferSidePanelToggle')?.addEventListener('change', (e) => {
      this.saveSetting('preferSidePanel', e.target.checked);
    });

    document.getElementById('slashCommandToggle')?.addEventListener('change', (e) => {
      this.saveSetting('slashCommand', e.target.checked);
    });

    document.getElementById('fuzzySearchToggle')?.addEventListener('change', (e) => {
      this.saveSetting('fuzzySearch', e.target.checked);
    });

    // File format
    document.getElementById('fileFormatSelect')?.addEventListener('change', (e) => {
      this.saveSetting('fileFormat', e.target.value);
    });

    // Variable syntax settings (popup panel)
    document.getElementById('popupVariableSyntaxSelect')?.addEventListener('change', (e) => {
      const value = e.target.value;
      const customContainer = document.getElementById('popupCustomSyntaxContainer');
      
      if (value === 'custom') {
        customContainer.style.display = 'block';
        this.updatePopupSyntaxPreview();
      } else {
        customContainer.style.display = 'none';
        this.saveSetting('variableSyntax', value);
      }
    });

    document.getElementById('popupCustomStartDelimiter')?.addEventListener('input', () => {
      this.updatePopupSyntaxPreview();
      this.savePopupCustomSyntax();
    });

    document.getElementById('popupCustomEndDelimiter')?.addEventListener('input', () => {
      this.updatePopupSyntaxPreview();
      this.savePopupCustomSyntax();
    });

    // Favorites tab event listeners
    const favoritesSearchInput = document.getElementById('favoritesSearchInput');
    const clearFavoritesSearchBtn = document.getElementById('clearFavoritesSearchBtn');
    
    if (favoritesSearchInput) {
      favoritesSearchInput.addEventListener('input', (e) => {
        // Show/hide clear button
        if (clearFavoritesSearchBtn) {
          clearFavoritesSearchBtn.style.display = e.target.value ? 'flex' : 'none';
        }
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.searchFavorites(e.target.value);
        }, 200);
      });
    }
    
    // Clear favorites search button
    if (clearFavoritesSearchBtn) {
      clearFavoritesSearchBtn.addEventListener('click', () => {
        if (favoritesSearchInput) {
          favoritesSearchInput.value = '';
          clearFavoritesSearchBtn.style.display = 'none';
          this.searchFavorites(''); // Clear search results
          favoritesSearchInput.focus(); // Keep focus on input
        }
      });
    }

    // Custom Sort Dropdown handlers
    const sortTrigger = document.getElementById('sortDropdownTrigger');
    const sortMenu = document.getElementById('sortDropdownMenu');
    
    sortTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = sortMenu.style.display === 'block';
      sortMenu.style.display = isOpen ? 'none' : 'block';
      
      // Hide tooltips when dropdown is open
      const insertVarBtn = document.getElementById('insertVariableBtn');
      if (sortMenu.style.display === 'block') {
        sortTrigger.setAttribute('data-tooltip-hidden', 'true');
        // Also hide insert variable button tooltip
        if (insertVarBtn) {
          insertVarBtn.setAttribute('data-tooltip-hidden', 'true');
        }
        const rect = sortTrigger.getBoundingClientRect();
        const containerRect = sortTrigger.closest('.inline-actions').getBoundingClientRect();
        sortMenu.style.top = `${rect.bottom - containerRect.top + 8}px`;
        sortMenu.style.right = `${containerRect.right - rect.right}px`;
      } else {
        sortTrigger.removeAttribute('data-tooltip-hidden');
        // Restore insert variable button tooltip
        if (insertVarBtn) {
          insertVarBtn.removeAttribute('data-tooltip-hidden');
        }
      }
    });
    
    // Handle sort option selection
    document.querySelectorAll('.sort-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const value = e.target.dataset.value;
        this.currentFavoriteSort = value;
        sortMenu.style.display = 'none';
        // Restore tooltips when option is selected
        if (sortTrigger) sortTrigger.removeAttribute('data-tooltip-hidden');
        const insertVarBtn = document.getElementById('insertVariableBtn');
        if (insertVarBtn) insertVarBtn.removeAttribute('data-tooltip-hidden');
        this.renderFavorites();
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#sortDropdownTrigger') && !e.target.closest('#sortDropdownMenu')) {
        if (sortMenu) {
          sortMenu.style.display = 'none';
          // Restore tooltips when dropdown closes
          if (sortTrigger) sortTrigger.removeAttribute('data-tooltip-hidden');
          const insertVarBtn = document.getElementById('insertVariableBtn');
          if (insertVarBtn) insertVarBtn.removeAttribute('data-tooltip-hidden');
        }
      }
    });

    document.getElementById('favoritesManageBtn')?.addEventListener('click', () => {
      window.open(chrome.runtime.getURL('options.html'), '_blank');
    });

    // Download All Favorites button
    document.getElementById('downloadAllFavoritesBtn')?.addEventListener('click', () => {
      this.showDownloadFavouritesModal();
    });

    // Download Favourites modal controls
    document.getElementById('closeDownloadFavouritesModal')?.addEventListener('click', () => {
      document.getElementById('downloadFavouritesModal').style.display = 'none';
    });
    document.getElementById('cancelDownloadFavouritesBtn')?.addEventListener('click', () => {
      document.getElementById('downloadFavouritesModal').style.display = 'none';
    });
    document.getElementById('confirmDownloadFavouritesBtn')?.addEventListener('click', () => {
      document.getElementById('downloadFavouritesModal').style.display = 'none';
      this.exportFavorites();
    });

    // Folders tab event listeners (Phase 2)
    const foldersSearchInput = document.getElementById('foldersSearchInput');
    const clearFoldersSearchBtn = document.getElementById('clearFoldersSearchBtn');
    
    if (foldersSearchInput) {
      foldersSearchInput.addEventListener('input', (e) => {
        // Show/hide clear button based on input value
        if (clearFoldersSearchBtn) {
          clearFoldersSearchBtn.style.display = e.target.value ? 'flex' : 'none';
        }
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.searchFolders(e.target.value);
        }, 150); // Phase 2.2: Reduced from 200ms to 150ms
      });
    }
    
    // Clear folders search button
    if (clearFoldersSearchBtn) {
      clearFoldersSearchBtn.addEventListener('click', () => {
        if (foldersSearchInput) {
          foldersSearchInput.value = '';
          clearFoldersSearchBtn.style.display = 'none';
          this.searchFolders(''); // Clear search results
          foldersSearchInput.focus(); // Keep focus on input
        }
      });
    }

    document.getElementById('newFolderBtn')?.addEventListener('click', () => {
      // Context-aware: Get current folder from navigation path
      const currentFolder = this.folderPath[this.folderPath.length - 1];
      const parentId = currentFolder && currentFolder.id !== '__uncategorized__' ? currentFolder.id : null;
      this.openFolderModal(parentId);
    });

    document.getElementById('createFirstFolderBtn')?.addEventListener('click', () => {
      // Always create at root level from empty state
      this.openFolderModal(null);
    });

    document.getElementById('goToPromptsBtn')?.addEventListener('click', () => {
      this.switchTab('prompts');
    });

    document.getElementById('addFirstPromptBtn')?.addEventListener('click', () => {
      this.openPromptModal();
    });

    document.getElementById('importFromFileBtn')?.addEventListener('click', () => {
      this.importPrompts();
    });

    // Folder Modal controls
    document.getElementById('closeFolderModal')?.addEventListener('click', () => {
      this.closeFolderModal();
    });
    document.getElementById('cancelFolderBtn')?.addEventListener('click', () => {
      this.closeFolderModal();
    });
    document.getElementById('saveFolderBtn')?.addEventListener('click', () => {
      this.saveFolder();
    });

    // Custom folder dropdown handlers - will be initialized when modals open
    this.initCustomFolderDropdowns();

    // Feedback form
    document.getElementById('feedbackForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitFeedback();
    });

    // UNIVERSAL MODAL CLICK-OUTSIDE-TO-CLOSE HANDLER
    // Applies to ALL modals in the extension
    document.addEventListener('click', (e) => {
      // Comprehensive list of ALL modals in the extension
      const modalConfig = {
        'promptModal': () => this.closePromptModal(),
        'folderModal': () => this.closeFolderModal(),
        'deletePromptModal': () => this.closeDeletePromptModal(),
        'deleteAllModal': () => this.closeDeleteAllModal(),
        'deleteFavoritesModal': () => this.closeDeleteFavoritesModal(),
        'downloadFavouritesModal': () => this.closeDownloadFavouritesModal(),
        'deleteFoldersModal': () => this.closeDeleteFoldersModal(),
        'confirmModal': () => this.closeConfirmModal(),
        'shareModal': () => this.closeShareModal()
      };

      // Check each modal
      Object.keys(modalConfig).forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && modal.style.display === 'flex') {
          // Check if click is on the modal backdrop (not on modal content)
          if (e.target === modal) {
            console.log(`🖱️ Click outside ${modalId} detected - closing modal`);
            modalConfig[modalId]();
          }
        }
      });
      
      // Clear bulk selection if clicking outside prompt cards
      if (this.selectedPromptIds.size > 0) {
        const clickedCard = e.target.closest('.prompt-card');
        const clickedBanner = e.target.closest('.selection-counter-banner');
        const clickedMenu = e.target.closest('.bulk-actions-menu');
        const clickedModal = e.target.closest('.modal');
        
        // Clear selection if clicked outside cards, banner, menu, and modals
        if (!clickedCard && !clickedBanner && !clickedMenu && !clickedModal) {
          console.log('🖱️ Click outside prompt cards - clearing selection');
          this.clearBulkSelection();
        }
      }
      
      // Clear bulk folder selection if clicking outside folder cards
      if (this.selectedFolderIds.size > 0) {
        const clickedCard = e.target.closest('.folder-card');
        const clickedBanner = e.target.closest('.selection-counter-banner');
        const clickedMenu = e.target.closest('.bulk-actions-menu');
        const clickedModal = e.target.closest('.modal');
        
        // Clear selection if clicked outside cards, banner, menu, and modals
        if (!clickedCard && !clickedBanner && !clickedMenu && !clickedModal) {
          console.log('🖱️ Click outside folder cards - clearing selection');
          this.clearBulkFolderSelection();
        }
      }
    });

    // ═══════════════════════════════════════════════════════════
    // GLOBAL KEYBOARD SHORTCUTS (Elite Implementation)
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('keydown', (e) => {
      // Handle type-to-navigate in dropdowns (letter keys only)
      if (this.handleDropdownTypeToNavigate(e)) {
        return; // Event handled by dropdown navigation
      }
      
      // Cmd+K / Ctrl+K - Context-aware shortcut for all search bars
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        
        // Focus appropriate search input based on current tab
        if (this.currentTab === 'prompts') {
          const searchInput = document.getElementById('searchInput');
          if (searchInput) {
            searchInput.focus();
            searchInput.select(); // Select existing text if any
            return;
          }
        } else if (this.currentTab === 'favorites') {
          const favoritesSearchInput = document.getElementById('favoritesSearchInput');
          if (favoritesSearchInput) {
            favoritesSearchInput.focus();
            favoritesSearchInput.select(); // Select existing text if any
            return;
          }
        } else if (this.currentTab === 'folders') {
          const foldersSearchInput = document.getElementById('foldersSearchInput');
          if (foldersSearchInput) {
            foldersSearchInput.focus();
            foldersSearchInput.select(); // Select existing text if any
            return;
          }
        }
        
        // Otherwise, toggle command palette
        this.toggleCommandPalette();
        return;
      }
      
      // ═══════════════════════════════════════════════════════════
      // ESCAPE KEY - Hierarchical Closing Logic
      // ═══════════════════════════════════════════════════════════
      if (e.key === 'Escape') {
        e.preventDefault();
        
        // PRIORITY 1: Close open custom dropdown
        const openDropdown = document.querySelector('.custom-folder-dropdown.open');
        if (openDropdown) {
          console.log('⌨️ Escape: Closing custom dropdown');
          openDropdown.classList.remove('open');
          return;
        }
        
        // PRIORITY 1b: Close bulk actions menu
        const bulkActionsMenu = document.querySelector('.bulk-actions-menu');
        if (bulkActionsMenu) {
          console.log('⌨️ Escape: Closing bulk actions menu');
          bulkActionsMenu.remove();
          return;
        }
        
        // PRIORITY 1c: Close context menu (move to folder, right-click menus)
        const contextMenu = document.querySelector('.context-menu');
        if (contextMenu) {
          console.log('⌨️ Escape: Closing context menu');
          contextMenu.remove();
          return;
        }
        
        // PRIORITY 1d: Clear bulk selection if active
        if (this.selectedPromptIds.size > 0) {
          console.log('⌨️ Escape: Clearing bulk prompt selection');
          this.clearBulkSelection();
          return;
        }
        
        // PRIORITY 1e: Clear bulk folder selection if active
        if (this.selectedFolderIds.size > 0) {
          console.log('⌨️ Escape: Clearing bulk folder selection');
          this.clearBulkFolderSelection();
          return;
        }
        
        // PRIORITY 2: Close command palette
        if (this.commandPaletteOpen) {
          console.log('⌨️ Escape: Closing command palette');
          this.closeCommandPalette();
          return;
        }
        
        // PRIORITY 3: Close active modal (check all modals)
        const modalConfig = {
          'promptModal': () => this.closePromptModal(),
          'folderModal': () => this.closeFolderModal(),
          'deletePromptModal': () => this.closeDeletePromptModal(),
          'deleteAllModal': () => this.closeDeleteAllModal(),
          'deleteFavoritesModal': () => this.closeDeleteFavoritesModal(),
          'downloadFavouritesModal': () => this.closeDownloadFavouritesModal(),
          'deleteFoldersModal': () => this.closeDeleteFoldersModal(),
          'confirmModal': () => this.closeConfirmModal(),
          'shareModal': () => this.closeShareModal()
        };
        
        for (const [modalId, closeMethod] of Object.entries(modalConfig)) {
          const modal = document.getElementById(modalId);
          if (modal && modal.style.display === 'flex') {
            console.log(`⌨️ Escape: Closing ${modalId}`);
            closeMethod();
            return;
          }
        }
        
        console.log('⌨️ Escape: No components to close');
      }
      
      // ═══════════════════════════════════════════════════════════
      // ENTER KEY - Smart Submit Logic
      // ═══════════════════════════════════════════════════════════
      if (e.key === 'Enter') {
        // Check if any modal is open (both ID-based and dynamic modals)
        const modalIds = ['promptModal', 'folderModal', 'deletePromptModal', 
                          'deleteAllModal', 'deleteFavoritesModal', 'downloadFavouritesModal',
                          'deleteFoldersModal', 'confirmModal', 'shareModal'];
        
        let activeModal = null;
        let activeModalId = null;
        
        // First check ID-based modals
        activeModalId = modalIds.find(id => {
          const modal = document.getElementById(id);
          if (modal && modal.style.display === 'flex') {
            activeModal = modal;
            return true;
          }
          return false;
        });
        
        // If no ID-based modal found, check for dynamic modals (e.g., share modal)
        if (!activeModal) {
          const dynamicModals = document.querySelectorAll('.modal');
          for (const modal of dynamicModals) {
            if (modal.style.display !== 'none' && !modal.id) {
              activeModal = modal;
              activeModalId = 'dynamic-modal';
              break;
            }
          }
        }
        
        if (!activeModal) return; // No modal open, ignore
        
        // Check if dropdown is open (Enter should be for dropdown, not submit)
        const openDropdown = document.querySelector('.custom-folder-dropdown.open');
        const contextMenu = document.querySelector('.context-menu');
        if (openDropdown || contextMenu) {
          return; // Let dropdown/context menu handle Enter
        }
        
        // Check focused element - don't intercept if user is typing
        const activeElement = document.activeElement;
        const isTextarea = activeElement && activeElement.tagName === 'TEXTAREA';
        const isInput = activeElement && activeElement.tagName === 'INPUT' && activeElement.type !== 'search';
        const isButton = activeElement && activeElement.tagName === 'BUTTON';
        
        if (isTextarea || isInput || isButton) {
          return; // Let native behavior handle it
        }
        
        // Find and click primary button in active modal
        const primaryBtn = activeModal.querySelector(`
          .btn-primary,
          #savePromptBtn,
          #saveFolderBtn,
          #confirmDeleteBtn,
          #confirmDeleteFavoritesBtn,
          #confirmDeleteFoldersBtn,
          #confirmBtn,
          #confirmDeletePromptBtn,
          #confirmDownloadFavouritesBtn,
          .share-link-btn,
          .download-btn,
          .action-btn.primary
        `.trim());
        
        if (primaryBtn && !primaryBtn.disabled) {
          e.preventDefault();
          console.log(`⌨️ Enter: Triggering primary action in ${activeModalId}`);
          primaryBtn.click();
        }
      }
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    
    // Clear bulk selection when switching tabs
    if (this.selectedPromptIds.size > 0) {
      this.clearBulkSelection();
    }
    
    // Hide all clear buttons when switching tabs
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const clearFavoritesSearchBtn = document.getElementById('clearFavoritesSearchBtn');
    const clearFoldersSearchBtn = document.getElementById('clearFoldersSearchBtn');
    
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    if (clearFavoritesSearchBtn) clearFavoritesSearchBtn.style.display = 'none';
    if (clearFoldersSearchBtn) clearFoldersSearchBtn.style.display = 'none';
    
    // Note: We now preserve folder navigation state when switching tabs
    // The folderPath is maintained so users can return to where they left off
    
    // Clear folder search when switching to folders tab (fresh start)
    if (tab === 'folders') {
      this.currentFolderSearchQuery = '';
      const foldersSearchInput = document.getElementById('foldersSearchInput');
      if (foldersSearchInput) {
        foldersSearchInput.value = '';
      }
    }
    
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update pill indicator position
    const navContainer = document.querySelector('.nav-floating-pill');
    if (navContainer) {
      navContainer.setAttribute('data-active', tab);
    }
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tab}Tab`);
    });
    
    // Update header icon buttons active state
    const settingsBtn = document.getElementById('settingsHeaderBtn');
    const feedbackBtn = document.getElementById('feedbackHeaderBtn');
    
    if (settingsBtn) {
      settingsBtn.classList.toggle('active', tab === 'settings');
    }
    if (feedbackBtn) {
      feedbackBtn.classList.toggle('active', tab === 'feedback');
    }
    
    // Render tab-specific content
    if (tab === 'favorites') {
      this.renderFavorites();
    } else if (tab === 'folders') {
      this.renderFolders();
    } else if (tab === 'settings') {
      this.loadPopupSettings();
    }
  }

  updateUIState() {
    const hasPrompts = this.prompts.length > 0;
    
    // Toggle search container visibility
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
      searchContainer.style.display = hasPrompts ? 'block' : 'none';
    }
    
    // Disable/enable inline action buttons based on prompt count
    const inlineImportBtn = document.getElementById('inlineImportBtn');
    const inlineExportBtn = document.getElementById('inlineExportBtn');
    const inlineManageBtn = document.getElementById('inlineManageBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (inlineExportBtn) {
      inlineExportBtn.disabled = !hasPrompts;
    }
    if (inlineManageBtn) {
      inlineManageBtn.disabled = !hasPrompts;
    }
    if (searchInput) {
      searchInput.disabled = !hasPrompts;
    }
    
    // Hide action buttons
    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
      actionButtons.style.display = 'none';
    }
    
    // Update prompt count
    const promptCount = document.getElementById('promptCount');
    promptCount.textContent = `${this.prompts.length} prompt${this.prompts.length !== 1 ? 's' : ''}`;
    
    // Disable/enable Delete All button based on prompt count
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
      deleteAllBtn.disabled = !hasPrompts;
    }
  }

  renderPrompts() {
    const promptsList = document.getElementById('promptsList');
    const emptyState = document.getElementById('emptyState');
    
    if (!promptsList || !emptyState) return;
    
    const searchInput = document.getElementById('searchInput');
    const isSearching = searchInput && searchInput.value.trim().length > 0;
    
    if (this.filteredPrompts.length === 0) {
      if (isSearching) {
        // Show "No matches found" while keeping UI intact
        promptsList.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #9A9A9A; font-family: 'Sora', sans-serif; font-size: 13px;">
            No matches found
          </div>
        `;
        promptsList.style.display = 'flex';
        emptyState.style.display = 'none';
      } else if (this.prompts.length === 0) {
        // Show empty state only if library is truly empty
        promptsList.style.display = 'none';
        emptyState.style.display = 'flex';
      } else {
        // Filtered but not searching (e.g., tag filter)
        promptsList.style.display = 'none';
        emptyState.style.display = 'none';
      }
    } else {
      promptsList.style.display = 'flex';
      emptyState.style.display = 'none';
      
      promptsList.innerHTML = '';
      this.filteredPrompts.forEach(prompt => {
        const card = this.createPromptCard(prompt);
        promptsList.appendChild(card);
      });
    }
  }

  renderFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    const favoritesEmptyState = document.getElementById('favoritesEmptyState');
    const favoritesHeader = document.querySelector('.favorites-header');
    
    if (!favoritesList || !favoritesEmptyState) return;
    
    // Get favorited prompts
    const favoritedPrompts = this.prompts.filter(p => this.isFavorite(p.id));
    
    // Check if we're searching
    const isSearching = this.currentSearchQuery && this.currentSearchQuery.trim() !== '';
    
    if (favoritedPrompts.length === 0) {
      if (isSearching) {
        // Show "No matches found" in the list area while keeping all UI intact
        favoritesList.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #9A9A9A; font-family: 'Sora', sans-serif; font-size: 13px;">
            No matches found
          </div>
        `;
        favoritesList.style.display = 'flex';
        favoritesEmptyState.style.display = 'none';
        // Keep header visible so user can clear search
        if (favoritesHeader) favoritesHeader.style.display = 'block';
      } else {
        // Show empty state when no favorites at all
        favoritesList.style.display = 'none';
        favoritesEmptyState.style.display = 'flex';
        if (favoritesHeader) favoritesHeader.style.display = 'none';
      }
    } else {
      favoritesList.style.display = 'flex';
      favoritesEmptyState.style.display = 'none';
      if (favoritesHeader) favoritesHeader.style.display = 'block';
      
      // Clear and render in order
      favoritesList.innerHTML = '';
      
      // Sort by favoriteOrder if available
      const sortedFavorites = this.favoritePromptOrder
        .map(id => favoritedPrompts.find(p => p.id === id))
        .filter(p => p !== undefined);
      
      // Add any favorites not in order array
      favoritedPrompts.forEach(prompt => {
        if (!sortedFavorites.includes(prompt)) {
          sortedFavorites.push(prompt);
        }
      });
      
      sortedFavorites.forEach(prompt => {
        const card = this.createPromptCard(prompt);
        favoritesList.appendChild(card);
      });
    }
    
    // Update favorites count
    const favoritesCount = document.getElementById('favoritesCount');
    if (favoritesCount) {
      favoritesCount.textContent = `${favoritedPrompts.length} favorite${favoritedPrompts.length !== 1 ? 's' : ''}`;
    }
    
    // Disable/enable Delete All Favorites button based on favorites count
    const deleteFavoritesBtn = document.getElementById('deleteFavoritesBtn');
    if (deleteFavoritesBtn) {
      deleteFavoritesBtn.disabled = favoritedPrompts.length === 0;
    }
  }

  sortFavorites(favoritePrompts) {
    const sorted = [...favoritePrompts];
    
    switch (this.currentFavoriteSort) {
      case 'mostUsed':
        return sorted.sort((a, b) => {
          const aCount = this.promptUsageStats[a.id]?.useCount || 0;
          const bCount = this.promptUsageStats[b.id]?.useCount || 0;
          return bCount - aCount;
        });
      
      case 'recentlyUsed':
        return sorted.sort((a, b) => {
          const aLast = this.promptUsageStats[a.id]?.lastUsed || 0;
          const bLast = this.promptUsageStats[b.id]?.lastUsed || 0;
          return bLast - aLast;
        });
      
      case 'dateAdded':
        return sorted.sort((a, b) => {
          return (a.createdAt || 0) - (b.createdAt || 0);
        });
      
      case 'customOrder':
        // Sort by custom order array
        return sorted.sort((a, b) => {
          const aIndex = this.favoritePromptOrder.indexOf(a.id);
          const bIndex = this.favoritePromptOrder.indexOf(b.id);
          // If not in custom order, put at end
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
      
      default:
        return sorted;
    }
  }

  /**
   * Search favorites with highlighting and fuzzy search support
   * Re-renders favorites to apply search highlighting
   */
  searchFavorites(query) {
    // Store query for highlighting
    this.currentSearchQuery = query;
    
    if (!query) {
      // No search - show all favorites
      this.renderFavorites();
      return;
    }
    
    // Get all favorited prompts
    const favoritedPrompts = this.prompts.filter(p => this.isFavorite(p.id));
    
    // Apply search filter (same logic as searchPrompts)
    const search = query.toLowerCase();
    const filteredFavorites = favoritedPrompts.filter(prompt => {
      // Search in title
      if (prompt.title.toLowerCase().includes(search)) return true;
      // Search in tags
      if (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(search))) return true;
      // Fuzzy search if enabled
      if (this.settings.fuzzySearch && this.fuzzyMatch(prompt.title.toLowerCase(), search)) return true;
      return false;
    });
    
    // Temporarily store filtered favorites and render
    const originalFavoriteOrder = [...this.favoritePromptOrder];
    const originalPrompts = [...this.prompts];
    
    // Filter prompts to only show matching favorites
    this.prompts = filteredFavorites;
    this.renderFavorites();
    
    // Restore original data
    this.prompts = originalPrompts;
  }

  showDownloadFavouritesModal() {
    const favoritePrompts = this.prompts.filter(prompt => 
      this.favoritePromptIds.includes(prompt.id)
    );
    
    if (favoritePrompts.length === 0) {
      this.showToast('No favorites to download', 'error');
      return;
    }
    
    // Get export format from settings and update modal text
    const format = this.settings.fileFormat || 'json';
    const textElement = document.getElementById('downloadFavouritesText');
    if (textElement) {
      textElement.textContent = `Yay! You can download all your favorite prompts as a .${format} file and share them with others.`;
    }
    
    // Show modal
    document.getElementById('downloadFavouritesModal').style.display = 'flex';
  }

  async exportFavorites() {
    const favoritePrompts = this.prompts.filter(prompt => 
      this.favoritePromptIds.includes(prompt.id)
    );
    
    if (favoritePrompts.length === 0) {
      this.showToast('No favorites to export', 'error');
      return;
    }
    
    // Use new export controller
    await this.exportController(favoritePrompts, 'favorite-prompts');
  }

  makeDraggable(card, promptId, index) {
    card.setAttribute('draggable', 'true');
    card.dataset.index = index;
    
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', promptId);
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard && draggingCard !== card) {
        card.classList.add('drag-over');
      }
    });
    
    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });
    
    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = promptId;
      
      if (draggedId !== targetId) {
        await this.reorderFavorites(draggedId, targetId);
      }
    });
  }

  async reorderFavorites(draggedId, targetId) {
    // Update custom order array
    const draggedIndex = this.favoritePromptOrder.indexOf(draggedId);
    const targetIndex = this.favoritePromptOrder.indexOf(targetId);
    
    // If not in order array, add them
    if (draggedIndex === -1) {
      this.favoritePromptOrder = [...this.favoritePromptIds];
    }
    
    // Remove dragged item
    const newOrder = this.favoritePromptOrder.filter(id => id !== draggedId);
    
    // Insert at new position
    const finalTargetIndex = newOrder.indexOf(targetId);
    newOrder.splice(finalTargetIndex, 0, draggedId);
    
    this.favoritePromptOrder = newOrder;
    
    // Save to storage
    await chrome.storage.sync.set({ favoritePromptOrder: this.favoritePromptOrder });
    
    // Re-render
    this.renderFavorites();
  }

  createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.promptId = prompt.id;
    
    // Add class if favorited (for CSS styling)
    if (this.isFavorite(prompt.id)) {
      card.classList.add('is-favorited-card');
    }
    
    // Add class if selected (for bulk selection)
    if (this.selectedPromptIds.has(prompt.id)) {
      card.classList.add('is-selected');
    }
    
    // Add selection indicator (checkmark badge)
    const selectionIndicator = document.createElement('div');
    selectionIndicator.className = 'selection-indicator';
    selectionIndicator.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    card.appendChild(selectionIndicator);
    
    // LAYER 1: Content layer (title + tags)
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    
    // Title (with search highlighting if query exists)
    const title = document.createElement('h4');
    title.className = 'prompt-title';
    if (this.currentSearchQuery) {
      title.innerHTML = this.highlightSearchMatches(prompt.title, this.currentSearchQuery);
    } else {
      title.textContent = prompt.title;
    }
    cardContent.appendChild(title);
    
    // Copy button with usage tracking
    const copyBtn = this.createActionButton('copy', 'Copy to clipboard', async () => {
      this.copyToClipboard(prompt.content);
      await this.logPromptUsage(prompt.id);
      this.showToast('Copied to clipboard!');
    });
    
    // Edit button
    const editBtn = this.createActionButton('edit', 'Edit prompt', () => {
      this.openPromptModal(prompt);
    });
    
    // Delete button - behaves differently in Favorites tab
    const deleteBtn = this.createActionButton(
      'delete',
      this.currentTab === 'favorites' ? 'Remove from favorites' : 'Delete prompt',
      async () => {
        if (this.currentTab === 'favorites') {
          // In Favorites tab, only unfavorite (don't delete)
          await this.removeFromFavorites(prompt.id);
          this.renderFavorites();
        } else {
          // In Prompts tab, show confirmation modal before deleting
          this.showDeletePromptModal(prompt);
        }
      }
    );
    
    // Favorite button
    const isFavorited = this.isFavorite(prompt.id);
    const favoriteBtn = this.createActionButton(
      isFavorited ? 'heart-filled' : 'heart',
      isFavorited ? 'Remove from favorites' : 'Add to favorites',
      async (e) => {
        const newState = await this.toggleFavorite(prompt.id);
        // Update button icon and tooltip
        const btn = e.currentTarget;
        const card = btn.closest('.prompt-card');
        if (newState) {
          btn.innerHTML = this.getHeartIcon(true);
          btn.setAttribute('data-tooltip', 'Remove from favorites');
          btn.classList.add('is-favorite');
          card.classList.add('is-favorited-card'); // Add class to card
        } else {
          btn.innerHTML = this.getHeartIcon(false);
          btn.setAttribute('data-tooltip', 'Add to favorites');
          btn.classList.remove('is-favorite');
          card.classList.remove('is-favorited-card'); // Remove class from card
        }
        // Refresh favorites tab if active
        if (this.currentTab === 'favorites') {
          this.renderFavorites();
        }
      }
    );
    if (isFavorited) {
      favoriteBtn.classList.add('is-favorite');
    }
    
    // Share button (used in More menu)
    const shareBtn = this.createActionButton('share', 'Share prompt', () => {
      this.sharePrompt(prompt);
    });
    
    // More button - opens dropdown with secondary actions
    const moreBtn = this.createActionButton('more-vertical', 'More options', (e) => {
      this.showMoreActionsMenu(e, prompt, favoriteBtn, shareBtn, deleteBtn, editBtn);
    });
    
    // Tags (always visible with dynamic colors) - Part of content layer
    if (prompt.tags && prompt.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'prompt-tags';
      
      prompt.tags.forEach(tag => {
        const tagChip = document.createElement('span');
        tagChip.className = 'tag-chip';
        tagChip.setAttribute('data-tag', tag.toLowerCase());
        
        // Apply search highlighting to tags if query exists
        if (this.currentSearchQuery && tag.toLowerCase().includes(this.currentSearchQuery.toLowerCase())) {
          tagChip.innerHTML = this.highlightSearchMatches(tag, this.currentSearchQuery);
        } else {
          tagChip.textContent = tag;
        }
        
        // Apply dynamic color based on tag name
        const colors = this.getTagColor(tag);
        tagChip.style.background = colors.bg;
        tagChip.style.color = colors.color;
        tagChip.style.border = `1px solid ${colors.border}`;
        
        tagChip.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log('🏷️ Tag clicked:', tag);
          this.filterByTag(tag);
        });
        tagsContainer.appendChild(tagChip);
      });
      
      cardContent.appendChild(tagsContainer);
    }
    
    // Append content layer to card
    card.appendChild(cardContent);
    
    // LAYER 2: Overlay layer (action controls only)
    const cardOverlay = document.createElement('div');
    cardOverlay.className = 'card-overlay';
    
    // Action controls container (Copy, More)
    const actionControls = document.createElement('div');
    actionControls.className = 'overlay-action-controls';
    
    // Append actions: Copy, More
    actionControls.appendChild(copyBtn);
    actionControls.appendChild(moreBtn);
    
    // Assemble overlay
    cardOverlay.appendChild(actionControls);
    
    // Append overlay layer to card
    card.appendChild(cardOverlay);
    
    
    // Click to edit (or select with modifier key)
    card.addEventListener('click', (e) => {
      console.log('🖱️ CARD CLICKED!', {
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        target: e.target.className,
        promptId: prompt.id
      });
      
      console.log('🔍 Checking this context:', {
        hasToggleMethod: typeof this.togglePromptSelection,
        hasSelectedIds: typeof this.selectedPromptIds,
        thisObject: this
      });
      
      // Don't trigger if clicking action buttons or tags
      if (e.target.closest('.card-action-btn') || 
          e.target.closest('.tag-chip') ||
          e.target.classList.contains('tag-chip')) {
        console.log('🚫 Card click blocked - clicked on:', e.target.className);
        return;
      }
      
      // Check for Shift or Cmd/Ctrl key for bulk selection
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔲 Bulk selection toggle for prompt:', prompt.id);
        
        // Call the method
        if (typeof this.togglePromptSelection === 'function') {
          this.togglePromptSelection(prompt.id);
        } else {
          console.error('❌ togglePromptSelection is not a function! Type:', typeof this.togglePromptSelection);
          console.error('❌ this object:', this);
          console.error('❌ Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)));
        }
        return;
      }
      
      // Regular click opens edit modal (only if no selection active)
      if (this.selectedPromptIds && this.selectedPromptIds.size === 0) {
        console.log('✏️ Opening edit modal from card click');
        this.openPromptModal(prompt);
      }
    });
    
    // Right-click to show context menu
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🖱️ Right-click on prompt card');
      
      // If this card is part of a multi-selection, show bulk actions menu
      if (this.selectedPromptIds.has(prompt.id) && this.selectedPromptIds.size > 0) {
        console.log('📋 Showing bulk actions menu');
        this.showBulkActionsMenu(e);
      } else if (this.selectedPromptIds.size > 0) {
        // Right-clicked on unselected card while selection exists - clear selection and show normal menu
        console.log('🔄 Clearing selection and showing normal menu');
        this.clearBulkSelection();
        this.showMoreActionsMenu(e, prompt, favoriteBtn, shareBtn, deleteBtn, editBtn);
      } else {
        // No selection - show normal menu
        console.log('📋 Showing normal context menu');
        this.showMoreActionsMenu(e, prompt, favoriteBtn, shareBtn, deleteBtn, editBtn);
      }
    });
    
    return card;
  }

  getHeartIcon(filled) {
    if (filled) {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="#22B8CF" stroke="#22B8CF" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    } else {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    }
  }

  getMenuItemIcon(label) {
    const icons = {
      'Edit': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
      'Share': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
      'Move to Folder': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
      'Add to Favorites': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
      'Remove from Favorites': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
      'Delete': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
      'Rename': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
      'Create Subfolder': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>'
    };
    
    return icons[label] || '';
  }

  createActionButton(type, tooltip, onClick) {
    const btn = document.createElement('button');
    btn.className = 'card-action-btn';
    btn.setAttribute('data-tooltip', tooltip);
    
    // Icon SVGs
    const icons = {
      copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
      edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
      delete: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
      share: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
      folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
      'more-vertical': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>',
      heart: this.getHeartIcon(false),
      'heart-filled': this.getHeartIcon(true)
    };
    
    btn.innerHTML = icons[type];
    btn.style.pointerEvents = 'auto';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log(`${type} button clicked for prompt:`, this.editingPrompt);
      try {
        onClick(e);
        console.log(`${type} onClick executed successfully`);
      } catch (error) {
        console.error(`Error in ${type} onClick:`, error);
      }
    });
    
    return btn;
  }

  searchPrompts(query) {
    // Store query for highlighting
    this.currentSearchQuery = query;
    
    // Clear bulk selection when searching
    if (this.selectedPromptIds.size > 0) {
      this.clearBulkSelection();
    }
    
    if (!query) {
      this.filteredPrompts = [...this.prompts];
    } else {
      const search = query.toLowerCase();
      this.filteredPrompts = this.prompts.filter(prompt => {
        // Search in title
        if (prompt.title.toLowerCase().includes(search)) return true;
        // Search in tags
        if (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(search))) return true;
        // Fuzzy search if enabled
        if (this.settings.fuzzySearch && this.fuzzyMatch(prompt.title.toLowerCase(), search)) return true;
        return false;
      });
    }
    this.renderPrompts();
  }

  /**
   * Enhanced fuzzy match with typo tolerance
   * Allows 1-2 character differences for better typo handling
   * Example: "optiimizer" matches "optimizer"
   */
  fuzzyMatch(str, pattern) {
    // Basic fuzzy matching - all pattern characters must appear in order
    let patternIdx = 0;
    let strIdx = 0;
    let matchCount = 0;
    const matches = [];
    
    while (strIdx < str.length && patternIdx < pattern.length) {
      if (str[strIdx] === pattern[patternIdx]) {
        matchCount++;
        matches.push(strIdx);
        patternIdx++;
      }
      strIdx++;
    }
    
    // All characters found in order
    if (matchCount === pattern.length) {
      return true;
    }
    
    // Typo tolerance: Allow 1-2 character difference if pattern is close enough
    if (pattern.length >= 5) {
      const similarity = matchCount / pattern.length;
      const lengthDiff = Math.abs(str.length - pattern.length);
      
      // If 80%+ characters match and length difference is small, consider it a match
      if (similarity >= 0.8 && lengthDiff <= 2) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Elite Search Highlighting System
   * Highlights search query matches in text with <mark> tags
   * @param {string} text - Original text to highlight
   * @param {string} query - Search query (can be multiple words)
   * @returns {string} HTML string with <mark> tags
   */
  highlightSearchMatches(text, query) {
    if (!query || !text) return this.escapeHtml(text);
    
    // Split query into keywords
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    
    let result = this.escapeHtml(text);
    
    // Sort keywords by length (longest first) to avoid partial matches
    keywords.sort((a, b) => b.length - a.length);
    
    keywords.forEach(keyword => {
      // Escape special regex characters in keyword
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Create case-insensitive regex
      const regex = new RegExp(`(${escapedKeyword})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });
    
    return result;
  }

  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format timestamp as relative time (e.g., "3 hours ago", "2 days ago")
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Formatted relative time string
   */
  formatRelativeTime(timestamp) {
    if (!timestamp) return 'Just now';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} mo ago`;
    return `${years} yr ago`;
  }

  filterByTag(tag) {
    console.log('🏷️ filterByTag called with tag:', tag);
    
    // Ensure we're on the Prompts tab
    if (this.currentTab !== 'prompts') {
      console.log('📍 Switching to Prompts tab for tag filter');
      this.switchTab('prompts');
    }
    
    this.activeFilter = tag;
    this.filteredPrompts = this.prompts.filter(prompt => 
      prompt.tags && prompt.tags.includes(tag)
    );
    
    console.log('✅ Filtered prompts count:', this.filteredPrompts.length);
    
    // Show filter navigation
    const tagFilter = document.getElementById('tagFilter');
    const activeFilterChip = document.getElementById('activeFilterChip');
    if (tagFilter && activeFilterChip) {
      tagFilter.style.display = 'flex';
      // Capitalize tag name for display
      const capitalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1);
      activeFilterChip.textContent = capitalizedTag;
    }
    
    this.renderPrompts();
  }

  clearFilter() {
    console.log('🧹 Clearing filter');
    this.activeFilter = null;
    this.filteredPrompts = [...this.prompts];
    document.getElementById('tagFilter').style.display = 'none';
    
    // Clear search and highlighting
    document.getElementById('searchInput').value = '';
    this.currentSearchQuery = '';
    
    this.renderPrompts();
  }

  openPromptModal(prompt = null, autoFavorite = false) {
    console.log('openPromptModal called', prompt, 'autoFavorite:', autoFavorite);
    const modal = document.getElementById('promptModal');
    console.log('Modal element:', modal);
    
    if (!modal) {
      console.error('Modal element not found!');
      return;
    }
    
    const modalTitle = document.getElementById('modalTitle');
    const titleInput = document.getElementById('promptTitle');
    const contentInput = document.getElementById('promptContent');
    const saveBtn = document.getElementById('savePromptBtn');
    
    // Reset state first
    this.editingPrompt = null;
    this.selectedTags = [];
    this.autoFavoriteOnSave = autoFavorite; // Store for use in savePrompt
    
    // CRITICAL: If currentPromptFolderId is already set (from empty folder), use it
    // Otherwise use prompt's folder or null
    if (!prompt && this.currentPromptFolderId !== undefined) {
      // Creating new prompt from folder view - keep currentPromptFolderId
      console.log('📁 Using pre-set folder ID:', this.currentPromptFolderId);
    } else {
      this.currentPromptFolderId = prompt?.folderId || null;
    }
    
    // Then set values based on prompt
    if (prompt) {
      // EDIT MODE: Store original state for change detection
      this.editingPrompt = prompt;
      this.selectedTags = [...(prompt.tags || [])];
      modalTitle.textContent = 'Edit Prompt';
      titleInput.value = prompt.title;
      contentInput.value = prompt.content;
      saveBtn.textContent = 'Update Prompt';
      
      // Store original state as deep copy
      this.originalPromptState = JSON.parse(JSON.stringify({
        title: prompt.title,
        content: prompt.content,
        tags: prompt.tags || [],
        folderId: prompt.folderId || null
      }));
      
      // Disable save button initially (no changes yet)
      saveBtn.disabled = true;
      saveBtn.classList.add('is-disabled');
      
      // Setup event listeners for change detection
      this.setupSmartEditListeners(titleInput, contentInput);
    } else {
      // CREATE MODE: Button always enabled
      modalTitle.textContent = 'Create New Prompt';
      titleInput.value = '';
      contentInput.value = '';
      saveBtn.textContent = 'Save Prompt';
      
      // No original state in create mode
      this.originalPromptState = null;
      
      // Enable save button
      saveBtn.disabled = false;
      saveBtn.classList.remove('is-disabled');
    }
    
    // Update folder dropdown display
    const folderDropdown = document.getElementById('promptFolderDropdown');
    if (folderDropdown) {
      const selectedText = folderDropdown.querySelector('.selected-folder-text');
      if (this.currentPromptFolderId) {
        // Show selected folder name (normal color)
        selectedText.classList.remove('placeholder-text');
        const folder = this.folderManager.folders.find(f => f.id === this.currentPromptFolderId);
        if (folder) {
          selectedText.textContent = folder.name;
        } else {
          selectedText.textContent = 'Uncategorized';
        }
      } else {
        // No folder selected: show placeholder
        selectedText.textContent = 'Select a Folder';
        selectedText.classList.add('placeholder-text');
      }
    }
    
    this.renderSelectedTags();
    
    // Update placeholder with current variable syntax
    this.updatePromptPlaceholder();
    
    modal.style.display = 'flex';
    modal.style.pointerEvents = 'auto';
    modal.style.visibility = 'visible';
    console.log('Modal display set to flex');
    setTimeout(() => titleInput.focus(), 100);
  }

  /**
   * Setup smart edit event listeners with debouncing
   * Monitors changes to enable/disable save button
   * @param {HTMLElement} titleInput - Title input element
   * @param {HTMLElement} contentInput - Content textarea element
   */
  setupSmartEditListeners(titleInput, contentInput) {
    // Remove any existing listeners to prevent duplicates
    if (this._debouncedUpdateButton) {
      titleInput.removeEventListener('input', this._debouncedUpdateButton);
      contentInput.removeEventListener('input', this._debouncedUpdateButton);
    }
    
    // Create debounced update function (250ms delay for typing)
    this._debouncedUpdateButton = this.debounce(() => {
      this.updatePromptSaveButtonState();
    }, 250);
    
    // Attach debounced listeners to title and content
    titleInput.addEventListener('input', this._debouncedUpdateButton);
    contentInput.addEventListener('input', this._debouncedUpdateButton);
    
    // Note: Folder and tag changes trigger immediate updates
    // These are handled in selectPromptFolder() and tag add/remove methods
  }

  closePromptModal(options = {}) {
    const { skipPanelClose = false } = options; // true when saving (don't auto-close panel)
    const modal = document.getElementById('promptModal');
    
    modal.style.display = 'none';
    modal.style.pointerEvents = 'none';
    modal.style.visibility = 'hidden';
    
    // Hide Tippy dropdown if open (can block clicks when modal closes)
    this.promptFolderTippy?.hide();
    
    // Clear all state and inputs
    this.editingPrompt = null;
    this.selectedTags = [];
    this.originalPromptState = null; // Clear original state
    
    // Clear form inputs
    document.getElementById('promptTitle').value = '';
    document.getElementById('promptContent').value = '';
    
    // Clear tag selector display
    this.renderSelectedTags();
    
    // When opened from "Save as Prompt" and user cancels (not saves), close entire panel
    if (this.openedFromSaveAsPrompt && !skipPanelClose && window.top !== window.self) {
      this.openedFromSaveAsPrompt = false;
      window.parent.postMessage({ action: 'closePromptPanel' }, '*');
      chrome.runtime.sendMessage({ action: 'closeInjectedPanel' }).catch(() => {});
    } else {
      this.openedFromSaveAsPrompt = false;
    }
  }

  /**
   * Initialize custom folder dropdown handlers
   */
  initCustomFolderDropdowns() {
    // Initialize Tippy.js for Prompt Folder Dropdown
    const promptDropdown = document.getElementById('promptFolderDropdown');
    if (promptDropdown) {
      const trigger = promptDropdown.querySelector('.custom-folder-dropdown-trigger');
      const menu = promptDropdown.querySelector('.custom-folder-dropdown-menu');
      
      if (trigger && menu && typeof tippy !== 'undefined') {
        this.promptFolderTippy = tippy(trigger, {
          content: menu,
          allowHTML: true,
          trigger: 'click',
          interactive: true,
          appendTo: () => document.body,
          placement: 'bottom-start',
          maxWidth: '320px',
          theme: 'prompt-folder',
          arrow: false,
          offset: [0, 4],
          onShow: (instance) => {
            // Reset keyboard navigation state
            const menuElement = instance.popper.querySelector('.custom-folder-dropdown-menu');
            if (menuElement) {
              menuElement.dataset.lastKeyPressed = '';
              menuElement.dataset.lastKeyTime = '0';
              menuElement.dataset.currentMatchIndex = '-1';
              
              // Populate dropdown content
              this.populatePromptFolderDropdown(promptDropdown);
            }
          },
          onShown: (instance) => {
            // Set up keyboard navigation
            const menuElement = instance.popper.querySelector('.custom-folder-dropdown-menu');
            if (menuElement) {
              this.setupFolderDropdownKeyboardNav(menuElement, instance);
              // Focus first interactive item
              const firstItem = menuElement.querySelector('.folder-tree-dropdown-item');
              if (firstItem) {
                firstItem.setAttribute('tabindex', '0');
                firstItem.focus();
              }
            }
          },
          onHide: () => {
            // Cleanup keyboard listeners
            if (this._dropdownKeydownHandler) {
              document.removeEventListener('keydown', this._dropdownKeydownHandler);
              this._dropdownKeydownHandler = null;
            }
          }
        });
      } else {
        // Fallback to old behavior if Tippy not available
        trigger?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleCustomFolderDropdown('promptFolderDropdown');
        });
      }
    }

    // Folder parent dropdown (keep original behavior for now)
    const parentDropdown = document.getElementById('folderParentDropdown');
    if (parentDropdown) {
      const trigger = parentDropdown.querySelector('.custom-folder-dropdown-trigger');
      trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCustomFolderDropdown('folderParentDropdown');
      });
    }

    // Close dropdowns when clicking outside (for non-Tippy dropdowns)
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-folder-dropdown')) {
        document.querySelectorAll('.custom-folder-dropdown').forEach(dropdown => {
          dropdown.classList.remove('open');
        });
      }
    });
  }

  /**
   * Close folder dropdown (works with both Tippy and non-Tippy dropdowns)
   */
  closeFolderDropdown(dropdownIdOrElement) {
    // Handle both ID string and element
    const dropdown = typeof dropdownIdOrElement === 'string' 
      ? document.getElementById(dropdownIdOrElement)
      : dropdownIdOrElement;
    
    if (!dropdown) return;
    
    // Check if this dropdown uses Tippy
    if (dropdown.id === 'promptFolderDropdown' && this.promptFolderTippy) {
      this.promptFolderTippy.hide();
    } else {
      // Fallback to CSS class method
      dropdown.classList.remove('open');
    }
  }

  /**
   * Setup keyboard navigation for folder dropdown
   * Preserves the existing type-to-navigate functionality
   */
  setupFolderDropdownKeyboardNav(menuElement, tippyInstance) {
    const keydownHandler = (e) => {
      // Only handle if menu is visible
      if (!tippyInstance.state.isVisible) return;
      
      // Only handle letter keys for type-to-navigate
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        
        const typedKey = e.key.toLowerCase();
        const currentTime = Date.now();
        const lastKeyTime = parseInt(menuElement.dataset.lastKeyTime) || 0;
        const lastKeyPressed = menuElement.dataset.lastKeyPressed || '';
        const parsedIndex = parseInt(menuElement.dataset.currentMatchIndex);
        const currentMatchIndex = isNaN(parsedIndex) ? -1 : parsedIndex;
        
        const isCycling = (typedKey === lastKeyPressed && currentTime - lastKeyTime < 1000);
        
        // Get all folder items
        const allItems = Array.from(menuElement.querySelectorAll('.folder-tree-dropdown-item'));
        const matchingItems = allItems.filter(item => {
          const folderName = item.dataset.folderName || '';
          return folderName.toLowerCase().startsWith(typedKey);
        });
        
        if (matchingItems.length === 0) return;
        
        // Calculate target index
        let targetIndex = 0;
        if (isCycling) {
          targetIndex = (currentMatchIndex + 1) % matchingItems.length;
        }
        
        const targetElement = matchingItems[targetIndex];
        
        // Remove previous focus
        allItems.forEach(item => item.classList.remove('keyboard-focused'));
        
        // Add focus to target
        targetElement.classList.add('keyboard-focused');
        targetElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        
        // Update state
        menuElement.dataset.lastKeyPressed = typedKey;
        menuElement.dataset.lastKeyTime = currentTime.toString();
        menuElement.dataset.currentMatchIndex = targetIndex.toString();
      }
      
      // Handle Enter key
      if (e.key === 'Enter') {
        const focusedItem = menuElement.querySelector('.folder-tree-dropdown-item.keyboard-focused');
        if (focusedItem) {
          e.preventDefault();
          e.stopPropagation();
          focusedItem.click();
          tippyInstance.hide();
        }
      }
      
      // Handle Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        tippyInstance.hide();
      }
    };
    
    // Store and attach handler
    this._dropdownKeydownHandler = keydownHandler;
    document.addEventListener('keydown', keydownHandler);
  }

  /**
   * Toggle custom folder dropdown (fallback for non-Tippy dropdowns)
   */
  toggleCustomFolderDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('open');
    
    // Close all dropdowns first
    document.querySelectorAll('.custom-folder-dropdown').forEach(d => {
      d.classList.remove('open');
      // Clear keyboard focus when closing
      const menu = d.querySelector('.custom-folder-dropdown-menu');
      if (menu) {
        menu.querySelectorAll('.folder-tree-dropdown-item.keyboard-focused')
          .forEach(item => item.classList.remove('keyboard-focused'));
      }
    });

    // Open this one if it was closed
    if (!isOpen) {
      dropdown.classList.add('open');
      
      // CRITICAL FIX: Reset keyboard navigation state when reopening
      dropdown.dataset.lastKeyPressed = '';
      dropdown.dataset.lastKeyTime = '0';
      dropdown.dataset.currentMatchIndex = '-1';
      
      // Populate dropdown based on type using ELITE tree dropdown
      if (dropdownId === 'promptFolderDropdown') {
        this.populateEliteFolderDropdown(dropdown, {
          dropdownType: 'prompt',
          selectedFolderId: this.currentPromptFolderId,
          showUncategorized: false
        });
      } else if (dropdownId === 'folderParentDropdown') {
        const folderModal = document.getElementById('folderModal');
        const editingFolderId = folderModal?.dataset.editingFolderId;
        this.populateEliteFolderDropdown(dropdown, {
          dropdownType: 'parent',
          excludeFolderId: editingFolderId,
          selectedFolderId: folderModal?.dataset.selectedParentId,
          showUncategorized: false
        });
      }
    }
  }

  /**
   * Populate prompt folder dropdown with collapsible tree + Uncategorized
   */
  populatePromptFolderDropdown(dropdown) {
    console.log('📂 populatePromptFolderDropdown called');
    console.log('📊 FolderManager state:', {
      initialized: !!this.folderManager,
      foldersCount: this.folderManager?.folders?.length || 0,
      folders: this.folderManager?.folders || []
    });
    
    const menu = dropdown.querySelector('.custom-folder-dropdown-menu');
    if (!menu) {
      console.error('❌ Dropdown menu not found!');
      return;
    }

    menu.innerHTML = '';

    // Add "Create New Folder" option with center alignment
    const newFolderOption = document.createElement('div');
    newFolderOption.className = 'folder-tree-dropdown-action';  // Use action class (11px, clickable)
    newFolderOption.textContent = 'Create New Folder';
    newFolderOption.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeFolderDropdown(dropdown);
      // Context-aware: Get current folder from navigation path
      const currentFolder = this.folderPath[this.folderPath.length - 1];
      const parentId = currentFolder && currentFolder.id !== '__uncategorized__' ? currentFolder.id : null;
      this.openFolderModal(parentId);
    });
    menu.appendChild(newFolderOption);

    // Add separator
    if (this.folderManager.folders.length > 0) {
      const separator = document.createElement('div');
      separator.className = 'folder-tree-dropdown-divider';
      menu.appendChild(separator);
    }

    // RECENTLY USED FOLDERS (Top 5)
    const recentFoldersToShow = this.recentFolders
      .slice(0, 5)
      .filter(recent => this.folderManager.folders.some(f => f.id === recent.id)); // Filter out deleted folders

    if (recentFoldersToShow.length > 0) {
      // Add "RECENT FOLDERS" header (center-aligned)
      const recentHeader = document.createElement('div');
      recentHeader.className = 'folder-tree-dropdown-header';
      recentHeader.textContent = 'RECENT FOLDERS';
      menu.appendChild(recentHeader);

      // Add recent folders
      recentFoldersToShow.forEach(recent => {
        const folder = this.folderManager.folders.find(f => f.id === recent.id);
        if (!folder) return;

        const item = document.createElement('div');
        item.className = 'folder-tree-dropdown-item';
        item.dataset.folderName = folder.name; // For keyboard navigation
        item.dataset.folderId = folder.id;
        item.innerHTML = `
          <span class="folder-chevron-spacer"></span>
          <span class="folder-name">${folder.name}</span>
        `;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.currentPromptFolderId = folder.id;
          const selectedText = dropdown.querySelector('.selected-folder-text');
          if (selectedText) {
            selectedText.textContent = folder.name;
            selectedText.classList.remove('placeholder-text');
          }
          this.closeFolderDropdown(dropdown);
          
          // Trigger button state update for smart edit modal
          this.updatePromptSaveButtonState();
        });

        menu.appendChild(item);
      });

      // Add separator before all folders
      const separator2 = document.createElement('div');
      separator2.className = 'folder-tree-dropdown-divider';
      menu.appendChild(separator2);

      // Add "ALL FOLDERS" header (center-aligned, consistent styling)
      const allHeader = document.createElement('div');
      allHeader.className = 'folder-tree-dropdown-header';
      allHeader.textContent = 'ALL FOLDERS';
      menu.appendChild(allHeader);
    }

    // Build COLLAPSIBLE folder tree (only root folders shown initially)
    const buildCollapsibleTree = (parentId, level = 0) => {
      const folders = this.folderManager.folders.filter(f => f.parentId === parentId);
      folders.sort((a, b) => a.order - b.order);

      folders.forEach(folder => {
        // Check if folder has children
        const hasChildren = this.folderManager.folders.some(f => f.parentId === folder.id);
        
        // Create folder item
        const item = document.createElement('div');
        item.className = 'folder-tree-dropdown-item collapsible-folder';
        item.dataset.folderName = folder.name; // For keyboard navigation
        item.dataset.folderId = folder.id;
        item.dataset.level = level;
        if (hasChildren) item.dataset.hasChildren = 'true';
        
        const indent = '\u00A0\u00A0'.repeat(level);
        
        // Build HTML with optional chevron
        if (hasChildren) {
          item.innerHTML = `
            <span class="folder-chevron" data-folder-id="${folder.id}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
            <span class="folder-name">${indent}${folder.name}</span>
          `;
          
          // Chevron click handler - toggle children
          const chevron = item.querySelector('.folder-chevron');
          chevron.addEventListener('click', (e) => {
            e.stopPropagation();
            const childrenContainer = item.nextElementSibling;
            if (childrenContainer && childrenContainer.classList.contains('folder-tree-children')) {
              const isExpanded = childrenContainer.style.display === 'block';
              childrenContainer.style.display = isExpanded ? 'none' : 'block';
              item.classList.toggle('expanded', !isExpanded);
            }
          });
        } else {
          item.innerHTML = `
            <span class="folder-name">${indent}${folder.name}</span>
          `;
        }

        // Folder name click handler - select folder
        const folderName = item.querySelector('.folder-name');
        folderName.addEventListener('click', (e) => {
          e.stopPropagation();
          this.currentPromptFolderId = folder.id;
          const selectedText = dropdown.querySelector('.selected-folder-text');
          if (selectedText) {
            selectedText.textContent = folder.name;
            selectedText.classList.remove('placeholder-text');
          }
          this.closeFolderDropdown(dropdown);
          
          // Trigger button state update for smart edit modal
          this.updatePromptSaveButtonState();
        });

        menu.appendChild(item);
        
        // Create children container (hidden by default)
        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'folder-tree-children';
          childrenContainer.style.display = 'none'; // Collapsed by default
          childrenContainer.dataset.parentId = folder.id;
          menu.appendChild(childrenContainer);
          
          // Build children into container
          buildCollapsibleTree(folder.id, level + 1);
        }
      });
    };

    // Append children to the correct parent container in the menu
    const appendToParentContainer = (parentId, item, childrenContainer) => {
      if (parentId === null) {
        // Root level - append directly to menu
        menu.appendChild(item);
        if (childrenContainer) menu.appendChild(childrenContainer);
      } else {
        // Find parent's children container
        const parentContainer = menu.querySelector(`.folder-tree-children[data-parent-id="${parentId}"]`);
        if (parentContainer) {
          parentContainer.appendChild(item);
          if (childrenContainer) parentContainer.appendChild(childrenContainer);
        }
      }
    };

    // Modified build function to properly nest items
    const buildNestedTree = (parentId, level = 0) => {
      const folders = this.folderManager.folders.filter(f => f.parentId === parentId);
      folders.sort((a, b) => a.order - b.order);

      folders.forEach(folder => {
        const hasChildren = this.folderManager.folders.some(f => f.parentId === folder.id);
        
        const item = document.createElement('div');
        item.className = 'folder-tree-dropdown-item collapsible-folder';
        item.dataset.folderName = folder.name; // For keyboard navigation
        item.dataset.folderId = folder.id;
        item.dataset.level = level;
        if (hasChildren) item.dataset.hasChildren = 'true';
        
        if (hasChildren) {
          item.innerHTML = `
            <span class="folder-chevron" data-folder-id="${folder.id}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
            <span class="folder-name">${folder.name}</span>
          `;
          
          const chevron = item.querySelector('.folder-chevron');
          chevron.addEventListener('click', (e) => {
            e.stopPropagation();
            const childrenContainer = item.nextElementSibling;
            if (childrenContainer && childrenContainer.classList.contains('folder-tree-children')) {
              const isExpanded = childrenContainer.style.display === 'block';
              childrenContainer.style.display = isExpanded ? 'none' : 'block';
              item.classList.toggle('expanded', !isExpanded);
            }
          });
        } else {
          item.innerHTML = `
            <span class="folder-chevron-spacer"></span>
            <span class="folder-name">${folder.name}</span>
          `;
        }

        const folderName = item.querySelector('.folder-name');
        folderName.addEventListener('click', (e) => {
          e.stopPropagation();
          this.currentPromptFolderId = folder.id;
          const selectedText = dropdown.querySelector('.selected-folder-text');
          if (selectedText) {
            selectedText.textContent = folder.name;
            selectedText.classList.remove('placeholder-text');
          }
          this.closeFolderDropdown(dropdown);
          
          // Trigger button state update for smart edit modal
          this.updatePromptSaveButtonState();
        });

        appendToParentContainer(parentId, item, null);
        
        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'folder-tree-children';
          childrenContainer.style.display = 'none';
          childrenContainer.dataset.parentId = folder.id;
          appendToParentContainer(parentId, childrenContainer, null);
          
          buildNestedTree(folder.id, level + 1);
        }
      });
    };

    buildNestedTree(null, 0);
    
    // Setup keyboard navigation for type-to-navigate feature
    this.setupDropdownKeyboardNavigation(dropdown);
    
    console.log('✅ Dropdown populated with collapsible tree + keyboard navigation');
  }

  /**
   * Populate folder parent dropdown with ELITE FEATURES:
   * - Recent Folders (top 5)
   * - Separator
   * - All Folders (collapsible tree, root level only by default)
   */
  populateFolderParentDropdown(dropdown) {
    console.log('📂 populateFolderParentDropdown called');
    
    const menu = dropdown.querySelector('.custom-folder-dropdown-menu');
    if (!menu) {
      console.error('❌ Dropdown menu not found!');
      return;
    }

    menu.innerHTML = '';
    const editingFolderId = document.getElementById('folderModal')?.dataset.editingFolderId;
    
    // Store all clickable items for keyboard navigation
    const allClickableItems = [];

    // Add Root option first (always visible)
    const rootItem = document.createElement('div');
    rootItem.className = 'folder-tree-dropdown-item root-item';
    rootItem.dataset.folderName = 'Root'; // For keyboard navigation
    rootItem.innerHTML = `
      <span class="folder-name" style="text-align: center; width: 100%;">Root</span>
    `;
    rootItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectParentFolder(dropdown, null, 'Root');
    });
    menu.appendChild(rootItem);
    allClickableItems.push(rootItem);

    // SECTION 1: RECENT FOLDERS (Top 5 most recently used as parent)
    console.log('🔍 Checking recentFolders:', this.recentFolders);
    
    let recentParentFolders = this.recentFolders
      .filter(recent => recent.usedAsParent) // Only folders used as parents
      .slice(0, 5)
      .filter(recent => {
        // Filter out deleted folders and the folder being edited
        return this.folderManager.folders.some(f => f.id === recent.id && f.id !== editingFolderId);
      });

    // FALLBACK: If no recent folders tracked yet, show first 5 existing folders
    if (recentParentFolders.length === 0 && this.folderManager.folders.length > 0) {
      const availableFolders = this.folderManager.folders
        .filter(f => f.id !== editingFolderId)
        .slice(0, 5);
      
      recentParentFolders = availableFolders.map(f => ({ id: f.id, name: f.name }));
      console.log('📋 Using fallback folders for Recent section:', recentParentFolders);
    }

    console.log('📊 Final recentParentFolders to display:', recentParentFolders);

    if (recentParentFolders.length > 0) {
      // Add separator
      const separator1 = document.createElement('div');
      separator1.className = 'folder-tree-dropdown-divider';
      menu.appendChild(separator1);

      // Add "RECENT FOLDERS" header
      const recentHeader = document.createElement('div');
      recentHeader.className = 'folder-tree-dropdown-header';
      recentHeader.textContent = 'RECENT FOLDERS';
      menu.appendChild(recentHeader);

      // Add recent folder items
      recentParentFolders.forEach(recent => {
        // Handle both tracked folders and fallback folders
        const folderId = recent.id;
        const folderName = recent.name || this.folderManager.folders.find(f => f.id === folderId)?.name;
        
        if (!folderName) return; // Skip if folder not found

        const item = document.createElement('div');
        item.className = 'folder-tree-dropdown-item';
        item.dataset.folderName = folderName; // For keyboard navigation
        item.innerHTML = `
          <span class="folder-chevron-spacer"></span>
          <span class="folder-name">${folderName}</span>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectParentFolder(dropdown, folderId, folderName);
        });
        menu.appendChild(item);
        allClickableItems.push(item);
      });
    }

    // Add separator before ALL FOLDERS section
    if (this.folderManager.folders.length > 0) {
      const separator2 = document.createElement('div');
      separator2.className = 'folder-tree-dropdown-divider';
      menu.appendChild(separator2);

      // Add "ALL FOLDERS" header
      const allHeader = document.createElement('div');
      allHeader.className = 'folder-tree-dropdown-header';
      allHeader.textContent = 'ALL FOLDERS';
      menu.appendChild(allHeader);
    }

    // SECTION 2: ALL FOLDERS (Interactive Tree View)
    // Default State: Only root-level folders shown
    // Interaction: Chevron click expands/collapses children recursively
    
    // Helper to append items to correct parent container
    const appendToParentContainer = (parentId, item, childrenContainer) => {
      if (parentId === null) {
        menu.appendChild(item);
        if (childrenContainer) menu.appendChild(childrenContainer);
      } else {
        const parentContainer = menu.querySelector(`.folder-tree-children[data-parent-id="${parentId}"]`);
        if (parentContainer) {
          parentContainer.appendChild(item);
          if (childrenContainer) parentContainer.appendChild(childrenContainer);
        }
      }
    };
    
    const buildCollapsibleTree = (parentId, level = 0) => {
      const folders = this.folderManager.folders.filter(f => {
        if (f.parentId !== parentId) return false;
        if (f.id === editingFolderId) return false; // Can't select folder being edited as parent
        return true;
      });
      
      folders.sort((a, b) => a.order - b.order);

      folders.forEach(folder => {
        // Check if folder has children (excluding the folder being edited)
        const hasChildren = this.folderManager.folders.some(
          f => f.parentId === folder.id && f.id !== editingFolderId
        );
        
        // Create folder item
        const item = document.createElement('div');
        item.className = 'folder-tree-dropdown-item collapsible-folder';
        item.dataset.folderId = folder.id;
        item.dataset.folderName = folder.name; // For keyboard navigation
        item.dataset.level = level;
        if (hasChildren) item.dataset.hasChildren = 'true';
        
        // Build HTML: Chevron (if has children) + Folder Name (text-only, no icon)
        if (hasChildren) {
          item.innerHTML = `
            <span class="folder-chevron" data-folder-id="${folder.id}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
            <span class="folder-name">${folder.name}</span>
          `;
          
          // Chevron click handler: Toggle expand/collapse
          const chevron = item.querySelector('.folder-chevron');
          chevron.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFolderInDropdown(item);
          });
        } else {
          // No children: Use spacer to maintain alignment
          item.innerHTML = `
            <span class="folder-chevron-spacer"></span>
            <span class="folder-name">${folder.name}</span>
          `;
        }

        // Folder name click handler: Select this folder as parent
        const folderNameEl = item.querySelector('.folder-name');
        folderNameEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectParentFolder(dropdown, folder.id, folder.name);
        });

        appendToParentContainer(parentId, item, null);
        allClickableItems.push(item);
        
        // Create children container if folder has children
        if (hasChildren) {
          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'folder-tree-children';
          childrenContainer.style.display = 'none'; // Hidden by default
          childrenContainer.dataset.parentId = folder.id;
          appendToParentContainer(parentId, childrenContainer, null);
          
          // Recursively build children (they'll be hidden initially)
          buildCollapsibleTree(folder.id, level + 1);
        }
      });
    };

    // Build the tree starting from root level
    buildCollapsibleTree(null, 0);
    
    // Store clickable items on dropdown for keyboard navigation
    dropdown.dataset.clickableItems = JSON.stringify(
      allClickableItems.map(item => item.dataset.folderName || 'Root')
    );
    
    // Setup keyboard navigation for this dropdown
    this.setupDropdownKeyboardNavigation(dropdown, allClickableItems);
    
    console.log('✅ Parent dropdown populated with ELITE features');
  }

  /**
   * Toggle folder expand/collapse in dropdown with smooth animation
   */
  toggleFolderInDropdown(folderItem) {
    const childrenContainer = folderItem.nextElementSibling;
    if (childrenContainer && childrenContainer.classList.contains('folder-tree-children')) {
      const isExpanded = childrenContainer.style.display === 'block';
      childrenContainer.style.display = isExpanded ? 'none' : 'block';
      folderItem.classList.toggle('expanded', !isExpanded);
    }
  }

  /**
   * Select a parent folder and track it as recent
   */
  async selectParentFolder(dropdown, folderId, folderName) {
    this.currentFolderParentId = folderId;
    const selectedText = dropdown.querySelector('.selected-folder-text');
    if (selectedText) {
      selectedText.textContent = folderName;
      selectedText.classList.remove('placeholder-text');
    }
    this.closeFolderDropdown(dropdown);
    
    // Track as recent parent folder (ELITE FEATURE)
    if (folderId) {
      await this.trackRecentParentFolder(folderId);
    }
  }

  /**
   * Track folder usage as parent (for Recent Folders section)
   */
  async trackRecentParentFolder(folderId) {
    console.log('📌 Tracking folder as parent:', folderId);
    
    // Remove if already exists
    this.recentFolders = this.recentFolders.filter(r => r.id !== folderId);
    
    // Add to front with parent flag
    this.recentFolders.unshift({
      id: folderId,
      timestamp: Date.now(),
      usedAsParent: true
    });
    
    // Keep only last 10
    this.recentFolders = this.recentFolders.slice(0, 10);
    
    // Save to storage
    await chrome.storage.local.set({ recentFolders: this.recentFolders });
    
    console.log('✅ Recent folders updated:', this.recentFolders);
  }

  /**
   * ========================================
   * ELITE HIERARCHICAL TREE DROPDOWN
   * ========================================
   */

  /**
   * Create elite search box with clear button
   */
  createEliteSearchBox(dropdown) {
    const searchBox = document.createElement('div');
    searchBox.className = 'folder-dropdown-search-box';
    searchBox.innerHTML = `
      <div class="folder-dropdown-search">
        <svg class="folder-dropdown-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input 
          type="text" 
          class="folder-dropdown-search-input" 
          placeholder="Search folders..."
          autocomplete="off"
        />
        <button class="folder-dropdown-search-clear" style="display: none;" aria-label="Clear search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    return searchBox;
  }

  /**
   * Populate elite folder dropdown with search and tree view
   */
  populateEliteFolderDropdown(dropdown, options = {}) {
    const { 
      excludeFolderId = null, 
      selectedFolderId = null,
      showUncategorized = false,
      dropdownType = 'prompt' // 'prompt' or 'parent'
    } = options;

    const menu = dropdown.querySelector('.custom-folder-dropdown-menu');
    if (!menu) return;

    menu.innerHTML = '';
    menu.style.display = 'flex';
    menu.style.flexDirection = 'column';

    // Add search box
    const searchBox = this.createEliteSearchBox(dropdown);
    menu.appendChild(searchBox);

    // Add tree container
    const treeContainer = document.createElement('div');
    treeContainer.className = 'elite-folder-tree-container';
    menu.appendChild(treeContainer);

    // Build and render tree
    const treeList = document.createElement('ul');
    treeList.className = 'elite-folder-tree-list';
    treeContainer.appendChild(treeList);

    const folders = this.folderManager.folders.filter(f => f.id !== excludeFolderId);
    this.renderEliteTreeItems(treeList, folders, null, 0, selectedFolderId, dropdown, dropdownType);

    // Add create folder button
    const createAction = this.createEliteCreateFolderButton(dropdown);
    menu.appendChild(createAction);

    // Setup search functionality
    this.setupEliteSearch(dropdown);
  }

  /**
   * Render elite tree items recursively
   */
  renderEliteTreeItems(container, allFolders, parentId, depth, selectedFolderId, dropdown, dropdownType) {
    const folders = allFolders.filter(f => f.parentId === parentId);
    folders.sort((a, b) => a.order - b.order);

    folders.forEach((folder, index) => {
      const hasChildren = allFolders.some(f => f.parentId === folder.id);
      const isLast = index === folders.length - 1;
      const isSelected = folder.id === selectedFolderId;

      // Create folder item
      const li = document.createElement('li');
      li.className = `elite-folder-item${hasChildren ? ' expandable' : ''}${isSelected ? ' selected' : ''}`;
      li.dataset.folderId = folder.id;
      li.dataset.depth = depth;
      li.dataset.folderName = folder.name.toLowerCase();

      const itemContent = document.createElement('div');
      itemContent.className = 'elite-folder-item-content';

      // Add indentation spacers
      for (let i = 0; i < depth; i++) {
        const spacer = document.createElement('span');
        spacer.className = 'elite-folder-spacer';
        itemContent.appendChild(spacer);
      }

      // Add tree line for nested items
      if (depth > 0) {
        const treeLine = document.createElement('span');
        treeLine.className = `elite-tree-line${isLast ? ' tree-line-last' : ''}`;
        itemContent.appendChild(treeLine);
      }

      // Add expand/collapse button for folders with children
      if (hasChildren) {
        const expandBtn = document.createElement('button');
        expandBtn.className = 'elite-folder-expand-btn';
        expandBtn.setAttribute('aria-label', `Expand ${folder.name}`);
        expandBtn.innerHTML = `
          <svg class="elite-chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
        expandBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleEliteFolderExpansion(li);
        });
        itemContent.appendChild(expandBtn);
      }

      // Add folder icon
      const iconWrapper = document.createElement('span');
      iconWrapper.className = 'elite-folder-icon-wrapper';
      iconWrapper.setAttribute('data-lucide', folder.icon || 'folder');
      itemContent.appendChild(iconWrapper);

      // Add folder name
      const nameText = document.createElement('span');
      nameText.className = 'elite-folder-name-text';
      nameText.textContent = folder.name;
      itemContent.appendChild(nameText);

      // Add color badge
      const badge = document.createElement('span');
      badge.className = 'elite-folder-color-badge';
      badge.style.backgroundColor = folder.color || '#22B8CF';
      itemContent.appendChild(badge);

      // Click handler for selection
      itemContent.addEventListener('click', () => {
        this.selectEliteFolder(dropdown, folder, dropdownType);
      });

      li.appendChild(itemContent);
      container.appendChild(li);

      // Render children if has children
      if (hasChildren) {
        const childrenUl = document.createElement('ul');
        childrenUl.className = 'elite-folder-tree-children';
        li.appendChild(childrenUl);

        this.renderEliteTreeItems(childrenUl, allFolders, folder.id, depth + 1, selectedFolderId, dropdown, dropdownType);
      }

      // Reinitialize Lucide icons
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    });
  }

  /**
   * Toggle folder expansion
   */
  toggleEliteFolderExpansion(folderItem) {
    const isExpanded = folderItem.classList.contains('expanded');
    folderItem.classList.toggle('expanded');
    
    const chevronBtn = folderItem.querySelector('.elite-folder-expand-btn');
    if (chevronBtn) {
      const label = isExpanded ? 'Expand' : 'Collapse';
      const folderName = folderItem.dataset.folderName;
      chevronBtn.setAttribute('aria-label', `${label} ${folderName}`);
    }
  }

  /**
   * Select elite folder
   */
  selectEliteFolder(dropdown, folder, dropdownType) {
    // Remove previous selection
    dropdown.querySelectorAll('.elite-folder-item.selected').forEach(item => {
      item.classList.remove('selected');
    });

    // Add new selection
    const selectedItem = dropdown.querySelector(`[data-folder-id="${folder.id}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }

    // Update trigger button text
    const trigger = dropdown.querySelector('.custom-folder-dropdown-trigger');
    const selectedText = trigger?.querySelector('.selected-folder-text');
    if (selectedText) {
      selectedText.textContent = folder.name;
      selectedText.classList.remove('placeholder-text');
    }

    // Store selection based on dropdown type
    if (dropdownType === 'prompt') {
      this.currentPromptFolderId = folder.id;
      this.updatePromptSaveButtonState();
    } else if (dropdownType === 'parent') {
      // For parent folder selection in folder modal
      const folderModal = document.getElementById('folderModal');
      if (folderModal) {
        folderModal.dataset.selectedParentId = folder.id;
      }
    }

    // Close dropdown
    this.closeFolderDropdown(dropdown);

    // Track recent usage
    this.trackRecentFolder(folder.id);
  }

  /**
   * Create elite create folder button
   */
  createEliteCreateFolderButton(dropdown) {
    const createAction = document.createElement('div');
    createAction.className = 'elite-folder-create-action';
    
    const createBtn = document.createElement('button');
    createBtn.className = 'elite-create-folder-btn';
    createBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Create New Folder</span>
    `;
    
    createBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeFolderDropdown(dropdown);
      
      // Get current context for parent folder
      const currentFolder = this.folderPath[this.folderPath.length - 1];
      const parentId = currentFolder && currentFolder.id !== '__uncategorized__' ? currentFolder.id : null;
      this.openFolderModal(parentId);
    });
    
    createAction.appendChild(createBtn);
    return createAction;
  }

  /**
   * Setup elite search functionality
   */
  setupEliteSearch(dropdown) {
    const searchInput = dropdown.querySelector('.folder-dropdown-search-input');
    const clearBtn = dropdown.querySelector('.folder-dropdown-search-clear');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      this.filterEliteFolders(dropdown, query);
      
      // Show/hide clear button
      if (clearBtn) {
        clearBtn.style.display = query ? 'flex' : 'none';
      }
    });

    // Clear button click handler
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        searchInput.value = '';
        clearBtn.style.display = 'none';
        this.filterEliteFolders(dropdown, '');
        searchInput.focus();
      });
    }

    // Clear search on close
    dropdown.addEventListener('close', () => {
      searchInput.value = '';
      if (clearBtn) {
        clearBtn.style.display = 'none';
      }
      this.filterEliteFolders(dropdown, '');
    });
  }

  /**
   * Toggle folder expansion
   */
  toggleEliteFolderExpansion(folderItem) {
  const isExpanded = folderItem.classList.contains('expanded');
  folderItem.classList.toggle('expanded');
  
  const chevronBtn = folderItem.querySelector('.elite-folder-expand-btn');
  if (chevronBtn) {
    const label = isExpanded ? 'Expand' : 'Collapse';
    const folderName = folderItem.dataset.folderName;
    chevronBtn.setAttribute('aria-label', `${label} ${folderName}`);
  }
}

  /**
   * Select elite folder
   */
  selectEliteFolder(dropdown, folder, dropdownType) {
    // Remove previous selection
    dropdown.querySelectorAll('.elite-folder-item.selected').forEach(item => {
      item.classList.remove('selected');
    });

    // Add new selection
    const selectedItem = dropdown.querySelector(`[data-folder-id="${folder.id}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }

    // Update trigger button text
    const trigger = dropdown.querySelector('.custom-folder-dropdown-trigger');
    const selectedText = trigger?.querySelector('.selected-folder-text');
    if (selectedText) {
      selectedText.textContent = folder.name;
      selectedText.classList.remove('placeholder-text');
    }

    // Store selection based on dropdown type
    if (dropdownType === 'prompt') {
      this.currentPromptFolderId = folder.id;
      this.updatePromptSaveButtonState();
    } else if (dropdownType === 'parent') {
      // For parent folder selection in folder modal
      const folderModal = document.getElementById('folderModal');
      if (folderModal) {
        folderModal.dataset.selectedParentId = folder.id;
      }
    }

    // Close dropdown
    this.closeFolderDropdown(dropdown);

    // Track recent usage
    this.trackRecentFolder(folder.id);
  }

  /**
   * Create elite create folder button
   */
  createEliteCreateFolderButton(dropdown) {
    const createAction = document.createElement('div');
    createAction.className = 'elite-folder-create-action';
    
    const createBtn = document.createElement('button');
    createBtn.className = 'elite-create-folder-btn';
    createBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Create New Folder</span>
    `;
    
    createBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeFolderDropdown(dropdown);
      
      // Get current context for parent folder
      const currentFolder = this.folderPath[this.folderPath.length - 1];
      const parentId = currentFolder && currentFolder.id !== '__uncategorized__' ? currentFolder.id : null;
      this.openFolderModal(parentId);
    });
    
    createAction.appendChild(createBtn);
    return createAction;
  }

  /**
   * Filter elite folders based on search query
   */
  filterEliteFolders(dropdown, query) {
  const allItems = dropdown.querySelectorAll('.elite-folder-item');
  const menu = dropdown.querySelector('.custom-folder-dropdown-menu');
  const searchBox = dropdown.querySelector('.folder-dropdown-search-box');
  
  // Remove existing "no matches" message if present
  const existingNoMatches = dropdown.querySelector('.dropdown-no-matches');
  if (existingNoMatches) {
    existingNoMatches.remove();
  }
  
  if (!query) {
    // Show all, collapse all
    allItems.forEach(item => {
      item.style.display = '';
      item.classList.remove('expanded');
    });
    return;
  }

  // Hide all first
  allItems.forEach(item => item.style.display = 'none');

  // Find matches
  const matches = Array.from(allItems).filter(item => {
    const folderName = item.dataset.folderName || '';
    return folderName.includes(query);
  });

  // If no matches found, show "No matches found" message RIGHT AFTER search box
  if (matches.length === 0 && menu && searchBox) {
    const noMatchesDiv = document.createElement('div');
    noMatchesDiv.className = 'dropdown-no-matches';
    noMatchesDiv.textContent = 'No matches found';
    noMatchesDiv.style.cssText = 'padding: 16px; text-align: center; color: #9CA3AF; font-size: 13px; font-weight: 500;';
    // Insert after search box, not at end of menu
    searchBox.insertAdjacentElement('afterend', noMatchesDiv);
    return;
  }

  // Show matches and their ancestors
  matches.forEach(item => {
    item.style.display = '';
    
    // Show all parent folders
    let parent = item.parentElement.closest('.elite-folder-item');
    while (parent) {
      parent.style.display = '';
      parent.classList.add('expanded'); // Auto-expand parents
      parent = parent.parentElement.closest('.elite-folder-item');
    }
  });
}

/**
 * Track recent folder usage
 */
async trackRecentFolder(folderId) {
  // Remove if already exists
  this.recentFolders = this.recentFolders.filter(r => r.id !== folderId);
  
  // Add to front
  this.recentFolders.unshift({
    id: folderId,
    timestamp: Date.now()
  });
  
  // Keep only last 10
  this.recentFolders = this.recentFolders.slice(0, 10);
  
  // Save to storage
  await chrome.storage.local.set({ recentFolders: this.recentFolders });
}

  /**
   * Setup keyboard navigation for dropdown (type-to-navigate)
   * ENHANCED: Supports nested folder search with auto-expand
   * - Press letter to highlight first match (including nested folders)
   * - Press again to cycle to next match
   * - Press Enter to select highlighted item
   * - Auto-expands parent folders to reveal nested matches
   */
  setupDropdownKeyboardNavigation(dropdown, allFolderItems) {
    // Store ALL folder items (visible + nested) for comprehensive search
    const menu = dropdown.querySelector('.custom-folder-dropdown-menu');
    const allItems = menu.querySelectorAll('.folder-tree-dropdown-item');
    
    dropdown.dataset.keyboardItems = JSON.stringify(
      Array.from(allItems).map((item, index) => ({
        index,
        name: item.dataset.folderName || 'Root',
        folderId: item.dataset.folderId || null
      }))
    );
    dropdown.dataset.lastKeyPressed = '';
    dropdown.dataset.lastKeyTime = '0';
    dropdown.dataset.currentMatchIndex = '-1';
    dropdown.dataset.allItemsCount = allItems.length.toString();
  }

  /**
   * Handle type-to-navigate in open dropdowns
   * ENHANCED: Searches ALL folders (including nested), auto-expands parents
   * UNIVERSAL: Works for ALL custom folder dropdowns in the extension
   * EXCLUDES: // slash command autocomplete in LLM chat windows
   * Returns true if event was handled by dropdown navigation
   */
  handleDropdownTypeToNavigate(e) {
    // Handle Enter key for selection
    if (e.key === 'Enter') {
      const openDropdown = document.querySelector('.custom-folder-dropdown.open');
      if (!openDropdown) return false;
      
      const menu = openDropdown.querySelector('.custom-folder-dropdown-menu');
      if (!menu) return false;
      
      const focusedItem = menu.querySelector('.folder-tree-dropdown-item.keyboard-focused');
      
      if (focusedItem) {
        console.log('🔑 Enter pressed - selecting:', focusedItem.dataset.folderName);
        e.preventDefault();
        e.stopPropagation();
        
        // Trigger click on the folder name element to ensure proper selection
        const folderNameEl = focusedItem.querySelector('.folder-name');
        if (folderNameEl) {
          folderNameEl.click();
        } else {
          focusedItem.click();
        }
        
        console.log('✅ Selection triggered');
        return true;
      }
      return false;
    }
    
    // Only handle letter keys (a-z) for search
    if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) {
      return false;
    }

    // Check if any custom dropdown is open
    const openDropdown = document.querySelector('.custom-folder-dropdown.open');
    if (!openDropdown) {
      return false;
    }

    // Don't interfere with text inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return false;
    }

    e.preventDefault();
    e.stopPropagation();

    const keyPressed = e.key.toLowerCase();
    const now = Date.now();
    const lastKey = openDropdown.dataset.lastKeyPressed || '';
    const lastKeyTime = parseInt(openDropdown.dataset.lastKeyTime || '0');
    const currentMatchIndex = parseInt(openDropdown.dataset.currentMatchIndex || '-1');

    // Parse keyboard items (includes ALL folders, visible + nested)
    let keyboardItems;
    try {
      keyboardItems = JSON.parse(openDropdown.dataset.keyboardItems || '[]');
    } catch (err) {
      console.error('Failed to parse keyboard items:', err);
      return true;
    }

    // Check if same key pressed within 1 second (cycle to next match)
    const isCycling = (keyPressed === lastKey) && (now - lastKeyTime < 1000);

    // Find ALL items starting with the pressed key (including nested/hidden)
    const matchingItems = keyboardItems.filter(item => 
      item.name.toLowerCase().startsWith(keyPressed)
    );

    console.log(`🔍 Type-to-navigate: "${keyPressed}" found ${matchingItems.length} matches`, matchingItems);

    if (matchingItems.length === 0) {
      return true; // No matches, but we handled the event
    }

    // Determine which item to focus
    let targetItem;
    if (isCycling) {
      // Cycle to next match
      const currentItemIndex = matchingItems.findIndex(item => item.index === currentMatchIndex);
      const nextIndex = (currentItemIndex + 1) % matchingItems.length;
      targetItem = matchingItems[nextIndex];
      console.log(`♻️ Cycling to match ${nextIndex + 1}/${matchingItems.length}:`, targetItem.name);
    } else {
      // Jump to first match
      targetItem = matchingItems[0];
      console.log(`🎯 First match:`, targetItem.name);
    }

    // Get the actual DOM element
    const menu = openDropdown.querySelector('.custom-folder-dropdown-menu');
    const allItems = menu.querySelectorAll('.folder-tree-dropdown-item');
    const targetElement = allItems[targetItem.index];

    if (targetElement) {
      // CRITICAL: Auto-expand parent folders to reveal nested matches
      this.expandParentFoldersToReveal(targetElement);
      
      // Remove previous keyboard focus
      allItems.forEach(item => item.classList.remove('keyboard-focused'));
      
      // Add keyboard focus to target (ONLY HIGHLIGHT, DON'T SELECT)
      targetElement.classList.add('keyboard-focused');
      
      // Scroll into view
      setTimeout(() => {
        targetElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50); // Small delay to allow expand animation
      
      console.log('✅ Highlighted:', targetElement.dataset.folderName);
    }

    // Update state
    openDropdown.dataset.lastKeyPressed = keyPressed;
    openDropdown.dataset.lastKeyTime = now.toString();
    openDropdown.dataset.currentMatchIndex = targetItem.index.toString();

    return true; // Event handled
  }
  
  /**
   * Auto-expand all parent folders to reveal a nested item
   * @param {HTMLElement} targetElement - The folder item to reveal
   */
  expandParentFoldersToReveal(targetElement) {
    let currentElement = targetElement;
    
    // Walk up the DOM tree to find and expand all parent folders
    while (currentElement) {
      // Check if this element is inside a folder-tree-children container
      const parentContainer = currentElement.closest('.folder-tree-children');
      if (!parentContainer) break;
      
      // Find the parent folder item (sibling before the children container)
      const parentFolderItem = parentContainer.previousElementSibling;
      if (parentFolderItem && parentFolderItem.classList.contains('folder-tree-dropdown-item')) {
        // Expand this parent folder
        if (parentContainer.style.display !== 'block') {
          parentContainer.style.display = 'block';
          parentFolderItem.classList.add('expanded');
          console.log('📂 Auto-expanded parent:', parentFolderItem.dataset.folderName);
        }
      }
      
      // Move up to next level
      currentElement = parentContainer.parentElement;
    }
  }

  renderSelectedTags() {
    const tagSelector = document.getElementById('tagSelector');
    tagSelector.innerHTML = '';
    
    this.selectedTags.forEach(tag => {
      const tagItem = document.createElement('div');
      tagItem.className = 'tag-selector-item';
      
      const tagChip = document.createElement('span');
      tagChip.className = 'tag-selector-chip selected';
      tagChip.textContent = tag;
      
      // Add remove button on hover
      const removeBtn = document.createElement('span');
      removeBtn.className = 'tag-remove-btn';
      removeBtn.innerHTML = '×';
      removeBtn.onclick = () => this.removeTag(tag);
      
      tagChip.appendChild(removeBtn);
      tagItem.appendChild(tagChip);
      tagSelector.appendChild(tagItem);
    });
  }

  addTag(tag) {
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      this.renderSelectedTags();
      
      // Trigger button state update for smart edit modal
      this.updatePromptSaveButtonState();
    }
  }

  removeTag(tag) {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.renderSelectedTags();
    
    // Trigger button state update for smart edit modal
    this.updatePromptSaveButtonState();
  }

  async savePrompt() {
    const title = document.getElementById('promptTitle').value.trim();
    const content = document.getElementById('promptContent').value.trim();
    const folderId = this.currentPromptFolderId;
    
    if (!title || !content) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }
    
    const promptData = {
      title,
      content,
      tags: this.selectedTags,
      folderId: (folderId === '' || folderId === '__create__' || !folderId) ? null : folderId,
      createdAt: this.editingPrompt ? this.editingPrompt.createdAt : Date.now(),
      updatedAt: Date.now(),
      useCount: this.editingPrompt ? this.editingPrompt.useCount : 0
    };
    
    if (this.editingPrompt) {
      // Update existing
      promptData.id = this.editingPrompt.id;
      const index = this.prompts.findIndex(p => p.id === this.editingPrompt.id);
      if (index !== -1) {
        this.prompts[index] = promptData;
      }
    } else {
      // Create new
      promptData.id = `prompt_${Date.now()}`;
      this.prompts.push(promptData);
    }
    
    await chrome.storage.local.set({ prompts: this.prompts });
    
    // Elite Feature: Track folder save for suggestions
    if (folderId) {
      this.trackPromptSave(folderId);
      
      // Track folder usage for recent folders dropdown
      const folder = this.folderManager.folders.find(f => f.id === folderId);
      if (folder) {
        this.trackFolderVisit(folderId, folder.name);
      }
    }
    
    // Auto-favorite if created from Favorites tab
    if (!this.editingPrompt && this.autoFavoriteOnSave) {
      await this.addToFavorites(promptData.id);
    }
    
    await this.loadData();
    this.updateUIState(); // Re-enable buttons when prompt is added
    this.renderPrompts();
    
    // If on Favorites tab, render it to show the new favorited prompt
    if (this.currentTab === 'favorites' && this.autoFavoriteOnSave) {
      this.renderFavorites();
    }
    
    // Always update folders tab to show/hide uncategorized folder
    if (this.currentTab === 'folders') {
      this.renderFolders();
    }
    
    this.clearFilter();
    this.closePromptModal({ skipPanelClose: true }); // Keep panel open after save
    this.showToast(this.editingPrompt ? 'Prompt updated!' : 'Prompt saved!');
    
    // Reset auto-favorite flag
    this.autoFavoriteOnSave = false;
  }

  async deletePrompt(promptId) {
    // Update in-memory array first
    this.prompts = this.prompts.filter(p => p.id !== promptId);
    
    // Save to storage
    await chrome.storage.local.set({ prompts: this.prompts });
    
    // Reload from storage to ensure consistency
    await this.loadData();
    this.updateUIState(); // May disable buttons if all prompts deleted
    this.renderPrompts();
    this.showToast('Prompt deleted');
  }

  showDeleteAllModal() {
    const modal = document.getElementById('deleteAllModal');
    modal.style.display = 'flex';
    // Focus modal to enable immediate Enter key response
    modal.setAttribute('tabindex', '-1');
    setTimeout(() => modal.focus(), 50);
  }

  closeDeleteAllModal() {
    document.getElementById('deleteAllModal').style.display = 'none';
  }

  async deleteAllPrompts() {
    this.prompts = [];
    this.filteredPrompts = [];
    await chrome.storage.local.set({ prompts: [] });
    this.closeDeleteAllModal();
    this.updateUIState(); // Disable buttons when all prompts deleted
    this.renderPrompts();
    this.showToast('All prompts deleted');
  }

  showDeletePromptModal(prompt) {
    this.promptToDelete = prompt;
    const modal = document.getElementById('deletePromptModal');
    const textElement = document.getElementById('deletePromptText');
    if (textElement) {
      textElement.textContent = `Are you sure you want to delete "${prompt.title}"?`;
    }
    modal.style.display = 'flex';
    // Focus modal to enable immediate Enter key response
    modal.setAttribute('tabindex', '-1');
    setTimeout(() => modal.focus(), 50);
  }

  closeDeletePromptModal() {
    document.getElementById('deletePromptModal').style.display = 'none';
    this.promptToDelete = null;
  }

  async confirmDeletePrompt() {
    if (this.promptToDelete) {
      await this.deletePrompt(this.promptToDelete.id);
      this.closeDeletePromptModal();
    }
  }

  showDeleteFavoritesModal() {
    const modal = document.getElementById('deleteFavoritesModal');
    modal.style.display = 'flex';
    // Focus modal to enable immediate Enter key response
    modal.setAttribute('tabindex', '-1');
    setTimeout(() => modal.focus(), 50);
  }

  closeDeleteFavoritesModal() {
    document.getElementById('deleteFavoritesModal').style.display = 'none';
  }

  closeDownloadFavouritesModal() {
    document.getElementById('downloadFavouritesModal').style.display = 'none';
  }

  async deleteAllFavorites() {
    // Clear favorites arrays
    this.favoritePromptIds = [];
    this.favoritePromptOrder = [];
    
    // Save to storage
    await chrome.storage.sync.set({ 
      favoritePromptIds: [],
      favoritePromptOrder: []
    });
    
    this.closeDeleteFavoritesModal();
    this.renderFavorites(); // Will show empty state
    this.showToast('All favorites removed');
  }

  showDeleteFoldersModal() {
    const modal = document.getElementById('deleteFoldersModal');
    modal.style.display = 'flex';
    // Focus modal to enable immediate Enter key response
    modal.setAttribute('tabindex', '-1');
    setTimeout(() => modal.focus(), 50);
  }

  closeDeleteFoldersModal() {
    document.getElementById('deleteFoldersModal').style.display = 'none';
  }

  async deleteAllFolders() {
    // Delete all folders
    this.folderManager.folders = [];
    await chrome.storage.sync.set({ folders: [] });
    
    // Delete all prompts (as warned in modal)
    this.prompts = [];
    this.filteredPrompts = [];
    await chrome.storage.local.set({ prompts: [] });
    
    // Reset folder path to root
    this.folderPath = [{ id: null, name: 'All Folders' }];
    
    this.closeDeleteFoldersModal();
    
    // Update both tabs
    this.updateUIState(); // Disable prompts tab buttons
    this.renderFolders(); // Show folders empty state
    this.renderPrompts(); // Show prompts empty state
    
    this.showToast('All folders and prompts deleted');
  }

  /**
   * Show generic confirmation modal
   * @param {string} title - Modal title
   * @param {string} message - Main message
   * @param {string} details - Additional details (optional)
   * @param {string} confirmText - Confirm button text
   * @param {Function} onConfirm - Callback when confirmed
   */
  showConfirmModal(title, message, details, confirmText, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const messageEl = document.getElementById('confirmModalMessage');
    const detailsEl = document.getElementById('confirmModalDetails');
    const confirmBtn = document.getElementById('confirmActionBtn');
    
    if (!modal || !titleEl || !messageEl || !detailsEl || !confirmBtn) {
      console.error('Confirm modal elements not found');
      return;
    }
    
    // Set content
    titleEl.textContent = title;
    messageEl.textContent = message;
    detailsEl.textContent = details;
    detailsEl.style.display = details ? 'block' : 'none';
    confirmBtn.textContent = confirmText;
    
    // Remove old listeners by cloning
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new listener
    newConfirmBtn.addEventListener('click', async () => {
      this.closeConfirmModal();
      if (onConfirm) await onConfirm();
    });
    
    // Show modal
    modal.style.display = 'flex';
  }

  closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
  }

  async sharePrompt(prompt) {
    console.log('sharePrompt called', prompt);
    // Show options modal first
    this.showShareOptionsModal(prompt);
  }

  async createShareableLink(prompt) {
    // Create share data with expiration
    const shareData = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      promptId: prompt.id,
      title: prompt.title,
      content: prompt.content,
      tags: prompt.tags,
      createdAt: Date.now(),
      expiresAt: Date.now() + (72 * 60 * 60 * 1000) // 72 hours
    };
    
    // Store in Chrome storage for now (replace with backend service)
    const shares = await chrome.storage.local.get('shares');
    const allShares = shares.shares || {};
    allShares[shareData.id] = shareData;
    await chrome.storage.local.set({ shares: allShares });
    
    // Generate shareable URL
    return `${chrome.runtime.getURL('share.html')}?id=${shareData.id}`;
    
    /* Production backend implementation:
    const response = await fetch('https://your-api.com/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shareData)
    });
    const result = await response.json();
    return result.shareUrl;
    */
  }

  async submitFeedback() {
    const subject = document.getElementById('feedbackSubject').value.trim();
    const body = document.getElementById('feedbackBody').value.trim();
    
    if (!subject || !body) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }
    
    try {
      // In production, use GitHub API to create issue
      await this.createGitHubIssue(subject, body);
      
      // Clear form
      document.getElementById('feedbackSubject').value = '';
      document.getElementById('feedbackBody').value = '';
      
      this.showToast('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      this.showToast('Failed to submit feedback', 'error');
    }
  }

  async createGitHubIssue(title, body) {
    // Placeholder implementation
    console.log('Creating GitHub issue:', { title, body });
    
    /* Production implementation:
    const response = await fetch(
      `https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.githubConfig.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title,
          body: body,
          labels: ['feedback', 'user-submitted']
        })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to create issue');
    }
    
    return await response.json();
    */
  }

  async exportPrompts() {
    // Use new export controller for all prompts
    await this.exportController(this.prompts, 'all-prompts');
  }

  importPrompts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.jsonl,.txt,.md,.xml';
    
    // Trigger click immediately (no lag)
    input.click();
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Reload data first to ensure we have latest state
      await this.loadData();
      
      const text = await file.text();
      const fileName = file.name.toLowerCase();
      let data;
      
      try {
        // Detect format and parse using new system
        let importedPrompts = [];
        
        if (fileName.endsWith('.json') || fileName.endsWith('.jsonl')) {
          importedPrompts = this.parseJSON(text);
        } else if (fileName.endsWith('.txt')) {
          importedPrompts = this.parseTxt(text);
        } else if (fileName.endsWith('.md')) {
          importedPrompts = this.parseMarkdown(text);
        } else if (fileName.endsWith('.xml')) {
          importedPrompts = await this.parseXML(text);
        } else {
          this.showToast('Unsupported file format', 'error');
          return;
        }
        
        if (!importedPrompts || importedPrompts.length === 0) {
          this.showToast('No valid prompts found in file', 'error');
          return;
        }
        
        // Wrap in legacy format for compatibility
        data = {
          prompts: importedPrompts,
          version: '2.0'
        };
        
        if (data.prompts && Array.isArray(data.prompts)) {
          // Check for conflicts against CURRENT state (after reload)
          const conflicts = data.prompts.filter(imported => 
            this.prompts.some(existing => existing.title === imported.title)
          );
          
          let shouldProceed = true;
          let overwrite = false;
          
          // If conflicts exist, ask user what to do
          if (conflicts.length > 0) {
            const pluralPrompt = conflicts.length === 1 ? 'prompt' : 'prompts';
            const message = `Found ${conflicts.length} existing ${pluralPrompt} with the same title.\n\n` +
                          `Click OK to overwrite them, or Cancel to abort the import.`;
            overwrite = confirm(message);
            
            // If user clicked Cancel, abort the entire import
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
                // Existing prompt with same title
                if (overwrite) {
                  this.prompts[existingIndex] = {
                    ...importedPrompt,
                    id: this.prompts[existingIndex].id,
                    updatedAt: Date.now()
                  };
                  updatedCount++;
                }
              } else {
                // New prompt - always add
                const newPrompt = {
                  ...importedPrompt,
                  id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                };
                
                // Assign to pending folder if set (from empty folder state)
                if (this.pendingImportFolderId !== undefined) {
                  newPrompt.folderId = this.pendingImportFolderId;
                }
                
                this.prompts.push(newPrompt);
                importedCount++;
              }
            });
            
            // Clear pending folder ID
            this.pendingImportFolderId = undefined;
            
            await chrome.storage.local.set({ prompts: this.prompts });
            await this.loadData();
            this.updateUIState(); // Re-enable buttons when prompts are imported
            this.renderPrompts();
            this.renderFolders(); // Update folders to reflect new prompts
            
            // Show success message
            const totalCount = importedCount + updatedCount;
            this.showToast(`${totalCount} Prompt${totalCount > 1 ? 's' : ''} Imported Successfully`);
          }
        }
      } catch (error) {
        this.showToast('Error importing file', 'error');
        console.error('Import error:', error);
      }
    });
  }

  // ============================================================
  // REFACTORED IMPORT/EXPORT SYSTEM
  // Context-aware, interoperable formats with variable recognition
  // ============================================================

  /**
   * Extract variables from prompt content based on syntax settings
   * @param {string} content - The prompt content
   * @returns {Array<string>} - Array of unique variable names
   */
  extractVariables(content) {
    if (!content) return [];
    
    const syntax = this.getVariableSyntax();
    const { start, end } = syntax;
    
    // Escape special regex characters
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startEscaped = escapeRegex(start);
    const endEscaped = escapeRegex(end);
    
    // Create regex pattern to match variables
    const pattern = new RegExp(`${startEscaped}([^${endEscaped}]+)${endEscaped}`, 'g');
    const variables = [];
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      const varName = match[1].trim();
      if (varName && !variables.includes(varName)) {
        variables.push(varName);
      }
    }
    
    return variables;
  }

  /**
   * CENTRAL EXPORT CONTROLLER
   * Single entry point for all export/download operations
   * @param {Array<Object>} prompts - Array of prompt objects to export
   * @param {string} filename - Base filename (without extension)
   */
  async exportController(prompts, filename = null) {
    if (!prompts || prompts.length === 0) {
      this.showToast('No prompts to export', 'error');
      return;
    }
    
    const format = this.settings.fileFormat || 'json';
    const isSinglePrompt = prompts.length === 1;
    
    // Generate filename if not provided
    if (!filename) {
      if (isSinglePrompt) {
        // Use prompt title for single exports
        filename = prompts[0].title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      } else {
        // Generic name for bulk exports
        filename = `prompts-export-${new Date().toISOString().split('T')[0]}`;
      }
    }
    
    let content, mimeType, extension;
    
    switch (format) {
      case 'json':
        if (isSinglePrompt) {
          content = this.formatAsJSON(prompts);
          extension = 'json';
        } else {
          content = this.formatAsJSONL(prompts);
          extension = 'jsonl';
        }
        mimeType = 'application/json';
        break;
        
      case 'md':
        content = this.formatAsMarkdown(prompts);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
        
      case 'txt':
        content = this.formatAsTxt(prompts);
        mimeType = 'text/plain';
        extension = 'txt';
        break;

      case 'xml':
        content = this.formatAsXML(prompts);
        mimeType = 'application/xml';
        extension = 'xml';
        break;
        
      default:
        this.showToast('Unsupported file format', 'error');
        return;
    }
    
    // Trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const count = prompts.length;
    this.showToast(`${count} Prompt${count > 1 ? 's' : ''} Downloaded as .${extension}`);
  }

  /**
   * FORMAT: JSON (Single prompt - pretty-printed)
   */
  formatAsJSON(prompts) {
    const prompt = prompts[0];
    const variables = this.extractVariables(prompt.content);
    
    const obj = {
      title: prompt.title,
      content: prompt.content,
      input_variables: variables,
      metadata: {
        tags: prompt.tags || []
      }
    };
    
    return JSON.stringify(obj, null, 2);
  }

  /**
   * FORMAT: JSONL (Multiple prompts - one per line, minified)
   */
  formatAsJSONL(prompts) {
    return prompts.map(prompt => {
      const variables = this.extractVariables(prompt.content);
      const obj = {
        title: prompt.title,
        content: prompt.content,
        input_variables: variables,
        metadata: {
          tags: prompt.tags || []
        }
      };
      return JSON.stringify(obj);
    }).join('\n');
  }

  /**
   * FORMAT: Markdown with YAML Frontmatter
   */
  formatAsMarkdown(prompts) {
    return prompts.map(prompt => {
      const variables = this.extractVariables(prompt.content);
      
      let output = '---\n';
      output += `title: "${prompt.title.replace(/"/g, '\\"')}"\n`;
      output += `tags: [${(prompt.tags || []).map(t => `"${t.replace(/"/g, '\\"')}"`).join(', ')}]\n`;
      output += `input_variables: [${variables.map(v => `"${v.replace(/"/g, '\\"')}"`).join(', ')}]\n`;
      output += '---\n\n';
      output += prompt.content;
      
      return output;
    }).join('\n\n===PROMPT_SEPARATOR===\n\n');
  }

  /**
   * FORMAT: Plain Text (Clean structure)
   */
  formatAsTxt(prompts) {
    return prompts.map(prompt => {
      const variables = this.extractVariables(prompt.content);
      
      let output = `Title: ${prompt.title}\n`;
      output += `Tags: ${(prompt.tags || []).join(', ')}\n`;
      output += `Variables: ${variables.join(', ')}\n\n`;
      output += prompt.content;
      
      return output;
    }).join('\n\n====================\n\n');
  }

  /**
   * FORMAT: XML with full metadata
   * Includes variable configuration, folders, tags, and all prompt data
   * @param {Array} prompts - Prompts to export
   * @returns {string} XML formatted string
   */
  formatAsXML(prompts) {
    const escapeXML = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Get current variable syntax settings
    const syntax = this.settings.variableSyntax || '{{}}';
    const startDelim = this.settings.customStartDelimiter || '{{';
    const endDelim = this.settings.customEndDelimiter || '}}';

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<ProPrompterLibrary version="1.0.0" exportDate="${new Date().toISOString()}">\n\n`;

    // Variable configuration
    xml += '  <VariableConfiguration>\n';
    xml += `    <Syntax>${escapeXML(syntax)}</Syntax>\n`;
    xml += `    <CustomStartDelimiter>${escapeXML(startDelim)}</CustomStartDelimiter>\n`;
    xml += `    <CustomEndDelimiter>${escapeXML(endDelim)}</CustomEndDelimiter>\n`;
    xml += '  </VariableConfiguration>\n\n';

    // Folders
    const folders = this.folderManager?.folders || [];
    xml += '  <Folders>\n';
    folders.forEach(folder => {
      xml += `    <Folder id="${escapeXML(folder.id)}" `;
      xml += `parentId="${escapeXML(folder.parentId || '')}" `;
      xml += `order="${folder.order || 0}" `;
      xml += `createdAt="${folder.createdAt || 0}">\n`;
      xml += `      <Name>${escapeXML(folder.name)}</Name>\n`;
      xml += `      <Icon>${escapeXML(folder.icon)}</Icon>\n`;
      xml += `      <Color>${escapeXML(folder.color)}</Color>\n`;
      xml += '    </Folder>\n';
    });
    xml += '  </Folders>\n\n';

    // Tags - need to get from storage since not available in this context
    xml += '  <Tags>\n';
    // Note: Tags will be handled in parseXML for import, but export may not have full tag data
    xml += '  </Tags>\n\n';

    // Prompts
    xml += '  <Prompts>\n';
    prompts.forEach(prompt => {
      const variables = this.extractVariables(prompt.content);

      xml += `    <Prompt `;
      xml += `id="${escapeXML(prompt.id)}" `;
      xml += `folderId="${escapeXML(prompt.folderId || '')}" `;
      xml += `isFavorite="${prompt.isFavorite === true ? 'true' : 'false'}" `;
      xml += `createdAt="${prompt.createdAt || 0}" `;
      xml += `updatedAt="${prompt.updatedAt || 0}" `;
      xml += `lastUsed="${prompt.lastUsed || 0}" `;
      xml += `useCount="${prompt.useCount || 0}">\n`;

      xml += `      <Title>${escapeXML(prompt.title)}</Title>\n`;
      xml += `      <Content><![CDATA[${prompt.content}]]></Content>\n`;

      xml += '      <Tags>\n';
      (prompt.tags || []).forEach(tag => {
        xml += `        <Tag>${escapeXML(tag)}</Tag>\n`;
      });
      xml += '      </Tags>\n';

      xml += '      <Variables>\n';
      variables.forEach(variable => {
        xml += `        <Variable>${escapeXML(variable)}</Variable>\n`;
      });
      xml += '      </Variables>\n';

      xml += '    </Prompt>\n';
    });
    xml += '  </Prompts>\n\n';

    xml += '</ProPrompterLibrary>';

    return xml;
  }

  /**
   * PARSE: JSON / JSONL
   */
  parseJSON(text) {
    const prompts = [];
    
    // First, try parsing as standard JSON
    try {
      const data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        // Array of prompts
        data.forEach(obj => prompts.push(this.convertImportedPrompt(obj)));
      } else if (data.prompts && Array.isArray(data.prompts)) {
        // Legacy format with wrapper
        data.prompts.forEach(obj => prompts.push(this.convertImportedPrompt(obj)));
      } else if (data.title && data.content) {
        // Single prompt object
        prompts.push(this.convertImportedPrompt(data));
      } else if (data.metadata || data.input_variables) {
        // Single prompt object (new format)
        prompts.push(this.convertImportedPrompt(data));
      }
      
      // If we successfully parsed JSON and got prompts, return them
      if (prompts.length > 0) {
        return prompts;
      }
    } catch (e) {
      // Not valid JSON, might be JSONL
      console.log('Not valid JSON, trying JSONL...');
    }
    
    // If JSON parsing failed or returned no prompts, try JSONL
    const lines = text.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        prompts.push(this.convertImportedPrompt(obj));
      } catch (e) {
        console.error('Failed to parse JSONL line:', e);
      }
    }
    
    return prompts;
  }

  /**
   * PARSE: Markdown with YAML Frontmatter
   */
  parseMarkdown(text) {
    const prompts = [];
    
    // Split by the separator that appears between prompts: ===PROMPT_SEPARATOR===
    const sections = text.split(/\n\n===PROMPT_SEPARATOR===\n\n/);
    
    for (const section of sections) {
      try {
        const trimmed = section.trim();
        if (!trimmed) continue;
        
        // Check if section starts with YAML frontmatter marker
        if (!trimmed.startsWith('---')) continue;
        
        // Find the end of frontmatter (second ---)
        const frontmatterEnd = trimmed.indexOf('\n---\n', 3);
        if (frontmatterEnd === -1) continue;
        
        // Extract frontmatter (skip first ---\n) and content
        const frontmatterText = trimmed.substring(4, frontmatterEnd);
        const content = trimmed.substring(frontmatterEnd + 5).trim();
        
        // Parse YAML frontmatter (simple key-value parsing)
        const frontmatter = {};
        frontmatterText.split('\n').forEach(line => {
          const match = line.match(/^([\w_]+):\s*(.+)$/);
          if (match) {
            const [, key, value] = match;
            // Parse arrays [item1, item2]
            if (value.startsWith('[') && value.endsWith(']')) {
              const items = value.slice(1, -1).split(',').map(item => 
                item.trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
              ).filter(Boolean);
              frontmatter[key] = items;
            } else {
              // Remove quotes from strings
              frontmatter[key] = value.replace(/^["']|["']$/g, '').replace(/\\"/g, '"');
            }
          }
        });
        
        const prompt = {
          id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: frontmatter.title || 'Untitled',
          content: content,
          tags: frontmatter.tags || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          useCount: 0
        };
        
        prompts.push(prompt);
      } catch (e) {
        console.error('Failed to parse Markdown section:', e);
      }
    }
    
    return prompts;
  }

  /**
   * PARSE: Plain Text
   */
  parseTxt(text) {
    const prompts = [];
    const sections = text.split(/\n====================\n/).filter(s => s.trim());
    
    for (const section of sections) {
      try {
        const lines = section.split('\n');
        const prompt = {
          id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: '',
          content: '',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          useCount: 0
        };
        
        let contentStartIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('Title: ')) {
            prompt.title = line.substring(7);
          } else if (line.startsWith('Tags: ')) {
            const tagsStr = line.substring(6);
            prompt.tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
          } else if (line.startsWith('Variables: ')) {
            // We don't need to store variables as they're in the content
            continue;
          } else if (line === '' && contentStartIndex === -1 && prompt.title) {
            // Empty line after metadata = start of content
            contentStartIndex = i + 1;
            break;
          }
        }
        
        if (contentStartIndex > 0) {
          prompt.content = lines.slice(contentStartIndex).join('\n').trim();
        }
        
        if (prompt.title && prompt.content) {
          prompts.push(prompt);
        }
      } catch (e) {
        console.error('Failed to parse TXT section:', e);
      }
    }
    
    return prompts;
  }

  /**
   * PARSE: XML file and extract prompts, folders, tags
   * @param {string} text - Raw XML content
   * @returns {Array} Array of prompts
   */
  async parseXML(text) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        console.error('XML parsing error:', parserError[0].textContent);
        throw new Error('Invalid XML format');
      }

      const prompts = [];

      // Extract variable configuration (informational only)
      const varConfigNode = xmlDoc.getElementsByTagName('VariableConfiguration')[0];
      if (varConfigNode) {
        const syntaxNode = varConfigNode.getElementsByTagName('Syntax')[0];
        const startNode = varConfigNode.getElementsByTagName('CustomStartDelimiter')[0];
        const endNode = varConfigNode.getElementsByTagName('CustomEndDelimiter')[0];

        console.log('XML variable config:', {
          syntax: syntaxNode?.textContent || '{{}}',
          start: startNode?.textContent || '{{',
          end: endNode?.textContent || '}}'
        });
        // Note: User keeps their own variable settings
      }

      // Extract and merge folders
      const foldersNode = xmlDoc.getElementsByTagName('Folders')[0];
      const importedFolders = [];
      if (foldersNode) {
        const folderElements = foldersNode.getElementsByTagName('Folder');
        for (const folderEl of folderElements) {
          const nameNode = folderEl.getElementsByTagName('Name')[0];
          const iconNode = folderEl.getElementsByTagName('Icon')[0];
          const colorNode = folderEl.getElementsByTagName('Color')[0];

          importedFolders.push({
            id: folderEl.getAttribute('id'),
            name: nameNode?.textContent || 'Unnamed',
            icon: iconNode?.textContent || 'folder',
            color: colorNode?.textContent || '#22B8CF',
            parentId: folderEl.getAttribute('parentId') || null,
            order: parseInt(folderEl.getAttribute('order')) || 0,
            createdAt: parseInt(folderEl.getAttribute('createdAt')) || Date.now()
          });
        }

        if (importedFolders.length > 0 && this.folderManager) {
          console.log(`✓ Importing ${importedFolders.length} folders`);
          // Merge with existing folders (avoid duplicates)
          this.folderManager.folders = this.folderManager.folders || [];
          const existingIds = new Set(this.folderManager.folders.map(f => f.id));
          importedFolders.forEach(folder => {
            if (!existingIds.has(folder.id)) {
              this.folderManager.folders.push(folder);
            }
          });
          await this.folderManager.saveFolders();
        }
      }

      // Extract prompts
      const promptsNode = xmlDoc.getElementsByTagName('Prompts')[0];
      if (!promptsNode) {
        throw new Error('No Prompts section found in XML');
      }

      const promptElements = promptsNode.getElementsByTagName('Prompt');

      for (const promptEl of promptElements) {
        const id = promptEl.getAttribute('id');
        const folderId = promptEl.getAttribute('folderId') || null;
        const isFavorite = promptEl.getAttribute('isFavorite') === 'true';
        const createdAt = parseInt(promptEl.getAttribute('createdAt')) || Date.now();
        const updatedAt = parseInt(promptEl.getAttribute('updatedAt')) || Date.now();
        const lastUsed = parseInt(promptEl.getAttribute('lastUsed')) || null;
        const useCount = parseInt(promptEl.getAttribute('useCount')) || 0;

        const titleNode = promptEl.getElementsByTagName('Title')[0];
        if (!titleNode) {
          console.warn('Prompt missing title, skipping:', id);
          continue;
        }
        const title = titleNode.textContent;

        const contentNode = promptEl.getElementsByTagName('Content')[0];
        if (!contentNode) {
          console.warn('Prompt missing content, skipping:', id);
          continue;
        }
        const content = contentNode.textContent.trim();

        const tagsContainer = promptEl.getElementsByTagName('Tags')[0];
        const tags = [];
        if (tagsContainer) {
          const tagElements = tagsContainer.getElementsByTagName('Tag');
          for (const tagEl of tagElements) {
            tags.push(tagEl.textContent);
          }
        }

        prompts.push({
          id: id || `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          content,
          tags,
          folderId: folderId || null,
          isFavorite,
          createdAt,
          updatedAt,
          lastUsed,
          useCount
        });
      }

      if (prompts.length === 0) {
        throw new Error('No valid prompts found in XML file');
      }

      console.log(`✓ Parsed ${prompts.length} prompts from XML`);
      return prompts;

    } catch (error) {
      console.error('XML parsing error:', error);
      throw new Error(`Failed to parse XML: ${error.message}`);
    }
  }

  /**
   * Convert imported prompt object to internal format
   */
  convertImportedPrompt(obj) {
    return {
      id: obj.id || `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: obj.title || 'Untitled',
      content: obj.content || '',
      tags: obj.metadata?.tags || obj.tags || [],
      createdAt: obj.createdAt || Date.now(),
      updatedAt: obj.updatedAt || Date.now(),
      useCount: obj.useCount || 0,
      folderId: obj.folderId || null
    };
  }

  // ============================================================
  // LEGACY FORMAT CONVERTERS (DEPRECATED - kept for compatibility)
  // ============================================================
  
  convertToTxt(data) {
    let output = '# PROMPT LIBRARY EXPORT\n';
    output += `# Exported: ${data.exportDate}\n`;
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
    output += `**Exported:** ${data.exportDate}  \n`;
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
        currentPrompt.tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
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
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
  }

  async saveSetting(key, value) {
    if (!this.settings) this.settings = {};
    this.settings[key] = value;
    await chrome.storage.local.set({ settings: this.settings });
  }

  copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  showShareOptionsModal(prompt) {
    // Get current export format from settings
    const format = this.settings.fileFormat || 'json';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content share-modal-content">
        <div class="modal-header">
          <h2>Share Prompt</h2>
          <button class="close-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 16px; color: #000000; font-size: 13px; font-family: 'Sora', sans-serif; text-align: center; line-height: 1.5;">
            Create a Shareable Link or Download the prompt as a .${format} file.
          </p>
          <div class="share-button-group">
            <button class="action-btn primary download-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download</span>
            </button>
            <button class="action-btn share-link-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>Share as Link</span>
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Download button
    const downloadBtn = modal.querySelector('.download-btn');
    downloadBtn.addEventListener('click', () => {
      modal.remove();
      this.downloadSinglePrompt(prompt);
    });
    
    // Share link button
    const shareLinkBtn = modal.querySelector('.share-link-btn');
    shareLinkBtn.addEventListener('click', async () => {
      modal.remove();
      try {
        const shareUrl = await this.createShareableLink(prompt);
        this.showShareLinkModal(shareUrl);
      } catch (error) {
        console.error('Error sharing prompt:', error);
        this.showToast('Failed to create share link', 'error');
      }
    });
  }

  async downloadSinglePrompt(prompt) {
    // Use new export controller for single prompt
    const filename = prompt.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    await this.exportController([prompt], filename);
  }

  showShareLinkModal(shareUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content share-modal-content">
        <div class="modal-header">
          <h2>Share Prompt</h2>
          <button class="close-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 12px; color: #000000; font-size: 13px; font-family: 'Sora', sans-serif; text-align: center; line-height: 1.5;">
            Share this temporary link with anyone on the web
          </p>
          <div class="share-link-container">
            <input type="text" class="share-link-input" value="${shareUrl}" readonly>
            <button class="copy-link-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Copy button
    const copyBtn = modal.querySelector('.copy-link-btn');
    const linkInput = modal.querySelector('.share-link-input');
    copyBtn.addEventListener('click', () => {
      linkInput.select();
      document.execCommand('copy');
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        `;
      }, 2000);
    });
  }
  
  // ============================================================
  // FOLDER METHODS - Phase 2 Implementation
  // ============================================================

  /**
   * Render folders tree view (CONDITIONAL based on folderPath)
   * Supports search highlighting via this.currentFolderSearchQuery
   */
  renderFolders() {
    console.log('🎨🎨🎨 renderFolders CALLED 🎨🎨🎨');
    console.log('📍 Current folderPath:', this.folderPath);
    console.log('📏 folderPath.length:', this.folderPath.length);
    console.log('🚫 showOnlyPrompts:', this.showOnlyPrompts);
    console.log('🚫 showOnlySubfolders:', this.showOnlySubfolders);
    
    // CONDITIONAL RENDERING based on breadcrumb path
    // If we're deeper than root level, show folder details
    if (this.folderPath.length > 1) {
      console.log('✅ Path length > 1, calling renderFolderDetails()');
      this.renderFolderDetails();
      return;
    }

    console.log('⚠️ Path length <= 1, rendering folder list view');
    // Otherwise render folder list view
    const foldersTree = document.getElementById('foldersTree');
    const foldersEmptyState = document.getElementById('foldersEmptyState');
    const foldersCount = document.getElementById('foldersCount');
    const foldersHeader = document.querySelector('.folders-header');

    if (!foldersTree) return;

    const hasFolders = this.folderManager.folders.length > 0;
    const hasUncategorized = this.prompts.some(p => !p.folderId);
    const hasAnyContent = hasFolders || hasUncategorized;

    // Update empty state - hide if we have folders OR uncategorized prompts
    if (foldersEmptyState) {
      foldersEmptyState.style.display = hasAnyContent ? 'none' : 'flex';
    }
    foldersTree.style.display = hasAnyContent ? 'flex' : 'none';
    
    // Show header if we have any content
    if (foldersHeader) {
      foldersHeader.style.display = hasAnyContent ? 'block' : 'none';
    }

    // Update count - include uncategorized in count
    if (foldersCount) {
      const folderCount = this.folderManager.folders.length;
      const totalCount = hasUncategorized ? folderCount + 1 : folderCount;
      foldersCount.textContent = `${totalCount} folder${totalCount !== 1 ? 's' : ''}`;
    }
    
    // Disable/enable Delete All Folders button based on folder count
    const deleteFoldersBtn = document.getElementById('deleteFoldersBtn');
    if (deleteFoldersBtn) {
      deleteFoldersBtn.disabled = this.folderManager.folders.length === 0;
    }

    // Clear tree
    foldersTree.innerHTML = '';

    // Return early only if no content at all
    if (!hasAnyContent) return;

    // Check if we're in search mode
    const isSearching = this.currentFolderSearchQuery && this.currentFolderSearchQuery.trim() !== '';
    
    if (isSearching) {
      // SEARCH MODE: Check if search has any matches
      if (this.folderSearchHasMatches === false) {
        // No matching folders found - show search empty state
        foldersTree.style.display = 'none';
        const searchEmptyState = document.getElementById('foldersSearchEmptyState');
        if (searchEmptyState) {
          searchEmptyState.style.display = 'flex';
        }
        return;
      }
      
      // Hide search empty state if we have matches
      const searchEmptyState = document.getElementById('foldersSearchEmptyState');
      if (searchEmptyState) {
        searchEmptyState.style.display = 'none';
      }
      foldersTree.style.display = 'block';
      
      // Render all root folders (searchFolders will handle show/hide)
      const rootFolders = this.folderManager.folders.filter(f => !f.parentId);
      rootFolders.forEach(folder => {
        const hasChildren = this.folderManager.folders.some(f => f.parentId === folder.id);
        const promptCount = this.folderManager.countPromptsRecursive(folder.id, this.prompts);
        const row = this.createFolderRow(folder, promptCount, hasChildren);
        foldersTree.appendChild(row);
      });
    } else {
      // NORMAL MODE: Show Starred, Recent, and All sections (all collapsible)
      // STARRED FOLDERS Section (unlimited) - only if we have starred folders
      if (hasFolders) {
        this.renderStarredFoldersSection();
      }
      
      // RECENT FOLDERS Section (max 5) - only if we have folders
      if (hasFolders && this.recentFolders.length > 0) {
        this.renderRecentFoldersSection();
      }

      // ALL FOLDERS Section (root-level only) - only if we have folders
      if (hasFolders) {
        this.renderAllFoldersSection();
      }
    }

    // UNCATEGORIZED FOLDER Section (virtual folder for prompts without folderId)
    this.renderUncategorizedFolderSection();

    // Initialize Lucide icons after rendering all folders
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Attach folder action listeners after Lucide replaces icons
    this.attachFolderActionsListeners();
  }

  /**
   * Render folder details view (prompts inside a folder) with BREADCRUMB NAVIGATION
   */
  renderFolderDetails() {
    const foldersTree = document.getElementById('foldersTree');
    const foldersEmptyState = document.getElementById('foldersEmptyState');
    
    if (!foldersTree || this.folderPath.length < 2) return;

    // CRITICAL FIX: Recalculate filtered prompts for current folder
    const folderInPath = this.folderPath[this.folderPath.length - 1];
    if (folderInPath && folderInPath.id) {
      this.filteredPrompts = this.prompts.filter(p => p.folderId === folderInPath.id);
    }

    // Hide empty state
    if (foldersEmptyState) {
      foldersEmptyState.style.display = 'none';
    }
    foldersTree.style.display = 'flex';

    // Clear tree
    foldersTree.innerHTML = '';

    // Create breadcrumb navigation
    const breadcrumbContainer = document.createElement('div');
    breadcrumbContainer.className = 'folder-breadcrumb-nav';
    
    // Build breadcrumb trail
    this.folderPath.forEach((pathItem, index) => {
      // Add separator before each item except the first
      if (index > 0) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '›';
        breadcrumbContainer.appendChild(separator);
      }
      
      // Is this the last (current) item?
      const isLast = index === this.folderPath.length - 1;
      
      if (isLast) {
        // Current folder - not clickable
        const current = document.createElement('span');
        current.className = 'breadcrumb-current';
        current.textContent = pathItem.name;
        breadcrumbContainer.appendChild(current);
      } else {
        // Previous folders - clickable to navigate back
        const link = document.createElement('button');
        link.className = 'breadcrumb-link';
        link.textContent = pathItem.name;
        
        // Navigate back to this level when clicked
        link.addEventListener('click', () => {
          // Elite Feature: Add slide-back animation
          const container = document.getElementById('foldersTree');
          if (container) {
            container.classList.add('folder-view-transition', 'back');
            setTimeout(() => {
              container.classList.remove('folder-view-transition', 'back');
            }, 300);
          }
          
          // Slice the path to this point
          this.folderPath = this.folderPath.slice(0, index + 1);
          
          // Update filtered prompts and current folder ID
          if (this.folderPath.length === 1) {
            // Back to root - will render folder list
            this.filteredPrompts = [];
            this.currentFolderId = null; // Clear current folder when at root
          } else {
            // Navigate to parent folder
            const targetFolder = this.folderPath[this.folderPath.length - 1];
            this.filteredPrompts = this.prompts.filter(p => p.folderId === targetFolder.id);
            this.currentFolderId = targetFolder.id; // Update current folder
          }
          
          this.renderFolders();
        });
        
        breadcrumbContainer.appendChild(link);
      }
    });

    foldersTree.appendChild(breadcrumbContainer);

    // Get current folder
    const currentFolder = this.folderPath[this.folderPath.length - 1];
    
    // PHASE 1.1: Render subfolders in current folder (if any and not filtered out)
    const subfolders = this.folderManager.folders.filter(f => f.parentId === currentFolder.id);
    console.log(`🔍 Checking subfolders for "${currentFolder.name}" (ID: ${currentFolder.id})`);
    console.log(`📊 Total folders in manager: ${this.folderManager.folders.length}`);
    console.log(`📁 Subfolders found: ${subfolders.length}`, subfolders.map(f => f.name));
    console.log(`📁 Subfolder OBJECTS:`, subfolders);
    console.log(`🚫 showOnlyPrompts flag: ${this.showOnlyPrompts}`);
    
    if (subfolders.length > 0 && !this.showOnlyPrompts) {
      console.log('✅ Condition met: subfolders.length > 0 && !showOnlyPrompts');
      console.log('🎨 Creating SUBFOLDERS section...');
      const subfoldersSection = document.createElement('div');
      subfoldersSection.className = 'folders-section subfolders-section';
      subfoldersSection.style.padding = '16px 16px 0 16px';
      
      const subfoldersHeader = document.createElement('div');
      subfoldersHeader.className = 'folders-section-header';
      subfoldersHeader.textContent = 'SUBFOLDERS';
      subfoldersSection.appendChild(subfoldersHeader);
      
      const subfoldersList = document.createElement('div');
      subfoldersList.className = 'folders-list expanded'; // CRITICAL: Add 'expanded' class to make it visible!
      subfoldersList.style.padding = '0'; // Remove extra padding to match prompts list width
      
      console.log(`🔄 Creating ${subfolders.length} subfolder cards...`);
      subfolders.forEach((subfolder, index) => {
        console.log(`📇 Creating card ${index + 1}/${subfolders.length} for:`, subfolder.name, subfolder);
        const card = this.createEnhancedFolderCard(subfolder, 0);
        console.log(`✅ Card created:`, card);
        subfoldersList.appendChild(card);
      });
      
      console.log(`📦 Appending subfolders section to tree...`);
      subfoldersSection.appendChild(subfoldersList);
      foldersTree.appendChild(subfoldersSection);
      console.log(`✅ SUBFOLDERS section added to DOM!`);
      
      // Initialize Lucide icons for subfolder cards
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    // Render prompts in current folder (if not filtered out)
    if (this.filteredPrompts.length > 0 && !this.showOnlySubfolders) {
      // Add PROMPTS section header
      const promptsSection = document.createElement('div');
      promptsSection.className = 'folders-section prompts-section';
      promptsSection.style.padding = '16px 16px 0 16px';
      
      const promptsHeader = document.createElement('div');
      promptsHeader.className = 'folders-section-header';
      promptsHeader.textContent = 'PROMPTS';
      promptsSection.appendChild(promptsHeader);
      
      const promptsList = document.createElement('div');
      promptsList.className = 'prompts-list';
      promptsList.style.display = 'flex';
      promptsList.style.flexDirection = 'column';
      promptsList.style.gap = '8px';
      
      // Render each prompt as a card
      this.filteredPrompts.forEach(prompt => {
        const card = this.createPromptCard(prompt);
        promptsList.appendChild(card);
      });
      
      promptsSection.appendChild(promptsList);
      foldersTree.appendChild(promptsSection);
    } else if (subfolders.length === 0) {
      // Only show empty state if no prompts AND no subfolders
      const promptsContainer = document.createElement('div');
      promptsContainer.className = 'folder-prompts-container';
      promptsContainer.style.padding = '16px';
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-state';
      emptyMsg.style.padding = '40px 20px';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.innerHTML = `
        <div style="margin-bottom: 16px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22B8CF" stroke-width="1.5" style="opacity: 0.6;">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="9" y1="14" x2="15" y2="14" stroke-linecap="round"></line>
          </svg>
        </div>
        <div style="font-size: 14px; color: #9A9A9A; margin-bottom: 24px;">This folder is empty</div>
      `;
      
      // Add action buttons (same as empty state in Prompts tab)
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.gap = '12px';
      buttonsContainer.style.justifyContent = 'center';
      buttonsContainer.style.marginTop = '16px';
      
      const createBtn = document.createElement('button');
      createBtn.className = 'action-btn primary compact-btn';
      createBtn.innerHTML = '<span>Create New Prompt</span>';
      createBtn.addEventListener('click', () => {
        // Store current folder ID before opening modal
        const currentFolderId = this.currentFolderId || null;
        this.currentPromptFolderId = currentFolderId;
        this.openPromptModal();
      });
      
      const importBtn = document.createElement('button');
      importBtn.className = 'action-btn secondary compact-btn';
      importBtn.innerHTML = '<span>Import from File</span>';
      importBtn.addEventListener('click', () => {
        // Store current folder ID for import
        const currentFolderId = this.currentFolderId || null;
        this.pendingImportFolderId = currentFolderId;
        this.importPrompts();
      });
      
      buttonsContainer.appendChild(createBtn);
      buttonsContainer.appendChild(importBtn);
      emptyMsg.appendChild(buttonsContainer);
      
      promptsContainer.appendChild(emptyMsg);
      foldersTree.appendChild(promptsContainer);
    }
  }

  /**
   * Create Uncategorized item (Phase 6)
   */
  createUncategorizedItem(count) {
    const item = document.createElement('div');
    item.className = 'folder-tree-item uncategorized-item';
    item.dataset.level = 0;
    
    // macOS-Style Content Row
    const content = document.createElement('div');
    content.className = 'folder-item-content';

    // Empty toggle (no children)
    const toggle = document.createElement('span');
    toggle.className = 'folder-toggle empty';
    content.appendChild(toggle);

    // macOS-Style Icon & Name Group
    const iconNameGroup = document.createElement('div');
    iconNameGroup.className = 'folder-icon-name-group';

    // Lucide folder icon
    const icon = document.createElement('span');
    icon.className = 'folder-icon';
    const folderIcon = document.createElement('i');
    folderIcon.setAttribute('data-lucide', 'folder');
    folderIcon.style.width = '18px';
    folderIcon.style.height = '18px';
    folderIcon.style.color = '#9A9A9A';
    icon.appendChild(folderIcon);
    iconNameGroup.appendChild(icon);

    // Name (italic, lighter color)
    const name = document.createElement('span');
    name.className = 'folder-name';
    name.textContent = 'Uncategorized';
    name.style.fontStyle = 'italic';
    name.style.color = '#9A9A9A';
    iconNameGroup.appendChild(name);
    
    content.appendChild(iconNameGroup);

    // macOS-Style Count (Right-Aligned)
    if (count > 0) {
      const countBadge = document.createElement('span');
      countBadge.className = 'folder-count';
      countBadge.textContent = `${count}`;
      content.appendChild(countBadge);
    }

    // Click to view uncategorized prompts
    content.addEventListener('click', () => {
      this.viewUncategorizedPrompts();
    });

    item.appendChild(content);

    // Initialize Lucide icon
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 0);

    return item;
  }

  /**
   * PHASE 1.1: Create enhanced folder card with rich metadata
   * Displays: icon, name, color indicator, prompt count, subfolder count, timestamp
   * @param {Object} folder - Folder object
   * @param {number} level - Nesting level (for indentation)
   * @returns {HTMLElement} Enhanced folder card element
   */
  createEnhancedFolderCard(folder, level = 0) {
    const card = document.createElement('div');
    card.className = 'folder-card';
    card.dataset.folderId = folder.id;
    card.dataset.level = level;
    
    // Calculate metadata
    const promptCount = this.folderManager.countPromptsRecursive(folder.id, this.prompts);
    const subfolderCount = this.folderManager.folders.filter(f => f.parentId === folder.id).length;
    const timestamp = this.formatRelativeTime(folder.updatedAt || folder.createdAt);
    const isStarred = folder.isStarred || false;
    const folderColor = folder.color || '#22B8CF';
    const folderIcon = folder.icon || 'folder';
    
    // Use filled star icon when starred
    const starIcon = isStarred 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
      : `<i data-lucide="star" style="width: 14px; height: 14px;"></i>`;
    
    card.innerHTML = `<div class="folder-card-header">
  <div class="folder-icon-name">
    <span class="folder-name">${this.escapeHtml(folder.name)}</span>
  </div>
  <div class="folder-actions">
    <button class="folder-star-btn ${isStarred ? 'starred' : ''}" data-folder-id="${folder.id}">
      ${starIcon}
    </button>
    <button class="folder-menu-btn" data-folder-id="${folder.id}">
      <i data-lucide="more-vertical" style="width: 14px; height: 14px;"></i>
    </button>
  </div>
</div>
<div class="folder-color-accent" style="background: ${folderColor};"></div>
<div class="folder-metadata-row">
  <div class="folder-metadata">
    <button class="folder-meta-item prompts-meta ${promptCount === 0 ? 'empty-prompts' : ''}" data-folder-id="${folder.id}" data-action="view-prompts">
      ${promptCount} prompt${promptCount !== 1 ? 's' : ''}
    </button>
    ${subfolderCount > 0 ? `<button class="folder-meta-item subfolders-meta" data-folder-id="${folder.id}" data-action="view-subfolders">
      ${subfolderCount} subfolder${subfolderCount !== 1 ? 's' : ''}
    </button>` : ''}
  </div>
  <div class="folder-timestamp">
    <i data-lucide="clock" style="width: 10px; height: 10px;"></i>
    <span>${timestamp}</span>
  </div>
</div>
<div class="selection-indicator">
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
</div>`;
    
    // Add class if selected (for bulk selection)
    if (this.selectedFolderIds.has(folder.id)) {
      card.classList.add('is-selected');
    }
    
    // Event listeners - use event delegation to work with Lucide icon replacement
    card.addEventListener('click', (e) => {
      // Check if clicking on star button or its children
      if (e.target.closest('.folder-star-btn')) {
        e.stopPropagation();
        console.log('⭐ Star button clicked for folder:', folder.name);
        this.toggleFolderStar(folder.id);
        return;
      }
      
      // Check if clicking on menu button or its children
      if (e.target.closest('.folder-menu-btn')) {
        e.stopPropagation();
        console.log('⋮ Menu button clicked for folder:', folder.name);
        this.showFolderContextMenu(e, folder);
        return;
      }
      
      // Check if clicking on prompts metadata - show only prompts
      if (e.target.closest('.prompts-meta')) {
        e.stopPropagation();
        console.log('📄 Prompts metadata clicked for folder:', folder.name);
        this.viewFolderPromptsOnly(folder.id, folder.name);
        return;
      }
      
      // Check if clicking on subfolders metadata - show only subfolders
      if (e.target.closest('.subfolders-meta')) {
        e.stopPropagation();
        console.log('📁 Subfolders metadata clicked for folder:', folder.name);
        this.viewFolderSubfoldersOnly(folder.id, folder.name);
        return;
      }
      
      // Check if clicking on action buttons container
      if (e.target.closest('.folder-actions')) {
        e.stopPropagation();
        return;
      }
      
      // Check for Shift or Cmd/Ctrl key for bulk selection
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔲 Bulk selection toggle for folder:', folder.id);
        this.toggleFolderSelection(folder.id);
        return;
      }
      
      // Regular click navigates to folder (only if no selection active)
      if (this.selectedFolderIds && this.selectedFolderIds.size === 0) {
        this.viewFolderPrompts(folder.id, folder.name);
      }
    });
    
    // Add right-click context menu
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🖱️ Right-click on folder card:', folder.name);
      console.log('📊 Selected folders:', this.selectedFolderIds.size);
      console.log('📊 Is this card selected?', this.selectedFolderIds.has(folder.id));
      
      // If this card is part of a multi-selection, show bulk actions menu
      if (this.selectedFolderIds.has(folder.id) && this.selectedFolderIds.size > 0) {
        console.log('📋 Showing bulk folder actions menu');
        console.log('📋 Calling showBulkFolderActionsMenu...');
        this.showBulkFolderActionsMenu(e);
      } else if (this.selectedFolderIds.size > 0) {
        // Right-clicked on unselected card while selection exists - clear selection and show normal menu
        console.log('🔄 Clearing folder selection and showing normal menu');
        this.clearBulkFolderSelection();
        this.showFolderContextMenu(e, folder);
      } else {
        // No selection - show normal context menu
        console.log('📋 Showing normal folder context menu');
        this.showFolderContextMenu(e, folder);
      }
    });
    
    return card;
  }

  /**
   * Create folder tree element (recursive)
   */
  createFolderTreeElement(folderNode, level) {
    const item = document.createElement('div');
    item.className = 'folder-tree-item';
    item.dataset.folderId = folderNode.id;
    item.dataset.level = level;

    const hasChildren = folderNode.children && folderNode.children.length > 0;
    const promptCount = this.folderManager.countPromptsRecursive(folderNode.id, this.prompts);

    // macOS-Style Content Row
    const content = document.createElement('div');
    content.className = 'folder-item-content';
    content.draggable = true;

    // Add drag and drop event listeners
    content.addEventListener('dragstart', (e) => this.handleFolderDragStart(e, folderNode));
    content.addEventListener('dragover', (e) => this.handleFolderDragOver(e, folderNode));
    content.addEventListener('drop', (e) => this.handleFolderDrop(e, folderNode));
    content.addEventListener('dragend', (e) => this.handleFolderDragEnd(e));
    content.addEventListener('dragleave', (e) => this.handleFolderDragLeave(e));

    // macOS-Style Disclosure Chevron (Lucide chevron-right)
    const toggle = document.createElement('span');
    toggle.className = 'folder-toggle' + (hasChildren ? ' collapsed' : ' empty');
    
    if (hasChildren) {
      const chevron = document.createElement('i');
      chevron.setAttribute('data-lucide', 'chevron-right');
      toggle.appendChild(chevron);
      
      // Chevron click: Expand/collapse only
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFolder(folderNode.id);
      });
    }
    content.appendChild(toggle);

    // macOS-Style Icon & Name Group
    const iconNameGroup = document.createElement('div');
    iconNameGroup.className = 'folder-icon-name-group';
    
    // Folder Icon (supports both emoji and Lucide icons)
    const icon = document.createElement('span');
    icon.className = 'folder-icon';
    const iconName = folderNode.icon || 'folder';
    const isLucideIcon = !iconName.match(/[\u{1F300}-\u{1F9FF}]/u); // Not an emoji
    
    if (isLucideIcon) {
      // Lucide icon
      const lucideIcon = document.createElement('i');
      lucideIcon.setAttribute('data-lucide', iconName);
      lucideIcon.style.width = '18px';
      lucideIcon.style.height = '18px';
      icon.appendChild(lucideIcon);
    } else {
      // Emoji icon
      icon.textContent = iconName;
      icon.style.fontSize = '18px';
    }
    iconNameGroup.appendChild(icon);

    // Folder Name
    const name = document.createElement('span');
    name.className = 'folder-name';
    name.textContent = folderNode.name;
    iconNameGroup.appendChild(name);
    
    content.appendChild(iconNameGroup);

    // macOS-Style Prompt Count (Right-Aligned)
    if (promptCount > 0) {
      const count = document.createElement('span');
      count.className = 'folder-count';
      count.textContent = `${promptCount}`;
      content.appendChild(count);
    }

    // macOS-Style Kebab Menu Button
    const menuBtn = document.createElement('button');
    menuBtn.className = 'folder-menu-btn';
    menuBtn.textContent = '⋯';
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showFolderContextMenu(e, folderNode);
    });
    content.appendChild(menuBtn);

    // Row click: Navigate to folder (NOT expand/collapse)
    content.addEventListener('click', (e) => {
      // Don't trigger if clicking on toggle or menu
      if (e.target.closest('.folder-toggle') || 
          e.target.closest('.folder-menu-btn')) {
        return;
      }
      this.viewFolderPrompts(folderNode.id, folderNode.name);
    });

    item.appendChild(content);

    // Children container (collapsed by default - macOS style)
    if (hasChildren) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'folder-children collapsed';
      childrenContainer.id = `folder-children-${folderNode.id}`;

      folderNode.children.forEach(child => {
        const childElement = this.createFolderTreeElement(child, level + 1);
        childrenContainer.appendChild(childElement);
      });

      item.appendChild(childrenContainer);
    }

    return item;
  }

  /**
   * Toggle folder expand/collapse
   */
  toggleFolder(folderId) {
    const childrenContainer = document.getElementById(`folder-children-${folderId}`);
    const toggleBtn = document.querySelector(`[data-folder-id="${folderId}"] .folder-toggle`);

    if (childrenContainer && toggleBtn) {
      const isCollapsed = childrenContainer.classList.toggle('collapsed');
      toggleBtn.classList.toggle('collapsed', isCollapsed);
    }
  }

  /**
   * PHASE 1.1: Toggle folder star status
   * Stars/unstars a folder (unlimited starred folders allowed)
   * @param {string} folderId - ID of folder to star/unstar
   */
  async toggleFolderStar(folderId) {
    const folder = this.folderManager.folders.find(f => f.id === folderId);
    if (!folder) {
      console.error('Folder not found:', folderId);
      return;
    }

    // Toggle starred state
    if (!folder.isStarred) {
      // Starring
      folder.isStarred = true;
      this.showToast(`"${folder.name}" starred`, 'success');
    } else {
      // Unstarring
      folder.isStarred = false;
      this.showToast(`"${folder.name}" unstarred`, 'success');
    }

    folder.updatedAt = Date.now();
    await this.folderManager.saveFolders();
    
    // Re-render folders to show updated star state
    this.renderFolders();
  }

  /**
   * PHASE 1.3: Toggle folder section (accordion behavior)
   * Only one section can be expanded at a time
   * @param {string} sectionName - 'starred', 'recent', or 'all'
   */
  toggleFolderSection(sectionName) {
    const section = document.querySelector(`.${sectionName}-folders-section`);
    if (!section) return;
    
    const foldersList = section.querySelector('.folders-list');
    const chevron = section.querySelector('.section-chevron');
    
    if (!foldersList || !chevron) return;
    
    // If clicking the same section, toggle it
    if (this.expandedFolderSection === sectionName) {
      // Collapse
      foldersList.classList.remove('expanded');
      chevron.classList.remove('expanded');
      this.expandedFolderSection = null;
    } else {
      // Collapse all sections first
      document.querySelectorAll('.folders-list.expanded').forEach(list => {
        list.classList.remove('expanded');
      });
      document.querySelectorAll('.section-chevron.expanded').forEach(chev => {
        chev.classList.remove('expanded');
      });
      
      // Expand clicked section
      foldersList.classList.add('expanded');
      chevron.classList.add('expanded');
      this.expandedFolderSection = sectionName;
    }
  }

  /**
   * NEW: A generic, reusable, and intelligent function to show ANY context menu.
   * It takes the click event and an array of menu items as arguments.
   * @param {Event} event - The click event
   * @param {Array} menuItems - Array of menu item objects
   * @param {boolean} noScroll - If true, menu shows all items without scroll limit
   */
  showContextMenu(event, menuItems, noScroll = false, allFoldersForKeyboard = null) {
    event.stopPropagation();
    event.preventDefault();

    // Remove ALL existing context menus to prevent duplicates (both types)
    document.querySelectorAll('.context-menu').forEach(m => m.remove());
    document.querySelectorAll('.bulk-actions-menu').forEach(m => m.remove());

    const menu = document.createElement('div');
    menu.className = 'context-menu'; // Using a generic class name now
    if (noScroll) {
      menu.classList.add('no-scroll-limit'); // Add class for prompt card menus
    }

    const panelElement = document.querySelector('.panel-container');
    if (!panelElement) {
      console.error("Could not find the .panel-container element!");
      return;
    }

    const panelRect = panelElement.getBoundingClientRect();

    // Calculate initial position
    let menuLeft = event.clientX - panelRect.left;
    let menuTop = event.clientY - panelRect.top;

    // Build the menu from the provided items FIRST
    menuItems.forEach(item => {
      if (!item) return; // Skip separators or null items
      if (item.separator) {
        menu.appendChild(document.createElement('hr'));
        return;
      }
      
      // Handle header items (non-clickable section labels)
      if (item.isHeader) {
        const header = document.createElement('div');
        header.className = 'context-menu-header';
        header.textContent = item.label;
        if (item.headerStyle) {
          header.style.cssText = item.headerStyle;
        }
        menu.appendChild(header);
        return;
      }
      
      const btn = document.createElement('button');
      btn.className = 'context-menu-item' + (item.danger ? ' danger' : '') + (item.isRecentFolder ? ' recent-folder' : '') + (item.isMoveToFolderItem ? ' move-to-folder-item' : '');
      
      // Add data attributes for keyboard navigation
      btn.dataset.itemLabel = item.label;
      btn.dataset.folderId = item.folderId || '';
      
      // Add chevron if item has children
      if (item.hasChildren) {
        const chevronSpan = document.createElement('span');
        chevronSpan.className = 'menu-chevron';
        chevronSpan.style.marginRight = '4px';
        chevronSpan.style.display = 'inline-flex';
        chevronSpan.style.alignItems = 'center';
        chevronSpan.style.transition = 'transform 0.2s ease';
        chevronSpan.innerHTML = `
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
        btn.appendChild(chevronSpan);
        
        const labelSpan = document.createElement('span');
        labelSpan.textContent = item.label;
        btn.appendChild(labelSpan);
        
        // Create submenu container IMMEDIATELY
        const submenuContainer = document.createElement('div');
        submenuContainer.className = 'context-submenu';
        submenuContainer.style.display = 'none';
        submenuContainer.style.paddingLeft = '0';
        
        // Attach submenu container and expandAction for programmatic access
        btn.submenuContainer = submenuContainer;
        btn.expandAction = item.expandAction; // Store for auto-expand
        
        // CRITICAL FIX: Separate chevron click (expand) from folder name click (select)
        
        // Chevron click: expand/collapse children
        chevronSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          const isExpanded = submenuContainer.style.display === 'block';
          
          if (isExpanded) {
            // Collapse
            submenuContainer.style.display = 'none';
            chevronSpan.style.transform = 'rotate(0deg)';
          } else {
            // Expand
            submenuContainer.style.display = 'block';
            chevronSpan.style.transform = 'rotate(90deg)';
            
            // Build submenu if expanding
            if (submenuContainer.children.length === 0 && item.expandAction) {
              item.expandAction(submenuContainer);
            }
          }
        });
        
        // Folder name click: select this folder
        labelSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.action) {
            item.action();
            menu.remove();
          }
        });
      } else {
        // No children - add icon and label
        // Get icon based on label
        const iconSVG = this.getMenuItemIcon(item.label);
        if (iconSVG) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'menu-item-icon';
          iconSpan.innerHTML = iconSVG;
          btn.appendChild(iconSpan);
        }
        
        const labelSpan = document.createElement('span');
        labelSpan.textContent = item.label;
        btn.appendChild(labelSpan);
        
        // Click on menu item
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.action) {
            item.action();
            menu.remove();
          }
        });
      }
      
      menu.appendChild(btn);
      
      // Add submenu container if exists
      if (item.hasChildren && btn.submenuContainer) {
        menu.appendChild(btn.submenuContainer);
      }
    });

    // Temporarily append to the panel to measure its size for smart positioning
    menu.style.visibility = 'hidden'; // Render off-screen first
    menu.style.position = 'absolute';
    panelElement.appendChild(menu);
    const menuRect = menu.getBoundingClientRect();

    // **SMART CONTEXT-AWARE POSITIONING LOGIC**
    // Calculate position relative to panel
    const relativeX = event.clientX - panelRect.left;
    const relativeY = event.clientY - panelRect.top;
    
    let finalLeft = menuLeft;
    let finalTop = menuTop;
    
    // Horizontal positioning: If menu would overflow right edge, position it to the left of cursor
    if (relativeX + menuRect.width > panelRect.width - 10) {
      // Position menu to the left of cursor instead
      finalLeft = relativeX - menuRect.width;
      // Ensure it doesn't go off the left edge
      if (finalLeft < 10) {
        finalLeft = 10;
      }
      console.log('📍 Context menu adjusted left:', finalLeft, '(would overflow right edge)');
    }
    
    // Vertical positioning: If menu would overflow bottom edge, position it ABOVE the cursor
    if (relativeY + menuRect.height > panelRect.height - 10) {
      // Position menu ABOVE the cursor instead
      finalTop = relativeY - menuRect.height;
      // Ensure it doesn't go off the top edge
      if (finalTop < 10) {
        finalTop = 10;
      }
      console.log('📍 Context menu adjusted top:', finalTop, '(would overflow bottom edge, positioned above cursor)');
    }

    // Apply the final, corrected positions
    menu.style.left = `${finalLeft}px`;
    menu.style.top = `${finalTop}px`;
    menu.style.visibility = ''; // Make it visible again
    menu.style.display = 'block';

    // Setup keyboard navigation for type-to-navigate
    this.setupContextMenuKeyboardNavigation(menu, allFoldersForKeyboard);
    
    // CRITICAL FIX: Set focus to menu for keyboard navigation to work
    // Make menu focusable and focus it
    menu.setAttribute('tabindex', '-1');
    setTimeout(() => {
      menu.focus();
    }, 0);
    
    // Close menu on click or right-click outside
    const closeMenuOnClickOutside = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenuOnClickOutside);
        document.removeEventListener('contextmenu', closeMenuOnClickOutside);
        document.removeEventListener('keydown', menu._keydownHandler);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenuOnClickOutside);
      document.addEventListener('contextmenu', closeMenuOnClickOutside);
    }, 0);
  }

  /**
   * Setup keyboard navigation for context menu (type-to-navigate)
   * Enables letter key navigation to filter and highlight folders
   * @param {HTMLElement} menu - The context menu element
   * @param {Array} allFoldersForKeyboard - Optional comprehensive folder list (includes nested)
   */
  setupContextMenuKeyboardNavigation(menu, allFoldersForKeyboard = null) {
    // Get all clickable items (exclude headers and separators)
    const allItems = Array.from(menu.querySelectorAll('.context-menu-item'));
    
    // If comprehensive folder list provided, store it for searching ALL folders
    if (allFoldersForKeyboard) {
      menu.dataset.allFolders = JSON.stringify(allFoldersForKeyboard);
    }
    
    // Store navigation state on menu element
    menu.dataset.lastKeyPressed = '';
    menu.dataset.lastKeyTime = '0';
    menu.dataset.currentMatchIndex = '-1';
    
    // Create keyboard handler
    const keydownHandler = (e) => {
      // Only handle if this menu is visible and focused
      if (!document.body.contains(menu)) return;
      
      // CRITICAL: Only process if the event target is the menu or its children
      // This prevents interference with other inputs
      if (!menu.contains(e.target) && e.target !== menu) return;
      
      // Handle Enter key for selection
      if (e.key === 'Enter') {
        const focusedItem = menu.querySelector('.context-menu-item.keyboard-focused');
        if (focusedItem) {
          e.preventDefault();
          e.stopPropagation();
          focusedItem.click();
          return;
        }
      }
      
      // Only handle letter keys (a-z) for search
      if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const typedKey = e.key.toLowerCase();
      const currentTime = Date.now();
      const lastKeyTime = parseInt(menu.dataset.lastKeyTime) || 0;
      const lastKeyPressed = menu.dataset.lastKeyPressed || '';
      
      // CRITICAL FIX: Parse currentMatchIndex correctly (0 is valid!)
      const parsedIndex = parseInt(menu.dataset.currentMatchIndex);
      const currentMatchIndex = isNaN(parsedIndex) ? -1 : parsedIndex;
      
      // Check if same key pressed within 1 second (cycling behavior)
      const isCycling = (typedKey === lastKeyPressed && currentTime - lastKeyTime < 1000);
      
      // Get matching items - search in comprehensive folder list if available
      let matchingFolders = [];
      let matchingItems = [];
      
      // Always get fresh list of all items (important for expanded submenus)
      const currentAllItems = Array.from(menu.querySelectorAll('.context-menu-item'));
      
      if (menu.dataset.allFolders) {
        // Search ALL folders (including nested/hidden)
        try {
          const allFolders = JSON.parse(menu.dataset.allFolders);
          matchingFolders = allFolders.filter(folder => 
            folder.name.toLowerCase().startsWith(typedKey)
          );
          
          // Find visible items matching these folders
          matchingItems = currentAllItems.filter(item => {
            const folderId = item.dataset.folderId;
            return folderId && matchingFolders.some(f => f.folderId === folderId);
          });
          
          // CRITICAL FIX: Auto-expand if there are MORE matching folders than visible items
          // This handles case where some matches are in Recent Folders but others are nested
          if (matchingFolders.length > matchingItems.length) {
            console.log(`🔧 Auto-expand triggered: Found ${matchingFolders.length} total matches but only ${matchingItems.length} visible`);
            
            // Find which folders are nested (have parents)
            const nestedFolders = matchingFolders.filter(f => f.parentId);
            console.log(`   Found ${nestedFolders.length} nested folders to reveal`);
            
            // Collect unique parent IDs that need to be expanded
            const parentsToExpand = new Set(nestedFolders.map(f => f.parentId));
            
            // Auto-expand parents to reveal ALL their children (no filtering)
            parentsToExpand.forEach(parentId => {
              console.log(`🔧 Expanding parent: ${parentId} (showing ALL children)`);
              this.expandParentInContextMenu(menu, parentId);
            });
            
            // Re-query after expansion
            const updatedItems = Array.from(menu.querySelectorAll('.context-menu-item'));
            matchingItems = updatedItems.filter(item => {
              const folderId = item.dataset.folderId;
              return folderId && matchingFolders.some(f => f.folderId === folderId);
            });
            
            console.log(`🔧 After expansion: found ${matchingItems.length} visible items (all children shown)`);
          }
          
          console.log(`🔍 Found ${matchingFolders.length} folders matching "${typedKey}"`, matchingFolders);
          console.log(`📋 Found ${matchingItems.length} visible menu items`, matchingItems.map(i => i.dataset.itemLabel));
        } catch (err) {
          console.error('Failed to parse allFolders:', err);
        }
      } else {
        // Fallback: search only visible items
        matchingItems = currentAllItems.filter(item => {
          const label = item.dataset.itemLabel || '';
          return label.toLowerCase().startsWith(typedKey);
        });
      }
      
      if (matchingItems.length === 0) {
        console.log(`❌ No matches found for "${typedKey}"`);
        return;
      }
      
      // Calculate which match to highlight
      let targetIndex = 0;
      if (isCycling) {
        targetIndex = (currentMatchIndex + 1) % matchingItems.length;
        console.log(`🔄 Cycling: ${currentMatchIndex} → ${targetIndex} (of ${matchingItems.length})`);
      }
      
      const targetElement = matchingItems[targetIndex];
      
      // Remove previous keyboard focus from ALL current items
      currentAllItems.forEach(item => item.classList.remove('keyboard-focused'));
      
      // Add keyboard focus to target
      targetElement.classList.add('keyboard-focused');
      
      // Scroll into view
      targetElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      
      // Update state
      menu.dataset.lastKeyPressed = typedKey;
      menu.dataset.lastKeyTime = currentTime.toString();
      menu.dataset.currentMatchIndex = targetIndex.toString();
      
      console.log(`⌨️ Context menu: Highlighted "${targetElement.dataset.itemLabel}" (${targetIndex + 1}/${matchingItems.length})`);
    };
    
    // Store handler reference for cleanup
    menu._keydownHandler = keydownHandler;
    
    // Add event listener
    document.addEventListener('keydown', keydownHandler);
  }

  /**
   * Expand parent folder in context menu to reveal ALL nested children
   * No filtering - all children are shown, only matching ones are highlighted via keyboard nav
   * @param {HTMLElement} menu - The context menu
   * @param {string} parentFolderId - The parent folder ID to expand
   */
  expandParentInContextMenu(menu, parentFolderId) {
    console.log(`🔍 expandParentInContextMenu called for parent: ${parentFolderId}`);
    
    // Find the menu item for this parent folder
    // CRITICAL: We need the item with expandAction (from All Folders section, not Recent)
    const allItems = Array.from(menu.querySelectorAll('.context-menu-item'));
    console.log(`   Available items with folderIds:`, allItems.map(i => i.dataset.folderId));
    
    // Find items matching this folderId
    const matchingItems = allItems.filter(item => item.dataset.folderId === parentFolderId);
    console.log(`   Found ${matchingItems.length} items with folderId: ${parentFolderId}`);
    
    // Prefer the one with expandAction (from All Folders section)
    const parentItem = matchingItems.find(item => item.expandAction) || matchingItems[0];
    
    if (!parentItem) {
      console.log(`   ❌ Parent item not found for: ${parentFolderId}`);
      return;
    }
    
    console.log(`   ✓ Found parent item: ${parentItem.dataset.itemLabel}, Has expandAction: ${!!parentItem.expandAction}`);
    
    // Find the chevron and trigger expansion
    const chevron = parentItem.querySelector('.menu-chevron');
    console.log(`   Has chevron: ${!!chevron}, Has submenuContainer: ${!!parentItem.submenuContainer}`);
    
    if (!chevron || !parentItem.submenuContainer) {
      console.log(`   ⚠️ Cannot expand: missing chevron or submenuContainer (likely in Recent Folders section)`);
      return;
    }
    
    if (chevron && parentItem.submenuContainer) {
      const submenuContainer = parentItem.submenuContainer;
      
      // CRITICAL FIX: If container is empty, trigger expandAction to create children
      if (submenuContainer.children.length === 0 && parentItem.expandAction) {
        console.log('🔧 Triggering expandAction to create children for:', parentFolderId);
        parentItem.expandAction(submenuContainer);
      }
      
      // Expand if not already expanded
      if (submenuContainer.style.display !== 'block') {
        submenuContainer.style.display = 'block';
        chevron.style.transform = 'rotate(90deg)';
      }
      
      // NEW APPROACH: Show ALL children when expanding (no selective filtering)
      // Only highlight matching ones via keyboard navigation
      const childItems = submenuContainer.querySelectorAll('.context-menu-item');
      
      // Always ensure all children are visible (remove any previous filters)
      childItems.forEach(childItem => {
        childItem.style.display = '';
      });
      
      console.log(`✓ Expanded parent with ${childItems.length} children (all visible, no filtering)`);
    }
  }

  /**
   * Show "More Options" menu for prompt card secondary actions
   */
  showMoreActionsMenu(event, prompt, favoriteBtn, shareBtn, deleteBtn, editBtn) {
    event.stopPropagation();
    event.preventDefault();
    
    // Toggle functionality: Close if already open
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }
    
    const isFavorited = this.isFavorite(prompt.id);
    const isInFavoritesTab = this.currentTab === 'favorites';
    
    // Build context-aware menu based on current tab
    const menuItems = [];
    
    // Always show Edit first
    menuItems.push({
      label: 'Edit',
      action: () => {
        this.openPromptModal(prompt);
      }
    });
    
    // Always show Share second
    menuItems.push({
      label: 'Share',
      action: () => {
        this.sharePrompt(prompt);
      }
    });
    
    // Context-aware items based on tab
    if (isInFavoritesTab) {
      // FAVORITES TAB: Edit, Share, Move to Folder, Remove from Favorites
      menuItems.push({
        label: 'Move to Folder',
        action: () => {
          document.querySelectorAll('.context-menu').forEach(m => m.remove());
          const syntheticEvent = {
            clientX: event.clientX,
            clientY: event.clientY,
            target: event.target,
            stopPropagation: () => {},
            preventDefault: () => {}
          };
          setTimeout(() => {
            this.showFolderMenuForPrompt(syntheticEvent, prompt);
          }, 50);
        }
      });
      
      menuItems.push({ separator: true });
      
      menuItems.push({
        label: 'Remove from Favorites',
        action: async () => {
          await this.toggleFavorite(prompt.id);
          this.renderFavorites();
        },
        danger: true
      });
    } else {
      // PROMPTS TAB: Edit, Share, Add/Remove Favorites, Move to Folder, Delete
      menuItems.push({
        label: isFavorited ? 'Remove from Favorites' : 'Add to Favorites',
        action: async () => {
          const newState = await this.toggleFavorite(prompt.id);
          const btn = favoriteBtn;
          const card = event.target.closest('.prompt-card');
          if (newState) {
            btn.innerHTML = this.getHeartIcon(true);
            btn.setAttribute('data-tooltip', 'Remove from favorites');
            btn.classList.add('is-favorite');
            if (card) card.classList.add('is-favorited-card');
          } else {
            btn.innerHTML = this.getHeartIcon(false);
            btn.setAttribute('data-tooltip', 'Add to favorites');
            btn.classList.remove('is-favorite');
            if (card) card.classList.remove('is-favorited-card');
          }
        }
      });
      
      menuItems.push({
        label: 'Move to Folder',
        action: () => {
          document.querySelectorAll('.context-menu').forEach(m => m.remove());
          const syntheticEvent = {
            clientX: event.clientX,
            clientY: event.clientY,
            target: event.target,
            stopPropagation: () => {},
            preventDefault: () => {}
          };
          setTimeout(() => {
            this.showFolderMenuForPrompt(syntheticEvent, prompt);
          }, 50);
        }
      });
      
      menuItems.push({ separator: true });
      
      menuItems.push({
        label: 'Delete',
        action: () => {
          this.showDeletePromptModal(prompt);
        },
        danger: true
      });
    }
    
    // Pass noScroll = true for prompt card menus to show all options without scrolling
    this.showContextMenu(event, menuItems, true);
  }

  /**
   * NEW: A small, specific function for the folder menu.
   * It just prepares the items and calls the new generic showContextMenu function.
   */
  showFolderContextMenu(event, folder) {
    console.log('🎯 showFolderContextMenu called for folder:', folder.name);
    const menuItems = [
      { label: 'Create Subfolder', action: () => this.createSubfolder(folder) },
      { label: 'Rename', action: () => this.editFolder(folder) },
      { label: 'Delete', action: () => this.deleteFolderWithConfirm(folder), danger: true }
    ];
    this.showContextMenu(event, menuItems);
  }

  /**
   * Show elite move-to-folder modal
   */
  showFolderMenuForPrompt(event, prompt) {
    console.log('🎯 showFolderMenuForPrompt called');
    console.log('Prompt:', prompt);
    console.log('Event:', event);

    try {
      // Call the new working modal implementation
      console.log('About to call showMoveToFolderModal with:', {
        id: prompt.id,
        title: prompt.title,
        folderId: prompt.folderId
      });
      
      this.showMoveToFolderModal(prompt.id, prompt.title, prompt.folderId);
      
      console.log('showMoveToFolderModal call completed');
    } catch (error) {
      console.error('❌ ERROR in showFolderMenuForPrompt:', error);
      console.error('Error stack:', error.stack);
      alert('Error opening modal: ' + error.message);
    }
  }

  /**
   * ============================================
   * MOVE TO FOLDER MODAL - COMPLETE WORKING CODE
   * ============================================
   */

  /**
   * Opens the Move to Folder modal
   */
  showMoveToFolderModal(promptId, promptTitle, currentFolderId) {
    try {
      console.log('🚀 showMoveToFolderModal START');
      console.log('Parameters:', { promptId, promptTitle, currentFolderId });
      console.log('Folders available:', this.folderManager.folders.length);
      
      // Initialize recent folders if not exists
      if (!this.recentFolderIds) {
        this.recentFolderIds = [];
      }
      
      // Store state
      this.moveModalState = {
        isOpen: true,
        promptId: promptId,
        promptTitle: promptTitle,
        currentFolderId: currentFolderId,
        currentFolderName: currentFolderId
          ? (this.folderManager.folders.find(f => f.id === currentFolderId)?.name || 'None')
          : 'None',
        searchTerm: '',
        expandedFolderIds: new Set()
      };

      console.log('Modal state created:', this.moveModalState);

      // Remove existing modal if any
      const existingModal = document.querySelector('.move-to-folder-overlay');
      if (existingModal) {
        console.log('Removing existing modal');
        existingModal.remove();
      }

      // Create and inject modal
      console.log('Rendering modal HTML...');
      const modalHTML = this.renderMoveToFolderModalHTML();
      console.log('Modal HTML length:', modalHTML.length);
      console.log('Modal HTML preview:', modalHTML.substring(0, 200));
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      console.log('Modal HTML inserted into DOM');

      // Check if modal exists in DOM
      const checkModal = document.querySelector('.move-to-folder-overlay');
      console.log('Modal in DOM?', checkModal ? 'YES' : 'NO');
      if (checkModal) {
        const computedStyles = window.getComputedStyle(checkModal);
        console.log('Modal computed styles:', {
          display: computedStyles.display,
          visibility: computedStyles.visibility,
          opacity: computedStyles.opacity,
          zIndex: computedStyles.zIndex,
          position: computedStyles.position,
          top: computedStyles.top,
          left: computedStyles.left,
          width: computedStyles.width,
          height: computedStyles.height
        });
        
        // FAILSAFE: Force modal to be visible with inline styles
        // z-index must be higher than .panel-container (2147483647)
        // Use setProperty to avoid overwriting all styles
        console.log('Applying failsafe inline styles...');
        checkModal.style.setProperty('position', 'fixed', 'important');
        checkModal.style.setProperty('top', '0', 'important');
        checkModal.style.setProperty('left', '0', 'important');
        checkModal.style.setProperty('right', '0', 'important');
        checkModal.style.setProperty('bottom', '0', 'important');
        checkModal.style.setProperty('width', '100vw', 'important');
        checkModal.style.setProperty('height', '100vh', 'important');
        checkModal.style.setProperty('z-index', '2147483648', 'important');
        checkModal.style.setProperty('display', 'flex', 'important');
        checkModal.style.setProperty('align-items', 'center', 'important');
        checkModal.style.setProperty('justify-content', 'center', 'important');
        checkModal.style.setProperty('background', 'rgba(0, 0, 0, 0.7)', 'important');
        checkModal.style.setProperty('opacity', '1', 'important');
        checkModal.style.setProperty('visibility', 'visible', 'important');
        // DO NOT set pointer-events - it blocks clicks!
        console.log('Failsafe styles applied with z-index: 2147483648');
      }

      // Initialize Lucide icons FIRST
      if (typeof lucide !== 'undefined') {
        console.log('Initializing Lucide icons...');
        lucide.createIcons();
      } else {
        console.warn('⚠️ Lucide is not defined!');
      }

      // Attach event listeners AFTER icons are initialized
      // Use setTimeout to ensure DOM is fully ready
      setTimeout(() => {
        this.attachMoveModalEventListeners();
      }, 50);

      // Focus search input after a brief delay
      setTimeout(() => {
        const searchInput = document.querySelector('.move-modal-search-input');
        if (searchInput) {
          searchInput.focus();
          console.log('Search input focused');
        } else {
          console.warn('⚠️ Search input not found!');
        }
      }, 150);
      
      console.log('✅ showMoveToFolderModal COMPLETE');
    } catch (error) {
      console.error('❌ CRITICAL ERROR in showMoveToFolderModal:', error);
      console.error('Error stack:', error.stack);
      alert('Critical error opening modal: ' + error.message);
    }
  }

  /**
   * Renders the complete modal HTML
   */
  renderMoveToFolderModalHTML() {
    // Check if this is a bulk move
    let promptTitle, currentFolderName;
    
    if (this.isBulkMove && this.bulkMoveContext) {
      promptTitle = this.bulkMoveContext.movingText;
      currentFolderName = this.bulkMoveContext.currentlyInText;
    } else {
      promptTitle = this.moveModalState.promptTitle;
      currentFolderName = this.moveModalState.currentFolderName;
    }

    return `
      <div class="move-to-folder-overlay">
        <div class="move-to-folder-modal">
          <!-- Header with Title and Close Button ONLY -->
          <div class="move-modal-header">
            <h2 class="move-modal-title">MOVE TO FOLDER</h2>
            <button class="move-modal-close-btn" data-action="close" aria-label="Close">
              <i data-lucide="x"></i>
            </button>
          </div>

          <!-- Context Info OUTSIDE Title Bar -->
          <div class="move-modal-context">
            <div class="context-row">
              <span class="context-label">Moving:</span>
              <span class="context-value" style="font-weight: 500;">${this.escapeHTML(promptTitle)}</span>
            </div>
            <div class="context-row">
              <span class="context-label">Currently in:</span>
              <span class="context-value context-folder" style="font-weight: 500;">${this.escapeHTML(currentFolderName)}</span>
            </div>
          </div>

          <!-- Search -->
          <div class="move-modal-search-container">
            <i data-lucide="search" class="search-icon"></i>
            <input
              type="text"
              class="move-modal-search-input"
              placeholder="Search folders..."
              autocomplete="off"
              spellcheck="false"
            />
            <button class="search-clear-btn" data-action="clear-search" style="display: none;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Folder List -->
          <div class="move-modal-content">
            ${this.renderFolderListHTML()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renders the folder list with sections
   */
  renderFolderListHTML() {
    try {
      console.log('📋 renderFolderListHTML START');
      const { searchTerm, currentFolderId } = this.moveModalState;
      console.log('Search term:', searchTerm, 'Current folder:', currentFolderId);

      // Check if no folders exist at all
      if (!this.folderManager.folders || this.folderManager.folders.length === 0) {
        console.log('No folders exist, rendering empty state');
        return this.renderEmptyStateHTML('no-folders');
      }

      console.log('Building folder tree from', this.folderManager.folders.length, 'folders');
      
      // Build folder tree
      const folderTree = this.buildFolderTree(this.folderManager.folders);
      console.log('Folder tree built:', folderTree.length, 'root folders');

      // Apply search filter
      const filteredTree = this.filterFolderTree(folderTree, searchTerm);
      console.log('Filtered tree:', filteredTree.length, 'folders');

      // Check if search returned no results
      if (searchTerm && searchTerm.trim() !== '' && filteredTree.length === 0) {
        console.log('Search returned no results');
        return this.renderEmptyStateHTML('no-results', searchTerm);
      }

      let html = '';

      // Recently Used Section (only when not searching)
      if (!searchTerm || searchTerm.trim() === '') {
        const recentFolders = this.getRecentlyUsedFolders();
        console.log('Recent folders:', recentFolders ? recentFolders.length : 0);
        if (recentFolders && recentFolders.length > 0) {
          html += `
            <div class="folder-section">
              <div class="folder-section-header">
                <i data-lucide="zap"></i>
                <span>RECENTLY USED</span>
              </div>
              <div class="folder-list">
                ${recentFolders.map(folder => this.renderFolderItemHTML(folder, currentFolderId, 0, false)).join('')}
              </div>
            </div>
          `;
        }
      }

      // All Folders Section
      html += `
        <div class="folder-section">
          <div class="folder-section-header">
            <i data-lucide="folder"></i>
            <span>${searchTerm ? 'SEARCH RESULTS' : 'ALL FOLDERS'}</span>
          </div>
          <div class="folder-list">
            ${filteredTree.map(folder => this.renderFolderItemHTML(folder, currentFolderId, 0, true)).join('')}
          </div>
        </div>
      `;

      console.log('📋 renderFolderListHTML COMPLETE, HTML length:', html.length);
      return html;
    } catch (error) {
      console.error('❌ Error in renderFolderListHTML:', error);
      return '<div class="move-modal-empty-state"><p>Error loading folders</p></div>';
    }
  }

  /**
   * Renders a single folder item recursively
   */
  renderFolderItemHTML(folder, currentFolderId, level = 0, includeChildren = true) {
    const isCurrent = folder.id === currentFolderId;
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = this.moveModalState.expandedFolderIds.has(folder.id) || folder.isExpanded;
    const promptCount = this.prompts.filter(p => p.folderId === folder.id).length;
    const folderColor = folder.color || '#22B8CF';
    const folderIcon = folder.icon || 'folder';
    const paddingLeft = 16 + (level * 24);

    let html = `
      <div
        class="folder-item ${isCurrent ? 'is-current' : ''} ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'is-expanded' : ''}"
        data-folder-id="${folder.id}"
        data-level="${level}"
        data-action="select-folder"
        style="padding-left: ${paddingLeft}px; --folder-color: ${folderColor};"
      >
        ${hasChildren ? `
          <button class="folder-chevron" data-action="toggle-expand" aria-label="Toggle folder">
            <i data-lucide="chevron-right"></i>
          </button>
        ` : '<span class="folder-chevron-spacer"></span>'}

        <i data-lucide="${folderIcon}" class="folder-icon" style="color: #9A9A9A !important;"></i>

        <span class="folder-name">${this.escapeHTML(folder.name)}</span>

        ${isCurrent ? '<i data-lucide="check" class="folder-checkmark"></i>' : ''}

        <span class="folder-count">${promptCount}</span>
      </div>
    `;

    // Render children
    if (hasChildren && isExpanded && includeChildren && folder.children) {
      html += '<div class="folder-children">';
      folder.children.forEach(child => {
        html += this.renderFolderItemHTML(child, currentFolderId, level + 1, true);
      });
      html += '</div>';
    }

    return html;
  }

  /**
   * Renders empty states
   */
  renderEmptyStateHTML(type, searchTerm = '') {
    if (type === 'no-folders') {
      return `
        <div class="move-modal-empty-state">
          <div class="empty-icon">
            <i data-lucide="folder-x"></i>
          </div>
          <h3 class="empty-title">No folders yet</h3>
          <p class="empty-description">Create your first folder to organize your prompts</p>
          <button class="empty-action-btn" data-action="create-new-folder">
            <i data-lucide="plus"></i>
            Create New Folder
          </button>
        </div>
      `;
    }

    if (type === 'no-results') {
      return `
        <div class="move-modal-empty-state">
          <div class="empty-icon">
            <i data-lucide="search-x"></i>
          </div>
          <h3 class="empty-title">No folders found</h3>
          <p class="empty-description">No folders matching "<strong>${this.escapeHTML(searchTerm)}</strong>"</p>
          <button class="empty-action-btn" data-action="create-new-folder" data-prefill="${this.escapeHTML(searchTerm)}">
            <i data-lucide="plus"></i>
            Create "${this.escapeHTML(searchTerm)}" folder
          </button>
          <p class="empty-hint">or try a different search term</p>
        </div>
      `;
    }

    return '';
  }

  /**
   * Attaches all event listeners - CRITICAL FOR SEARCH
   */
  attachMoveModalEventListeners() {
    console.log('🔧 attachMoveModalEventListeners called');
    
    const modal = document.querySelector('.move-to-folder-modal');
    const overlay = document.querySelector('.move-to-folder-overlay');
    const searchInput = document.querySelector('.move-modal-search-input');
    const clearBtn = document.querySelector('.move-modal-search-container .search-clear-btn');

    console.log('Modal found:', modal ? 'YES' : 'NO');
    console.log('Overlay found:', overlay ? 'YES' : 'NO');
    console.log('Search input found:', searchInput ? 'YES' : 'NO');
    console.log('Clear button found:', clearBtn ? 'YES' : 'NO');

    if (!modal || !overlay) {
      console.error('❌ Modal or overlay not found! Cannot attach listeners.');
      return;
    }

    // Close button - try multiple selectors
    let closeBtn = modal.querySelector('[data-action="close"]');
    if (!closeBtn) {
      closeBtn = modal.querySelector('.move-modal-close-btn');
    }
    if (!closeBtn) {
      closeBtn = document.querySelector('.move-modal-close-btn');
    }
    
    console.log('Close button found:', closeBtn ? 'YES' : 'NO');
    if (closeBtn) {
      console.log('Close button element:', closeBtn);
      console.log('Close button tagName:', closeBtn.tagName);
      console.log('Close button data-action:', closeBtn.getAttribute('data-action'));
      console.log('Attaching click listener to close button...');
      
      // Store this context
      const self = this;
      
      // Attach listener directly (don't clone)
      closeBtn.onclick = function(e) {
        console.log('❌ Close button clicked via onclick!');
        console.log('self object:', self);
        console.log('self.closeMoveToFolderModal:', self.closeMoveToFolderModal);
        console.log('About to call closeMoveToFolderModal...');
        e.preventDefault();
        e.stopPropagation();
        
        try {
          console.log('Calling method now...');
          const result = self.closeMoveToFolderModal();
          console.log('Method returned:', result);
          console.log('Method call completed');
        } catch (error) {
          console.error('❌ Error:', error);
          console.error('Stack:', error.stack);
        }
        
        return false;
      };
      
      console.log('✅ Close button onclick attached');
    } else {
      console.error('❌ Close button not found anywhere!');
    }

    // Overlay click to close
    console.log('Attaching click listener to overlay...');
    overlay.addEventListener('click', (e) => {
      console.log('🖱️ Overlay clicked, target:', e.target);
      console.log('Target is overlay?', e.target === overlay);
      console.log('Target classList:', e.target.classList);
      
      // Only close if clicked directly on overlay (not on modal or its children)
      if (e.target === overlay) {
        console.log('✅ Clicked directly on overlay background, closing modal');
        this.closeMoveToFolderModal();
      } else {
        console.log('❌ Clicked on:', e.target.className, '- not closing');
      }
    });
    console.log('✅ Overlay listener attached');

    // Escape key to close
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeMoveToFolderModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Search input - THIS IS CRITICAL FOR SEARCH TO WORK
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        console.log('Search input changed:', value);
        
        // Show/hide clear button based on input value
        if (clearBtn) {
          clearBtn.style.display = value ? 'flex' : 'none';
        }
        
        this.handleMoveModalSearch(value);
      });

      searchInput.addEventListener('keyup', (e) => {
        const value = e.target.value;
        console.log('Search keyup:', value);
        
        // Show/hide clear button based on input value
        if (clearBtn) {
          clearBtn.style.display = value ? 'flex' : 'none';
        }
        
        this.handleMoveModalSearch(value);
      });
    }

    // Clear search button
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        // Hide clear button after clearing
        clearBtn.style.display = 'none';
        this.handleMoveModalSearch('');
      });
    }

    // Event delegation for folder items
    // IMPORTANT: Check chevron FIRST before folder selection
    console.log('Attaching click listener to modal for folder items...');
    modal.addEventListener('click', (e) => {
      console.log('🖱️ Modal clicked, target:', e.target);
      console.log('Target tagName:', e.target.tagName);
      console.log('Target className:', e.target.className);
      
      // Check chevron toggle FIRST (highest priority)
      const toggleBtn = e.target.closest('[data-action="toggle-expand"]');
      if (toggleBtn) {
        console.log('🔽 Chevron clicked!');
        e.preventDefault();
        e.stopPropagation();
        const folderItem = toggleBtn.closest('.folder-item');
        const folderId = folderItem?.dataset.folderId;
        console.log('Folder item:', folderItem);
        console.log('Folder ID:', folderId);
        if (folderId) {
          console.log('✅ Toggle expand:', folderId);
          this.toggleFolderExpand(folderId);
        } else {
          console.warn('⚠️ No folder ID found!');
        }
        return;
      }

      // Check create folder button
      const createBtn = e.target.closest('[data-action="create-new-folder"]');
      if (createBtn) {
        const prefill = createBtn.dataset.prefill || '';
        console.log('✅ Create folder button clicked, prefill:', prefill);
        this.handleCreateNewFolderFromModal(prefill);
        return;
      }

      // Check folder selection LAST (lowest priority)
      const folderItem = e.target.closest('[data-action="select-folder"]');
      console.log('Checking for folder selection, folderItem:', folderItem);
      if (folderItem) {
        const folderId = folderItem.dataset.folderId;
        console.log('📁 Folder clicked! ID:', folderId);
        if (folderId) {
          console.log('✅ Calling handleFolderSelection with ID:', folderId);
          this.handleFolderSelection(folderId);
        } else {
          console.warn('⚠️ No folder ID found on clicked element');
        }
        return;
      }
      
      console.log('❌ No action matched for this click');
    });
    console.log('✅ Modal click listener attached');

    console.log('Move modal event listeners attached');
  }

  /**
   * Handles search input - CRITICAL FUNCTION
   */
  handleMoveModalSearch(searchTerm) {
    console.log('handleMoveModalSearch called with:', searchTerm);

    this.moveModalState.searchTerm = searchTerm;
    this.moveModalState.expandedFolderIds.clear();

    const clearBtn = document.querySelector('.move-modal-search-container .search-clear-btn');
    if (clearBtn) {
      clearBtn.style.display = searchTerm && searchTerm.trim() !== '' ? 'flex' : 'none';
    }

    this.updateMoveModalFolderList();
  }

  /**
   * Updates the folder list without re-rendering entire modal
   */
  updateMoveModalFolderList() {
    const contentContainer = document.querySelector('.move-modal-content');
    if (!contentContainer) {
      console.error('Content container not found!');
      return;
    }

    console.log('Updating folder list with search:', this.moveModalState.searchTerm);

    contentContainer.innerHTML = this.renderFolderListHTML();

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    console.log('Folder list updated');
  }

  /**
   * Builds hierarchical folder tree from flat array
   */
  buildFolderTree(folders, parentId = null) {
    if (!folders || !Array.isArray(folders)) {
      console.error('buildFolderTree: folders is not an array', folders);
      return [];
    }

    return folders
      .filter(folder => folder.parentId === parentId)
      .map(folder => ({
        ...folder,
        children: this.buildFolderTree(folders, folder.id)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Filters folder tree based on search term - CRITICAL FUNCTION
   */
  filterFolderTree(folderTree, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return folderTree;
    }

    const term = searchTerm.toLowerCase().trim();
    console.log('Filtering with term:', term);

    const results = [];

    for (const folder of folderTree) {
      const folderMatches = folder.name.toLowerCase().includes(term);

      const matchingChildren = folder.children && folder.children.length > 0
        ? this.filterFolderTree(folder.children, searchTerm)
        : [];

      if (folderMatches || matchingChildren.length > 0) {
        results.push({
          ...folder,
          children: matchingChildren,
          isExpanded: matchingChildren.length > 0
        });

        if (matchingChildren.length > 0) {
          this.moveModalState.expandedFolderIds.add(folder.id);
        }

        console.log('Folder matched:', folder.name, 'Has matching children:', matchingChildren.length);
      }
    }

    console.log('Filter results:', results.length, 'folders');
    return results;
  }

  /**
   * Gets recently used folders
   */
  getRecentlyUsedFolders() {
    const { currentFolderId } = this.moveModalState;
    
    // Use the recentFolders array from the main folders tab
    if (this.recentFolders && this.recentFolders.length > 0) {
      console.log('Using recentFolders from main folders tab:', this.recentFolders.length);
      
      // Get folder objects and filter out current folder
      const recentWithFolders = this.recentFolders
        .map(recent => this.folderManager.getFolder(recent.id))
        .filter(f => f && f.id !== currentFolderId);
      
      console.log('Recent folders after filtering:', recentWithFolders.length);
      
      // If we have 3 or more, return first 3
      if (recentWithFolders.length >= 3) {
        const result = recentWithFolders.slice(0, 3);
        console.log('Recent folders (3):', result.map(f => f.name));
        return result;
      }
      
      // Return what we have if less than 3
      if (recentWithFolders.length > 0) {
        console.log('Recent folders (<3):', recentWithFolders.map(f => f.name));
        return recentWithFolders;
      }
    }
    
    // Fallback: if no recent folders, return empty
    console.log('No recent folders available');
    return [];
  }

  /**
   * Toggles folder expand/collapse
   */
  toggleFolderExpand(folderId) {
    console.log('📂 toggleFolderExpand called for:', folderId);
    console.log('Currently expanded:', Array.from(this.moveModalState.expandedFolderIds));
    
    if (this.moveModalState.expandedFolderIds.has(folderId)) {
      console.log('Collapsing folder');
      this.moveModalState.expandedFolderIds.delete(folderId);
    } else {
      console.log('Expanding folder');
      this.moveModalState.expandedFolderIds.add(folderId);
    }
    
    console.log('New expanded state:', Array.from(this.moveModalState.expandedFolderIds));
    this.updateMoveModalFolderList();
  }

  /**
   * Handles folder selection
   */
  async handleFolderSelection(folderId) {
    // Check if this is a bulk move
    if (this.isBulkMove && this.bulkMovePromptIds) {
      console.log('💾 Bulk move to folder:', folderId);
      await this.handleBulkMoveToFolder(folderId);
      return;
    }
    
    // Single prompt move
    const { promptId, currentFolderId } = this.moveModalState;

    console.log('💾 handleFolderSelection called');
    console.log('Moving prompt', promptId, 'to folder', folderId);
    console.log('Current folder:', currentFolderId);

    if (folderId === currentFolderId) {
      console.log('⚠️ Same folder selected, but proceeding anyway');
      this.closeMoveToFolderModal();
      this.showToast('Prompt is already in this folder', 'info');
      return;
    }

    const prompt = this.prompts.find(p => p.id === promptId);
    if (prompt) {
      prompt.folderId = folderId;

      await chrome.storage.local.set({ prompts: this.prompts });

      if (!this.recentFolderIds) {
        this.recentFolderIds = [];
      }
      this.recentFolderIds.unshift(folderId);
      if (this.recentFolderIds.length > 10) {
        this.recentFolderIds = this.recentFolderIds.slice(0, 10);
      }

      const folder = this.folderManager.folders.find(f => f.id === folderId);
      const folderName = folder ? folder.name : 'folder';

      this.closeMoveToFolderModal();

      // Reload data and re-render
      await this.loadData();
      this.renderPrompts();

      this.showToast(`Moved to ${folderName}`, 'success');
    }
  }
  
  /**
   * Handle bulk move to folder
   */
  async handleBulkMoveToFolder(folderId) {
    const count = this.bulkMovePromptIds.length;
    
    // Move all selected prompts to the folder
    for (const promptId of this.bulkMovePromptIds) {
      const prompt = this.prompts.find(p => p.id === promptId);
      if (prompt) {
        prompt.folderId = folderId;
      }
    }
    
    // Save to storage
    await chrome.storage.local.set({ prompts: this.prompts });
    
    // Update recent folders
    if (!this.recentFolderIds) {
      this.recentFolderIds = [];
    }
    this.recentFolderIds.unshift(folderId);
    if (this.recentFolderIds.length > 10) {
      this.recentFolderIds = this.recentFolderIds.slice(0, 10);
    }
    
    // Get folder name
    const folder = this.folderManager.folders.find(f => f.id === folderId);
    const folderName = folder ? folder.name : 'folder';
    
    // Close modal and clean up
    this.closeMoveToFolderModal();
    this.isBulkMove = false;
    this.bulkMoveContext = null;
    this.bulkMovePromptIds = null;
    
    // Reload and update UI
    await this.loadData();
    
    if (this.currentTab === 'favorites') {
      this.renderFavorites();
    } else {
      this.renderPrompts();
    }
    
    this.showToast(`Selected prompts moved to ${folderName}`);
    this.clearBulkSelection();
  }

  /**
   * Handles creating new folder from modal
   */
  handleCreateNewFolderFromModal(prefillName = '') {
    console.log('🆕 handleCreateNewFolderFromModal called');
    console.log('Prefill name:', prefillName);
    
    // Store the prompt ID so we can move it after folder creation
    const promptIdToMove = this.moveModalState?.promptId;
    console.log('Prompt ID to move after creation:', promptIdToMove);
    
    // Store in a property that persists across modal closures
    this.pendingPromptMove = promptIdToMove;
    
    // Close move modal first
    this.closeMoveToFolderModal();

    // Wait for close animation
    setTimeout(() => {
      // Switch to folders tab
      console.log('Switching to folders tab...');
      const foldersTab = document.querySelector('[data-tab="folders"]');
      if (foldersTab) {
        foldersTab.click();
        console.log('Folders tab clicked');
      } else {
        console.warn('⚠️ Folders tab not found');
      }

      // Wait a bit for tab switch, then open create folder modal
      setTimeout(() => {
        console.log('Attempting to open create folder modal...');
        
        // Call openFolderModal (the actual method that opens the modal)
        if (typeof this.openFolderModal === 'function') {
          console.log('✅ Calling openFolderModal');
          this.openFolderModal(null); // null = create at root level
          
          // After modal opens, prefill the name
          setTimeout(() => {
            const nameInput = document.querySelector('#folderName');
            if (nameInput && prefillName) {
              nameInput.value = prefillName;
              nameInput.dispatchEvent(new Event('input', { bubbles: true }));
              console.log('✅ Prefilled folder name:', prefillName);
            }
          }, 100);
        } else {
          console.error('❌ openFolderModal not found!');
          console.log('Available methods:', Object.keys(this).filter(k => k.includes('Folder')));
        }
      }, 150);
    }, 250);
  }

  /**
   * Closes the modal
   */
  closeMoveToFolderModal() {
    console.log('🚪 closeMoveToFolderModal called');
    const overlay = document.querySelector('.move-to-folder-overlay');
    console.log('Overlay found:', overlay ? 'YES' : 'NO');
    
    if (overlay) {
      console.log('Removing modal...');
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
        console.log('Modal removed');
      }, 200);
    } else {
      console.warn('⚠️ Modal overlay not found!');
    }

    // Hide all clear buttons to prevent them showing incorrectly
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const clearFavoritesSearchBtn = document.getElementById('clearFavoritesSearchBtn');
    const clearFoldersSearchBtn = document.getElementById('clearFoldersSearchBtn');
    
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    if (clearFavoritesSearchBtn) clearFavoritesSearchBtn.style.display = 'none';
    if (clearFoldersSearchBtn) clearFoldersSearchBtn.style.display = 'none';

    if (this.moveModalState) {
      this.moveModalState.isOpen = false;
    }
  }

  /**
   * OLD METHOD - kept for compatibility
   */
  async openMoveToFolderModal(prompt) {
    console.log('🚀 openMoveToFolderModal called with prompt:', prompt);
    
    // Ensure folders are loaded
    if (!this.folderManager || !this.folderManager.folders || this.folderManager.folders.length === 0) {
      console.log('📁 Loading/initializing folders...');
      await this.folderManager.loadFolders();
      
      // Don't auto-create folders - let users create their own
      // if (this.folderManager.folders.length === 0) {
      //   console.log('🌱 No folders found, creating defaults...');
      //   await this.createDefaultFolders();
      // }
    }
    
    console.log('📁 Folders loaded:', this.folderManager.folders.length);
    
    // Store prompt for later use
    this.currentMovePrompt = prompt;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('moveToFolderModal');
    if (existingModal) {
      console.log('Removing existing modal');
      existingModal.remove();
    }

    // Create modal HTML
    console.log('Creating modal HTML...');
    const modal = this.createMoveToFolderModalHTML(prompt);
    console.log('Modal element created:', modal);
    
    // Append to body
    document.body.appendChild(modal);
    console.log('✅ Modal appended to body');
    
    // Check if it's in the DOM
    const checkModal = document.getElementById('moveToFolderModal');
    console.log('Modal in DOM:', checkModal);
    console.log('Modal computed styles:', window.getComputedStyle(checkModal));
    console.log('Modal display:', window.getComputedStyle(checkModal).display);
    console.log('Modal position:', window.getComputedStyle(checkModal).position);
    console.log('Modal z-index:', window.getComputedStyle(checkModal).zIndex);
    console.log('Modal visibility:', window.getComputedStyle(checkModal).visibility);
    console.log('Modal opacity:', window.getComputedStyle(checkModal).opacity);
    const dimensions = {
      width: checkModal.offsetWidth,
      height: checkModal.offsetHeight,
      top: checkModal.offsetTop,
      left: checkModal.offsetLeft
    };
    console.log('Modal dimensions:', dimensions);
    console.log('Width:', dimensions.width, 'Height:', dimensions.height);
    
    if (dimensions.width === 0 || dimensions.height === 0) {
      console.error('⚠️ MODAL HAS ZERO DIMENSIONS!');
      console.log('Checking inner modal...');
      const innerModal = checkModal.querySelector('.mtf-modal');
      if (innerModal) {
        console.log('Inner modal dimensions:', {
          width: innerModal.offsetWidth,
          height: innerModal.offsetHeight
        });
      }
    }

    // Initialize
    console.log('Initializing modal...');
    this.initializeMoveToFolderModal(prompt);
    console.log('✅ Modal initialized');
  }

  /**
   * Create move-to-folder modal HTML
   */
  createMoveToFolderModalHTML(prompt) {
    const overlay = document.createElement('div');
    overlay.id = 'moveToFolderModal';
    overlay.className = 'mtf-overlay';
    overlay.innerHTML = `
      <div class="mtf-modal" role="dialog" aria-modal="true" aria-labelledby="mtfTitle">
        <!-- Header -->
        <div class="mtf-header">
          <h2 class="mtf-title" id="mtfTitle">MOVE TO FOLDER</h2>
          <button class="mtf-close" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <!-- Context Info -->
        <div class="mtf-context-bar">
          <p class="mtf-context">Moving: <span class="mtf-prompt-name">${this.escapeHTML(prompt.title)}</span></p>
          <p class="mtf-current">Currently in: <span class="mtf-current-folder">${this.getCurrentFolderName(prompt.folderId)}</span></p>
        </div>

        <!-- Search -->
        <div class="mtf-search">
          <svg class="mtf-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" class="mtf-search-input" placeholder="Search folders..." autocomplete="off" />
          <button class="mtf-search-clear" style="display: none;" aria-label="Clear search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="mtf-content" id="mtfFolderList">
          <!-- Empty State (hidden by default) -->
          <div class="mtf-empty-state" id="mtfEmptyState" style="display: none;">
            <svg class="mtf-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
            <h3 class="mtf-empty-title">No Results Found</h3>
            <p class="mtf-empty-description">Can't find what you're looking for?</p>
            <button class="mtf-create-folder-btn" id="mtfCreateFolderBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create New Folder
            </button>
          </div>
        </div>

        <!-- Success Animation -->
        <div class="mtf-success" style="display: none;">
          <svg class="mtf-success-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span class="mtf-success-text">Moved to <strong id="mtfSuccessFolderName"></strong></span>
        </div>
      </div>
    `;
    return overlay;
  }

  /**
   * Initialize move-to-folder modal
   */
  initializeMoveToFolderModal(prompt) {
    const overlay = document.getElementById('moveToFolderModal');
    const modal = overlay.querySelector('.mtf-modal');
    const searchInput = overlay.querySelector('.mtf-search-input');
    const clearBtn = overlay.querySelector('.mtf-search-clear');
    const closeBtn = overlay.querySelector('.mtf-close');
    const folderList = document.getElementById('mtfFolderList');
    const createFolderBtn = document.getElementById('mtfCreateFolderBtn');

    // Render folders
    console.log('🎯 About to render folders, folderList element:', folderList);
    this.renderMoveToFolderList(prompt, folderList);
    console.log('🌳 After rendering, total folders in DOM:', folderList.querySelectorAll('.mtf-folder').length);

    // Auto-focus search
    setTimeout(() => searchInput.focus(), 100);

    // Search functionality - immediate without debouncing for debugging
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearBtn.style.display = query ? 'flex' : 'none';
      
      console.log('🔍 Search input event, query:', query);
      this.filterMoveToFolderList(query, folderList);
    });
    
    // Also handle keyup for immediate feedback
    searchInput.addEventListener('keyup', (e) => {
      const query = e.target.value.trim();
      console.log('⌨️ Keyup event, query:', query);
      this.filterMoveToFolderList(query, folderList);
    });

    // Clear search
    clearBtn.addEventListener('click', () => {
      console.log('📤 Clear button clicked');
      searchInput.value = '';
      clearBtn.style.display = 'none';
      this.filterMoveToFolderList('', folderList);
      searchInput.focus();
    });

    // Create folder button
    createFolderBtn.addEventListener('click', () => {
      this.closeMoveToFolderModal();
      this.showCreateFolderModal();
    });

    // Close handlers
    closeBtn.addEventListener('click', () => this.closeMoveToFolderModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeMoveToFolderModal();
    });

    // Keyboard shortcuts (Escape and Cmd+K)
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeMoveToFolderModal();
        document.removeEventListener('keydown', keyHandler);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        // Cmd+K to focus search in modal
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    };
    document.addEventListener('keydown', keyHandler);

    // Lucide icons
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  /**
   * Render folder list
   */
  renderMoveToFolderList(prompt, container) {
    console.log('🚀 Rendering folder list for prompt:', prompt);
    console.log('📁 Total folders available:', this.folderManager.folders.length);
    console.log('📁 Folders:', this.folderManager.folders);
    
    container.innerHTML = '';

    // Recent folders section
    const recentFolders = this.recentFolders
      .slice(0, 5)
      .filter(r => this.folderManager.folders.some(f => f.id === r.id));

    console.log('⏱️ Recent folders:', recentFolders);

    if (recentFolders.length > 0) {
      const recentSection = document.createElement('div');
      recentSection.className = 'mtf-section';
      recentSection.innerHTML = `
        <div class="mtf-section-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span>RECENTLY USED</span>
        </div>
      `;

      recentFolders.forEach(recent => {
        const folder = this.folderManager.folders.find(f => f.id === recent.id);
        if (folder) {
          recentSection.appendChild(this.createMoveToFolderItem(folder, prompt, false));
        }
      });

      container.appendChild(recentSection);
    }

    // All folders section
    const allSection = document.createElement('div');
    allSection.className = 'mtf-section';
    allSection.innerHTML = `
      <div class="mtf-section-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>ALL FOLDERS</span>
      </div>
    `;

    // Render root folders with tree
    console.log('🌳 Rendering folder tree...');
    this.renderFolderTree(allSection, prompt, null);
    container.appendChild(allSection);
    
    console.log('✅ Folder list rendered. Container children:', container.children.length);
  }

  /**
   * Render folder tree recursively
   */
  renderFolderTree(container, prompt, parentId) {
    const folders = this.folderManager.folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.order - b.order);

    console.log(`🌿 Rendering ${folders.length} folders for parentId:`, parentId);

    folders.forEach(folder => {
      const hasChildren = this.folderManager.folders.some(f => f.parentId === folder.id);
      const folderItem = this.createMoveToFolderItem(folder, prompt, hasChildren);
      container.appendChild(folderItem);

      if (hasChildren) {
        const childContainer = document.createElement('div');
        childContainer.className = 'mtf-children';
        childContainer.dataset.parentId = folder.id;
        childContainer.style.display = 'none';
        container.appendChild(childContainer);
        
        // CRITICAL FIX: Pre-render all children so search can find them
        // Render children immediately (not lazily) so they're searchable
        this.renderFolderTree(childContainer, prompt, folder.id);
      }
    });
  }

  /**
   * Create folder item
   */
  createMoveToFolderItem(folder, prompt, hasChildren) {
    const isCurrent = folder.id === prompt.folderId;
    const item = document.createElement('div');
    item.className = `mtf-folder${isCurrent ? ' current' : ''}${hasChildren ? ' expandable' : ''}`;
    item.dataset.folderId = folder.id;
    item.dataset.folderName = folder.name.toLowerCase();
    
    console.log('📝 Creating folder item:', folder.name, 'hasChildren:', hasChildren);

    // Build HTML
    let html = '';

    // Expand button for folders with children
    if (hasChildren) {
      html += `
        <button class="mtf-expand-btn" aria-label="Expand ${this.escapeHTML(folder.name)}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      `;
    }

    // Color bar
    html += `<div class="mtf-color-bar" style="background-color: ${folder.color || '#22B8CF'};"></div>`;

    // Icon
    html += `<span class="mtf-icon" data-lucide="${folder.icon || 'folder'}"></span>`;

    // Name
    html += `<span class="mtf-name">${this.escapeHTML(folder.name)}</span>`;

    // Count
    const count = this.prompts.filter(p => p.folderId === folder.id).length;
    html += `<span class="mtf-count">${count}</span>`;

    // Checkmark for current folder
    if (isCurrent) {
      html += `
        <svg class="mtf-checkmark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    }

    item.innerHTML = html;

    // Click handler
    if (!isCurrent) {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking expand button
        if (e.target.closest('.mtf-expand-btn')) return;
        this.handleMoveToFolder(prompt, folder);
      });
    }

    // Expand/collapse handler
    if (hasChildren) {
      const expandBtn = item.querySelector('.mtf-expand-btn');
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFolderInMoveModal(item);
      });
    }

    return item;
  }

  /**
   * Toggle folder expansion
   */
  toggleFolderInMoveModal(folderItem) {
    const isExpanded = folderItem.classList.contains('expanded');
    const childContainer = folderItem.nextElementSibling;

    if (isExpanded) {
      // Collapse
      folderItem.classList.remove('expanded');
      if (childContainer) childContainer.style.display = 'none';
    } else {
      // Expand
      folderItem.classList.add('expanded');
      if (childContainer) {
        childContainer.style.display = 'block';
        
        // Children are already pre-rendered, just reinitialize icons
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
      }
    }
  }

  /**
   * Handle move to folder with animation
   */
  async handleMoveToFolder(prompt, folder) {
    const overlay = document.getElementById('moveToFolderModal');
    const successEl = overlay.querySelector('.mtf-success');
    const folderNameEl = document.getElementById('mtfSuccessFolderName');

    // Show success animation
    folderNameEl.textContent = folder.name;
    successEl.style.display = 'flex';

    // Move prompt
    await this.movePromptToFolder(prompt, folder.id);

    // Track recent usage
    await this.trackFolderVisit(folder.id, folder.name);

    // Close modal after delay
    setTimeout(() => {
      this.closeMoveToFolderModal();
    }, 800);
  }

  /**
   * Filter folders based on search - FIXED to work with all folders including nested
   */
  filterMoveToFolderList(query, container) {
    const emptyState = document.getElementById('mtfEmptyState');
    const allSections = container.querySelectorAll('.mtf-section');
    const allFolders = container.querySelectorAll('.mtf-folder');
    const allChildContainers = container.querySelectorAll('.mtf-children');
    
    console.log('🔍 Filtering with query:', query);
    console.log('📁 Total folders found:', allFolders.length);
    console.log('🌳 Container element:', container);
    console.log('🏡 Empty state element:', emptyState);
    
    if (!query) {
      // Show all folders and collapse all children
      allFolders.forEach(item => {
        item.style.display = '';
        item.classList.remove('expanded');
      });
      allChildContainers.forEach(child => child.style.display = 'none');
      allSections.forEach(section => section.style.display = '');
      emptyState.style.display = 'none';
      return;
    }

    const lowerQuery = query.toLowerCase().trim();

    // Hide all folders and children containers first
    allFolders.forEach(item => item.style.display = 'none');
    allChildContainers.forEach(child => child.style.display = 'none');

    // Find matches by folder name
    const matches = Array.from(allFolders).filter(item => {
      const folderName = item.dataset.folderName || '';
      const folderText = item.querySelector('.mtf-name')?.textContent || '';
      const folderTextLower = folderText.toLowerCase();
      
      console.log(`Checking: dataset="${folderName}" text="${folderText}" against query="${lowerQuery}"`);
      
      // Check both dataset and actual text
      const matchesDataset = folderName.toLowerCase().includes(lowerQuery);
      const matchesText = folderTextLower.includes(lowerQuery);
      
      return matchesDataset || matchesText;
    });

    console.log('✅ Matches found:', matches.length);

    // If no matches, show empty state
    if (matches.length === 0) {
      console.log('❌ No matches found, showing empty state');
      allSections.forEach(section => section.style.display = 'none');
      
      // Ensure empty state is visible
      if (emptyState) {
        emptyState.style.display = 'flex';
        emptyState.style.cssText += 'display: flex !important; opacity: 1 !important; visibility: visible !important;';
      } else {
        console.error('❌ Empty state element not found!');
      }
      return;
    }

    // Hide empty state
    emptyState.style.display = 'none';
    
    // Show all sections that contain matches
    const sectionsWithMatches = new Set();
    matches.forEach(matchedFolder => {
      // Find the section this folder belongs to
      let section = matchedFolder.closest('.mtf-section');
      if (section) {
        sectionsWithMatches.add(section);
      }
    });
    
    // Hide sections without matches
    allSections.forEach(section => {
      section.style.display = sectionsWithMatches.has(section) ? '' : 'none';
    });

    // Show matches and their parent chain
    matches.forEach(matchedFolder => {
      matchedFolder.style.display = '';
      
      // Walk up parent chain and show + expand all parents
      let currentElement = matchedFolder.parentElement;
      
      while (currentElement && currentElement !== container) {
        // If it's a children container, show it and expand parent
        if (currentElement.classList.contains('mtf-children')) {
          currentElement.style.display = 'block';
          
          // Find and expand the parent folder
          const parentFolder = currentElement.previousElementSibling;
          if (parentFolder && parentFolder.classList.contains('mtf-folder')) {
            parentFolder.style.display = '';
            parentFolder.classList.add('expanded');
          }
        }
        
        currentElement = currentElement.parentElement;
      }
    });
  }

  /**
   * Get current folder name
   */
  getCurrentFolderName(folderId) {
    if (!folderId) return 'Uncategorized';
    const folder = this.folderManager.folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Unknown';
  }

  /**
   * Truncate text
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Escape HTML
   */
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Create default folders for new users
   */
  async createDefaultFolders() {
    console.log('🌱🌱🌱 createDefaultFolders CALLED 🌱🌱🌱');
    console.log('📊 Current folder count:', this.folderManager.folders.length);
    
    // Create only 3 folders: Productivity (starred), Business (starred), Writing
    
    // 1. Productivity folder (STARRED)
    console.log('📁 Creating Productivity folder with isStarred: true');
    const productivityFolder = await this.folderManager.createFolder({
      name: 'Productivity',
      icon: 'zap',
      color: '#22B8CF',
      isStarred: true
    });
    console.log('✅ Productivity folder created:', productivityFolder);
    
    // 2. Business folder (STARRED)
    console.log('📁 Creating Business folder with isStarred: true');
    const businessFolder = await this.folderManager.createFolder({
      name: 'Business',
      icon: 'briefcase',
      color: '#FF9F43',
      isStarred: true
    });
    console.log('✅ Business folder created:', businessFolder);
    
    // 3. Writing folder (NOT starred)
    console.log('📁 Creating Writing folder');
    const writingFolder = await this.folderManager.createFolder({
      name: 'Writing',
      icon: 'pen-tool',
      color: '#FF6B6B',
      isStarred: false
    });
    console.log('✅ Writing folder created:', writingFolder);
    
    console.log('✅✅✅ Default folders created successfully (Productivity & Business starred) ✅✅✅');
    console.log('📊 Final folder count:', this.folderManager.folders.length);
  }
  
  /**
   * TEMPORARY: Ensure test folders exist (for debugging)
   */
  async ensureTestFolders() {
    // Check if we already have folders
    if (this.folderManager.folders.length > 0) {
      console.log('👍 Test folders already exist');
      return;
    }
    
    console.log('🧪 Creating test folders for debugging...');
    
    // Create test folders directly
    const testFolders = [
      { name: 'Productivity', icon: 'zap', color: '#22B8CF' },
      { name: 'Writing', icon: 'pen-tool', color: '#FF6B6B' },
      { name: 'test', icon: 'folder', color: '#4ECDC4' },
      { name: 'know', icon: 'folder', color: '#B886FF' },
      { name: 'asscsd', icon: 'folder', color: '#FFD93D' },
      { name: 'abs', icon: 'folder', color: '#6CD582' },
      { name: 'pro1', icon: 'folder', color: '#FF9F43' }
    ];
    
    // Create folders
    for (const folderData of testFolders) {
      await this.folderManager.createFolder(folderData);
    }
    
    // Create Business folder with nested folders
    const businessFolder = await this.folderManager.createFolder({
      name: 'Business',
      icon: 'building',
      color: '#FF9F43'
    });
    
    // Create nested folders
    await this.folderManager.createFolder({
      name: 'bus1',
      parentId: businessFolder.id,
      icon: 'folder',
      color: '#FF9F43'
    });
    
    await this.folderManager.createFolder({
      name: 'sadfs',
      parentId: businessFolder.id,
      icon: 'folder',
      color: '#FF9F43'
    });
    
    console.log('✅ Test folders created');
  }

  /**
   * Track folder visit for recent folders
   */
  async trackFolderVisit(folderId, folderName) {
    console.log('📌 Tracking folder visit:', folderId, folderName);
    
    // Remove if already exists
    this.recentFolders = this.recentFolders.filter(r => r.id !== folderId);
    
    // Add to front
    this.recentFolders.unshift({
      id: folderId,
      name: folderName,
      timestamp: Date.now()
    });
    
    // Keep only last 10
    this.recentFolders = this.recentFolders.slice(0, 10);
    
    // Save to storage
    try {
      await chrome.storage.local.set({ recentFolders: this.recentFolders });
      console.log('✅ Recent folders updated:', this.recentFolders);
    } catch (error) {
      console.error('❌ Error saving recent folders:', error);
    }
  }

  /**
   * OLD IMPLEMENTATION - Keeping for reference but not used
   * Show folder selection menu for moving a single prompt (collapsible tree)
   */
  showFolderMenuForPrompt_OLD(event, prompt) {
    console.log('🎯 showFolderMenuForPrompt called for prompt:', prompt.title);
    
    // Build collapsible menu items (only root folders initially)
    const menuItems = [];
    
    // RECENTLY USED FOLDERS (Top 5)
    const recentFoldersToShow = this.recentFolders
      .slice(0, 5)
      .filter(recent => this.folderManager.folders.some(f => f.id === recent.id)); // Filter out deleted folders

    if (recentFoldersToShow.length > 0) {
      // Add "RECENT FOLDERS" header (center-aligned)
      menuItems.push({
        label: 'RECENT FOLDERS',
        isHeader: true
      });

      // Add recent folders
      recentFoldersToShow.forEach(recent => {
        const folder = this.folderManager.folders.find(f => f.id === recent.id);
        if (!folder) return;

        menuItems.push({
          label: folder.name,
          folderId: folder.id,
          isRecentFolder: true,  // Mark as recent folder for center alignment
          action: () => {
            console.log(`Moving prompt '${prompt.title}' to recent folder '${folder.name}'`);
            this.movePromptToFolder(prompt, folder.id);
          }
        });
      });

      // Add separator
      menuItems.push({ separator: true });

      // Add "ALL FOLDERS" header (consistent with RECENT FOLDERS styling)
      menuItems.push({
        label: 'ALL FOLDERS',
        isHeader: true
      });
    }
    
    // Build collapsible folder list (only root level)
    const buildCollapsibleMenu = (parentId = null) => {
      // Find all folders with this parent
      const folders = this.folderManager.folders.filter(f => f.parentId === parentId);
      
      // Sort by order
      folders.sort((a, b) => a.order - b.order);
      
      folders.forEach(folder => {
        // Check if folder has children
        const hasChildren = this.folderManager.folders.some(f => f.parentId === folder.id);
        
        menuItems.push({
          label: folder.name,
          hasChildren: hasChildren,
          folderId: folder.id,
          isMoveToFolderItem: true,  // Mark for center alignment
          action: () => {
            console.log(`Moving prompt '${prompt.title}' to folder '${folder.name}'`);
            this.movePromptToFolder(prompt, folder.id);
            // Track folder usage
            this.trackFolderVisit(folder.id, folder.name);
          },
          expandAction: hasChildren ? (submenuContainer) => {
            // Build children submenu
            const childFolders = this.folderManager.folders.filter(f => f.parentId === folder.id);
            childFolders.sort((a, b) => a.order - b.order);
            
            childFolders.forEach(childFolder => {
              const hasGrandchildren = this.folderManager.folders.some(f => f.parentId === childFolder.id);
              
              const childItem = document.createElement('div');
              childItem.className = 'context-menu-item context-menu-child move-to-folder-child';
              // Padding handled by CSS for proper alignment
              
              // CRITICAL: Add data attributes for keyboard navigation
              childItem.dataset.itemLabel = childFolder.name;
              childItem.dataset.folderId = childFolder.id;
              
              if (hasGrandchildren) {
                childItem.innerHTML = `
                  <span class="menu-chevron" style="margin-right: 4px; display: inline-flex; align-items: center;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                  <span>${childFolder.name}</span>
                `;
              } else {
                // No spacer needed - using CSS ::before dot indicator
                childItem.innerHTML = `<span>${childFolder.name}</span>`;
              }
              
              childItem.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`Moving prompt '${prompt.title}' to folder '${childFolder.name}'`);
                this.movePromptToFolder(prompt, childFolder.id);
                document.querySelectorAll('.context-menu').forEach(m => m.remove());
              });
              
              submenuContainer.appendChild(childItem);
            });
          } : null
        });
      });
    };
    
    // Build only root folders
    buildCollapsibleMenu(null);
    
    // Removed "Uncategorized" option - prompts will be stored as uncategorized behind the scenes

    // Build comprehensive folder list for keyboard navigation (includes ALL folders)
    const allFoldersForKeyboard = [];
    this.folderManager.folders.forEach(folder => {
      allFoldersForKeyboard.push({
        folderId: folder.id,
        name: folder.name,
        parentId: folder.parentId
      });
    });

    this.showContextMenu(event, menuItems, false, allFoldersForKeyboard);
  }

  /**
   * Open folder modal (create or edit)
   * @param {Object|String} folderOrParentId - Folder object for editing, or parent ID string for creating subfolder
   */
  openFolderModal(folderOrParentId = null) {
    const modal = document.getElementById('folderModal');
    const title = document.getElementById('folderModalTitle');
    const nameInput = document.getElementById('folderName');
    const saveBtn = document.getElementById('saveFolderBtn');

    if (!modal || !nameInput || !title || !saveBtn) {
      console.error('Folder modal elements not found in DOM');
      return;
    }

    // Determine if editing or creating
    const isEditing = folderOrParentId && typeof folderOrParentId === 'object';
    const folder = isEditing ? folderOrParentId : null;
    const parentId = !isEditing && typeof folderOrParentId === 'string' ? folderOrParentId : null;

    // Set title
    title.textContent = folder ? 'Edit Folder' : 'Create New Folder';
    saveBtn.textContent = folder ? 'Save Changes' : 'Create Folder';

    // Store folder parent selection
    this.currentFolderParentId = folder?.parentId || parentId || null;

    if (folder) {
      // Edit mode
      nameInput.value = folder.name;
      modal.dataset.editingFolderId = folder.id;
    } else {
      // Create mode
      nameInput.value = '';
      delete modal.dataset.editingFolderId;
    }

    // Update parent dropdown display
    const parentDropdown = document.getElementById('folderParentDropdown');
    if (parentDropdown) {
      const selectedText = parentDropdown.querySelector('.selected-folder-text');
      if (selectedText) { // NULL SAFETY CHECK
        if (this.currentFolderParentId) {
          const parentFolder = this.folderManager.folders.find(f => f.id === this.currentFolderParentId);
          if (parentFolder) {
            selectedText.textContent = parentFolder.name; // Removed emoji
          } else {
            selectedText.textContent = 'Root';
          }
        } else {
          selectedText.textContent = 'Root';
        }
      } else {
        console.error('❌ Parent dropdown selected-folder-text element not found!');
      }
    }

    modal.style.display = 'flex';
    
    // Focus name input
    setTimeout(() => nameInput.focus(), 0);
  }

  // OLD populateFolderParentDropdown removed - using new elite version at line ~1581

  /**
   * Close folder modal
   */
  closeFolderModal() {
    const modal = document.getElementById('folderModal');
    if (modal) {
      modal.style.display = 'none';
      delete modal.dataset.editingFolderId;
    }
  }

  /**
   * Save folder (create or update)
   */
  async saveFolder() {
    const modal = document.getElementById('folderModal');
    const nameInput = document.getElementById('folderName');

    const name = nameInput.value.trim();
    if (!name) {
      this.showToast('Please enter a folder name', 'error');
      nameInput.focus();
      return;
    }

    const parentId = this.currentFolderParentId;

    try {
      const editingFolderId = modal.dataset.editingFolderId;
      let newFolderId = null;

      if (editingFolderId) {
        // Update existing folder
        await this.folderManager.updateFolder(editingFolderId, { name });
        this.showToast('Folder updated successfully');
      } else {
        // Create new folder
        const newFolder = await this.folderManager.createFolder({ name, parentId });
        newFolderId = newFolder.id;
        this.showToast('Folder created successfully');
      }

      this.closeFolderModal();
      
      // If opened from prompt modal, update the dropdown and select the new folder
      const promptModal = document.getElementById('promptModal');
      if (newFolderId && promptModal && promptModal.style.display === 'flex') {
        this.currentPromptFolderId = newFolderId;
        const folderDropdown = document.getElementById('promptFolderDropdown');
        if (folderDropdown) {
          const selectedText = folderDropdown.querySelector('.selected-folder-text');
          if (selectedText) {
            selectedText.textContent = name;
            selectedText.classList.remove('placeholder-text');
          }
        }
      }
      
      // If there's a pending prompt move (from Move to Folder modal), move it now
      if (newFolderId && this.pendingPromptMove) {
        console.log('📦 Moving pending prompt to new folder:', this.pendingPromptMove, '→', newFolderId);
        const prompt = this.prompts.find(p => p.id === this.pendingPromptMove);
        if (prompt) {
          prompt.folderId = newFolderId;
          await chrome.storage.local.set({ prompts: this.prompts });
          
          // Add to recent folders
          if (!this.recentFolderIds) {
            this.recentFolderIds = [];
          }
          this.recentFolderIds.unshift(newFolderId);
          if (this.recentFolderIds.length > 10) {
            this.recentFolderIds = this.recentFolderIds.slice(0, 10);
          }
          
          this.showToast(`Moved to ${name}`, 'success');
          console.log('✅ Prompt moved to new folder');
        }
        
        // Clear the pending move
        this.pendingPromptMove = null;
        
        // Switch back to prompts tab and refresh
        setTimeout(() => {
          const promptsTab = document.querySelector('[data-tab="prompts"]');
          if (promptsTab) {
            promptsTab.click();
          }
        }, 500);
      }
      
      this.renderFolders();
    } catch (error) {
      console.error('Error saving folder:', error);
      this.showToast(error.message || 'Failed to save folder', 'error');
    }
  }

  /**
   * Edit folder
   */
  editFolder(folder) {
    this.openFolderModal(folder);
  }

  /**
   * Create subfolder inside a parent folder
   */
  createSubfolder(parentFolder) {
    // Open folder modal with parent folder pre-selected
    // Pass parent folder ID as string (not object) to trigger create mode with parent
    this.openFolderModal(parentFolder.id);
  }

  /**
   * Delete folder with confirmation modal
   */
  async deleteFolderWithConfirm(folder) {
    const descendants = this.folderManager.getAllDescendantIds(folder.id);
    const promptCount = this.folderManager.countPromptsRecursive(folder.id, this.prompts);

    // Build message parts
    const messageParts = [];
    if (descendants.length > 0) {
      messageParts.push(`• ${descendants.length} subfolder(s)`);
    }
    if (promptCount > 0) {
      messageParts.push(`• ${promptCount} prompt(s)`);
    }
    
    const message = messageParts.length > 0 
      ? `This will also delete:\n${messageParts.join('\n')}`
      : '';

    this.showConfirmModal(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"?`,
      message,
      'Delete Folder',
      async () => {
        try {
          await this.folderManager.deleteFolder(folder.id, true, this.prompts);
          
          // Reload prompts from storage
          await this.loadData();
          
          this.showToast('Folder deleted successfully');
          this.renderFolders();
          this.renderPrompts();
        } catch (error) {
          console.error('Error deleting folder:', error);
          this.showToast('Failed to delete folder', 'error');
        }
      }
    );
  }

  /**
   * Search folders
   */
  searchFolders(query) {
    // Store query for highlighting
    this.currentFolderSearchQuery = query;
    
    if (!query.trim()) {
      this.currentFolderSearchQuery = '';
      this.folderSearchHasMatches = true; // Reset
      
      // CRITICAL FIX: Hide search empty state when clearing search
      const searchEmptyState = document.getElementById('foldersSearchEmptyState');
      if (searchEmptyState) {
        searchEmptyState.style.display = 'none';
      }
      
      this.renderFolders();
      return;
    }

    // If we're in a folder detail view, search within that folder's prompts
    if (this.folderPath.length > 1) {
      const currentFolder = this.folderPath[this.folderPath.length - 1];
      const lowerQuery = query.toLowerCase();
      this.filteredPrompts = this.prompts.filter(p => {
        if (p.folderId !== currentFolder.id) return false;
        return p.title.toLowerCase().includes(lowerQuery) || 
               (p.content && p.content.toLowerCase().includes(lowerQuery));
      });
      this.renderFolders();
      return;
    }

    const foldersTree = document.getElementById('foldersTree');
    if (!foldersTree) return;

    // For folder search, ONLY match folder names (not prompt content)
    // This is different from deepSearch which also searches prompts
    const matchingIds = new Set();
    const directMatches = new Set();
    const lowerQuery = query.toLowerCase();
    
    this.folderManager.folders.forEach(folder => {
      if (folder.name.toLowerCase().includes(lowerQuery)) {
        directMatches.add(folder.id);
        matchingIds.add(folder.id);
        // Add all ancestors to show the path to matching folders
        this.folderManager.addAncestorsToSet(folder.id, matchingIds);
      }
    });

    // Track if search has matches for "No matches found" display
    this.folderSearchHasMatches = directMatches.size > 0;
    
    // Re-render and highlight matches
    this.renderFolders();

    // CRITICAL: Expand folders that have matching children BEFORE hiding/showing
    // This ensures children are rendered in the DOM
    const foldersToExpand = new Set();
    matchingIds.forEach(matchingId => {
      const folder = this.folderManager.folders.find(f => f.id === matchingId);
      if (folder && folder.parentId) {
        // This folder matches and has a parent - parent needs to be expanded
        foldersToExpand.add(folder.parentId);
      }
    });
    
    // Force expand parent folders (this will create child elements in DOM)
    foldersToExpand.forEach(parentId => {
      const parentRow = document.querySelector(`[data-folder-id="${parentId}"]`);
      if (parentRow) {
        const childrenContainer = parentRow.nextElementSibling;
        // Check if NOT already expanded
        if (!childrenContainer || !childrenContainer.classList.contains('folder-children')) {
          // Trigger expansion to create children in DOM
          this.toggleFolderExpansion(parentId, parentRow);
        }
      }
    });
    
    // Now hide non-matching folders and show matching ones
    document.querySelectorAll('.folder-row').forEach(row => {
      const folderId = row.dataset.folderId;
      
      // ALWAYS hide prompts count rows during search (non-matching children)
      if (row.classList.contains('prompts-count-row')) {
        row.style.display = 'none';
        return;
      }
      
      // Always show uncategorized if it matches
      if (folderId === '__uncategorized__') {
        const uncategorizedMatches = this.prompts.some(p => {
          if (p.folderId) return false;
          const lowerQuery = query.toLowerCase();
          return p.title.toLowerCase().includes(lowerQuery) || 
                 (p.content && p.content.toLowerCase().includes(lowerQuery));
        });
        row.style.display = uncategorizedMatches ? 'flex' : 'none';
        return;
      }
      
      // Check if this folder matches (either directly or as an ancestor)
      const isMatch = matchingIds.has(folderId);
      const isDirectMatch = directMatches.has(folderId);
      
      if (isMatch) {
        row.style.display = 'flex';
        
        // Check if children container exists and if it has matching children
        const childrenContainer = row.nextElementSibling;
        if (childrenContainer && childrenContainer.classList.contains('folder-children')) {
          const hasMatchingChildren = this.folderManager.folders.some(childFolder => 
            childFolder.parentId === folderId && (directMatches.has(childFolder.id) || matchingIds.has(childFolder.id))
          );
          
          if (hasMatchingChildren) {
            // Ensure expanded
            childrenContainer.classList.add('expanded');
            
            // Rotate chevron to indicate expanded state
            const chevron = row.querySelector('.folder-chevron');
            if (chevron) {
              chevron.style.transform = 'rotate(90deg)';
            }
            
            // Hide non-matching children within the expanded container
            const childRows = childrenContainer.querySelectorAll('.folder-row');
            childRows.forEach(childRow => {
              const childFolderId = childRow.dataset.folderId;
              
              // Hide prompts count rows in expanded children
              if (childRow.classList.contains('prompts-count-row')) {
                childRow.style.display = 'none';
                return;
              }
              
              if (!matchingIds.has(childFolderId) && !directMatches.has(childFolderId)) {
                childRow.style.display = 'none';
              } else {
                childRow.style.display = 'flex'; // Show matching children
              }
            });
          }
        }
      } else {
        row.style.display = 'none';
      }
    });
    
    console.log(`🔍 Folder search complete: ${matchingIds.size} matches for "${query}"`);
  }

  // ============================================================
  // DRAG & DROP HANDLERS - Phase 3 Implementation
  // ============================================================

  /**
   * Handle drag start
   */
  handleFolderDragStart(event, folder) {
    event.stopPropagation();
    
    // Store dragged folder data
    this.draggedFolder = folder;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', folder.id);

    // Add dragging visual feedback
    event.currentTarget.classList.add('dragging');
    event.currentTarget.style.opacity = '0.5';
    event.currentTarget.style.cursor = 'grabbing';

    console.log('📦 Drag started:', folder.name);
  }

  /**
   * Handle drag over (determines if drop is valid)
   */
  handleFolderDragOver(event, targetFolder) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.draggedFolder) return;

    // Don't allow dropping on itself
    if (this.draggedFolder.id === targetFolder.id) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }

    // Check if this would create a circular dependency
    const canNest = this.folderManager.canNestFolder(this.draggedFolder.id, targetFolder.id);
    
    if (canNest) {
      event.dataTransfer.dropEffect = 'move';
      
      // Add visual feedback for valid drop zone
      const target = event.currentTarget;
      if (!target.classList.contains('drag-over')) {
        target.classList.add('drag-over');
      }
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }

  /**
   * Handle drop
   */
  async handleFolderDrop(event, targetFolder) {
    event.preventDefault();
    event.stopPropagation();

    // Remove drag-over class
    event.currentTarget.classList.remove('drag-over');

    if (!this.draggedFolder) return;

    // Don't allow dropping on itself
    if (this.draggedFolder.id === targetFolder.id) {
      console.log('❌ Cannot drop folder on itself');
      return;
    }

    // Validate the drop
    const canNest = this.folderManager.canNestFolder(this.draggedFolder.id, targetFolder.id);
    
    if (!canNest) {
      this.showToast('Cannot move folder into its own descendant', 'error');
      console.log('❌ Invalid drop: would create circular dependency');
      return;
    }

    try {
      console.log(`📁 Moving "${this.draggedFolder.name}" into "${targetFolder.name}"`);
      
      // Move the folder
      await this.folderManager.moveFolder(this.draggedFolder.id, targetFolder.id);
      
      // Re-render the folders tree
      this.renderFolders();
      
      // Expand the target folder to show the moved folder
      const childrenContainer = document.getElementById(`folder-children-${targetFolder.id}`);
      const toggleBtn = document.querySelector(`[data-folder-id="${targetFolder.id}"] .folder-toggle`);
      if (childrenContainer && toggleBtn) {
        childrenContainer.classList.remove('collapsed');
        toggleBtn.classList.remove('collapsed');
      }
      
      this.showToast(`Moved "${this.draggedFolder.name}" to "${targetFolder.name}"`);
    } catch (error) {
      console.error('Error moving folder:', error);
      this.showToast('Failed to move folder', 'error');
    }
  }

  /**
   * Handle drag end
   */
  handleFolderDragEnd(event) {
    event.stopPropagation();
    
    // Remove dragging visual feedback
    event.currentTarget.classList.remove('dragging');
    event.currentTarget.style.opacity = '';
    event.currentTarget.style.cursor = '';

    // Remove all drag-over classes
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });

    // Clear dragged folder reference
    this.draggedFolder = null;

    console.log('📦 Drag ended');
  }

  /**
   * Handle drag leave
   */
  handleFolderDragLeave(event) {
    event.stopPropagation();
    
    // Only remove drag-over if we're leaving the element (not entering a child)
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      event.currentTarget.classList.remove('drag-over');
    }
  }

  // ============================================================
  // PROMPT-FOLDER INTEGRATION - Phase 4 Implementation
  // ============================================================

  // REMOVED: Duplicate populatePromptFolderDropdown function
  // The active version is at line ~1239
  // This old version was for <select> elements and is no longer used
  
  // REMOVED: handlePromptFolderChange function
  // No longer needed with custom dropdown implementation

  /**
   * Build complete folder path from root to target folder
   * This walks UP the parent chain to get all ancestors
   */
  buildCompleteFolderPath(folderId) {
    const path = [{ id: null, name: 'All Folders' }]; // Start with root
    
    if (!folderId) return path;
    
    // Build ancestry chain by walking up parents
    const ancestry = [];
    let currentId = folderId;
    
    while (currentId) {
      const folder = this.folderManager.folders.find(f => f.id === currentId);
      if (!folder) break;
      
      // Add to front of ancestry (we're walking backwards)
      ancestry.unshift({ id: folder.id, name: folder.name });
      
      // Move to parent
      currentId = folder.parentId;
    }
    
    // Combine root + ancestry
    return [...path, ...ancestry];
  }

  /**
   * View prompts in a specific folder (click handler)
   */
  viewFolderPrompts(folderId, folderName) {
    console.log('🚀🚀🚀 viewFolderPrompts CALLED 🚀🚀🚀');
    console.log('📂 Folder ID:', folderId);
    console.log('📂 Folder Name:', folderName);
    
    // Store current folder ID for creating/importing prompts
    this.currentFolderId = folderId;
    
    // Elite Feature: Track folder visit for recents
    this.trackFolderVisit(folderId, folderName);
    
    // BUILD COMPLETE PATH including all parent folders
    this.folderPath = this.buildCompleteFolderPath(folderId);
    console.log('🛤️ Folder path built:', this.folderPath.map(p => p.name).join(' › '));
    console.log('🛤️ Folder path length:', this.folderPath.length);
    
    // Filter prompts by folder
    this.filteredPrompts = this.prompts.filter(p => p.folderId === folderId);
    console.log('📄 Filtered prompts:', this.filteredPrompts.length);
    
    // Reset filter flags for combined view
    this.showOnlyPrompts = false;
    this.showOnlySubfolders = false;
    console.log('🚫 Filter flags reset - showOnlyPrompts:', this.showOnlyPrompts, 'showOnlySubfolders:', this.showOnlySubfolders);
    
    // Check subfolders
    const subfolders = this.folderManager.folders.filter(f => f.parentId === folderId);
    console.log('📁 Subfolders for this folder:', subfolders.length);
    if (subfolders.length > 0) {
      console.log('📁 Subfolder names:', subfolders.map(f => f.name));
    }
    
    // Elite Feature: Add slide-in animation
    const container = document.getElementById('foldersTree');
    if (container) {
      container.classList.add('folder-view-transition');
      setTimeout(() => container.classList.remove('folder-view-transition'), 300);
    }
    
    // Re-render folders tab with folder details view
    console.log('🎨 Calling renderFolders()...');
    this.renderFolders();
    
    console.log(`✅ viewFolderPrompts complete - Path depth: ${this.folderPath.length}, Prompts: ${this.filteredPrompts.length}, Subfolders: ${subfolders.length}`);
  }

  /**
   * View only prompts in a folder (when clicking prompts metadata)
   */
  viewFolderPromptsOnly(folderId, folderName) {
    // Store current folder ID
    this.currentFolderId = folderId;
    
    // Track folder visit
    this.trackFolderVisit(folderId, folderName);
    
    // Build complete path
    this.folderPath = this.buildCompleteFolderPath(folderId);
    
    // Filter prompts by folder
    this.filteredPrompts = this.prompts.filter(p => p.folderId === folderId);
    
    // Set flag to show only prompts
    this.showOnlyPrompts = true;
    this.showOnlySubfolders = false;
    
    // Add animation
    const container = document.getElementById('foldersTree');
    if (container) {
      container.classList.add('folder-view-transition');
      setTimeout(() => container.classList.remove('folder-view-transition'), 300);
    }
    
    // Re-render
    this.renderFolders();
    
    console.log(`📄 Viewing ${this.filteredPrompts.length} prompts only in folder: ${folderName}`);
  }

  /**
   * View only subfolders in a folder (when clicking subfolders metadata)
   */
  viewFolderSubfoldersOnly(folderId, folderName) {
    console.log('📁📁📁 viewFolderSubfoldersOnly CALLED 📁📁📁');
    console.log('📂 Folder ID:', folderId);
    console.log('📂 Folder Name:', folderName);
    
    // Store current folder ID
    this.currentFolderId = folderId;
    
    // Track folder visit
    this.trackFolderVisit(folderId, folderName);
    
    // Build complete path
    this.folderPath = this.buildCompleteFolderPath(folderId);
    console.log('🛤️ Folder path built:', this.folderPath);
    console.log('🛤️ Folder path length:', this.folderPath.length);
    console.log('🛤️ Path names:', this.folderPath.map(p => p.name).join(' › '));
    
    // Clear prompts (we only want subfolders)
    this.filteredPrompts = [];
    console.log('📄 Filtered prompts cleared:', this.filteredPrompts.length);
    
    // Set flag to show only subfolders
    this.showOnlySubfolders = true;
    this.showOnlyPrompts = false;
    console.log('🚫 Flags set - showOnlySubfolders:', this.showOnlySubfolders, 'showOnlyPrompts:', this.showOnlyPrompts);
    
    // Count subfolders
    const subfolderCount = this.folderManager.folders.filter(f => f.parentId === folderId).length;
    console.log('📁 Subfolders to display:', subfolderCount);
    
    // Add animation
    const container = document.getElementById('foldersTree');
    if (container) {
      container.classList.add('folder-view-transition');
      setTimeout(() => container.classList.remove('folder-view-transition'), 300);
    }
    
    // Re-render
    console.log('🎨 Calling renderFolders()...');
    this.renderFolders();
    
    console.log(`✅ viewFolderSubfoldersOnly complete - Path depth: ${this.folderPath.length}, Subfolders: ${subfolderCount}`);
  }

  /**
   * Show breadcrumb for folder navigation
   */
  showFolderBreadcrumb(folderName) {
    const searchContainer = document.querySelector('#promptsTab .search-container');
    if (!searchContainer) return;

    // Remove existing breadcrumb
    const existingBreadcrumb = searchContainer.querySelector('.folder-breadcrumb');
    if (existingBreadcrumb) {
      existingBreadcrumb.remove();
    }

    // Create breadcrumb
    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'folder-breadcrumb';
    breadcrumb.innerHTML = `
      <button class="breadcrumb-back-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <span class="breadcrumb-text">📂 ${folderName}</span>
    `;

    breadcrumb.querySelector('.breadcrumb-back-btn').addEventListener('click', () => {
      this.clearFilter();
      breadcrumb.remove();
    });

    searchContainer.insertAdjacentElement('afterend', breadcrumb);
  }

  /**
   * View uncategorized prompts (Phase 6)
   */
  viewUncategorizedPrompts() {
    // Switch to prompts tab
    this.switchTab('prompts');
    
    // Filter uncategorized prompts
    this.filteredPrompts = this.prompts.filter(p => !p.folderId);
    
    // Set active filter
    this.activeFilter = {
      type: 'uncategorized',
      value: null,
      label: 'Uncategorized'
    };
    
    // Render prompts
    this.renderPrompts();
    
    // Show breadcrumb
    this.showFolderBreadcrumb('Uncategorized');
    
    console.log(`📂 Viewing ${this.filteredPrompts.length} uncategorized prompts`);
  }


  /**
   * Move prompt to folder (Phase 5)
   */
  async movePromptToFolder(prompt, folderId) {
    const oldFolderId = prompt.folderId;
    
    // Update prompt
    prompt.folderId = folderId;
    prompt.updatedAt = Date.now();

    // Save to storage
    const index = this.prompts.findIndex(p => p.id === prompt.id);
    if (index !== -1) {
      this.prompts[index] = prompt;
      await chrome.storage.local.set({ prompts: this.prompts });
    }

    // Get folder name for toast message
    let folderName = 'Uncategorized';
    if (folderId) {
      const folder = this.folderManager.folders.find(f => f.id === folderId);
      folderName = folder ? folder.name : 'Unknown';
    }

    // Show toast
    this.showToast(`Moved to ${folderName}`);

    // Re-render
    await this.loadData();
    this.renderPrompts();
    
    console.log(`📁 Moved prompt "${prompt.title}" from ${oldFolderId || 'uncategorized'} to ${folderId || 'uncategorized'}`);
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

  /* ============================================================ */
  /* ELITE FEATURES - Navigation, Intelligence, and Power User */
  /* ============================================================ */

  /**
   * Track folder visit for recent folders
   */
  trackFolderVisit(folderId, folderName) {
    if (!folderId) return;
    
    // Remove if already exists
    this.recentFolders = this.recentFolders.filter(f => f.id !== folderId);
    
    // Add to front
    this.recentFolders.unshift({
      id: folderId,
      name: folderName,
      timestamp: Date.now()
    });
    
    // Keep only last 5
    if (this.recentFolders.length > 5) {
      this.recentFolders = this.recentFolders.slice(0, 5);
    }
    
    // Save to storage
    chrome.storage.local.set({ recentFolders: this.recentFolders });
  }

  /**
   * Load recent folders from storage
   */
  async loadRecentFolders() {
    const result = await chrome.storage.local.get(['recentFolders']);
    this.recentFolders = result.recentFolders || [];
  }

  /**
   * Render STARRED FOLDERS section (unlimited starred folders, collapsible)
   */
  renderStarredFoldersSection() {
    console.log('🌟 renderStarredFoldersSection called');
    const tree = document.getElementById('foldersTree');
    if (!tree) {
      console.error('❌ foldersTree element not found!');
      return;
    }
    
    // Get starred folders
    console.log('📊 Total folders:', this.folderManager.folders.length);
    console.log('📁 All folders:', this.folderManager.folders.map(f => ({ name: f.name, isStarred: f.isStarred })));
    const starredFolders = this.folderManager.folders.filter(f => f.isStarred);
    console.log('⭐ Starred folders found:', starredFolders.length);
    console.log('⭐ Starred folder names:', starredFolders.map(f => f.name));
    
    if (starredFolders.length === 0) {
      console.warn('⚠️ No starred folders found, section will not render');
      return;
    }
    
    // Create section container
    const section = document.createElement('div');
    section.className = 'folders-section starred-folders-section';
    
    // Section header (clickable for expand/collapse)
    const header = document.createElement('div');
    header.className = 'folders-section-header starred-header clickable';
    header.innerHTML = `
      <i data-lucide="star" style="width: 12px; height: 12px;"></i>
      <span>STARRED FOLDERS (${starredFolders.length})</span>
      <i data-lucide="chevron-down" class="section-chevron" style="width: 14px; height: 14px; margin-left: auto;"></i>
    `;
    
    // Add click handler for expand/collapse
    header.addEventListener('click', () => {
      this.toggleFolderSection('starred');
    });
    
    section.appendChild(header);
    
    // Folder list (collapsed by default)
    const list = document.createElement('div');
    list.className = 'folders-list';
    
    // Use enhanced folder cards
    starredFolders.forEach(folder => {
      const card = this.createEnhancedFolderCard(folder, 0);
      list.appendChild(card);
    });
    
    section.appendChild(list);
    tree.appendChild(section);
    
    // Auto-expand STARRED FOLDERS by default (unless another section is explicitly expanded)
    if (!this.expandedFolderSection) {
      // No section is expanded, so expand STARRED FOLDERS by default
      list.classList.add('expanded');
      const chevron = section.querySelector('.section-chevron');
      if (chevron) {
        chevron.classList.add('expanded');
      }
      this.expandedFolderSection = 'starred';
    } else if (this.expandedFolderSection === 'starred') {
      // Restore expanded state if this section was expanded before
      list.classList.add('expanded');
      const chevron = section.querySelector('.section-chevron');
      if (chevron) {
        chevron.classList.add('expanded');
      }
    }
    
    // Initialize Lucide icons for the new cards
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Render RECENT FOLDERS section (5 most recent, collapsible)
   */
  renderRecentFoldersSection() {
    const tree = document.getElementById('foldersTree');
    if (!tree) return;
    
    // Get folder objects and sort by their updatedAt timestamp (most recent first)
    const recentWithFolders = this.recentFolders
      .map(recent => ({
        ...recent,
        folder: this.folderManager.getFolder(recent.id)
      }))
      .filter(item => item.folder) // Remove deleted folders
      .sort((a, b) => {
        const timeA = a.folder.updatedAt || a.folder.createdAt || 0;
        const timeB = b.folder.updatedAt || b.folder.createdAt || 0;
        return timeB - timeA; // Most recent first
      });
    
    const recentToShow = recentWithFolders.slice(0, 5); // Changed from 3 to 5
    if (recentToShow.length === 0) return;
    
    // Create section container
    const section = document.createElement('div');
    section.className = 'folders-section recent-folders-section';
    
    // Section header (clickable for expand/collapse)
    const header = document.createElement('div');
    header.className = 'folders-section-header clickable';
    header.innerHTML = `
      <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
      <span>RECENT FOLDERS (${recentToShow.length})</span>
      <i data-lucide="chevron-down" class="section-chevron" style="width: 14px; height: 14px; margin-left: auto;"></i>
    `;
    
    // Add click handler for expand/collapse
    header.addEventListener('click', () => {
      this.toggleFolderSection('recent');
    });
    
    section.appendChild(header);
    
    // Folder list (collapsed by default)
    const list = document.createElement('div');
    list.className = 'folders-list';
    
    // Use enhanced folder cards
    recentToShow.forEach(item => {
      const card = this.createEnhancedFolderCard(item.folder, 0);
      list.appendChild(card);
    });
    
    section.appendChild(list);
    tree.appendChild(section);
    
    // Restore expanded state if this section was expanded before
    if (this.expandedFolderSection === 'recent') {
      list.classList.add('expanded');
      const chevron = section.querySelector('.section-chevron');
      if (chevron) {
        chevron.classList.add('expanded');
      }
    }
    
    // Initialize Lucide icons for the new cards
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Render ALL FOLDERS section (collapsible, shows root folders count)
   */
  renderAllFoldersSection() {
    const tree = document.getElementById('foldersTree');
    if (!tree) return;
    
    // Get root-level folders only
    const rootFolders = this.folderManager.folders
      .filter(f => !f.parentId)
      .sort((a, b) => a.order - b.order);
    
    // Create section container
    const section = document.createElement('div');
    section.className = 'folders-section all-folders-section';
    
    // Section header (clickable for expand/collapse)
    const header = document.createElement('div');
    header.className = 'folders-section-header clickable';
    header.innerHTML = `
      <i data-lucide="folder" style="width: 12px; height: 12px;"></i>
      <span>ALL FOLDERS (${rootFolders.length})</span>
      <i data-lucide="chevron-down" class="section-chevron" style="width: 14px; height: 14px; margin-left: auto;"></i>
    `;
    
    // Add click handler for expand/collapse
    header.addEventListener('click', () => {
      this.toggleFolderSection('all');
    });
    
    section.appendChild(header);
    
    // Folder list (collapsed by default)
    const list = document.createElement('div');
    list.className = 'folders-list';
    
    // Use enhanced folder cards
    rootFolders.forEach(folder => {
      const card = this.createEnhancedFolderCard(folder, 0);
      list.appendChild(card);
    });
    
    section.appendChild(list);
    tree.appendChild(section);
    
    // Restore expanded state if this section was expanded before
    if (this.expandedFolderSection === 'all') {
      list.classList.add('expanded');
      const chevron = section.querySelector('.section-chevron');
      if (chevron) {
        chevron.classList.add('expanded');
      }
    }
    
    // Initialize Lucide icons for the new cards
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Render UNCATEGORIZED FOLDER section (virtual folder for uncategorized prompts)
   */
  renderUncategorizedFolderSection() {
    const tree = document.getElementById('foldersTree');
    if (!tree) return;
    
    // Count prompts without folderId
    const uncategorizedPrompts = this.prompts.filter(p => !p.folderId);
    
    // Only show if there are uncategorized prompts
    if (uncategorizedPrompts.length === 0) return;
    
    // Create section container
    const section = document.createElement('div');
    section.className = 'folders-section uncategorized-section';
    
    // Folder list (no header for single item)
    const list = document.createElement('div');
    list.className = 'folders-list';
    
    // Create virtual uncategorized folder row
    const row = document.createElement('div');
    row.className = 'folder-row uncategorized-folder-row';
    row.dataset.folderId = '__uncategorized__';
    
    // Add chevron for expansion (consistent with other folders)
    const chevron = document.createElement('i');
    chevron.className = 'folder-chevron';
    chevron.setAttribute('data-lucide', 'chevron-right');
    chevron.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.toggleFolderExpansion('__uncategorized__', row);
    });
    row.appendChild(chevron);
    
    // Folder name & count
    const nameContainer = document.createElement('div');
    nameContainer.className = 'folder-name-container';
    
    const name = document.createElement('span');
    name.className = 'folder-name-text';
    name.textContent = 'Uncategorized';
    nameContainer.appendChild(name);
    
    // Prompt count removed per user request
    // const count = document.createElement('span');
    // count.className = 'folder-prompt-count';
    // count.textContent = ` (${uncategorizedPrompts.length})`;
    // nameContainer.appendChild(count);
    
    row.appendChild(nameContainer);
    
    // Row click behavior - expand to show prompts
    row.addEventListener('click', (e) => {
      this.toggleFolderExpansion('__uncategorized__', row);
    });
    
    list.appendChild(row);
    section.appendChild(list);
    tree.appendChild(section);
  }

  /**
   * View uncategorized prompts
   */
  viewUncategorizedFolder() {
    this.folderPath = [
      { id: null, name: 'All Folders' },
      { id: '__uncategorized__', name: 'Uncategorized' }
    ];
    
    this.filteredPrompts = this.prompts.filter(p => !p.folderId);
    this.renderFolders();
  }

  /**
   * Create a sleek macOS-style folder row
   */
  createFolderRow(folder, promptCount, hasChildren) {
    const row = document.createElement('div');
    row.className = 'folder-row';
    row.dataset.folderId = folder.id;
    
    // Disclosure chevron (only if has children)
    if (hasChildren) {
      const chevron = document.createElement('i');
      chevron.className = 'folder-chevron';
      chevron.setAttribute('data-lucide', 'chevron-right');
      chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.toggleFolderExpansion(folder.id, row);
      });
      row.appendChild(chevron);
    } else {
      // Empty space to maintain alignment
      const spacer = document.createElement('span');
      spacer.className = 'folder-chevron-spacer';
      row.appendChild(spacer);
    }
    
    // Folder name & count (with search highlighting if query exists)
    const nameContainer = document.createElement('div');
    nameContainer.className = 'folder-name-container';
    
    const name = document.createElement('span');
    name.className = 'folder-name-text';
    if (this.currentFolderSearchQuery) {
      name.innerHTML = this.highlightSearchMatches(folder.name, this.currentFolderSearchQuery);
    } else {
      name.textContent = folder.name;
    }
    nameContainer.appendChild(name);
    
    // Prompt count removed per user request
    // const count = document.createElement('span');
    // count.className = 'folder-prompt-count';
    // count.textContent = ` (${promptCount})`;
    // nameContainer.appendChild(count);
    
    row.appendChild(nameContainer);
    
    // Actions menu (appears on hover)
    const actionsBtn = document.createElement('i');
    actionsBtn.className = 'folder-actions-btn';
    actionsBtn.setAttribute('data-lucide', 'more-horizontal');
    actionsBtn.dataset.folderId = folder.id; // Store folder ID for later listener attachment
    row.appendChild(actionsBtn);
    
    // Row click behavior
    row.addEventListener('click', (e) => {
      // Don't handle click if it's on the actions button or its children (SVG after Lucide)
      if (e.target.closest('.folder-actions-btn')) {
        return;
      }
      
      const hasDirectPrompts = this.prompts.some(p => p.folderId === folder.id);
      
      if (hasChildren || hasDirectPrompts) {
        // Has children or prompts: expand/collapse to show them
        this.toggleFolderExpansion(folder.id, row);
      } else {
        // Empty folder: still navigate (shouldn't happen normally)
        this.viewFolderPrompts(folder.id, folder.name);
      }
    });
    
    return row;
  }

  /**
   * Create a prompts count row (shows "X prompts" in folder tree)
   */
  createPromptsCountRow(folderId, promptCount, isUncategorized = false) {
    const row = document.createElement('div');
    row.className = 'folder-row prompts-count-row';
    row.dataset.folderId = folderId;
    
    // Spacer for alignment
    const spacer = document.createElement('span');
    spacer.className = 'folder-chevron-spacer';
    row.appendChild(spacer);
    
    // Icon for prompts
    const icon = document.createElement('i');
    icon.className = 'prompts-icon';
    icon.setAttribute('data-lucide', 'file-text');
    icon.style.width = '14px';
    icon.style.height = '14px';
    icon.style.color = '#22B8CF';
    icon.style.marginRight = '8px';
    row.appendChild(icon);
    
    // Text: "X prompts"
    const text = document.createElement('span');
    text.className = 'prompts-count-text';
    text.textContent = `${promptCount} prompt${promptCount !== 1 ? 's' : ''}`;
    text.style.fontSize = '12px'; // Match folder name size
    text.style.color = '#22B8CF';
    text.style.fontWeight = '400'; // Match folder name weight
    text.style.fontFamily = 'Sora, sans-serif';
    row.appendChild(text);
    
    // Click to view folder prompts
    row.addEventListener('click', () => {
      if (isUncategorized) {
        this.viewUncategorizedFolder();
      } else {
        const folder = this.folderManager.getFolder(folderId);
        if (folder) {
          this.viewFolderPrompts(folderId, folder.name);
        }
      }
    });
    
    // Hover effect
    row.style.cursor = 'pointer';
    row.addEventListener('mouseenter', () => {
      row.style.background = 'rgba(34, 184, 207, 0.05)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = 'transparent';
    });
    
    return row;
  }

  /**
   * Toggle folder expansion (show/hide children)
   * @param {string} folderId - The folder ID
   * @param {HTMLElement} clickedRow - The specific row element that was clicked (optional)
   */
  toggleFolderExpansion(folderId, clickedRow = null) {
    // Use the passed row element if available, otherwise search for it
    const row = clickedRow || document.querySelector(`[data-folder-id="${folderId}"]`);
    if (!row) return;
    
    const chevron = row.querySelector('.folder-chevron');
    const childrenContainer = row.nextElementSibling;
    
    // Check if children are already rendered
    if (childrenContainer && childrenContainer.classList.contains('folder-children')) {
      // Toggle visibility
      const isExpanded = childrenContainer.classList.toggle('expanded');
      if (chevron) {
        chevron.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
      }
    } else {
      // First expansion - create children container
      const children = this.folderManager.folders
        .filter(f => f.parentId === folderId)
        .sort((a, b) => a.order - b.order);
      
      // Special handling for Uncategorized folder
      const isUncategorized = folderId === '__uncategorized__';
      const directPrompts = isUncategorized 
        ? this.prompts.filter(p => !p.folderId)
        : this.prompts.filter(p => p.folderId === folderId);
      
      if (children.length > 0 || directPrompts.length > 0) {
        const container = document.createElement('div');
        container.className = 'folder-children expanded';
        
        // Add prompts count row FIRST if this folder has direct prompts
        if (directPrompts.length > 0) {
          const promptsRow = this.createPromptsCountRow(folderId, directPrompts.length, isUncategorized);
          container.appendChild(promptsRow);
        }
        
        // Add child folders AFTER prompts
        children.forEach(child => {
          const hasGrandchildren = this.folderManager.folders.some(f => f.parentId === child.id);
          const promptCount = this.folderManager.countPromptsRecursive(child.id, this.prompts);
          const childRow = this.createFolderRow(child, promptCount, hasGrandchildren);
          container.appendChild(childRow);
        });
        
        row.parentNode.insertBefore(container, row.nextSibling);
        
        if (chevron) {
          chevron.style.transform = 'rotate(90deg)';
        }
        
        // Re-init Lucide icons
        if (window.lucide) window.lucide.createIcons();
        
        // Attach folder action listeners after Lucide replaces icons
        this.attachFolderActionsListeners();
      }
    }
  }

  /**
   * Attach event listeners to folder action buttons
   * Must be called AFTER lucide.createIcons() to attach to the SVG elements
   */
  attachFolderActionsListeners() {
    document.querySelectorAll('.folder-actions-btn').forEach(btn => {
      // Get folder ID from data attribute
      const folderId = btn.dataset.folderId;
      if (!folderId) return;
      
      // Remove old listener by cloning (if any)
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Attach click listener
      newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const folder = this.folderManager.getFolder(folderId);
        if (folder) {
          this.showFolderActionsMenu(e, folder);
        }
      });
    });
  }

  /**
   * Show folder actions menu (Rename, Delete, Create Subfolder)
   */
  showFolderActionsMenu(event, folder) {
    console.log('🎯 showFolderActionsMenu called for folder:', folder.name);
    const menuItems = [
      {
        label: 'Rename',
        action: () => this.editFolder(folder)
      },
      {
        label: 'Create Subfolder',
        action: () => this.openFolderModal(folder.id)
      },
      { separator: true },
      {
        label: 'Delete',
        action: () => this.deleteFolderWithConfirm(folder),
        danger: true
      }
    ];
    
    console.log('🎯 Calling showContextMenu with', menuItems.length, 'items');
    this.showContextMenu(event, menuItems);
  }

  /**
   * Get time ago string
   */
  getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  /**
   * Track prompt save to folder for suggestions
   */
  trackPromptSave(folderId) {
    if (!folderId) return;
    
    if (!this.folderSaveHistory[folderId]) {
      this.folderSaveHistory[folderId] = { count: 0, lastSave: Date.now() };
    }
    
    this.folderSaveHistory[folderId].count++;
    this.folderSaveHistory[folderId].lastSave = Date.now();
    
    // Save to storage
    chrome.storage.local.set({ folderSaveHistory: this.folderSaveHistory });
    
    // Update suggested folders
    this.updateSuggestedFolders();
  }

  /**
   * Update suggested folders based on save history
   */
  updateSuggestedFolders() {
    const history = Object.entries(this.folderSaveHistory)
      .map(([id, data]) => ({ id, ...data }))
      .filter(item => {
        // Only suggest if saved in last 7 days
        const daysSinceLastSave = (Date.now() - item.lastSave) / (1000 * 60 * 60 * 24);
        return daysSinceLastSave < 7;
      })
      .sort((a, b) => {
        // Sort by recency and frequency
        const scoreA = a.count * 0.5 + (1 / ((Date.now() - a.lastSave) / 1000));
        const scoreB = b.count * 0.5 + (1 / ((Date.now() - b.lastSave) / 1000));
        return scoreB - scoreA;
      })
      .slice(0, 2); // Top 2 suggestions
    
    this.suggestedFolders = history.map(h => h.id);
  }

  /**
   * Command Palette - Toggle
   */
  toggleCommandPalette() {
    if (this.commandPaletteOpen) {
      this.closeCommandPalette();
    } else {
      this.openCommandPalette();
    }
  }

  /**
   * Command Palette - Open
   */
  openCommandPalette() {
    this.commandPaletteOpen = true;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'command-palette-overlay';
    overlay.id = 'commandPaletteOverlay';
    
    // Create palette
    const palette = document.createElement('div');
    palette.className = 'command-palette';
    
    // Input
    const input = document.createElement('input');
    input.className = 'command-palette-input';
    input.placeholder = 'Go to folder...';
    input.id = 'commandPaletteInput';
    
    // Results
    const results = document.createElement('div');
    results.className = 'command-palette-results';
    results.id = 'commandPaletteResults';
    
    // Hint
    const hint = document.createElement('div');
    hint.className = 'command-palette-hint';
    hint.innerHTML = '<span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span><span>Select with <kbd>Enter</kbd></span>';
    
    palette.appendChild(input);
    palette.appendChild(results);
    palette.appendChild(hint);
    overlay.appendChild(palette);
    document.body.appendChild(overlay);
    
    // Focus input
    input.focus();
    
    // Event listeners
    let selectedIndex = 0;
    let filteredFolders = [];
    
    const renderResults = (query) => {
      const allFolders = this.folderManager.getAllFolders();
      filteredFolders = query ? allFolders.filter(f => 
        f.name.toLowerCase().includes(query.toLowerCase())
      ) : allFolders;
      
      results.innerHTML = '';
      selectedIndex = 0;
      
      if (filteredFolders.length === 0) {
        results.innerHTML = '<div class="command-palette-empty">No folders found</div>';
        return;
      }
      
      filteredFolders.forEach((folder, index) => {
        const item = document.createElement('div');
        item.className = 'command-palette-item' + (index === 0 ? ' selected' : '');
        
        // Icon (always use folder emoji)
        const iconSpan = document.createElement('span');
        iconSpan.textContent = '📁';
        iconSpan.style.fontSize = '16px';
        item.appendChild(iconSpan);
        
        // Content
        const content = document.createElement('div');
        content.className = 'command-palette-item-content';
        
        const name = document.createElement('div');
        name.className = 'command-palette-item-name';
        name.textContent = folder.name;
        content.appendChild(name);
        
        // Path
        if (folder.parentId) {
          const path = this.getFolderPath(folder);
          const pathDiv = document.createElement('div');
          pathDiv.className = 'command-palette-item-path';
          pathDiv.textContent = path;
          content.appendChild(pathDiv);
        }
        
        item.appendChild(content);
        
        item.addEventListener('click', () => {
          this.navigateToFolder(folder);
          this.closeCommandPalette();
        });
        
        results.appendChild(item);
      });
      
      // Initialize Lucide icons
      setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
      }, 10);
    };
    
    input.addEventListener('input', (e) => {
      renderResults(e.target.value);
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredFolders.length - 1);
        updateSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredFolders[selectedIndex]) {
          this.navigateToFolder(filteredFolders[selectedIndex]);
          this.closeCommandPalette();
        }
      }
    });
    
    const updateSelection = () => {
      document.querySelectorAll('.command-palette-item').forEach((item, index) => {
        item.classList.toggle('selected', index === selectedIndex);
        if (index === selectedIndex) {
          item.scrollIntoView({ block: 'nearest' });
        }
      });
    };
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeCommandPalette();
      }
    });
    
    // Initial render
    renderResults('');
  }

  /**
   * Get folder path string
   */
  getFolderPath(folder) {
    const parts = [];
    let current = folder;
    
    while (current.parentId) {
      const parent = this.folderManager.getFolder(current.parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      current = parent;
    }
    
    return parts.join(' / ');
  }

  /**
   * Navigate to folder from command palette
   */
  navigateToFolder(folder) {
    // Switch to folders tab
    if (this.currentTab !== 'folders') {
      this.switchTab('folders');
    }
    
    // Navigate to folder
    this.viewFolderPrompts(folder.id, folder.name);
  }

  /**
   * Command Palette - Close
   */
  closeCommandPalette() {
    const overlay = document.getElementById('commandPaletteOverlay');
    if (overlay) {
      overlay.remove();
    }
    this.commandPaletteOpen = false;
  }

  // ============================================================
  // INTELLIGENT VARIABLES SYSTEM
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
   * Insert variable placeholder at cursor position
   */
  insertVariable() {
    const textarea = document.getElementById('promptContent');
    if (!textarea) return;
    
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
    if (!textarea) return;
    
    const syntax = this.getVariableSyntax();
    const example = `${syntax.start}variables${syntax.end}`;
    
    textarea.placeholder = `Enter your prompt here.\n\nUse "+" button from above to add ${example} for creating reusable prompts.\n\nYou can customize the syntax for adding variables from Settings i.e [ ], < >, { } etc.`;
  }

  /**
   * Update popup syntax preview
   */
  updatePopupSyntaxPreview() {
    const start = document.getElementById('popupCustomStartDelimiter')?.value || '$$';
    const end = document.getElementById('popupCustomEndDelimiter')?.value || '$$';
    const preview = document.getElementById('popupSyntaxPreview');
    
    if (preview) {
      preview.innerHTML = `Preview: <strong>${start}VARIABLE${end}</strong>`;
    }
  }

  /**
   * Save custom syntax from popup
   */
  async savePopupCustomSyntax() {
    const start = document.getElementById('popupCustomStartDelimiter')?.value;
    const end = document.getElementById('popupCustomEndDelimiter')?.value;
    
    if (start && end) {
      await this.saveSetting('variableSyntax', 'custom');
      await this.saveSetting('customStartDelimiter', start);
      await this.saveSetting('customEndDelimiter', end);
    }
  }

  /**
   * Load settings into popup panel Settings tab
   */
  loadPopupSettings() {
    // Load variable syntax settings
    const variableSyntax = this.settings.variableSyntax || '{{}}';
    const select = document.getElementById('popupVariableSyntaxSelect');
    if (select) {
      select.value = variableSyntax;
    }
    
    // Show/hide custom syntax container
    const customContainer = document.getElementById('popupCustomSyntaxContainer');
    if (customContainer) {
      if (variableSyntax === 'custom') {
        customContainer.style.display = 'block';
        const startInput = document.getElementById('popupCustomStartDelimiter');
        const endInput = document.getElementById('popupCustomEndDelimiter');
        if (startInput) startInput.value = this.settings.customStartDelimiter || '{{';
        if (endInput) endInput.value = this.settings.customEndDelimiter || '}}';
        this.updatePopupSyntaxPreview();
      } else {
        customContainer.style.display = 'none';
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BULK SELECTION FEATURE
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Toggle selection state for a prompt
   */
  togglePromptSelection(promptId) {
    if (this.selectedPromptIds.has(promptId)) {
      this.selectedPromptIds.delete(promptId);
      console.log('🔲 Deselected prompt:', promptId);
    } else {
      this.selectedPromptIds.add(promptId);
      console.log('✅ Selected prompt:', promptId);
    }
    
    console.log('📊 Total selected prompts:', this.selectedPromptIds.size);
    console.log('📊 Selected IDs:', Array.from(this.selectedPromptIds));
    
    // Update UI
    this.updateSelectionUI();
  }
  
  /**
   * Clear all selections
   */
  clearBulkSelection() {
    console.log('🧹 Clearing bulk selection');
    this.selectedPromptIds.clear();
    this.updateSelectionUI();
  }
  
  /**
   * Update UI to reflect current selection state
   */
  updateSelectionUI() {
    console.log('🎨 Updating selection UI...');
    
    // Update all prompt cards
    const cards = document.querySelectorAll('.prompt-card');
    console.log('📇 Found', cards.length, 'prompt cards');
    
    cards.forEach(card => {
      const promptId = card.dataset.promptId;
      const isSelected = this.selectedPromptIds.has(promptId);
      
      if (isSelected) {
        card.classList.add('is-selected');
        console.log('✅ Added is-selected class to card:', promptId);
        
        // Verify the selection indicator exists
        const indicator = card.querySelector('.selection-indicator');
        if (indicator) {
          console.log('✓ Selection indicator found for card:', promptId);
        } else {
          console.warn('⚠️ Selection indicator NOT found for card:', promptId);
        }
      } else {
        card.classList.remove('is-selected');
      }
    });
    
    // Update or create selection counter banner
    this.updateSelectionCounter();
  }
  
  /**
   * Update the selection counter banner
   */
  updateSelectionCounter() {
    const count = this.selectedPromptIds.size;
    
    if (count === 0) {
      // Hide banner
      if (this.selectionCounterBanner) {
        this.selectionCounterBanner.classList.remove('visible');
        setTimeout(() => {
          if (this.selectionCounterBanner && this.selectedPromptIds.size === 0) {
            this.selectionCounterBanner.remove();
            this.selectionCounterBanner = null;
          }
        }, 300);
      }
      return;
    }
    
    // Create or update banner
    if (!this.selectionCounterBanner) {
      this.selectionCounterBanner = document.createElement('div');
      this.selectionCounterBanner.className = 'selection-counter-banner';
      
      // Insert at top of panel-container for proper positioning
      const panelContainer = document.querySelector('.panel-container');
      if (panelContainer) {
        panelContainer.insertBefore(this.selectionCounterBanner, panelContainer.firstChild);
        console.log('✅ Banner created and inserted into panel-container');
      } else {
        console.error('❌ panel-container not found!');
      }
    } else {
      console.log('🔄 Banner already exists, updating content');
    }
    
    // Update content
    const plural = count === 1 ? '' : 's';
    this.selectionCounterBanner.innerHTML = `
      <div class="selection-counter-text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <span>${count} prompt${plural} selected</span>
      </div>
      <button class="selection-clear-btn" title="Clear selection">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    // Add click handler for clear button
    const clearBtn = this.selectionCounterBanner.querySelector('.selection-clear-btn');
    clearBtn.addEventListener('click', () => this.clearBulkSelection());
    
    // Show banner with animation
    setTimeout(() => {
      if (this.selectionCounterBanner) {
        this.selectionCounterBanner.classList.add('visible');
        console.log('🎬 Banner visible class added');
        console.log('📏 Banner computed style:', {
          position: getComputedStyle(this.selectionCounterBanner).position,
          top: getComputedStyle(this.selectionCounterBanner).top,
          zIndex: getComputedStyle(this.selectionCounterBanner).zIndex,
          transform: getComputedStyle(this.selectionCounterBanner).transform,
          opacity: getComputedStyle(this.selectionCounterBanner).opacity
        });
      }
    }, 10);
  }
  
  /**
   * Show bulk actions context menu
   */
  showBulkActionsMenu(event) {
    // Remove ALL existing context menus (both types)
    document.querySelectorAll('.bulk-actions-menu').forEach(m => m.remove());
    document.querySelectorAll('.context-menu').forEach(m => m.remove());
    
    const count = this.selectedPromptIds.size;
    const plural = count === 1 ? '' : 's';
    
    // Create menu
    const menu = document.createElement('div');
    menu.className = 'bulk-actions-menu';
    // Don't set position yet - will be set after measurements
    
    console.log('📍 Initial click position:', { x: event.clientX, y: event.clientY });
    
    menu.innerHTML = `
      <div class="bulk-actions-menu-header">${count} prompt${plural} selected</div>
      <div class="bulk-actions-menu-item" data-action="download">
        <div class="menu-item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <span>Download Selection</span>
      </div>
      <div class="bulk-actions-menu-item" data-action="favorite">
        <div class="menu-item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
        <span>Add Selection to Favorites</span>
      </div>
      <div class="bulk-actions-menu-item" data-action="move">
        <div class="menu-item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <span>Move Selection to Folder</span>
      </div>
      <hr>
      <div class="bulk-actions-menu-item danger" data-action="delete">
        <div class="menu-item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>
        <span>Delete Selection</span>
      </div>
    `;
    
    // Add click handlers BEFORE appending
    menu.querySelectorAll('.bulk-actions-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        menu.remove();
        this.handleBulkAction(action);
      });
    });
    
    // Append to body for proper fixed positioning
    document.body.appendChild(menu);
    
    // Use requestAnimationFrame to ensure accurate measurements after DOM append
    requestAnimationFrame(() => {
      const menuRect = menu.getBoundingClientRect();
      
      // Get actual popup dimensions and position
      const popup = document.querySelector('.panel-container') || document.body;
      const popupRect = popup.getBoundingClientRect();
      
      // Calculate position relative to popup's left edge
      const relativeX = event.clientX - popupRect.left;
      const relativeY = event.clientY - popupRect.top;
      
      let finalLeft = event.clientX;
      let finalTop = event.clientY;
      
      console.log('📊 Viewport info:', {
        popupWidth: popupRect.width,
        popupLeft: popupRect.left,
        clickX: event.clientX,
        relativeX: relativeX,
        menuWidth: menuRect.width,
        wouldOverflow: (relativeX + menuRect.width > popupRect.width - 10)
      });
      
      // Adjust horizontal position if menu would overflow popup's right edge
      if (relativeX + menuRect.width > popupRect.width - 10) {
        // Position menu to the left of cursor instead
        finalLeft = event.clientX - menuRect.width;
        // Ensure it doesn't go off the left edge
        if (finalLeft < popupRect.left + 10) {
          finalLeft = popupRect.left + 10;
        }
        console.log('📍 Adjusted menu left:', finalLeft, '(would overflow right edge, positioned left of cursor)');
      }
      
      // Adjust vertical position if menu would overflow bottom edge
      if (relativeY + menuRect.height > popupRect.height - 10) {
        // Position menu ABOVE the cursor instead
        finalTop = event.clientY - menuRect.height;
        // Ensure it doesn't go off the top edge
        if (finalTop < popupRect.top + 10) {
          finalTop = popupRect.top + 10;
        }
        console.log('📍 Adjusted menu top:', finalTop, '(would overflow bottom edge, positioned above cursor)');
      }
      
      // Apply final position
      menu.style.left = `${finalLeft}px`;
      menu.style.top = `${finalTop}px`;
      
      console.log('📐 Menu dimensions:', {
        width: menuRect.width,
        height: menuRect.height,
        finalPosition: { left: finalLeft, top: finalTop }
      });
      
      // Show with animation
      setTimeout(() => {
        menu.classList.add('visible');
        console.log('🎬 Menu visible class added');
        
        // Verify menu is actually visible
        const computedStyle = getComputedStyle(menu);
        console.log('🔍 Menu computed styles:', {
          display: computedStyle.display,
          opacity: computedStyle.opacity,
          transform: computedStyle.transform,
          position: computedStyle.position,
          left: computedStyle.left,
          top: computedStyle.top,
          zIndex: computedStyle.zIndex,
          pointerEvents: computedStyle.pointerEvents
        });
        
        // Check if menu is in DOM
        console.log('🌳 Menu in DOM:', document.body.contains(menu));
        console.log('📦 Menu element:', menu);
      }, 10);
      
      // Close menu on click or right-click outside (delay to prevent immediate closure)
      setTimeout(() => {
        const closeMenu = (e) => {
          if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
            document.removeEventListener('contextmenu', closeMenu);
          }
        };
        document.addEventListener('click', closeMenu);
        document.addEventListener('contextmenu', closeMenu);
      }, 200);
    });
  }
  
  /**
   * Handle bulk action selection
   */
  async handleBulkAction(action) {
    console.log('🎬 Bulk action:', action, 'for', this.selectedPromptIds.size, 'prompts');
    
    switch (action) {
      case 'download':
        this.showDownloadSelectionModal();
        break;
      case 'favorite':
        await this.addSelectionToFavorites();
        break;
      case 'move':
        this.showMoveSelectionModal();
        break;
      case 'delete':
        this.showDeleteSelectionModal();
        break;
    }
  }
  
  /**
   * Show download selection modal
   */
  showDownloadSelectionModal() {
    const count = this.selectedPromptIds.size;
    const format = this.settings.fileFormat || 'md';
    const formatNames = { md: 'Markdown', json: 'JSON', txt: 'Text', xml: 'XML' };
    const formatName = formatNames[format] || 'Markdown';
    
    const modal = document.createElement('div');
    modal.className = 'modal download-selection-modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Download Prompts</h2>
          <button class="modal-close-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p>Download <strong>${count} selected prompt${count === 1 ? '' : 's'}</strong> as a single <strong>.${format}</strong> file</p>
          <div class="download-info-box">
            <span>All prompts will be combined in one <strong>${formatName}</strong> file with clear separators</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="download-cancel-btn">Cancel</button>
          <button class="download-primary-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download ${count} Prompt${count === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event handlers
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.download-cancel-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.download-primary-btn').addEventListener('click', async () => {
      await this.downloadSelectedPrompts();
      modal.remove();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
  
  /**
   * Download selected prompts as a single file
   */
  async downloadSelectedPrompts() {
    const selectedPrompts = this.prompts.filter(p => this.selectedPromptIds.has(p.id));
    const count = selectedPrompts.length;
    
    // Generate filename with today's date
    const today = new Date().toISOString().split('T')[0];
    const filename = `selected-prompts-${today}`;
    
    // Use existing export controller
    await this.exportController(selectedPrompts, filename);
    
    this.showToast(`Downloaded ${count} prompt${count === 1 ? '' : 's'}`);
    this.clearBulkSelection();
  }
  
  /**
   * Add all selected prompts to favorites
   */
  async addSelectionToFavorites() {
    const count = this.selectedPromptIds.size;
    let addedCount = 0;
    
    for (const promptId of this.selectedPromptIds) {
      if (!this.isFavorite(promptId)) {
        await this.toggleFavorite(promptId);
        addedCount++;
      }
    }
    
    // Update UI
    if (this.currentTab === 'favorites') {
      this.renderFavorites();
    } else {
      this.renderPrompts();
    }
    
    const message = addedCount === 0 
      ? 'All selected prompts already favorited'
      : `${addedCount} prompt${addedCount === 1 ? '' : 's'} added to favorites`;
    this.showToast(message);
    this.clearBulkSelection();
  }
  
  /**
   * Show move selection to folder modal
   */
  showMoveSelectionModal() {
    // Get selected prompts info
    const selectedPrompts = this.prompts.filter(p => this.selectedPromptIds.has(p.id));
    const count = selectedPrompts.length;
    
    // Get current folders
    const currentFolders = [...new Set(selectedPrompts.map(p => p.folderId).filter(Boolean))];
    const folderNames = currentFolders.map(id => {
      const folder = this.folderManager.folders.find(f => f.id === id);
      return folder ? folder.name : 'Unknown';
    });
    
    // Build context text
    let movingText = '';
    if (count <= 3) {
      movingText = selectedPrompts.map(p => p.title).join(', ');
    } else {
      movingText = selectedPrompts.slice(0, 3).map(p => p.title).join(', ') + `, +${count - 3} more`;
    }
    
    let currentlyInText = '';
    if (folderNames.length === 0) {
      currentlyInText = 'None';
    } else if (folderNames.length === 1) {
      currentlyInText = folderNames[0];
    } else if (folderNames.length <= 3) {
      currentlyInText = folderNames.join(', ');
    } else {
      currentlyInText = folderNames.slice(0, 3).join(', ') + `, +${folderNames.length - 3} more`;
    }
    
    // Store bulk move state
    this.bulkMovePromptIds = Array.from(this.selectedPromptIds);
    
    // Show move to folder modal with modified context
    // We'll use a special flag to indicate this is a bulk move
    this.isBulkMove = true;
    this.bulkMoveContext = { movingText, currentlyInText };
    
    // Call existing move to folder modal (we'll modify it to handle bulk moves)
    this.showMoveToFolderModal(null, movingText, null);
  }
  
  /**
   * Show delete selection confirmation modal
   */
  showDeleteSelectionModal() {
    const selectedPrompts = this.prompts.filter(p => this.selectedPromptIds.has(p.id));
    const count = selectedPrompts.length;
    
    const modal = document.createElement('div');
    modal.className = 'modal delete-selection-modal';
    modal.style.display = 'flex';
    
    // Build prompt list HTML
    let promptListHTML = '';
    if (count <= 10) {
      promptListHTML = selectedPrompts.map(p => 
        `<div class="delete-prompts-list-item">${p.title}</div>`
      ).join('');
    } else {
      promptListHTML = selectedPrompts.slice(0, 5).map(p => 
        `<div class="delete-prompts-list-item">${p.title}</div>`
      ).join('');
      promptListHTML += `<div class="delete-prompts-list-more">+ ${count - 5} more prompts</div>`;
    }
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Delete ${count} Prompt${count === 1 ? '' : 's'}?</h2>
          <button class="modal-close-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-warning-box">
            Are you sure you want to delete these ${count} prompt${count === 1 ? '' : 's'}? This action cannot be undone.
          </div>
          <div class="delete-prompts-list">
            ${promptListHTML}
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn secondary cancel-btn">Cancel</button>
          <button class="action-btn primary danger delete-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete ${count} Prompt${count === 1 ? '' : 's'}</span>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event handlers
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.delete-btn').addEventListener('click', async () => {
      await this.deleteSelectedPrompts();
      modal.remove();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
  
  /**
   * Delete all selected prompts
   */
  async deleteSelectedPrompts() {
    const count = this.selectedPromptIds.size;
    const idsToDelete = Array.from(this.selectedPromptIds);
    
    // Delete each prompt
    for (const promptId of idsToDelete) {
      const index = this.prompts.findIndex(p => p.id === promptId);
      if (index !== -1) {
        this.prompts.splice(index, 1);
      }
      
      // Remove from favorites if present
      if (this.favoritePromptIds.includes(promptId)) {
        this.favoritePromptIds = this.favoritePromptIds.filter(id => id !== promptId);
        this.favoritePromptOrder = this.favoritePromptOrder.filter(id => id !== promptId);
      }
    }
    
    // Save to storage
    await chrome.storage.local.set({ prompts: this.prompts });
    await chrome.storage.sync.set({ 
      favoritePromptIds: this.favoritePromptIds,
      favoritePromptOrder: this.favoritePromptOrder
    });
    
    // Reload and update UI
    await this.loadData();
    this.updateUIState();
    
    if (this.currentTab === 'favorites') {
      this.renderFavorites();
    } else {
      this.renderPrompts();
    }
    
    this.showToast(`${count} prompt${count === 1 ? '' : 's'} deleted`);
    this.clearBulkSelection();
  }

  // ============================================================
  // BULK FOLDER SELECTION METHODS
  // ============================================================
  
  /**
   * Toggle selection state for a folder
   */
  toggleFolderSelection(folderId) {
    if (this.selectedFolderIds.has(folderId)) {
      this.selectedFolderIds.delete(folderId);
      console.log('🔲 Deselected folder:', folderId);
    } else {
      this.selectedFolderIds.add(folderId);
      console.log('✅ Selected folder:', folderId);
    }
    
    console.log('📊 Total selected folders:', this.selectedFolderIds.size);
    console.log('📊 Selected folder IDs:', Array.from(this.selectedFolderIds));
    
    // Update UI
    this.updateFolderSelectionUI();
  }
  
  /**
   * Clear bulk folder selection
   */
  clearBulkFolderSelection() {
    console.log('🧹 Clearing bulk folder selection');
    this.selectedFolderIds.clear();
    this.updateFolderSelectionUI();
  }
  
  /**
   * Update folder selection UI (add/remove is-selected class)
   */
  updateFolderSelectionUI() {
    const cards = document.querySelectorAll('.folder-card');
    
    cards.forEach(card => {
      const folderId = card.dataset.folderId;
      const isSelected = this.selectedFolderIds.has(folderId);
      
      if (isSelected) {
        card.classList.add('is-selected');
        console.log('✅ Added is-selected class to folder card:', folderId);
      } else {
        card.classList.remove('is-selected');
      }
    });
    
    // Update selection counter
    this.updateFolderSelectionCounter();
  }
  
  /**
   * Update the folder selection counter banner
   */
  updateFolderSelectionCounter() {
    const count = this.selectedFolderIds.size;
    
    if (count === 0) {
      // Hide banner
      if (this.selectionCounterBanner) {
        this.selectionCounterBanner.classList.remove('visible');
        setTimeout(() => {
          if (this.selectionCounterBanner && this.selectedFolderIds.size === 0) {
            this.selectionCounterBanner.remove();
            this.selectionCounterBanner = null;
          }
        }, 300);
      }
      return;
    }
    
    // Create or update banner
    if (!this.selectionCounterBanner) {
      this.selectionCounterBanner = document.createElement('div');
      this.selectionCounterBanner.className = 'selection-counter-banner';
      
      // Insert banner OUTSIDE the panel container, at the very top of body
      const panelContainer = document.querySelector('.panel-container');
      if (panelContainer) {
        document.body.insertBefore(this.selectionCounterBanner, panelContainer);
      }
    }
    
    const plural = count === 1 ? '' : 's';
    this.selectionCounterBanner.innerHTML = `
      <div class="selection-counter-content">
        <span class="selection-counter-text">${count} folder${plural} selected</span>
        <button class="selection-clear-btn">
          <i data-lucide="x" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
    `;
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Add clear button handler
    const clearBtn = this.selectionCounterBanner.querySelector('.selection-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearBulkFolderSelection());
    }
    
    // Show banner with animation
    setTimeout(() => {
      this.selectionCounterBanner.classList.add('visible');
    }, 10);
  }
  
  /**
   * Show bulk folder actions context menu
   */
  showBulkFolderActionsMenu(e) {
    // Remove ALL existing context menus (both types)
    document.querySelectorAll('.bulk-actions-menu').forEach(m => m.remove());
    document.querySelectorAll('.context-menu').forEach(m => m.remove());
    
    const count = this.selectedFolderIds.size;
    const plural = count === 1 ? '' : 's';
    
    // Create menu
    const menu = document.createElement('div');
    menu.className = 'bulk-actions-menu folder-bulk-menu';
    
    menu.innerHTML = `
      <div class="bulk-actions-header">
        <span class="bulk-actions-count">${count} FOLDER${plural.toUpperCase()} SELECTED</span>
      </div>
      <div class="bulk-actions-list">
        <button class="bulk-action-item delete-action" data-action="delete">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          <span>Delete Selection</span>
        </button>
      </div>
    `;
    
    // Position menu
    const x = e.clientX;
    const y = e.clientY;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    document.body.appendChild(menu);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Show menu with animation
    setTimeout(() => {
      menu.classList.add('visible');
    }, 10);
    
    // Adjust position if menu goes off-screen
    setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
    }, 0);
    
    // Add event listeners
    menu.querySelectorAll('.bulk-action-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        this.handleBulkFolderAction(action);
        menu.remove();
      });
    });
    
    // Close menu on click or right-click outside
    setTimeout(() => {
      const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
          document.removeEventListener('contextmenu', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
      document.addEventListener('contextmenu', closeMenu);
    }, 0);
  }
  
  /**
   * Handle bulk folder action selection
   */
  async handleBulkFolderAction(action) {
    console.log('🎬 Bulk folder action:', action, 'for', this.selectedFolderIds.size, 'folders');
    
    switch (action) {
      case 'delete':
        this.showDeleteFolderSelectionModal();
        break;
    }
  }
  
  /**
   * Show delete folder selection confirmation modal
   */
  showDeleteFolderSelectionModal() {
    const selectedFolders = this.folderManager.folders.filter(f => this.selectedFolderIds.has(f.id));
    const count = selectedFolders.length;
    
    const modal = document.createElement('div');
    modal.className = 'modal delete-selection-modal';
    modal.style.display = 'flex';
    
    // Build folder list HTML
    let folderListHTML = '';
    if (count <= 10) {
      folderListHTML = selectedFolders.map(f => 
        `<div class="delete-prompts-list-item">${this.escapeHtml(f.name)}</div>`
      ).join('');
    } else {
      folderListHTML = selectedFolders.slice(0, 5).map(f => 
        `<div class="delete-prompts-list-item">${this.escapeHtml(f.name)}</div>`
      ).join('');
      folderListHTML += `<div class="delete-prompts-list-more">+ ${count - 5} more folders</div>`;
    }
    
    modal.innerHTML = `
      <div class="modal-content delete-selection-modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Delete ${count} Folder${count === 1 ? '' : 's'}?</h3>
          <button class="modal-close-btn">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-prompts-list">
            ${folderListHTML}
          </div>
          <div class="delete-warning-box">
            <i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i>
            <div>
              <strong>Warning:</strong> This will permanently delete ${count === 1 ? 'this folder' : 'these folders'} and all their contents (subfolders and prompts). This action cannot be undone.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary cancel-btn">Cancel</button>
          <button class="btn btn-danger delete-btn">Delete ${count === 1 ? 'Folder' : 'Folders'}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Event handlers
    modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.delete-btn').addEventListener('click', async () => {
      await this.deleteSelectedFolders();
      modal.remove();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
  
  /**
   * Delete all selected folders
   */
  async deleteSelectedFolders() {
    const count = this.selectedFolderIds.size;
    const idsToDelete = Array.from(this.selectedFolderIds);
    
    // Delete each folder (this will also delete subfolders and prompts)
    for (const folderId of idsToDelete) {
      await this.folderManager.deleteFolder(folderId);
      
      // Also delete prompts in this folder
      this.prompts = this.prompts.filter(p => p.folderId !== folderId);
    }
    
    // Save prompts to storage
    await chrome.storage.local.set({ prompts: this.prompts });
    
    // Reload and update UI
    await this.loadData();
    this.updateUIState();
    this.renderFolders();
    
    this.showToast(`${count} folder${count === 1 ? '' : 's'} deleted`);
    this.clearBulkFolderSelection();
  }

}

// ============================================================
// FOLDER MANAGER - Hierarchical Folder Organization System
// ============================================================

/**
 * FolderManager - Manages hierarchical folder structure for prompts
 * Features: CRUD operations, nesting validation, cascade delete, deep search
 */
class FolderManager {
  constructor() {
    this.folders = [];
    this.cachedTree = null;
    this.cacheInvalid = true;
  }

  /**
   * Generate unique folder ID
   * Format: "f-{timestamp}-{random}"
   */
  generateFolderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `f-${timestamp}-${random}`;
  }

  /**
   * Load folders from storage
   */
  async loadFolders() {
    console.log('🔍 FolderManager: Loading folders from chrome.storage.sync...');
    const result = await chrome.storage.sync.get('folders');
    console.log('📦 FolderManager: Storage result:', result);
    this.folders = result.folders || [];
    console.log('✅ FolderManager: Loaded', this.folders.length, 'folders:', this.folders);
    this.invalidateCache();
    return this.folders;
  }

  /**
   * Save folders to storage
   */
  async saveFolders() {
    await chrome.storage.sync.set({ folders: this.folders });
    this.invalidateCache();
  }

  /**
   * Invalidate cached tree structure
   */
  invalidateCache() {
    this.cacheInvalid = true;
    this.cachedTree = null;
  }

  /**
   * Create a new folder
   * @param {Object} folderData - Folder properties
   * @param {string} folderData.name - Folder name (required, 1-50 chars)
   * @param {string|null} folderData.parentId - Parent folder ID (optional)
   * @param {string} [folderData.icon='folder'] - Folder icon (optional)
   * @param {string} [folderData.color='#22B8CF'] - Folder color (optional)
   * @param {boolean} [folderData.isStarred=false] - Is folder starred (optional)
   * @returns {Promise<Folder>} Created folder object
   * @throws {Error} If validation fails
   */
  async createFolder({ name, parentId = null, icon = 'folder', color = '#22B8CF', isStarred = false }) {
    // Validation
    if (!name || name.trim().length === 0) {
      throw new Error('Folder name is required');
    }
    if (name.length > 50) {
      throw new Error('Folder name must be 50 characters or less');
    }
    if (parentId && !this.folders.find(f => f.id === parentId)) {
      throw new Error('Parent folder not found');
    }

    // Calculate order (last in parent)
    const siblings = this.folders.filter(f => f.parentId === parentId);
    const order = siblings.length > 0 ? Math.max(...siblings.map(f => f.order)) + 1 : 0;

    // Create folder object
    const folder = {
      id: this.generateFolderId(),
      name: name.trim(),
      parentId,
      icon,
      color,
      isStarred,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order
    };

    this.folders.push(folder);
    await this.saveFolders();

    return folder;
  }

  /**
   * Update folder properties
   * @param {string} folderId - Folder ID to update
   * @param {Object} updates - Properties to update
   * @returns {Promise<Folder>} Updated folder object
   * @throws {Error} If folder not found or validation fails
   */
  async updateFolder(folderId, updates) {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Validation
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Folder name cannot be empty');
      }
      if (updates.name.length > 50) {
        throw new Error('Folder name must be 50 characters or less');
      }
    }

    // Apply updates
    Object.assign(folder, updates, { updatedAt: Date.now() });
    await this.saveFolders();

    return folder;
  }

  /**
   * Move folder to new parent
   * @param {string} folderId - Folder ID to move
   * @param {string|null} newParentId - New parent ID (null for root)
   * @returns {Promise<Folder>} Updated folder object
   * @throws {Error} If would create circular dependency
   */
  async moveFolder(folderId, newParentId) {
    // Validate not moving to self
    if (folderId === newParentId) {
      throw new Error('Cannot move folder into itself');
    }

    // Validate no circular dependency
    if (newParentId && !this.canNestFolder(folderId, newParentId)) {
      throw new Error('Cannot move folder into its own descendant');
    }

    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Calculate new order
    const siblings = this.folders.filter(f => f.parentId === newParentId && f.id !== folderId);
    const order = siblings.length > 0 ? Math.max(...siblings.map(f => f.order)) + 1 : 0;

    folder.parentId = newParentId;
    folder.order = order;
    folder.updatedAt = Date.now();

    await this.saveFolders();
    return folder;
  }

  /**
   * Delete folder (cascade by default)
   * @param {string} folderId - Folder ID to delete
   * @param {boolean} cascade - If true, delete descendants and prompts
   * @param {Array} prompts - Current prompts array (for cascade delete)
   * @returns {Promise<Object>} Delete statistics
   */
  async deleteFolder(folderId, cascade = true, prompts = []) {
    const folder = this.folders.find(f => f.id === folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    let deletedFolders = 1;
    let deletedPrompts = 0;
    let foldersToDelete = [folderId];

    if (cascade) {
      // Get all descendant folder IDs
      const descendants = this.getAllDescendantIds(folderId);
      foldersToDelete = [folderId, ...descendants];
      deletedFolders = foldersToDelete.length;

      // Delete prompts in these folders
      const remainingPrompts = prompts.filter(p => !foldersToDelete.includes(p.folderId));
      deletedPrompts = prompts.length - remainingPrompts.length;

      // Update prompts in storage
      await chrome.storage.local.set({ prompts: remainingPrompts });
    }

    // Delete folders
    this.folders = this.folders.filter(f => !foldersToDelete.includes(f.id));
    await this.saveFolders();

    return { deletedFolders, deletedPrompts, folderIds: foldersToDelete };
  }

  /**
   * Get all descendant folder IDs (recursive)
   * Time Complexity: O(n)
   * @param {string} folderId - Parent folder ID
   * @returns {string[]} Array of descendant folder IDs
   */
  getAllDescendantIds(folderId) {
    const descendants = [];
    const stack = [folderId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      const children = this.folders.filter(f => f.parentId === currentId);

      children.forEach(child => {
        descendants.push(child.id);
        stack.push(child.id);
      });
    }

    return descendants;
  }

  /**
   * Check if folder can be nested under target parent
   * Prevents circular dependencies
   * @param {string} folderId - Folder to move
   * @param {string} targetParentId - Proposed parent
   * @returns {boolean} True if nesting is valid
   */
  canNestFolder(folderId, targetParentId) {
    if (folderId === targetParentId) return false;
    if (!targetParentId) return true; // Moving to root is always valid

    // Check if targetParentId is descendant of folderId
    const descendants = this.getAllDescendantIds(folderId);
    return !descendants.includes(targetParentId);
  }

  /**
   * Build hierarchical tree structure from flat array
   * Time Complexity: O(n)
   * @param {boolean} useCache - Use cached tree if available
   * @returns {FolderNode[]} Array of root folder nodes with children
   */
  buildFolderTree(useCache = true) {
    if (useCache && !this.cacheInvalid && this.cachedTree) {
      return this.cachedTree;
    }

    const folderMap = new Map();
    const rootFolders = [];

    // First pass: Create map with children arrays
    this.folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Second pass: Build hierarchy
    this.folders.forEach(folder => {
      const node = folderMap.get(folder.id);
      if (folder.parentId === null) {
        rootFolders.push(node);
      } else {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // Orphaned folder - promote to root
          console.warn(`Orphaned folder detected: ${folder.name} (${folder.id})`);
          node.parentId = null;
          rootFolders.push(node);
        }
      }
    });

    // Sort folders by order property
    const sortByOrder = (a, b) => a.order - b.order;
    rootFolders.sort(sortByOrder);

    // Recursively sort children
    const sortChildren = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort(sortByOrder);
        node.children.forEach(sortChildren);
      }
    };

    rootFolders.forEach(sortChildren);

    // Cache result
    this.cachedTree = rootFolders;
    this.cacheInvalid = false;

    return rootFolders;
  }

  /**
   * Get folder by ID
   * @param {string} folderId - Folder ID
   * @returns {Folder|null} Folder object or null
   */
  getFolder(folderId) {
    return this.folders.find(f => f.id === folderId) || null;
  }

  /**
   * Get all folders at root level
   * @returns {Folder[]} Array of root folders
   */
  getRootFolders() {
    return this.folders.filter(f => f.parentId === null).sort((a, b) => a.order - b.order);
  }

  /**
   * Get direct children of folder
   * @param {string} folderId - Parent folder ID
   * @returns {Folder[]} Array of child folders
   */
  getChildren(folderId) {
    return this.folders.filter(f => f.parentId === folderId).sort((a, b) => a.order - b.order);
  }

  /**
   * Get folder path (ancestors)
   * @param {string} folderId - Folder ID
   * @returns {Folder[]} Array of folders from root to target
   */
  getFolderPath(folderId) {
    const path = [];
    let current = this.getFolder(folderId);

    while (current) {
      path.unshift(current);
      current = current.parentId ? this.getFolder(current.parentId) : null;
    }

    return path;
  }

  /**
   * Deep search folders and prompts
   * Returns folder IDs that match or contain matching prompts
   * @param {string} query - Search query
   * @param {Array} prompts - Prompts array to search
   * @returns {Set<string>} Set of matching folder IDs
   */
  deepSearch(query, prompts) {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return new Set();

    const matchingFolderIds = new Set();

    // 1. Find folders with matching names
    this.folders.forEach(folder => {
      if (folder.name.toLowerCase().includes(lowerQuery)) {
        matchingFolderIds.add(folder.id);
        // Add all ancestors to show path
        this.addAncestorsToSet(folder.id, matchingFolderIds);
      }
    });

    // 2. Find prompts with matching title/content
    prompts.forEach(prompt => {
      const titleMatch = prompt.title.toLowerCase().includes(lowerQuery);
      const contentMatch = prompt.content && prompt.content.toLowerCase().includes(lowerQuery);

      if ((titleMatch || contentMatch) && prompt.folderId) {
        matchingFolderIds.add(prompt.folderId);
        this.addAncestorsToSet(prompt.folderId, matchingFolderIds);
      }
    });

    return matchingFolderIds;
  }

  /**
   * Add all ancestor folder IDs to set
   * @param {string} folderId - Starting folder ID
   * @param {Set<string>} resultSet - Set to add ancestors to
   */
  addAncestorsToSet(folderId, resultSet) {
    let current = this.getFolder(folderId);
    while (current && current.parentId) {
      resultSet.add(current.parentId);
      current = this.getFolder(current.parentId);
    }
  }

  /**
   * Reorder folders within same parent
   * @param {string} folderId - Folder to reorder
   * @param {number} newOrder - New order value
   */
  async reorderFolder(folderId, newOrder) {
    const folder = this.getFolder(folderId);
    if (!folder) throw new Error('Folder not found');

    folder.order = newOrder;
    folder.updatedAt = Date.now();
    await this.saveFolders();
  }

  /**
   * Count prompts in folder (non-recursive)
   * @param {string} folderId - Folder ID
   * @param {Array} prompts - Prompts array
   * @returns {number} Count of prompts
   */
  countPromptsInFolder(folderId, prompts) {
    return prompts.filter(p => p.folderId === folderId).length;
  }

  /**
   * Count prompts in folder and all descendants (recursive)
   * @param {string} folderId - Folder ID
   * @param {Array} prompts - Prompts array
   * @returns {number} Total count including descendants
   */
  countPromptsRecursive(folderId, prompts) {
    const descendants = this.getAllDescendantIds(folderId);
    const allFolderIds = [folderId, ...descendants];
    return prompts.filter(p => allFolderIds.includes(p.folderId)).length;
  }
}

// Initialize panel manager when DOM is ready
// ===== PREMIUM CUSTOM DROPDOWN FUNCTIONALITY =====
class CustomDropdown {
  constructor(dropdownElement) {
    this.dropdown = dropdownElement;
    this.trigger = this.dropdown.querySelector('.custom-dropdown-trigger');
    this.menu = this.dropdown.querySelector('.custom-dropdown-menu');
    this.items = this.dropdown.querySelectorAll('.custom-dropdown-item');
    this.valueDisplay = this.dropdown.querySelector('.dropdown-value');
    this.hiddenSelect = this.dropdown.parentElement.querySelector('select[style*="display: none"]');
    
    this.isOpen = false;
    this.selectedValue = this.dropdown.querySelector('.custom-dropdown-item.active')?.dataset.value || '';
    
    this.init();
  }
  
  init() {
    // Toggle dropdown on trigger click
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    
    // Handle item selection
    this.items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectItem(item);
      });
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target)) {
        this.close();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    
    // Smart positioning: check if there's enough space below
    this.updatePosition();
    
    this.dropdown.classList.add('open');
    this.trigger.setAttribute('aria-expanded', 'true');
  }
  
  updatePosition() {
    const triggerRect = this.trigger.getBoundingClientRect();
    const menuHeight = 200; // Reduced from 240 to be more sensitive
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - triggerRect.bottom - 20; // Add buffer
    const spaceAbove = triggerRect.top - 20; // Add buffer
    
    console.log('Positioning check:', { spaceBelow, spaceAbove, menuHeight });
    
    // If not enough space below, try to open upward
    if (spaceBelow < menuHeight && spaceAbove >= 100) { // More aggressive upward detection
      console.log('Opening upward');
      this.dropdown.classList.add('open-upward');
      this.dropdown.classList.remove('open-downward');
    } else {
      console.log('Opening downward');
      this.dropdown.classList.add('open-downward');
      this.dropdown.classList.remove('open-upward');
    }
  }
  
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.dropdown.classList.remove('open');
    this.dropdown.classList.remove('open-upward');
    this.dropdown.classList.remove('open-downward');
    this.trigger.setAttribute('aria-expanded', 'false');
  }
  
  selectItem(item) {
    const value = item.dataset.value;
    const label = item.textContent.trim();
    
    // Update selected value
    this.selectedValue = value;
    
    // Update active state
    this.items.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    // Update display
    if (this.valueDisplay) {
      this.valueDisplay.textContent = label;
    }
    
    // Update hidden select if exists
    if (this.hiddenSelect) {
      this.hiddenSelect.value = value;
      // Trigger change event
      const event = new Event('change', { bubbles: true });
      this.hiddenSelect.dispatchEvent(event);
    }
    
    // Close dropdown
    this.close();
  }
}

// Initialize custom dropdowns
function initCustomDropdowns() {
  const dropdowns = document.querySelectorAll('.custom-dropdown');
  dropdowns.forEach(dropdown => new CustomDropdown(dropdown));
}

document.addEventListener('DOMContentLoaded', () => {
  // Make panel manager globally accessible for debugging
  window.panelManager = new RefinedPanelManager();
  console.log('✅ Panel Manager initialized and available as window.panelManager');
  
  // Initialize custom dropdowns
  initCustomDropdowns();
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
