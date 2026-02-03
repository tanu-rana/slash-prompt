# PROJECT CONTEXT: Slash Prompt (Chrome Extension)

<project_metadata>
  <type>Chrome Extension (Manifest V3)</type>
  <core_function>Prompt library management + on-page prompt injection via double-slash trigger (//) and an injected right-side panel UI</core_function>
  <tech_stack>Vanilla JS, HTML, CSS, Chrome Extensions APIs (storage, scripting, contextMenus, messaging), Tippy.js (CDN), Popper.js (CDN), Lucide icons (local lucide.min.js), Google Fonts (Sora via CSS @import / remote), iframe-based injected panel overlay</tech_stack>
</project_metadata>

<architecture_map>
  <entry_point type="manifest">manifest.json</entry_point>
  <entry_point type="background">background.js (MV3 service worker)</entry_point>
  <entry_point type="content_script">content.js + content-refined.css (matches LLM sites; run_at=document_end)</entry_point>
  <entry_point type="popup">popup-panel-refined.html → popup-panel-refined.css + popup-panel-refined.js + lucide.min.js (+ Tippy/Popper from CDN)</entry_point>
  <entry_point type="options">options.html → options.css + options.js</entry_point>
  <entry_point type="page_injection">inject-panel.js (dynamically injected by background via chrome.scripting.executeScript)</entry_point>
  <entry_point type="share_page">share.html → share.js (web_accessible_resources; opened via chrome.runtime.getURL('share.html')?id=...)</entry_point>

  <data_flow>
    <flow name="Prompt storage + retrieval">
      <step>UI (popup/options/content/side panel iframe) requests data via chrome.runtime.sendMessage({action: 'getPrompts'|'getTags'|'getSettings'|...})</step>
      <step>background.js handles messages and persists data in chrome.storage.local (prompts, tags, settings, shares, pendingPrompt, pendingEditPromptId)</step>
      <step>Folders + favorites stored primarily in chrome.storage.sync (folders, favoritePromptIds, favoritePromptOrder, promptUsageStats)</step>
    </flow>

    <flow name="Injection / panel UI">
      <step>Background context menu / action click calls injectAndOpenPanel(tabId)</step>
      <step>background.js injects inject-panel.js via chrome.scripting.executeScript (restricted pages may fail → fallback to chrome.action.openPopup)</step>
      <step>inject-panel.js creates a full-screen container + backdrop and a fixed right-side wrapper containing an iframe</step>
      <step>iframe src is chrome.runtime.getURL('popup-panel-refined.html'); panel UI is isolated by iframe boundary (not Shadow DOM)</step>
      <step>Closing: popup-panel-refined.js posts window.parent.postMessage({action:'closePromptPanel'}) and also asks background.js to closeInjectedPanel (best-effort)</step>
    </flow>

    <flow name="On-page autocomplete (//)">
      <step>content.js monitors input/keydown events on TEXTAREA and contenteditable</step>
      <step>Trigger: detects lastIndexOf('//') before cursor; hides on newline, '///', or space immediately after //</step>
      <step>Renders dropdown into document.body (.prompt-autocomplete-dropdown) and positions near caret</step>
      <step>Insert: replaces the trigger segment with prompt.content; then sends incrementUseCount to background.js</step>
      <step>Edit-from-dropdown: sets chrome.storage.local.pendingEditPromptId and requests background to open popup for edit</step>
    </flow>

    <flow name="Sharing (local-storage share links)">
      <step>popup-panel-refined.js stores share metadata under chrome.storage.local.shares and returns a URL: chrome.runtime.getURL('share.html')?id=...</step>
      <step>share.js loads chrome.storage.local.shares[shareId], validates expiration, and renders read-only page with copy button</step>
      <note>There are placeholder network calls in popup-panel-refined.js to 'https://your-api.com/shares' (not production-backed).</note>
    </flow>
  </data_flow>
</architecture_map>

<critical_rules>
  <design_system>
    - Single source of truth: `DESIGN_SYSTEM.md` (Last Updated: 2025-10-08). Follow it for ALL UI work.
    - Use CSS variables from `popup-panel-refined.css` (not hardcoded colors) for the refined UI:
      - --accent-primary: #22B8CF; --accent-hover: #1DA2B8; --accent-light: #E6F7F9
      - --text-primary/secondary; --bg-primary/secondary/tertiary; --border-color
    - Typography: Sora for extension UI. Use consistent sizes/weights and standard hover/focus patterns (cyan focus ring, 150–250ms transitions).
    - Dropdown/select styling: cyan themed, custom arrow, consistent paddings (documented in `DESIGN_SYSTEM.md`).
  </design_system>

  <variable_logic>
    - Purpose: “Intelligent Variables” are placeholders inside prompt templates to create reusable prompts; the extension does NOT substitute values (the LLM/user does).
    - Default syntax: `{{VARIABLE}}`
    - Supported built-ins: `{{VARIABLE}}`, `<VARIABLE>`, `[VARIABLE]`, `__VARIABLE__`
    - Custom syntax:
      - settings.variableSyntax = 'custom'
      - settings.customStartDelimiter + settings.customEndDelimiter (1–4 chars each)
      - Example: `$$VARIABLE$$`, `##VARIABLE##`, `@{VARIABLE}@`
    - Insert-variable behavior:
      - UI inserts `${start}VARIABLE${end}` at cursor and auto-selects the word “VARIABLE” for immediate overwrite.
    - Settings persistence:
      - Stored in chrome.storage.local.settings (keys include variableSyntax, customStartDelimiter, customEndDelimiter)
  </variable_logic>

  <injection_strategy>
    - Primary strategy: inject `inject-panel.js` then render an iframe panel pointing to `popup-panel-refined.html`.
    - The injected container uses a fullscreen backdrop + fixed right-side wrapper; z-index is near max.
    - Restricted pages (chrome://, extension store, PDFs, etc.) may block injection; fallback is opening the popup UI.
  </injection_strategy>
</critical_rules>

<file_system_status>
  <active_directories>
    - icons/ (extension icons referenced by manifest)
    - scripts/ (dev utility: icon generation; not runtime)
  </active_directories>

  <legacy_debris>
    - content.css (Reason: content script CSS in manifest is content-refined.css; content.css is older)
    - popup.html / popup.js / popup.css (Reason: not referenced by manifest action; replaced by popup-panel-refined.html)
    - popup-panel.html / popup-panel.js / popup-panel.css (Reason: older popup panel variant; manifest uses refined files)
    - sidepanel.html / sidepanel.js / sidepanel.css (Reason: present as web_accessible_resources but not used by current injection path; panel injection uses iframe to popup-panel-refined.html)
    - inject-panel-shadow-test.js (Reason: test harness; not referenced by manifest)
    - test-dropdown.html, test-search.js (Reason: local tests; not referenced by manifest)
    - archive/ (Reason: documentation dump / historical logs; not linked to runtime)
    - node_modules/ (Reason: dev-only; not used in extension runtime)
    - *.md status/fix logs in repo root (Reason: documentation; not linked in runtime)
  </legacy_debris>
</file_system_status>

<known_issues>
  - Panel injection can fail on restricted pages; user must rely on popup fallback.
  - `popup-panel-refined.html` loads Tippy/Popper from CDNs (`unpkg.com`); this can be brittle/offline-hostile and may conflict with typical MV3 CSP expectations.
  - Share flow stores data in extension-local storage; `share.html` only works when opened as an extension URL (cannot access chrome.storage on normal web origins).
  - There are placeholder API calls in `popup-panel-refined.js` to `https://your-api.com/shares` (not a real backend).
  - Content script dropdown is injected into the page DOM and may be impacted by complex editors / Shadow DOM implementations depending on site.
  - `package.json` is effectively empty (no declared dev dependencies); repository includes `node_modules/` which is atypical for source control.
</known_issues>

