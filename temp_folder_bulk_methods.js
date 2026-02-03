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
    
    // Update selection counter (reuse prompt counter for now, or create separate)
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
      
      const foldersTab = document.getElementById('foldersTab');
      if (foldersTab) {
        foldersTab.insertBefore(this.selectionCounterBanner, foldersTab.firstChild);
      }
    }
    
    const plural = count === 1 ? '' : 's';
    this.selectionCounterBanner.innerHTML = `
      <div class="selection-counter-content">
        <span class="selection-counter-text">${count} folder${plural} selected</span>
        <button class="selection-counter-clear">
          <i data-lucide="x" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
    `;
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Add clear button handler
    const clearBtn = this.selectionCounterBanner.querySelector('.selection-counter-clear');
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
    // Remove existing menu if any
    const existingMenu = document.querySelector('.bulk-actions-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    const count = this.selectedFolderIds.size;
    const plural = count === 1 ? '' : 's';
    
    // Create menu
    const menu = document.createElement('div');
    menu.className = 'bulk-actions-menu';
    
    menu.innerHTML = `
      <div class="bulk-actions-header">
        <span>${count} Folder${plural} Selected</span>
      </div>
      <div class="bulk-actions-list">
        <button class="bulk-action-item danger" data-action="delete">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
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
    
    // Close menu on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
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
