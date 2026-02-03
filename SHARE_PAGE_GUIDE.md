# Shared Prompt Page - Display Guide

## 📄 What Gets Displayed

When someone accesses a shared prompt link, they will see:

### 1. **Page Header**
- **Title**: The actual prompt title (e.g., "Code Review Assistant")
- **Logo**: Document icon
- **Copy Button**: To copy the full prompt content

### 2. **Content Sections**

#### Tags Section (if tags exist)
```
TAGS
[coding] [review] [analysis]
```
- Color-coded tag chips
- Each tag has colored background matching the theme

#### Prompt Section
```
PROMPT
┌─────────────────────────────────┐
│                                 │
│  Full prompt content displayed  │
│  with proper line breaks and    │
│  formatting preserved            │
│                                 │
└─────────────────────────────────┘
```
- Full prompt text displayed in a styled container
- Dark background (#1A1A1A)
- Light text (#E5E5E5)
- Preserves newlines and spacing (`white-space: pre-wrap`)
- Proper line height (1.8) for readability
- Font: Sora

### 3. **Footer**
- Link to install the extension
- Branding: "Prompt Manager Pro"

## 🎨 Visual Layout

```
╔════════════════════════════════════════════╗
║ 📄 Code Review Assistant     [Copy Prompt] ║
╠════════════════════════════════════════════╣
║                                            ║
║  TAGS                                      ║
║  [coding] [review]                         ║
║                                            ║
║  PROMPT                                    ║
║  ┌──────────────────────────────────────┐ ║
║  │ You are a code review assistant.     │ ║
║  │                                      │ ║
║  │ Your tasks:                          │ ║
║  │ 1. Review code for bugs              │ ║
║  │ 2. Suggest improvements              │ ║
║  │ 3. Check best practices              │ ║
║  └──────────────────────────────────────┘ ║
║                                            ║
╠════════════════════════════════════════════╣
║  Want to manage your own prompts?          ║
║  Get Prompt Manager Pro Extension          ║
╚════════════════════════════════════════════╝
```

## 📊 Data Flow

### When User Clicks Share:
1. **Modal appears** with share link
2. **Data stored** in Chrome storage:
   ```javascript
   {
     id: "share_1234567890_abc123",
     promptId: "original-prompt-id",
     title: "Code Review Assistant",
     content: "Full prompt text...",
     tags: ["coding", "review"],
     createdAt: 1699123456789,
     expiresAt: 1699382656789  // 72 hours later
   }
   ```
3. **URL generated**: `chrome-extension://[id]/share.html?id=share_1234567890_abc123`

### When Someone Opens the Link:
1. **Parse URL** to get share ID
2. **Retrieve data** from Chrome storage
3. **Check expiration** (72 hours)
4. **Display**:
   - Title in header
   - Tags (if present)
   - Full prompt content
5. **Copy button** copies full content to clipboard

## ✅ Key Features

### Content Display
- ✅ **Title**: Prominently displayed in header (Montserrat font)
- ✅ **Full Content**: Complete prompt text visible
- ✅ **Formatting**: Line breaks and spacing preserved
- ✅ **Tags**: Color-coded chips (Sora font)
- ✅ **No Truncation**: Entire content shown (no max-height)

### User Experience
- ✅ **Copy Button**: One-click copy to clipboard
- ✅ **Visual Feedback**: Button changes to "Copied!" after click
- ✅ **Expiration Notice**: Clear message when link expires
- ✅ **Responsive**: Works on all screen sizes

### Security
- ✅ **HTML Escaping**: Prevents XSS attacks
- ✅ **Read-Only**: Cannot modify shared prompts
- ✅ **Time-Limited**: Automatically expires after 72 hours

## 🎯 Example Display

For a prompt titled **"Debug Helper"** with tags **["debug", "coding"]**:

```
═══════════════════════════════════════════════
📄 Debug Helper                    [Copy Prompt]
═══════════════════════════════════════════════

TAGS
[debug] [coding]

PROMPT
╔═══════════════════════════════════════════╗
║ You are a debugging assistant.           ║
║                                           ║
║ When I share code with you:               ║
║ 1. Identify potential bugs                ║
║ 2. Explain why they occur                 ║
║ 3. Suggest fixes                          ║
║ 4. Recommend preventive measures          ║
║                                           ║
║ Use clear explanations and examples.      ║
╚═══════════════════════════════════════════╝

───────────────────────────────────────────────
Want to manage your own prompts?
Get Prompt Manager Pro Extension
═══════════════════════════════════════════════
```

## 🧪 Testing Steps

1. **Create a test prompt** in the extension
2. **Click share icon** on the prompt
3. **Copy the link** from the modal
4. **Open link** in new tab
5. **Verify**:
   - [ ] Prompt title appears in header
   - [ ] Full prompt content is visible
   - [ ] Tags are displayed (if any)
   - [ ] Copy button works
   - [ ] Formatting is preserved

## 🔧 Technical Details

### Styling
- **Header**: Montserrat, 400 weight
- **Section Labels**: Montserrat, 600 weight, uppercase
- **Content**: Sora, 400 weight
- **Tags**: Sora, 500 weight

### Colors
- **Background**: #000000 gradient to #2A2A2A
- **Content Box**: #1A1A1A
- **Text**: #E5E5E5
- **Tags**: Theme colors (blue, teal, red, yellow)

### Accessibility
- High contrast (text on dark background)
- Clear section labels
- Readable font sizes (14px content)
- Proper line spacing (1.8)

---

**Version**: 3.1.0
**Status**: ✅ Complete - Title and content fully displayed
