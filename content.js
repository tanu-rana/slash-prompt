// Content Script for Slash Prompt
// VERSION: 3.1.0 - Action Menu surgical fix (Infinite Capture, Robust Positioning, Instant Insertion)

class PromptAutocomplete {
  constructor() {
    this.prompts = [];
    this.filteredPrompts = [];
    this.dropdown = null;
    this.activeInput = null;
    this.searchText = '';
    this.selectedIndex = 0;
    this.triggerPosition = -1;
    this.savedCursorPos = -1;
    this.init();
  }

  init() {
    this.loadPrompts();
    this.setupEventListeners();
    this.createDropdown();
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.prompts) {
        this.loadPrompts();
      }
    });
  }

  loadPrompts() {
    chrome.runtime.sendMessage({ action: 'getPrompts' }, (response) => {
      this.prompts = response || [];
    });
  }

  setupEventListeners() {
    document.addEventListener('input', this.handleInput.bind(this), true);
    document.addEventListener('keydown', this.handleKeydown.bind(this), true);
    document.addEventListener('click', (e) => {
      if (this.dropdown && this.dropdown.contains(e.target)) return;
      this.hideDropdown();
    }, true);
  }

  handleInput(event) {
    const target = event.target;
    if (target.tagName !== 'TEXTAREA' && !target.isContentEditable) return;

    this.activeInput = target;
    const text = this.getInputText(target);
    const cursorPos = this.getCursorPosition(target);
    if (text === null || cursorPos === null) return;

    const textBeforeCursor = text.substring(0, cursorPos);
    const doubleSlashIndex = textBeforeCursor.lastIndexOf('//');

    if (doubleSlashIndex !== -1) {
      const textAfterSlash = textBeforeCursor.substring(doubleSlashIndex + 2);
      const hasLineBreakAfter = textAfterSlash.includes('\n');
      const hasSpaceImmediatelyAfter = textAfterSlash.trimStart() !== textAfterSlash;

      // Hide only on: line break, space immediately after //, or /// (three+ slashes)
      if (hasLineBreakAfter) {
        this.hideDropdown();
        return;
      }
      if (doubleSlashIndex > 0 && text[doubleSlashIndex - 1] === '/') {
        this.hideDropdown();
        return;
      }
      if (hasSpaceImmediatelyAfter) {
        this.hideDropdown();
        return;
      }

      this.triggerPosition = doubleSlashIndex;
      this.savedCursorPos = cursorPos;
      this.searchText = textAfterSlash;
      this.filterPrompts();

      if (this.filteredPrompts.length === 0) {
        if (this.searchText.includes(' ')) {
          this.hideDropdown();
          return;
        }
        if (this.searchText.length > 25) {
          this.hideDropdown();
          return;
        }
      }
      this.showDropdown();
      return;
    }
    this.hideDropdown();
  }

  handleKeydown(event) {
    // Protocol 1: Only intercept Enter when menu is open AND an item is selected (can be inserted)
    const menuOpen = this.dropdown && this.dropdown.style.display !== 'none';
    const hasSelectableItem = this.filteredPrompts.length > 0 && this.selectedIndex >= 0 && this.selectedIndex < this.filteredPrompts.length;

    if (!menuOpen) return; // Let Enter pass through normally (send message)

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredPrompts.length;
        if (this.filteredPrompts.length === 0) this.selectedIndex = 0;
        this.updateSelection();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = this.filteredPrompts.length > 0
          ? (this.selectedIndex - 1 + this.filteredPrompts.length) % this.filteredPrompts.length
          : 0;
        this.updateSelection();
        break;
      case 'Enter':
      case 'Tab':
        if (hasSelectableItem) {
          event.preventDefault();
          event.stopPropagation();
          this.insertPrompt(this.filteredPrompts[this.selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.hideDropdown();
        break;
    }
  }

  filterPrompts() {
    if (!this.searchText || this.searchText.trim().length === 0) {
      this.filteredPrompts = this.prompts.slice(0, 10);
    } else {
      const search = this.searchText.toLowerCase().trim();
      this.filteredPrompts = this.prompts.filter(p => {
        const title = p.title.toLowerCase();
        if (title.startsWith(search)) return true;
        const firstWord = title.split(/\s+/)[0] || '';
        return firstWord.startsWith(search);
      }).slice(0, 10);
    }
    this.selectedIndex = 0;
  }

  showDropdown() {
    const rect = this.getCaretCoordinates();
    if (!rect) {
      this.dropdown.style.display = 'none';
      return;
    }

    this.dropdown.style.display = 'block';
    this.dropdown.style.zIndex = '2147483647'; // Protocol 3: Max Int

    const itemCount = Math.max(this.filteredPrompts.length, 1);
    const dropdownHeight = Math.min(Math.max(itemCount * 38, 35), 195);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const viewportPadding = 12;

    let top;
    if (spaceBelow >= dropdownHeight + viewportPadding) {
      top = rect.bottom + 5;
    } else if (spaceAbove >= dropdownHeight + viewportPadding) {
      top = rect.top - dropdownHeight - 5;
    } else {
      top = Math.max(viewportPadding, Math.min(rect.top - dropdownHeight - 5, window.innerHeight - dropdownHeight - viewportPadding));
    }
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - dropdownHeight - viewportPadding));

    this.dropdown.style.top = `${top}px`;
    this.dropdown.style.left = `${rect.left}px`;

    this.renderDropdownContent();
  }

  hideDropdown() {
    if (this.dropdown) {
      this.dropdown.style.display = 'none';
    }
    this.activeInput = null;
    this.searchText = '';
    this.triggerPosition = -1;
    this.savedCursorPos = -1;
  }

  renderDropdownContent() {
    this.dropdown.innerHTML = '';
    if (this.filteredPrompts.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'prompt-item prompt-item-empty';
      emptyMsg.textContent = 'No prompts found';
      this.dropdown.appendChild(emptyMsg);
      return;
    }
    this.filteredPrompts.forEach((prompt, index) => {
      const item = document.createElement('div');
      item.className = 'prompt-item';
      if (index === this.selectedIndex) {
        item.classList.add('selected');
      }
      const titleEl = document.createElement('span');
      titleEl.className = 'prompt-title';
      titleEl.textContent = prompt.title;
      item.appendChild(titleEl);

      const editBtn = document.createElement('button');
      editBtn.className = 'prompt-item-edit-btn';
      editBtn.type = 'button';
      editBtn.setAttribute('aria-label', 'Edit prompt');
      editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEditModal(prompt);
      });
      item.appendChild(editBtn);

      item.addEventListener('click', (e) => {
        if (!e.target.closest('.prompt-item-edit-btn')) {
          this.insertPrompt(prompt);
        }
      });
      this.dropdown.appendChild(item);
    });
    this.scrollSelectedIntoView();
  }

  openEditModal(prompt) {
    chrome.storage.local.set({ pendingEditPromptId: prompt.id }, () => {
      chrome.runtime.sendMessage({ action: 'openPopupForEdit' }, () => {
        if (chrome.runtime.lastError) {
          chrome.runtime.sendMessage({ action: 'openExtensionPage' });
        }
      });
    });
    this.hideDropdown();
  }

  updateSelection() {
    const items = this.dropdown.querySelectorAll('.prompt-item');
    if (items.length === 0) return;
    this.selectedIndex = Math.max(0, Math.min(this.selectedIndex, items.length - 1));
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    this.scrollSelectedIntoView();
  }

  scrollSelectedIntoView() {
    const selectedItem = this.dropdown.querySelector('.prompt-item.selected');
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }

  insertPrompt(prompt) {
    const input = this.activeInput;
    const trigger = this.triggerPosition;
    const cursorPos = this.savedCursorPos >= 0 ? this.savedCursorPos : this.getCursorPosition(input);
    if (!prompt || !input) return;

    const textToInsert = prompt.content;
    const currentText = this.getInputText(input);
    const beforeText = currentText.substring(0, trigger);
    const afterText = currentText.substring(cursorPos);
    const newText = beforeText + textToInsert + afterText;

    this.hideDropdown();

    input.focus();

    if (input.isContentEditable) {
      try {
        const selection = window.getSelection();
        const range = this.createRangeFromPosition(input, trigger, cursorPos);
        if (range) {
          selection.removeAllRanges();
          selection.addRange(range);
          input.dispatchEvent(new InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: textToInsert
          }));
          document.execCommand('insertText', false, textToInsert);
        } else {
          this.insertViaTextContent(input, newText);
        }
        input.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: false,
          inputType: 'insertText',
          data: textToInsert
        }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (err) {
        this.insertViaTextContent(input, newText);
      }
    } else {
      input.value = newText;
      const newCursorPos = (beforeText + textToInsert).length;
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    chrome.runtime.sendMessage({ action: 'incrementUseCount', id: prompt.id });
  }

  insertViaTextContent(element, newText) {
    const root = this.getContentEditableRoot(element);
    try {
      root.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(root);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertText', false, newText);
      root.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: newText }));
    } catch (e) {
      root.textContent = newText;
      root.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  getContentEditableRoot(el) {
    if (!el) return null;
    let root = el;
    while (root.parentElement && String(root.parentElement.contentEditable) === 'true') {
      root = root.parentElement;
    }
    return root.contentEditable === 'true' ? root : el;
  }

  createRangeFromPosition(element, startPos, endPos) {
    try {
      const range = document.createRange();
      let currentPos = 0;
      let startNode = null, startOffset = 0;
      let endNode = null, endOffset = 0;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        const len = node.textContent.length;
        if (!startNode && currentPos + len >= startPos) {
          startNode = node;
          startOffset = startPos - currentPos;
        }
        if (!endNode && currentPos + len >= endPos) {
          endNode = node;
          endOffset = endPos - currentPos;
          break;
        }
        currentPos += len;
      }
      if (startNode && endNode) {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return range;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  getInputText(element) {
    try {
      return element.isContentEditable ? element.textContent || '' : element.value || '';
    } catch (e) {
      return '';
    }
  }

  getCursorPosition(element) {
    try {
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        return element.selectionStart ?? 0;
      }
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return 0;
      const range = sel.getRangeAt(0);
      const pre = range.cloneRange();
      pre.selectNodeContents(element);
      pre.setEnd(range.endContainer, range.endOffset);
      return pre.toString().length;
    } catch (e) {
      return 0;
    }
  }

  // Requirement B: Robust positioning - getBoundingClientRect for contenteditable, selectionStart for textarea
  getCaretCoordinates() {
    if (!this.activeInput) return null;
    try {
      if (this.activeInput.isContentEditable) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const range = sel.getRangeAt(0);
        if (!this.activeInput.contains(range.commonAncestorContainer)) return null;
        const rects = range.getClientRects();
        if (rects.length > 0) {
          const r = rects[rects.length - 1];
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        }
        range.collapse(true);
        const single = range.getBoundingClientRect();
        if (single.width === 0 && single.height === 0) return null;
        return { left: single.left, right: single.right, top: single.top, bottom: single.bottom };
      }
      // Textarea/INPUT: compute caret pixel position via mirror div (Requirement B: robust positioning)
      const style = window.getComputedStyle(this.activeInput);
      const div = document.createElement('div');
      const props = ['fontSize', 'fontFamily', 'fontWeight', 'letterSpacing', 'lineHeight', 'padding', 'paddingLeft', 'paddingTop', 'boxSizing', 'whiteSpace', 'wordWrap'];
      props.forEach(p => { div.style[p] = style[p]; });
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      div.style.left = '-9999px';
      div.style.top = '0';
      div.style.width = this.activeInput.offsetWidth + 'px';
      div.style.whiteSpace = 'pre-wrap';
      div.style.wordWrap = 'break-word';
      div.style.overflow = 'hidden';
      const text = this.activeInput.value.substring(0, this.activeInput.selectionStart);
      div.textContent = text;
      const span = document.createElement('span');
      span.textContent = '\u200b'; // Zero-width space - marks caret without affecting layout
      div.appendChild(span);
      document.body.appendChild(div);
      const divRect = div.getBoundingClientRect();
      const spanRect = span.getBoundingClientRect();
      const inputRect = this.activeInput.getBoundingClientRect();
      document.body.removeChild(div);
      const offsetX = spanRect.left - divRect.left;
      const offsetY = spanRect.top - divRect.top;
      return {
        left: inputRect.left + offsetX,
        right: inputRect.left + offsetX + 2,
        top: inputRect.top + offsetY,
        bottom: inputRect.top + offsetY + (spanRect.height || 16)
      };
    } catch (e) {
      const r = this.activeInput.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.bottom, bottom: r.bottom + 5 };
    }
  }

  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'prompt-autocomplete-dropdown';
    this.dropdown.style.display = 'none';
    document.body.appendChild(this.dropdown);
  }
}

new PromptAutocomplete();
