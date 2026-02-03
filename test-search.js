// Quick test script to debug search in Move to Folder modal
// Paste this in the console when the modal is open

function testSearch() {
  const modal = document.getElementById('moveToFolderModal');
  if (!modal) {
    console.error('Modal not found! Open the Move to Folder modal first.');
    return;
  }
  
  const searchInput = modal.querySelector('.mtf-search-input');
  const folders = modal.querySelectorAll('.mtf-folder');
  
  console.log('=== FOLDER DEBUG INFO ===');
  console.log('Total folders:', folders.length);
  
  folders.forEach((folder, index) => {
    const name = folder.querySelector('.mtf-name')?.textContent;
    const dataset = folder.dataset.folderName;
    console.log(`Folder ${index + 1}:`, {
      name: name,
      dataset: dataset,
      visible: folder.style.display !== 'none'
    });
  });
  
  console.log('\n=== TESTING SEARCH ===');
  
  // Test search for "business"
  console.log('Testing search for "business"...');
  searchInput.value = 'business';
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    const visibleFolders = Array.from(folders).filter(f => f.style.display !== 'none');
    console.log('Visible folders after searching "business":', visibleFolders.length);
    visibleFolders.forEach(f => {
      console.log('- ' + f.querySelector('.mtf-name')?.textContent);
    });
    
    // Clear search
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  }, 100);
}

// Run the test
testSearch();
