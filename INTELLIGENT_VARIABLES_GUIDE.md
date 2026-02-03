# Intelligent Variables System - User Guide & Testing

## 🎯 Overview

The **Intelligent Variables System** transforms static prompts into dynamic, reusable templates by supporting flexible variable placeholders. This system recognizes multiple syntaxes and allows custom delimiters.

---

## 📋 Features

### ✅ Built-in Syntax Support
- **Curly Braces**: `{{VARIABLE}}` (Default)
- **Angle Brackets**: `<VARIABLE>`
- **Square Brackets**: `[VARIABLE]`
- **Double Underscore**: `__VARIABLE__`

### ✅ Custom Delimiters
- Define your own start/end delimiters (1-4 characters each)
- Live preview shows how variables will look
- Examples: `$$VAR$$`, `##VAR##`, `@{VAR}@`

### ✅ Smart Integration
- **Insert Variable Button**: One-click insertion with auto-selection
- **Dynamic Placeholder**: Updates based on chosen syntax
- **Persistent Settings**: Saved across sessions
- **Dual Interface**: Works in popup AND options page

---

## 🔧 Setup Instructions

### Step 1: Configure Variable Syntax

1. **Open Extension Options**:
   - Click extension icon → Click ⚙️ Settings (gear icon at bottom)
   - OR right-click extension icon → Options

2. **Navigate to Variable Settings**:
   - Scroll to "Syntax for Prompt Variables" section

3. **Choose Your Syntax**:
   
   **Option A - Use Built-in Syntax**:
   - Select from dropdown: `{{VARIABLE}}`, `<VARIABLE>`, `[VARIABLE]`, or `__VARIABLE__`
   - Setting saves automatically
   
   **Option B - Create Custom Syntax**:
   - Select "Custom..." from dropdown
   - Enter Start Delimiter (e.g., `$$`)
   - Enter End Delimiter (e.g., `$$`)
   - Watch live preview update: "Your variables will look like: **$$VARIABLE$$**"
   - Auto-saves on input

---

## 📝 Creating Prompts with Variables

### Method 1: Manual Typing

1. Click "+ Add New Prompt"
2. Notice the dynamic placeholder text shows your chosen syntax
3. Type your prompt with variables:
   ```
   Write a {{TOPIC}} article about {{SUBJECT}} 
   in {{TONE}} tone for {{AUDIENCE}}
   ```
4. Save prompt

### Method 2: Insert Variable Button

1. Click "+ Add New Prompt"
2. Type your prompt text
3. Position cursor where you want a variable
4. Click the **"+ Variable"** button (bottom-right of textarea)
5. Variable placeholder appears: `{{VARIABLE}}`
6. "VARIABLE" text is auto-selected → Type your variable name
7. Continue adding more variables as needed
8. Save prompt

---

## 🧪 Testing Checklist

### Test 1: Built-in Syntax Selection

- [ ] Open Options → Settings
- [ ] Select "Curly Braces: {{VARIABLE}}"
- [ ] Create new prompt → Verify placeholder shows `{{variables}}`
- [ ] Click "+ Variable" button → Verify `{{VARIABLE}}` inserted
- [ ] Change to "Angle Brackets: <VARIABLE>"
- [ ] Create new prompt → Verify placeholder shows `<variables>`
- [ ] Click "+ Variable" button → Verify `<VARIABLE>` inserted
- [ ] Repeat for `[VARIABLE]` and `__VARIABLE__`

### Test 2: Custom Syntax

- [ ] Open Options → Settings
- [ ] Select "Custom..."
- [ ] Enter Start Delimiter: `$$`
- [ ] Enter End Delimiter: `$$`
- [ ] Verify preview updates: "Your variables will look like: **$$VARIABLE$$**"
- [ ] Create new prompt
- [ ] Verify placeholder shows `$$variables$$`
- [ ] Click "+ Variable" button → Verify `$$VARIABLE$$` inserted
- [ ] Change delimiters to `##` and `##`
- [ ] Verify preview updates immediately
- [ ] Create new prompt → Verify `##VARIABLE##` inserted

### Test 3: Cross-Interface Consistency

- [ ] Set syntax in Options page (e.g., `<VARIABLE>`)
- [ ] Open popup panel (click extension icon)
- [ ] Click "+ Add New Prompt"
- [ ] Verify placeholder shows `<variables>`
- [ ] Click "+ Variable" button → Verify `<VARIABLE>` inserted
- [ ] Settings persist between popup and options page

### Test 4: Variable Insertion Behavior

- [ ] Create new prompt
- [ ] Type: "Explain " (with trailing space)
- [ ] Click "+ Variable" button
- [ ] Verify: "Explain {{VARIABLE}}"
- [ ] Verify: "VARIABLE" text is selected (highlighted)
- [ ] Type "CONCEPT" → Replaces "VARIABLE"
- [ ] Result: "Explain {{CONCEPT}}"

### Test 5: Settings Persistence

- [ ] Set custom syntax: `@@` and `@@`
- [ ] Create prompt with `@@VAR@@`
- [ ] Reload extension (chrome://extensions → Reload)
- [ ] Open Options → Settings
- [ ] Verify "Custom..." is selected
- [ ] Verify custom delimiters still show `@@` and `@@`
- [ ] Create new prompt → Verify `@@VARIABLE@@` still works

### Test 6: Empty/Edge Cases

- [ ] Set custom delimiter to single character: `$` and `$`
- [ ] Verify it works: `$VARIABLE$`
- [ ] Set maximum length: `$$$$` (4 chars)
- [ ] Verify it works: `$$$$VARIABLE$$$$`
- [ ] Try to set empty delimiter → Should use fallback `{{}}`

---

## 💡 Usage Examples

### Example 1: Content Generation Prompt
```
Create a {{LENGTH}} {{FORMAT}} about {{TOPIC}} for {{AUDIENCE}}.
Include {{NUMBER}} key points and use {{TONE}} tone.
```

**Variables**:
- `LENGTH`: "500-word", "2-page", "brief"
- `FORMAT`: "blog post", "email", "report"
- `TOPIC`: Any subject matter
- `AUDIENCE`: "beginners", "experts", "general public"
- `NUMBER`: "3", "5", "10"
- `TONE`: "professional", "casual", "humorous"

### Example 2: Code Review Prompt
```
Review this {{LANGUAGE}} code for:
1. {{ASPECT1}}
2. {{ASPECT2}}
3. {{ASPECT3}}

Focus on {{PRIORITY}} level issues.
```

**Variables**:
- `LANGUAGE`: "JavaScript", "Python", "Java"
- `ASPECT1/2/3`: "security", "performance", "readability"
- `PRIORITY`: "critical", "high", "all"

### Example 3: Learning Prompt
```
Explain {{CONCEPT}} as if I'm {{LEVEL}}.
Use {{STYLE}} and include {{ELEMENTS}}.
```

**Variables**:
- `CONCEPT`: Any topic to learn
- `LEVEL`: "5 years old", "a beginner", "an expert"
- `STYLE`: "analogies", "step-by-step examples", "diagrams"
- `ELEMENTS`: "code examples", "real-world scenarios", "practice exercises"

---

## 🔍 Troubleshooting

### Issue: Variable button not inserting

**Solution**:
1. Ensure cursor is in the textarea
2. Click the textarea to focus it
3. Try clicking button again

### Issue: Placeholder not updating

**Solution**:
1. Close and reopen the modal
2. Reload extension
3. Check that settings were saved (visit Options → Settings)

### Issue: Custom syntax not saving

**Solution**:
1. Ensure both Start AND End delimiters are filled
2. Check browser console for errors (F12)
3. Try a different delimiter pattern
4. Reload extension

### Issue: Settings lost after browser restart

**Solution**:
1. Verify Chrome sync is enabled
2. Check `chrome://extensions` → Extension has proper permissions
3. Settings are stored in `chrome.storage.local` (persistent)

---

## 🎨 Styling Details

### Insert Variable Button
- **Position**: Bottom-right of textarea (absolute positioned)
- **Color**: Cyan (#22B8CF / #45B7D1)
- **Hover**: Darker cyan + lift effect + shadow
- **Active**: Press-down animation
- **Size**: 
  - Options page: 12px font, larger button
  - Popup panel: 11px font, compact button

### Custom Syntax Container
- **Display**: Hidden by default, flex when "Custom..." selected
- **Preview Box**: Light gray background, cyan left border, monospace font
- **Inputs**: Side-by-side, equal width, max 4 characters

---

## 🚀 Advanced Tips

### Tip 1: Naming Conventions
Use descriptive, uppercase variable names:
- ✅ `{{TOPIC}}`, `{{USER_NAME}}`, `{{TARGET_AUDIENCE}}`
- ❌ `{{x}}`, `{{temp}}`, `{{var1}}`

### Tip 2: Optional Variables
Document optional variables in prompt:
```
Create a {{TYPE}} about {{TOPIC}}.
Optional: Include {{EXTRAS}} if specified.
```

### Tip 3: Default Values
Provide fallbacks in your instructions:
```
Write in {{TONE}} tone (default: professional).
Target length: {{LENGTH}} words (default: 500).
```

### Tip 4: Multiple Instances
Use same variable name for consistency:
```
Analyze {{COMPANY}} stock performance.
Compare {{COMPANY}} to competitors.
Predict {{COMPANY}} future growth.
```

### Tip 5: Nested Templates
Combine multiple prompts:
```
Base Prompt: "Analyze {{DATA_TYPE}}"
Enhancement: "Focus on {{ASPECT}} using {{METHOD}}"
```

---

## 📚 Technical Details

### Storage Structure
```javascript
settings: {
  variableSyntax: '{{}}' | '<>' | '[]' | '__' | 'custom',
  customStartDelimiter: string,  // Only if custom
  customEndDelimiter: string     // Only if custom
}
```

### Default Values
- **Syntax**: `'{{}}'` (Curly braces)
- **Start Delimiter**: `'{{'`
- **End Delimiter**: `'}}'`

### Recognition Pattern
Extension recognizes but does NOT process variables. The LLM (ChatGPT, Claude, etc.) handles variable substitution.

### Files Modified
- `options.html` - Settings UI + Modal button
- `options.css` - Button styling
- `options.js` - Settings logic + helpers
- `popup-panel-refined.html` - Modal button
- `popup-panel-refined.css` - Compact button styling
- `popup-panel-refined.js` - Integration + helpers
- `background.js` - Default settings initialization

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify extension permissions
3. Try reloading the extension
4. Check this guide's troubleshooting section
5. Open GitHub issue with:
   - Browser version
   - Steps to reproduce
   - Console error messages
   - Screenshots (if applicable)

---

## ✨ Future Enhancements

Potential features for future releases:
- Variable validation (warn about unused variables)
- Variable suggestions based on prompt content
- Import/export syntax presets
- Quick-switch syntax from modal
- Variable library (reusable variable definitions)
- Syntax highlighting for variables in textarea

---

**Version**: 1.0  
**Last Updated**: 2025-10-10  
**Status**: ✅ Fully Implemented & Tested
