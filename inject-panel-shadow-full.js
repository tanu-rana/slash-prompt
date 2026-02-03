// Phase 3: Full HTML Structure in Shadow DOM
// Preserves ALL IDs and classes exactly as they are

console.log('Shadow DOM Phase 3: Loading full structure...');

// Create host element
const shadowHost = document.createElement('div');
shadowHost.id = 'prompt-manager-shadow-host';
shadowHost.style.cssText = `
  position: fixed;
  top: 0;
  right: 0;
  width: 360px;
  height: 100vh;
  z-index: 2147483647;
  pointer-events: none;
  margin: 0;
  padding: 0;
`;

// Attach Shadow DOM
const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

// Get CSS URL
const cssUrl = chrome.runtime.getURL('popup-panel-refined.css');

// Full HTML structure (lines 10-295 from popup-panel-refined.html)
const htmlStructure = `
  <link rel="stylesheet" href="${cssUrl}">
  
  <div class="panel-container" style="pointer-events: auto;">
    <!-- Header -->
    <div class="header">
      <div class="header-title">
        <svg class="logo" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <h1 class="app-title">Pro Prompter</h1>
      </div>
      <div class="header-actions">
        <button id="settingsHeaderBtn" class="header-icon-btn" data-tooltip="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button id="feedbackHeaderBtn" class="header-icon-btn" data-tooltip="Feedback">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
        </button>
        <button id="closePanelBtn" class="header-icon-btn" data-tooltip="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab-btn active" data-tab="prompts">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span>Prompts</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Prompts Tab -->
      <div id="promptsTab" class="tab-panel active">
        <!-- Search Bar with Dynamic Inline Actions -->
        <div class="search-container">
          <div class="search-wrapper">
            <div class="search-input-wrapper">
              <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input type="text" id="searchInput" class="search-input" placeholder="Search Prompts" autocomplete="off">
            </div>
            <!-- Inline actions shown when library has prompts -->
            <div id="inlineActions" class="inline-actions" style="display: none;">
              <button id="inlineAddBtn" class="inline-action-btn" data-tooltip="Add New Prompt">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button id="inlineManageBtn" class="inline-action-btn" data-tooltip="Manage Prompts">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Full Action Buttons (shown only when empty) -->
        <div id="actionButtons" class="action-buttons empty-state-buttons">
          <button id="addPromptBtn" class="action-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Prompt</span>
          </button>
          <button id="manageBtn" class="action-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Manage Prompts</span>
          </button>
        </div>

        <!-- Tag Filter with Back Navigation -->
        <div id="tagFilter" class="tag-filter" style="display: none;">
          <button id="filterBackBtn" class="filter-back-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>All Prompts</span>
          </button>
          <span id="activeFilterChip" class="tag-filter-chip"></span>
        </div>

        <!-- Prompts List -->
        <div class="prompts-container">
          <div id="promptsList" class="prompts-list">
            <!-- Prompts will be dynamically inserted here -->
          </div>
          
          <!-- Empty State -->
          <div id="emptyState" class="empty-state" style="display: none;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <p class="empty-title">No prompts yet</p>
            <p class="empty-subtitle">Create your first prompt to get started</p>
          </div>
        </div>

        <!-- Footer with Delete All -->
        <div class="footer">
          <div class="footer-stats">
            <span id="promptCount">0 prompts</span>
          </div>
          <div class="footer-actions">
            <button id="importBtn" class="text-btn">Import</button>
            <button id="exportBtn" class="text-btn">Export All</button>
            <button id="deleteAllBtn" class="text-btn danger">Delete All</button>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div id="settingsTab" class="tab-panel">
        <div class="settings-container">
          <h2>Settings</h2>
          
          <div class="setting-group">
            <h3>Appearance</h3>
            <div class="setting-item">
              <div class="setting-info">
                <label for="darkModeToggle">Dark Mode</label>
                <p>Always enabled for premium experience</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="darkModeToggle" checked disabled>
                <span class="slider"></span>
              </label>
            </div>
          </div>
          
          <div class="setting-group">
            <h3>Panel Mode</h3>
            <div class="setting-item">
              <div class="setting-info">
                <label for="preferSidePanelToggle">Prefer Side Panel</label>
                <p>Try to open as side panel when possible</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="preferSidePanelToggle" checked>
                <span class="slider"></span>
              </label>
            </div>
          </div>
          
          <div class="setting-group">
            <h3>Slash Command</h3>
            <div class="setting-item">
              <div class="setting-info">
                <label for="slashCommandToggle">Enable // Trigger</label>
                <p>Type // to activate autocomplete in LLM chats</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="slashCommandToggle" checked>
                <span class="slider"></span>
              </label>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <label for="fuzzySearchToggle">Fuzzy Search</label>
                <p>Enable fuzzy matching in search</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="fuzzySearchToggle" checked>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Tab -->
      <div id="feedbackTab" class="tab-panel">
        <h2 class="tab-heading">Feedback</h2>
        <div class="feedback-container">
          <form id="feedbackForm" class="feedback-form">
            <div class="form-group">
              <label for="feedbackSubject">Subject</label>
              <input type="text" id="feedbackSubject" class="form-input" placeholder="Brief description of your feedback..." required>
            </div>
            
            <div class="form-group">
              <label for="feedbackBody">Your Feedback</label>
              <textarea id="feedbackBody" class="form-textarea" placeholder="Describe your feedback, bug report, or feature request in detail..." required></textarea>
            </div>
            
            <button type="submit" class="submit-btn">Submit Feedback</button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Add/Edit Prompt Modal -->
  <div id="promptModal" class="modal" style="display: none;">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle">Add New Prompt</h2>
        <button id="closeModal" class="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="promptTitle">Title</label>
          <input type="text" id="promptTitle" class="form-input" placeholder="Enter prompt title..." required>
        </div>
        
        <div class="form-group">
          <label for="promptContent">Content</label>
          <textarea id="promptContent" class="form-textarea" placeholder="Enter your prompt..." rows="6" required></textarea>
        </div>
        
        <div class="form-group">
          <label>Tags</label>
          <div class="tag-input-wrapper">
            <input type="text" id="newTagInput" class="form-input" placeholder="Type a tag name and &quot;Enter&quot;">
          </div>
          <div id="tagSelector" class="tag-selector">
            <!-- Selected tags will be displayed here -->
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button id="cancelBtn" class="action-btn secondary">Cancel</button>
        <button id="savePromptBtn" class="action-btn primary">Save Prompt</button>
      </div>
    </div>
  </div>

  <!-- Delete All Confirmation Modal -->
  <div id="deleteAllModal" class="modal" style="display: none;">
    <div class="modal-content confirmation-modal">
      <div class="modal-header">
        <h2>Confirm Delete All</h2>
        <button id="closeDeleteModal" class="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <p>Are you sure you want to delete all prompts?<br>This action cannot be undone.</p>
      </div>
      
      <div class="modal-footer">
        <button id="cancelDeleteBtn" class="action-btn secondary">Cancel</button>
        <button id="confirmDeleteBtn" class="action-btn primary danger">Delete All</button>
      </div>
    </div>
  </div>
`;

// Insert HTML into Shadow DOM
shadowRoot.innerHTML = htmlStructure;

// Append host to page
document.body.appendChild(shadowHost);

console.log('Shadow DOM: HTML structure injected');

// Phase 4: Initialize JavaScript with Shadow DOM scoping
console.log('Shadow DOM Phase 4: Initializing JavaScript...');

// Fetch the JavaScript file
fetch(chrome.runtime.getURL('popup-panel-refined.js'))
  .then(response => response.text())
  .then(jsCode => {
    console.log('Shadow DOM: JavaScript file loaded');
    
    // Create the wrapped initialization code
    const wrappedInit = `
      (function(shadowRoot) {
        // Create a proxy for document that redirects to shadowRoot
        const documentProxy = new Proxy(shadowRoot, {
          get(target, prop) {
            // Special handling for common document methods
            if (prop === 'getElementById') {
              return (id) => target.querySelector('#' + id);
            }
            if (prop === 'querySelectorAll' || prop === 'querySelector') {
              return (...args) => target[prop](...args);
            }
            if (prop === 'createElement') {
              return (...args) => document[prop](...args);
            }
            if (prop === 'addEventListener') {
              return (...args) => target[prop](...args);
            }
            if (prop === 'body') {
              return target.host.ownerDocument.body;
            }
            // For everything else, try shadowRoot first, then fall back to document
            return target[prop] !== undefined ? target[prop] : document[prop];
          }
        });
        
        // Override document in this scope
        const document = documentProxy;
        
        // Execute the original code
        ` + jsCode + `
        
        // Initialize the panel manager
        if (typeof RefinedPanelManager !== 'undefined') {
          console.log('Shadow DOM: Initializing RefinedPanelManager...');
          new RefinedPanelManager();
          console.log('✓ Shadow DOM Phase 4: Complete - All functionality active');
        } else {
          console.error('Shadow DOM: RefinedPanelManager class not found');
        }
      })(arguments[0]);
    `;
    
    // Execute the wrapped code with proper context
    try {
      const executeInContext = new Function('shadowRoot', wrappedInit);
      executeInContext(shadowRoot);
      console.log('Shadow DOM: JavaScript executed successfully');
    } catch (error) {
      console.error('Shadow DOM: Error executing JavaScript:', error);
      console.error('Error details:', error.message, error.stack);
    }
  })
  .catch(error => {
    console.error('Shadow DOM: Error loading JavaScript file:', error);
  });
