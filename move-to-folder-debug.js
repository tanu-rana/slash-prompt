// Debug script to manually fix Move to Folder modal issues
// Run this in console to test

function fixMoveToFolderModal() {
  // 1. Check if modal exists
  const modal = document.getElementById('moveToFolderModal');
  if (!modal) {
    console.error('❌ Modal not found!');
    return;
  }
  
  console.log('✅ Modal found:', modal);
  
  // 2. Check modal structure
  const innerModal = modal.querySelector('.mtf-modal');
  const folderList = document.getElementById('mtfFolderList');
  const searchInput = modal.querySelector('.mtf-search-input');
  
  console.log('📋 Modal structure:', {
    innerModal: innerModal,
    folderList: folderList,
    searchInput: searchInput,
    folders: folderList ? folderList.querySelectorAll('.mtf-folder').length : 0
  });
  
  // 3. Test search functionality
  if (searchInput) {
    console.log('🔍 Testing search...');
    
    // Log all folders
    const folders = folderList.querySelectorAll('.mtf-folder');
    folders.forEach(folder => {
      console.log('Folder:', {
        name: folder.querySelector('.mtf-name')?.textContent,
        dataset: folder.dataset.folderName,
        display: folder.style.display
      });
    });
    
    // Simulate search
    searchInput.value = 'business';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    setTimeout(() => {
      console.log('📊 After search:');
      folders.forEach(folder => {
        if (folder.style.display !== 'none') {
          console.log('Visible folder:', folder.querySelector('.mtf-name')?.textContent);
        }
      });
    }, 200);
  }
  
  // 4. Apply centering fix
  console.log('🎨 Applying centering fix...');
  
  // Fix overlay
  modal.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(10px) !important;
    z-index: 9999999 !important;
  `;
  
  // Fix inner modal
  if (innerModal) {
    innerModal.style.cssText = `
      position: relative !important;
      width: 460px !important;
      max-width: 90vw !important;
      height: 580px !important;
      max-height: 85vh !important;
      background: white !important;
      border-radius: 20px !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
      display: flex !important;
      flex-direction: column !important;
      margin: 0 !important;
    `;
  }
  
  console.log('✅ Fixes applied!');
}

// Run the fix
fixMoveToFolderModal();
