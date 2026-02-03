// Content script to inject the side panel into the page

console.log('Prompt Manager: inject-panel.js loaded');

class PanelInjector {
  constructor() {
    this.panelFrame = null;
    this.panelWrapper = null;
    this.panelContainer = null;
    this.panelBackdrop = null;
    this.isMinimized = false;
    console.log('PanelInjector initialized');
    this.init();
  }

  init() {
    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Message received:', request);
      
      if (request.action === 'ping') {
        sendResponse({ success: true, message: 'Panel injector is active' });
      } else if (request.action === 'togglePanel') {
        this.togglePanel();
        sendResponse({ success: true });
      } else if (request.action === 'openPanel') {
        this.showPanel();
        sendResponse({ success: true });
      } else if (request.action === 'closePanel') {
        this.removePanel();
        sendResponse({ success: true });
      }
      
      return true; // Keep message channel open for async response
    });

    // Listen for messages from the iframe (postMessage)
    window.addEventListener('message', (event) => {
      if (event.data && event.data.action === 'closePromptPanel') {
        this.removePanel();
      } else if (event.data && event.data.action === 'minimizePromptPanel') {
        this.minimizePanel();
      }
    });
  }

  togglePanel() {
    console.log('Toggle panel called. Current state:', {
      hasContainer: !!this.panelContainer,
      isMinimized: this.isMinimized
    });
    
    if (this.panelContainer) {
      if (this.isMinimized) {
        this.restorePanel();
      } else {
        this.removePanel();
      }
    } else {
      this.createPanel();
    }
  }

  showPanel() {
    if (!this.panelContainer) {
      this.createPanel();
    } else if (this.isMinimized) {
      this.restorePanel();
    }
  }

  createPanel() {
    console.log('Creating panel...');
    
    try {
      const PANEL_WIDTH = 420;
      
      // Create full-screen container for backdrop + panel
      this.panelContainer = document.createElement('div');
      this.panelContainer.id = 'prompt-manager-panel-container';
      this.panelContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2147483646;
        pointer-events: auto;
      `;

      // Create backdrop - click outside to close
      this.panelBackdrop = document.createElement('div');
      this.panelBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.15);
        cursor: pointer;
        z-index: 2147483646;
      `;
      this.panelBackdrop.addEventListener('click', () => this.removePanel());

      // Create wrapper - right-side panel (not full page)
      this.panelWrapper = document.createElement('div');
      this.panelWrapper.id = 'prompt-manager-panel-wrapper';
      this.panelWrapper.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: ${PANEL_WIDTH}px;
        max-width: min(${PANEL_WIDTH}px, 90vw);
        height: 100vh;
        z-index: 2147483647;
        pointer-events: auto;
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 1;
        box-shadow: -4px 0 24px rgba(0,0,0,0.15);
        background: #fff;
      `;

      // Create iframe - fills the right-side panel only
      this.panelFrame = document.createElement('iframe');
      this.panelFrame.id = 'prompt-manager-panel';
      const panelUrl = chrome.runtime.getURL('popup-panel-refined.html');
      console.log('Panel URL:', panelUrl);
      this.panelFrame.src = panelUrl;
      this.panelFrame.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        background: #fff;
        pointer-events: auto;
      `;
      
      // Add error handling for iframe
      this.panelFrame.onerror = (error) => {
        console.error('Error loading iframe:', error);
      };
      
      this.panelFrame.onload = () => {
        console.log('Panel iframe loaded successfully');
      };

      // Append iframe to wrapper
      this.panelWrapper.appendChild(this.panelFrame);

      // Append backdrop and wrapper to container, then container to body
      this.panelContainer.appendChild(this.panelBackdrop);
      this.panelContainer.appendChild(this.panelWrapper);
      document.body.appendChild(this.panelContainer);
      console.log('Panel added to page');
      
    } catch (error) {
      console.error('Error creating panel:', error);
    }
  }

  minimizePanel() {
    if (!this.panelWrapper) return;
    
    this.isMinimized = true;
    this.panelWrapper.style.opacity = '0';
    setTimeout(() => {
      if (this.panelWrapper) {
        this.panelWrapper.style.display = 'none';
      }
    }, 300);
  }

  restorePanel() {
    if (!this.panelWrapper) {
      this.createPanel();
      return;
    }
    
    this.isMinimized = false;
    this.panelContainer.style.display = '';
    setTimeout(() => {
      if (this.panelContainer) {
        this.panelContainer.style.opacity = '1';
      }
    }, 10);
  }

  removePanel() {
    if (this.panelContainer) {
      this.panelContainer.remove();
      this.panelContainer = null;
      this.panelBackdrop = null;
      this.panelWrapper = null;
      this.panelFrame = null;
    }
    
    this.isMinimized = false;
  }
}

// Initialize panel injector
const panelInjector = new PanelInjector();
