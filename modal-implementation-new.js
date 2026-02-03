  /**
   * ============================================
   * MOVE TO FOLDER MODAL - COMPLETE WORKING CODE
   * ============================================
   */

  /**
   * Opens the Move to Folder modal
   */
  showMoveToFolderModal(promptId, promptTitle, currentFolderId) {
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

    // Remove existing modal if any
    const existingModal = document.querySelector('.move-to-folder-overlay');
    if (existingModal) {
      existingModal.remove();
    }

    // Create and inject modal
    const modalHTML = this.renderMoveToFolderModalHTML();
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Attach event listeners
    this.attachMoveModalEventListeners();

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Focus search input after a brief delay
    setTimeout(() => {
      const searchInput = document.querySelector('.move-modal-search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }, 150);
  }

  /**
   * Renders the complete modal HTML
   */
  renderMoveToFolderModalHTML() {
    const { promptTitle, currentFolderName, currentFolderId } = this.moveModalState;

    return `
      <div class="move-to-folder-overlay">
        <div class="move-to-folder-modal">
          <!-- Header -->
          <div class="move-modal-header">
            <div class="move-modal-title-row">
              <h2 class="move-modal-title">MOVE TO FOLDER</h2>
              <button class="move-modal-close-btn" data-action="close" aria-label="Close">
                <i data-lucide="x"></i>
              </button>
            </div>

            <div class="move-modal-context">
              <div class="context-row">
                <span class="context-label">Moving:</span>
                <span class="context-value">${this.escapeHtml(promptTitle)}</span>
              </div>
              <div class="context-row">
                <span class="context-label">Currently in:</span>
                <span class="context-value context-folder">${this.escapeHtml(currentFolderName)}</span>
              </div>
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
              <i data-lucide="x"></i>
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
    const { searchTerm, currentFolderId } = this.moveModalState;

    // Check if no folders exist at all
    if (!this.folderManager.folders || this.folderManager.folders.length === 0) {
      return this.renderEmptyStateHTML('no-folders');
    }

    // Build folder tree
    const folderTree = this.buildFolderTree(this.folderManager.folders);

    // Apply search filter
    const filteredTree = this.filterFolderTree(folderTree, searchTerm);

    // Check if search returned no results
    if (searchTerm && searchTerm.trim() !== '' && filteredTree.length === 0) {
      return this.renderEmptyStateHTML('no-results', searchTerm);
    }

    let html = '';

    // Recently Used Section (only when not searching)
    if (!searchTerm || searchTerm.trim() === '') {
      const recentFolders = this.getRecentlyUsedFolders();
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

    return html;
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
        data-action="${isCurrent ? '' : 'select-folder'}"
        style="padding-left: ${paddingLeft}px; --folder-color: ${folderColor};"
      >
        ${hasChildren ? `
          <button class="folder-chevron" data-action="toggle-expand" aria-label="Toggle folder">
            <i data-lucide="chevron-right"></i>
          </button>
        ` : '<span class="folder-chevron-spacer"></span>'}

        <i data-lucide="${folderIcon}" class="folder-icon" style="color: ${folderColor};"></i>

        <span class="folder-name">${this.escapeHtml(folder.name)}</span>

        <span class="folder-count">${promptCount}</span>

        ${isCurrent ? '<i data-lucide="check" class="folder-checkmark"></i>' : ''}
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
          <p class="empty-description">No folders matching "<strong>${this.escapeHtml(searchTerm)}</strong>"</p>
          <button class="empty-action-btn" data-action="create-new-folder" data-prefill="${this.escapeHtml(searchTerm)}">
            <i data-lucide="plus"></i>
            Create "${this.escapeHtml(searchTerm)}" folder
          </button>
          <p class="empty-hint">or try a different search term</p>
        </div>
      `;
    }

    return '';
  }

  /**
   * Attaches all event listeners
   */
  attachMoveModalEventListeners() {
    const modal = document.querySelector('.move-to-folder-modal');
    const overlay = document.querySelector('.move-to-folder-overlay');
    const searchInput = document.querySelector('.move-modal-search-input');
    const clearBtn = document.querySelector('.search-clear-btn');

    if (!modal || !overlay) return;

    // Close button
    modal.querySelector('[data-action="close"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeMoveToFolderModal();
    });

    // Overlay click to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeMoveToFolderModal();
      }
    });

    // Escape key to close
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeMoveToFolderModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Search input - THIS IS CRITICAL
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        console.log('Search input changed:', value); // Debug log
        this.handleMoveModalSearch(value);
      });

      // Also handle keyup as backup
      searchInput.addEventListener('keyup', (e) => {
        const value = e.target.value;
        console.log('Search keyup:', value); // Debug log
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
        this.handleMoveModalSearch('');
      });
    }

    // Event delegation for folder items
    modal.addEventListener('click', (e) => {
      // Select folder
      const folderItem = e.target.closest('[data-action="select-folder"]');
      if (folderItem) {
        const folderId = folderItem.dataset.folderId;
        console.log('Folder selected:', folderId); // Debug log
        this.handleFolderSelection(folderId);
        return;
      }

      // Toggle expand
      const toggleBtn = e.target.closest('[data-action="toggle-expand"]');
      if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        const folderItem = toggleBtn.closest('.folder-item');
        const folderId = folderItem?.dataset.folderId;
        if (folderId) {
          console.log('Toggle expand:', folderId); // Debug log
          this.toggleFolderExpand(folderId);
        }
        return;
      }

      // Create new folder
      const createBtn = e.target.closest('[data-action="create-new-folder"]');
      if (createBtn) {
        const prefill = createBtn.dataset.prefill || '';
        console.log('Create folder:', prefill); // Debug log
        this.handleCreateNewFolderFromModal(prefill);
        return;
      }
    });

    console.log('Move modal event listeners attached'); // Debug log
  }

  /**
   * Handles search input - CRITICAL FUNCTION
   */
  handleMoveModalSearch(searchTerm) {
    console.log('handleMoveModalSearch called with:', searchTerm); // Debug

    // Update state
    this.moveModalState.searchTerm = searchTerm;
    this.moveModalState.expandedFolderIds.clear();

    // Show/hide clear button
    const clearBtn = document.querySelector('.search-clear-btn');
    if (clearBtn) {
      clearBtn.style.display = searchTerm && searchTerm.trim() !== '' ? 'flex' : 'none';
    }

    // Re-render folder list
    this.updateMoveModalFolderList();
  }

  /**
   * Updates the folder list without re-rendering entire modal
   */
  updateMoveModalFolderList() {
    const contentContainer = document.querySelector('.move-modal-content');
    if (!contentContainer) {
      console.error('Content container not found!'); // Debug
      return;
    }

    console.log('Updating folder list with search:', this.moveModalState.searchTerm); // Debug

    // Re-render folder list
    contentContainer.innerHTML = this.renderFolderListHTML();

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    console.log('Folder list updated'); // Debug
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
    // If no search term, return all folders
    if (!searchTerm || searchTerm.trim() === '') {
      return folderTree;
    }

    const term = searchTerm.toLowerCase().trim();
    console.log('Filtering with term:', term); // Debug

    const results = [];

    for (const folder of folderTree) {
      // Check if this folder matches (case-insensitive)
      const folderMatches = folder.name.toLowerCase().includes(term);

      // Recursively filter children
      const matchingChildren = folder.children && folder.children.length > 0
        ? this.filterFolderTree(folder.children, searchTerm)
        : [];

      // Include folder if it matches OR if any children match
      if (folderMatches || matchingChildren.length > 0) {
        results.push({
          ...folder,
          children: matchingChildren,
          isExpanded: matchingChildren.length > 0 // Auto-expand if children match
        });

        // Track as expanded
        if (matchingChildren.length > 0) {
          this.moveModalState.expandedFolderIds.add(folder.id);
        }

        console.log('Folder matched:', folder.name, 'Has matching children:', matchingChildren.length); // Debug
      }
    }

    console.log('Filter results:', results.length, 'folders'); // Debug
    return results;
  }

  /**
   * Gets recently used folders
   */
  getRecentlyUsedFolders() {
    // Initialize if not exists
    if (!this.recentFolderIds) {
      this.recentFolderIds = [];
    }

    // Get up to 3 recent folders
    const recentIds = [...new Set(this.recentFolderIds)].slice(0, 3);

    return recentIds
      .map(id => this.folderManager.folders.find(f => f.id === id))
      .filter(f => f && f.id !== this.moveModalState.currentFolderId); // Exclude current folder
  }

  /**
   * Toggles folder expand/collapse
   */
  toggleFolderExpand(folderId) {
    if (this.moveModalState.expandedFolderIds.has(folderId)) {
      this.moveModalState.expandedFolderIds.delete(folderId);
    } else {
      this.moveModalState.expandedFolderIds.add(folderId);
    }

    this.updateMoveModalFolderList();
  }

  /**
   * Handles folder selection
   */
  async handleFolderSelection(folderId) {
    const { promptId, currentFolderId } = this.moveModalState;

    // Don't do anything if already in this folder
    if (folderId === currentFolderId) {
      return;
    }

    console.log('Moving prompt', promptId, 'to folder', folderId); // Debug

    // Find and update the prompt
    const prompt = this.prompts.find(p => p.id === promptId);
    if (prompt) {
      // Update folder
      prompt.folderId = folderId;

      // Save to storage
      await chrome.storage.local.set({ prompts: this.prompts });

      // Track as recent
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

      // Close modal
      this.closeMoveToFolderModal();

      // Refresh prompts display
      await this.loadAndDisplayPrompts();

      // Show success message
      this.showToast(`Moved to ${folderName}`, 'success');
    }
  }

  /**
   * Handles creating new folder from modal
   */
  handleCreateNewFolderFromModal(prefillName = '') {
    // Close this modal
    this.closeMoveToFolderModal();

    // Open create folder modal
    // If you have a showCreateFolderModal method, call it
    if (typeof this.showCreateFolderModal === 'function') {
      this.showCreateFolderModal(null, prefillName);
    } else {
      // Fallback: Use prompt
      const folderName = prompt('Enter folder name:', prefillName);
      if (folderName && folderName.trim()) {
        const newFolder = {
          id: this.generateId(),
          name: folderName.trim(),
          icon: 'folder',
          color: '#22B8CF',
          parentId: null,
          createdAt: Date.now()
        };

        this.folderManager.folders.push(newFolder);
        chrome.storage.local.set({ folders: this.folderManager.folders });

        // Reopen move modal
        setTimeout(() => {
          this.showMoveToFolderModal(
            this.moveModalState.promptId,
            this.moveModalState.promptTitle,
            this.moveModalState.currentFolderId
          );
        }, 100);
      }
    }
  }

  /**
   * Closes the modal
   */
  closeMoveToFolderModal() {
    const overlay = document.querySelector('.move-to-folder-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
      }, 200);
    }

    if (this.moveModalState) {
      this.moveModalState.isOpen = false;
    }
  }

  /**
   * Helper: Escape HTML
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Helper: Generate ID
   */
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
