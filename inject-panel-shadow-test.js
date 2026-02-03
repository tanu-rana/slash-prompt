// Phase 2: Shadow DOM Test - Simple "Hello World" Test
// This is a TEST FILE to verify Shadow DOM injection works

console.log('Shadow DOM Test: Script loaded');

// Create host element
const shadowHost = document.createElement('div');
shadowHost.id = 'prompt-manager-shadow-host';
shadowHost.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 360px;
  z-index: 2147483647;
`;

// Attach Shadow DOM
const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

// Simple test content
shadowRoot.innerHTML = `
  <style>
    .test-container {
      background: white;
      border: 2px solid #22B8CF;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: Arial, sans-serif;
    }
    h1 {
      margin: 0 0 10px 0;
      color: #22B8CF;
      font-size: 18px;
    }
    p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  </style>
  <div class="test-container">
    <h1>✅ Hello World!</h1>
    <p>Shadow DOM is working!</p>
    <p style="margin-top: 10px; font-size: 12px;">Phase 2 Test Successful</p>
  </div>
`;

// Append to page
document.body.appendChild(shadowHost);

console.log('Shadow DOM Test: Element injected successfully');
