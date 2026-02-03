// Share Page JavaScript - External file to comply with CSP

console.log('=== SHARE PAGE DEBUG ===');
console.log('1. Script loaded');
console.log('2. Chrome object:', typeof chrome);
console.log('3. Chrome storage:', typeof chrome?.storage);

// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);
const shareId = urlParams.get('id');

console.log('4. Share ID from URL:', shareId);
console.log('5. Full URL:', window.location.href);

// Test storage access function
async function testStorage() {
  const result = document.getElementById('testResult');
  result.textContent = 'Testing...';
  
  try {
    console.log('Testing chrome.storage.local.get...');
    const data = await chrome.storage.local.get('shares');
    console.log('Storage test result:', data);
    
    if (data.shares) {
      const shareIds = Object.keys(data.shares);
      result.innerHTML = `✅ Storage accessible!<br>Found ${shareIds.length} shares<br>IDs: ${shareIds.join(', ')}<br>Looking for: ${shareId}`;
      
      if (data.shares[shareId]) {
        result.innerHTML += '<br>✅ This share exists!';
        // Try loading again
        setTimeout(() => loadSharedPrompt(), 1000);
      } else {
        result.innerHTML += '<br>❌ This share ID not found';
      }
    } else {
      result.textContent = '❌ No shares in storage';
    }
  } catch (error) {
    console.error('Storage test error:', error);
    result.textContent = '❌ Error: ' + error.message;
  }
}

async function loadSharedPrompt() {
  const loadingArea = document.getElementById('loadingArea');
  const contentArea = document.getElementById('contentArea');
  
  console.log('Starting to load shared prompt...');
  console.log('Share ID:', shareId);
  
  if (!shareId) {
    console.error('No share ID found');
    showError('Invalid share link - no ID provided');
    return;
  }
  
  // Add timeout fallback
  const timeoutId = setTimeout(() => {
    console.error('Loading timeout - taking too long');
    showError('Loading timed out. The share data might not exist or the extension storage is not accessible.');
  }, 5000);
  
  try {
    // Check if chrome.storage is available
    if (!chrome || !chrome.storage) {
      clearTimeout(timeoutId);
      console.error('Chrome storage API not available');
      showError('Chrome storage API is not available. Make sure this page is opened from the extension.');
      return;
    }
    
    console.log('Fetching from storage...');
    // Get shared prompts from storage
    const result = await chrome.storage.local.get('shares');
    clearTimeout(timeoutId);
    
    console.log('Storage result:', result);
    const shares = result.shares || {};
    console.log('All shares:', Object.keys(shares));
    const shareData = shares[shareId];
    
    console.log('Share data for ID:', shareData);
    
    if (!shareData) {
      showError('This prompt link is invalid or has been removed. The share ID might not exist in storage.');
      return;
    }
    
    // Check expiration
    if (Date.now() > shareData.expiresAt) {
      showExpired(shareData);
      return;
    }
    
    // Display the prompt
    console.log('Displaying prompt...');
    loadingArea.style.display = 'none';
    contentArea.style.display = 'block';
    displayPrompt(shareData);
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error loading shared prompt:', error);
    console.error('Error stack:', error.stack);
    showError('Failed to load shared prompt: ' + error.message);
  }
}

function displayPrompt(shareData) {
  const contentArea = document.getElementById('contentArea');
  
  // Set the page title
  document.title = `${shareData.title} - Prompt Manager Pro`;
  
  // Calculate time ago
  const timeAgo = getTimeAgo(shareData.createdAt);
  const expiresIn = getExpiresIn(shareData.expiresAt);
  
  // Build the content
  contentArea.innerHTML = `
    <div class="card-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="prompt-title">${escapeHtml(shareData.title)}</h1>
        </div>
        <button id="copyPromptBtn" class="btn btn-primary btn-copy-header" data-content="${escapeHtml(shareData.content).replace(/"/g, '&quot;')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy Prompt
        </button>
      </div>
    </div>
    
    <div class="card-body">
      <div class="content-section">
        <div class="section-title">Prompt Content</div>
        <div class="prompt-content">${escapeHtml(shareData.content)}</div>
      </div>
    </div>
  `;
  
  // Setup copy button event listener
  setTimeout(() => {
    const copyBtn = document.getElementById('copyPromptBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        const content = this.getAttribute('data-content');
        copyPromptToClipboard(content, this);
      });
    }
  }, 100);
}

function showExpired(shareData) {
  const loadingArea = document.getElementById('loadingArea');
  const contentArea = document.getElementById('contentArea');
  
  loadingArea.style.display = 'none';
  contentArea.style.display = 'block';
  contentArea.innerHTML = `
    <div class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h2 class="error-title">Link Expired</h2>
      <p class="error-message">
        This shared prompt "${escapeHtml(shareData.title)}" expired on ${new Date(shareData.expiresAt).toLocaleDateString()}.
        <br><br>Shared links are valid for 3 days after creation.
      </p>
    </div>
  `;
}

function showError(message) {
  const loadingArea = document.getElementById('loadingArea');
  const contentArea = document.getElementById('contentArea');
  
  loadingArea.style.display = 'none';
  contentArea.style.display = 'block';
  contentArea.innerHTML = `
    <div class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <h2 class="error-title">Unable to Load</h2>
      <p class="error-message">${escapeHtml(message)}</p>
    </div>
  `;
}

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function getExpiresIn(timestamp) {
  const seconds = Math.floor((timestamp - Date.now()) / 1000);
  
  if (seconds < 0) return 'expired';
  if (seconds < 3600) return `in ${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `in ${Math.floor(seconds / 3600)} hours`;
  return `in ${Math.floor(seconds / 86400)} days`;
}

function copyPromptToClipboard(content, btn) {
  // Decode HTML entities
  const div = document.createElement('div');
  div.innerHTML = content;
  const decodedContent = div.textContent;
  
  const textarea = document.createElement('textarea');
  textarea.value = decodedContent;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  
  // Show feedback
  const originalHtml = btn.innerHTML;
  btn.classList.add('copied');
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    Copied!
  `;
  
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = originalHtml;
  }, 2000);
}

// Load the prompt on page load
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting load process...');
  
  // Setup test button event listener
  const testBtn = document.getElementById('testStorageBtn');
  if (testBtn) {
    testBtn.addEventListener('click', testStorage);
  }
  
  // Setup "Learn more" button - TODO: Update with landing page URL when available
  const learnMoreBtn = document.getElementById('learnMoreBtn');
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Placeholder: Will be updated with landing page URL
      console.log('Learn more clicked - Landing page coming soon!');
      alert('Landing page coming soon!');
    });
  }
  
  loadSharedPrompt();
});
