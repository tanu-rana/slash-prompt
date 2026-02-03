# Testing Guide for Prompt Manager Pro Extension

## 🚀 Quick Start Testing

### Step 1: Reload the Extension
1. Go to `chrome://extensions/`
2. Find "Prompt Manager Pro"
3. Click the refresh button ↻
4. The extension now includes sample prompts

### Step 2: Test the Popup
1. Click the extension icon in your toolbar
2. You should see 3 sample prompts:
   - Code Review Assistant
   - Explain Like I'm 5
   - Debug Helper

### Step 3: Test the Double-Slash Command

#### On ChatGPT:
1. Go to https://chatgpt.com
2. Click in the message input area
3. Type `//` (no space after)
4. You should see a dropdown ABOVE the input field with prompts
5. Type `//co` to filter for coding prompts
6. Press Enter or click to insert the prompt

**Note**: If the dropdown doesn't appear:
- Check the browser console (F12) for any error messages
- Look for messages starting with "Prompt Manager:"
- Make sure you're on chatgpt.com (not chat.openai.com)

### Step 4: Verify UI Improvements
✅ **Fixed Issues:**
- Footer text now visible (Delete All, Import, Export)
- Prompts container takes more space
- Empty state is more compact
- Prompt cards are sleeker (36px height)
- Proper spacing between cards (6px gap)
- Tags show below action icons on hover

### Step 5: Test Features
- **Click a prompt** → Copies to clipboard
- **Hover over a prompt** → See 2x2 action grid
- **Click a tag** → Filter by that tag
- **Settings tab** → Check configuration options
- **Feedback tab** → See feedback form

## 🔍 Troubleshooting

### If Double-Slash Not Working:

1. **Check Console for Debug Messages**
   ```
   F12 → Console tab
   Look for: "Prompt Manager: Input detected"
   ```

2. **Verify Page is Allowed**
   - Works on: chatgpt.com, claude.ai, gemini.google.com
   - Doesn't work on: chrome://, PDFs, local files

3. **Manual Test in Console**
   ```javascript
   // Run this in console to check if content script is loaded
   document.querySelectorAll('[data-prompt-manager-attached]')
   ```

4. **Clear Cache and Reload**
   - Ctrl+Shift+R on the ChatGPT page
   - Then try `//` again

### Common Issues & Solutions:

| Issue | Solution |
|-------|----------|
| No dropdown appears | Reload extension & refresh page |
| Footer text invisible | Fixed in latest update |
| Cards too bulky | Now sleek 36px height |
| No space between cards | Fixed with 6px gap |
| Empty state too large | Reduced to 200px min-height |

## 📝 Test Checklist

- [ ] Extension popup opens
- [ ] Sample prompts are visible
- [ ] Footer buttons are visible
- [ ] Clicking prompt copies to clipboard
- [ ] Hover shows action grid
- [ ] `//` triggers autocomplete on ChatGPT
- [ ] `//co` filters to coding prompts
- [ ] Settings tab works
- [ ] Feedback tab displays form

## 💡 Tips

1. **Best Sites to Test On:**
   - ChatGPT: https://chatgpt.com
   - Claude: https://claude.ai
   - Gemini: https://gemini.google.com

2. **Keyboard Shortcuts:**
   - Type `//` then any letter to search
   - Arrow keys to navigate suggestions
   - Enter to insert selected prompt
   - Escape to close dropdown

3. **Performance:**
   - Dropdown appears after 100ms delay
   - Shows max 10 prompts at once
   - Positioned above input field

## 📊 Expected Behavior

When typing `//` in ChatGPT:
1. After `//` → Shows top 10 prompts
2. After `//c` → Shows prompts matching "c"
3. After `// ` (with space) → Hides dropdown
4. Click/Enter → Inserts full prompt text

---

**Version**: 2.0.0
**Last Updated**: November 2024
