// Quick fix to force modal centering
// Run this in console if modal is still fullscreen

function fixModalPosition() {
  const modal = document.getElementById('moveToFolderModal');
  if (!modal) {
    console.error('Modal not found!');
    return;
  }
  
  // Fix overlay
  modal.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(10px) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 999999 !important;
  `;
  
  // Fix inner modal
  const innerModal = modal.querySelector('.mtf-modal');
  if (innerModal) {
    innerModal.style.cssText = `
      position: relative !important;
      width: 460px !important;
      max-width: 90vw !important;
      height: 580px !important;
      max-height: 85vh !important;
      background: white !important;
      border-radius: 20px !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
      margin: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    `;
  }
  
  console.log('✅ Modal position fixed!');
}

fixModalPosition();
