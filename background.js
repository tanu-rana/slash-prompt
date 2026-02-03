// Background Service Worker for Prompt Manager Pro
// Handles storage management, messaging, and context menu operations

// Note: Clicking the extension icon injects a floating panel into the current page
// The panel floats on the right side of the viewport

// Handle extension icon click - inject floating panel
chrome.action.onClicked.addListener(async (tab) => {
  await injectAndOpenPanel(tab.id);
});

// Initialize storage with default values
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🎯 Extension installed/updated. Reason:', details.reason);
  
  // Only run default content setup on first install
  if (details.reason === 'install') {
    chrome.storage.local.get(['prompts', 'folders'], async (result) => {
      const existingPrompts = result.prompts || [];
      const existingFolders = result.folders || [];
      
      // Only add defaults if no prompts exist (true first install)
      if (existingPrompts.length === 0 && existingFolders.length === 0) {
        console.log('🎉 First install detected - setting up default content');
        
        // Create default folders
        const defaultFolders = [
          { 
            id: 'folder_prod_1', 
            name: 'Productivity', 
            parentId: null, 
            icon: 'zap', 
            color: '#22B8CF',
            order: 0,
            createdAt: Date.now() 
          },
          { 
            id: 'folder_biz_1', 
            name: 'Business', 
            parentId: null, 
            icon: 'briefcase', 
            color: '#8B5CF6',
            order: 1,
            createdAt: Date.now() + 1
          },
          { 
            id: 'folder_write_1', 
            name: 'Writing', 
            parentId: null, 
            icon: 'pen-square', 
            color: '#4ECDC4',
            order: 2,
            createdAt: Date.now() + 2
          }
        ];
        
        // Create default prompts linked to folders
        // Order: Prompt Optimizer, Business Idea Validator, Content Writer, Youtube Summarizer, Article Summarizer
        const defaultPrompts = [
          // 1. Prompt Optimizer (Productivity folder)
          {
            id: 'prompt_po_1',
            title: 'Prompt Optimizer',
            content: `# 🧬 Prompt Optimizer

**Prime Role:**  
Meta-Layer Prompt Architect + Instruction Systems Engineer + Cognitive Design Strategist  

**Mission:**  
Autonomously ingest, interpret, and reconstruct any text, instruction, or idea into a single, **self-validated, domain-aware, production-ready, LLM-agnostic optimized prompt** — delivered cleanly, without commentary, diagnostics, or metadata.

---

## CORE OPERATING LOGIC

1. **Input:** Any text, partial prompt, or idea.  

2. **Internal Process (Silent Execution):**  
   - Parse input for **intent**, **context**, **entities**, **constraints**, and **tone**.  
   - Detect and infer **missing logic**, **roles**, and **desired outcomes**.  
   - **Adaptive Domain Calibration:** Auto-detect if input is:  
     - Technical / Engineering / Code  
     - Creative / Narrative / Persuasive  
     - Educational / Instructional / Explanatory  
     - Strategic / Analytical / Business  
     Adjust phrasing, structure, reasoning depth, and tone accordingly.  
   - Apply five-layer synthesis pipeline:  
     **ROLE → OBJECTIVE → CONTEXT → TASK LOGIC → OUTPUT DESIGN.**  
   - Run **hidden self-validation loop**:  
     - Check clarity, coherence, completeness, reasoning scaffolding, and cross-model interpretability.  
     - Auto-refactor internally if deficiencies are detected.  
   - Finalize prompt with optimal phrasing, sequencing, and structural logic.  

3. **Output:**  
   - Emit **only** the optimized, ready-to-use prompt.  
   - No diagnostics, meta-notes, explanations, or summaries.  

---

## EXECUTION DIRECTIVE

> Operate fully autonomously.  
> Perform silent self-checks before delivery.  
> Produce a single clean output: the optimized prompt itself — logically complete, structurally perfect, domain-calibrated, and universally interpretable by any LLM.`,
            tags: ['productivity'],
            folderId: 'folder_prod_1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            useCount: 0
          },
          // 2. Business Idea Validator (Business folder)
          {
            id: 'prompt_biv_1',
            title: 'Business Idea Validator',
            content: 'You are a world-class business strategist, top-tier consultant, and market intelligence expert. Your mission is to analyze, validate, and score any business idea provided by the user, producing a comprehensive, actionable, consultant-grade report in Markdown (.md) format. Use elite strategic frameworks and consulting methodologies to determine whether the idea is worth pursuing. Follow these instructions: (1) Idea Comprehension & Context: Restate the business idea, identify target market, customer segments, value proposition, and industry context. Clarify the problem being solved and the proposed solution. (2) Market & Competitive Analysis: Assess market size, growth trends, adoption potential, competitors, substitutes, key differentiators, barriers to entry, regulatory constraints, and market risks. (3) Strategic Framework Application: Apply SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats), Porter\'s Five Forces (Competitive rivalry, Supplier power, Buyer power, Threat of substitutes, Threat of new entrants), Business Model Validation (Revenue streams, scalability, unit economics, defensibility), Value Proposition & Product-Market Fit, and Risk Assessment & Sensitivity Analysis. (4) Scoring & Quantitative Validation: Score the idea from 1–10 on Market Potential, Competitive Advantage, Feasibility (Operational & Technical), Financial Viability, Risk Profile (lower score = higher risk), and Strategic Fit. Compute a total weighted score for overall idea strength. (5) Financial & Operational Feasibility: Provide high-level estimated costs, revenue potential, profitability, and operational/technical challenges. (6) Overall Assessment & Recommendations: Give a clear verdict: Worth pursuing / Needs refinement / Not viable. Provide rationale, strategic improvements, or pivot options.',
            tags: ['strategy', 'business', 'ideation'],
            folderId: 'folder_biz_1',
            createdAt: Date.now() + 1,
            updatedAt: Date.now() + 1,
            useCount: 0
          },
          // 3. Content Writer (Writing folder)
          {
            id: 'prompt_cw_1',
            title: 'Content Writer',
            content: 'You are a world-class editor, content strategist, and elite communication specialist. Your mission is to take any raw, messy, or unstructured writing and transform it into a highly polished, engaging, impactful, and professional article in Markdown (.md) format, ready for publication and capable of captivating top-tier audiences. Follow these instructions: (1) Deep Comprehension & Analysis: Understand the core message, key points, arguments, and intended tone. Identify inconsistencies, unclear phrasing, weak logic, or missing connections. Determine the target audience, purpose, and desired reader impact. Detect opportunities to enhance engagement, persuasion, and shareability. (2) Elite-Level Restructuring: Organize content with a clear hierarchy: introduction, body, conclusion, and optional call-to-action. Ensure smooth transitions, logical flow, and coherent argumentation. Highlight key insights, impactful points, or actionable takeaways for maximum effect. (3) Language Optimization & Style Enhancement: Elevate vocabulary, phrasing, and tone to be professional, precise, and persuasive. Vary sentence length and structure for rhythm, flow, and reader engagement. Preserve the original voice while amplifying clarity, readability, and authority.',
            tags: ['writing', 'creative'],
            folderId: 'folder_write_1',
            createdAt: Date.now() + 2,
            updatedAt: Date.now() + 2,
            useCount: 0
          },
          // 4. Youtube Summarizer (Productivity folder)
          {
            id: 'prompt_ys_1',
            title: 'Youtube Summarizer',
            content: 'You are an elite-level knowledge synthesizer, video analyst, and strategic insight generator. Your mission is to watch or process the transcript of any YouTube video and produce a comprehensive, consultant-grade intelligence report that captures all explicit content, implicit insights, trends, and actionable implications. The output must be so thorough and high-quality that top 1% consultants, analysts, and knowledge professionals would rely on it. Instructions: (1) Full Comprehension & Extraction: Identify all main arguments, claims, supporting evidence, examples, and statistics. Capture the speaker\'s tone, emphasis, implied messages, visual examples, and contextual subtleties. Detect assumptions, contradictions, hidden patterns, and nuanced insights a normal summarizer would miss. (2) Insight Amplification & Strategic Contextualization: Translate content into actionable insights, strategic implications, or reflective lessons. Highlight opportunities, risks, trends, or counterintuitive findings.',
            tags: ['productivity', 'learning'],
            folderId: 'folder_prod_1',
            createdAt: Date.now() + 3,
            updatedAt: Date.now() + 3,
            useCount: 0
          },
          // 5. Article Summarizer (Productivity folder)
          {
            id: 'prompt_as_1',
            title: 'Article Summarizer',
            content: 'You are an elite-level knowledge synthesizer, capable of reading any article, report, or research paper and extracting all meaningful information, insights, and hidden patterns, producing a summary so thorough and actionable that even top 1% consultants, analysts, and strategists would rely on it. Instructions: (1) Read & Comprehend Fully: Identify main arguments, claims, evidence, trends, causal relationships, assumptions, contradictions, and subtle nuances. (2) Amplify Insights: Convert information into actionable insights, implications, or thought-provoking considerations. Highlight opportunities, risks, patterns, and hidden signals that a normal summarizer would miss. (3) Structured Output: Present your summary with Article Title & Source, Executive Summary (3–5 sentences), Key Points & Evidence, Deep Insights & Hidden Patterns, and Actionable Implications.',
            tags: ['productivity', 'learning'],
            folderId: 'folder_prod_1',
            createdAt: Date.now() + 4,
            updatedAt: Date.now() + 4,
            useCount: 0
          }
        ];
        
        // Set default favorites
        const defaultFavorites = ['prompt_po_1', 'prompt_biv_1', 'prompt_cw_1'];
        const defaultFavoriteOrder = ['prompt_po_1', 'prompt_biv_1', 'prompt_cw_1'];
        
        // Save prompts to local storage
        await chrome.storage.local.set({ 
          prompts: defaultPrompts
        });
        
        // Save folders and favorites to sync storage
        await chrome.storage.sync.set({ 
          folders: defaultFolders,
          favoritePromptIds: defaultFavorites,
          favoritePromptOrder: defaultFavoriteOrder
        });
        
        console.log('✅ Default content created: 3 folders, 5 prompts, 3 favorites');
      } else {
        console.log('⏭️ Skipping default content (already have data)');
      }
    });
  }
  
  // Run tag and settings initialization for all install/update scenarios
  chrome.storage.local.get(['tags', 'settings'], async (result) => {
    // Initialize or update tags
    const tags = result.tags || [];
    const requiredTags = [
      { id: 'productivity', name: 'Productivity', color: '#22B8CF' },
      { id: 'strategy', name: 'Strategy', color: '#8B5CF6' },
      { id: 'business', name: 'Business', color: '#52C41A' },
      { id: 'ideation', name: 'Ideation', color: '#F59E0B' },
      { id: 'writing', name: 'Writing', color: '#4ECDC4' },
      { id: 'creative', name: 'Creative', color: '#F7DC6F' },
      { id: 'learning', name: 'Learning', color: '#3B82F6' },
      { id: 'coding', name: 'Coding', color: '#FF6B6B' },
      { id: 'analysis', name: 'Analysis', color: '#45B7D1' },
      { id: 'research', name: 'Research', color: '#BB8FCE' }
    ];
    
    if (tags.length === 0) {
      // New user - add all default tags
      chrome.storage.local.set({ tags: requiredTags });
      console.log('✅ All default tags added');
    } else {
      // Existing user - add any missing tags
      let tagsUpdated = false;
      requiredTags.forEach(requiredTag => {
        if (!tags.some(t => t.id === requiredTag.id)) {
          tags.push(requiredTag);
          tagsUpdated = true;
        }
      });
      if (tagsUpdated) {
        chrome.storage.local.set({ tags });
        console.log('✅ Missing tags added');
      }
    }
    if (!result.settings) {
      chrome.storage.local.set({ 
        settings: {
          darkMode: true,
          fuzzySearchEnabled: true,
          autoSuggest: true,
          maxSuggestions: 10,
          variableSyntax: '{{}}',
          customStartDelimiter: '{{',
          customEndDelimiter: '}}',
          fileFormat: 'md'
        }
      });
    }
  });

  // Create context menu
  chrome.contextMenus.create({
    id: 'saveAsPrompt',
    title: 'Save as Prompt',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'openPanel',
    title: 'Open Prompt Manager',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'saveAsPrompt' && info.selectionText) {
    // Save the selected text
    await chrome.storage.local.set({ 
      pendingPrompt: {
        content: info.selectionText,
        timestamp: Date.now()
      }
    });
    
    // Inject and open panel
    await injectAndOpenPanel(tab.id);
  } else if (info.menuItemId === 'openPanel') {
    // Inject and open panel
    await injectAndOpenPanel(tab.id);
  }
});

// Helper function to inject panel script and open it
// Keeps user on current page with floating panel overlay (not a new tab)
async function injectAndOpenPanel(tabId) {
  try {
    // Try to send message first (panel may already be injected)
    await chrome.tabs.sendMessage(tabId, { action: 'openPanel' }).catch(async () => {
      // If script isn't injected, inject it first
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['inject-panel.js']
        });
        // Now send the open message
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { action: 'openPanel' });
        }, 100);
      } catch (injectError) {
        // Injection failed (e.g., chrome://, extension store, PDF) - try opening popup
        // Popup shows same UI; checkPendingPrompt will open modal with selected text
        console.warn('Panel injection failed on restricted page:', injectError);
        chrome.action.openPopup().catch(() => {
          // openPopup can fail; user can manually click extension icon to access
        });
      }
    });
  } catch (error) {
    console.error('Error opening panel:', error);
  }
}

// Handle messages from popup/iframe to close injected panel (reliable fallback for postMessage)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'closeInjectedPanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'closePanel' }).catch(() => {});
      }
      sendResponse({ success: true });
    });
    return true;
  }
  if (request.action === 'openSidePanel' && request.tabId) {
    // Try to inject and open side panel
    injectAndOpenPanel(request.tabId).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error opening side panel:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'incrementUseCount' && request.id) {
    // Increment use count for a prompt
    chrome.storage.local.get('prompts', (result) => {
      const prompts = result.prompts || [];
      const prompt = prompts.find(p => p.id === request.id);
      if (prompt) {
        prompt.useCount = (prompt.useCount || 0) + 1;
        prompt.lastUsed = Date.now();
        chrome.storage.local.set({ prompts });
      }
    });
  }
});

// Message handling for other operations
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getPrompts':
      chrome.storage.local.get('prompts', (result) => {
        sendResponse(result.prompts || []);
      });
      return true;

    case 'savePrompt':
      chrome.storage.local.get('prompts', (result) => {
        const prompts = result.prompts || [];
        const newPrompt = {
          id: generateId(),
          ...request.prompt,
          createdAt: Date.now(),
          lastUsed: null,
          useCount: 0
        };
        prompts.push(newPrompt);
        chrome.storage.local.set({ prompts }, () => {
          sendResponse({ success: true, prompt: newPrompt });
        });
      });
      return true;

    case 'updatePrompt':
      chrome.storage.local.get('prompts', (result) => {
        const prompts = result.prompts || [];
        const index = prompts.findIndex(p => p.id === request.prompt.id);
        if (index !== -1) {
          prompts[index] = { ...prompts[index], ...request.prompt, updatedAt: Date.now() };
          chrome.storage.local.set({ prompts }, () => {
            sendResponse({ success: true, prompt: prompts[index] });
          });
        } else {
          sendResponse({ success: false, error: 'Prompt not found' });
        }
      });
      return true;

    case 'deletePrompt':
      chrome.storage.local.get('prompts', (result) => {
        const prompts = result.prompts || [];
        const filtered = prompts.filter(p => p.id !== request.id);
        chrome.storage.local.set({ prompts: filtered }, () => {
          sendResponse({ success: true });
        });
      });
      return true;

    case 'incrementUseCount':
      chrome.storage.local.get('prompts', (result) => {
        const prompts = result.prompts || [];
        const prompt = prompts.find(p => p.id === request.id);
        if (prompt) {
          prompt.useCount = (prompt.useCount || 0) + 1;
          prompt.lastUsed = Date.now();
          chrome.storage.local.set({ prompts }, () => {
            sendResponse({ success: true });
          });
        }
      });
      return true;

    case 'exportPrompts':
      chrome.storage.local.get(['prompts', 'tags'], (result) => {
        const exportData = {
          version: '1.0.0',
          exportDate: new Date().toISOString(),
          prompts: result.prompts || [],
          tags: result.tags || []
        };
        sendResponse(exportData);
      });
      return true;

    case 'importPrompts':
      try {
        const importData = request.data;
        if (!importData.prompts || !Array.isArray(importData.prompts)) {
          sendResponse({ success: false, error: 'Invalid import data' });
          return;
        }

        chrome.storage.local.get(['prompts', 'tags'], (result) => {
          const existingPrompts = result.prompts || [];
          const existingTags = result.tags || [];
          
          // Handle duplicates based on user preference
          let newPrompts = importData.prompts;
          if (!request.overwrite) {
            newPrompts = importData.prompts.filter(
              imported => !existingPrompts.some(existing => existing.title === imported.title)
            );
          }

          // Merge prompts
          const mergedPrompts = request.overwrite 
            ? [...existingPrompts.filter(e => !newPrompts.some(n => n.title === e.title)), ...newPrompts]
            : [...existingPrompts, ...newPrompts];

          // Merge tags if provided
          const mergedTags = importData.tags 
            ? [...existingTags, ...importData.tags.filter(t => !existingTags.some(et => et.id === t.id))]
            : existingTags;

          chrome.storage.local.set({ 
            prompts: mergedPrompts,
            tags: mergedTags
          }, () => {
            sendResponse({ 
              success: true, 
              imported: newPrompts.length,
              total: mergedPrompts.length 
            });
          });
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'getTags':
      chrome.storage.local.get('tags', (result) => {
        sendResponse(result.tags || []);
      });
      return true;

    case 'saveTags':
      chrome.storage.local.set({ tags: request.tags }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'getSettings':
      chrome.storage.local.get('settings', (result) => {
        sendResponse(result.settings || {});
      });
      return true;

    case 'saveSettings':
      chrome.storage.local.get('settings', (result) => {
        const settings = { ...result.settings, ...request.settings };
        chrome.storage.local.set({ settings }, () => {
          sendResponse({ success: true, settings });
        });
      });
      return true;

    case 'openPopupForEdit':
      // Content script requesting to open popup for editing
      // The popup will check pendingEditPromptId in storage on load
      chrome.action.openPopup().catch(err => {
        console.log('Could not open popup programmatically:', err);
        // Fallback: open extension page in new tab
        chrome.tabs.create({ 
          url: chrome.runtime.getURL('popup-panel-refined.html') 
        });
      });
      sendResponse({ success: true });
      return true;

    case 'openExtensionPage':
      // Fallback: open extension page in new tab
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('popup-panel-refined.html') 
      });
      sendResponse({ success: true });
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Utility function to generate unique IDs
function generateId() {
  return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
