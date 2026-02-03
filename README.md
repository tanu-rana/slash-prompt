# Slash Prompt - Chrome Extension

A premium Chrome/Chromium extension for managing personal prompt libraries with double-slash (`//`) command integration in LLM chat interfaces. Features an elite UI/UX with modern cyan accent design, Sora typography, and comprehensive prompt management capabilities.

## ✨ Features

### Universal Access - Works on all LLM Sites
- **🌍 Works across major LLM providers**: ChatGPT, Claude, Gemini, Perplexity, Bing, and more
- **🪟 Hybrid Interface**: Popup (everywhere) + Injected right-side panel overlay (on regular sites)
- **🚀 Instant Access**: Click the extension icon or use keyboard shortcuts

### Core Functionality
- **📚 Prompt Library Management**: Create, edit, delete, and organize your prompts
- **🏷️ Tag System**: Categorize prompts with color-coded tags
- **🔍 Smart Search**: Fuzzy search with debouncing for instant results
- **💾 Import/Export**: JSON format for backup and sharing
- **⚡ Slash Commands**: Type `/` in any LLM chat to access prompts instantly
- **📊 Usage Tracking**: Automatically tracks frequently used prompts as JSON files
- **Fuzzy Search**: Real-time filtering with debounced search
- **Drag & Drop Reordering**: Organize prompts with intuitive drag and drop

### UI/UX Excellence
- **Premium Design**: Modern cyan accent theme (#22B8CF) with smooth animations
- **Typography**: Sora font family for ALL UI elements (unified design)
- **Consistent Styling**: Bold headings (700), center-aligned modals, gradient buttons
- **Micro-interactions**: Cyan hover states and transitions (250ms)
- **Responsive Layout**: 16px baseline grid with 2x spacing between sections
- **Interactive Elements**: Cyan gradients for primary actions, subtle borders for secondary
- **Visual Feedback**: Active states with cyan backgrounds on tabs, icons, and toggles

## 🚀 Installation & Browser Compatibility

### Supported Browsers
This extension works with all Chromium-based browsers:
- ✅ **Google Chrome** (recommended)
- ✅ **Microsoft Edge**
- ✅ **Brave Browser**
- ✅ **Opera**
- ✅ **Vivaldi**
- ❌ Firefox (requires separate WebExtension port)
- ❌ Safari (requires separate Safari Extension)
- ❌ Internet Explorer (not supported)

### Load Extension
1. Open your browser and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" button
4. Select the `prompt-manager-extension` folder
5. The extension icon will appear in your toolbar

### Generate Icon Files
The extension includes an SVG icon. To generate PNG versions:
1. Use an online converter or image editor
2. Generate the following sizes:
   - 16x16px → Save as `icons/icon16.png`
   - 48x48px → Save as `icons/icon48.png`  
   - 128x128px → Save as `icons/icon128.png`

## 📖 Usage Guide

### Basic Operations

#### Opening the Extension
1. **Click the extension icon** in your browser toolbar
2. **Popup opens immediately** on any page (including chrome://, PDFs, new tabs)
3. **On regular websites**: the extension can inject a fixed right-side panel overlay (iframe) with the same UI

#### Interface Modes
- **Popup Mode** (Default): Refined popup panel (≈400×600px), works everywhere
- **Injected Panel Mode**: Fixed overlay panel on the right side (regular sites only), using the same refined UI inside an iframe

#### Adding Prompts
1. Click "New Prompt" button
2. Enter title, content, and select tags
3. Click "Save Prompt"

#### Using Slash Commands
1. Navigate to any supported LLM chat (ChatGPT, Claude, Gemini, etc.)
2. Type `//` in the chat input (double-slash)
3. Autocomplete dropdown appears with your prompts (above the input, not below)
4. Use arrow keys or mouse to select
5. Press Enter/Tab to insert

#### Managing Library
1. Right-click extension icon → "Options"
2. Access full library management interface
3. Features available:
   - Grid/List view toggle
   - Bulk selection and deletion
   - Drag to reorder
   - Per-prompt actions (copy, download, edit, delete)

### Keyboard Shortcuts
- **`//`**: Trigger autocomplete in chat (on supported LLM sites)
- **Esc**: Close modals or popup
- **Arrow keys**: Navigate autocomplete suggestions
- **Enter/Tab**: Insert selected prompt
- **Click prompt card**: Copy to clipboard (paste anywhere)

### Working with Different Page Types

#### On Regular Websites
- Full functionality available
- Can use popup OR side panel mode
- Slash commands work in LLM chat interfaces
- Direct prompt insertion possible

#### On Restricted Pages (chrome://, PDFs, etc.)
- Popup mode only (side panel not available)
- Copy prompts to clipboard
- Paste manually into your target application
- All management features still work

### Import/Export

#### Import Prompts
1. Click Import button at the bottom
2. Select JSON file
3. Choose to overwrite duplicates or skip
4. Confirm import

#### Export Library
1. Click Export button at the bottom
2. Entire library downloads as JSON
3. Includes prompts, tags, and export date

## 🏗️ Architecture

### Project Structure (Current)
```
prompt-manager-extension/
├── manifest.json                # Extension configuration (MV3)
├── background.js                # Service worker: storage, messaging, context menus, panel injection
├── content.js                   # Double-slash (//) detection & autocomplete behavior
├── content-refined.css          # Refined autocomplete dropdown styles
├── inject-panel.js              # Injects right-side iframe panel into pages
├── popup-panel-refined.html     # Main popup / panel UI
├── popup-panel-refined.js       # Popup/panel logic, folders, favorites, sharing, settings
├── popup-panel-refined.css      # Refined design system styles for popup/panel
├── options.html                 # Full management/options page
├── options.js                   # Library management, tags, settings, import/export
├── options.css                  # Options page styles
├── share.html                   # Read-only shared prompt page
├── share.js                     # Loads shared prompt data and renders share page
├── default-prompts.js           # Default prompt library (used on first install in some flows)
├── icons/                       # Extension icons
├── scripts/
│   └── generate-icons.js        # Dev utility to generate icons
└── example-prompts.json         # Sample prompt library
```

### Components

#### Background Service Worker
- Manages Chrome storage API
- Handles message passing between components
- Context menu integration
- Import/export operations
- Toggles side panel on extension icon click

#### Injected Panel
- Fixed position on right side of screen (iframe overlay injected into page)
- Full-height interface that reuses the same refined popup UI
- Tabbed interface (Prompts, Favorites, Folders, Settings, Feedback)
- Minimize/restore functionality
- Responsive to different screen sizes

#### Content Scripts
- **content.js**: Monitors chat inputs for `//` trigger
- Renders the refined autocomplete dropdown (`.prompt-autocomplete-dropdown`)
- Handles prompt insertion into textareas and contenteditable fields
- Tracks usage statistics via background messaging

#### Options Page
- Full library management
- Tag management
- Settings configuration
- Bulk operations

### Data Model

#### Prompt Object
```json
{
  "id": "unique_identifier",
  "title": "Prompt Title",
  "content": "Full prompt text...",
  "tags": ["tag1", "tag2"],
  "createdAt": 1234567890,
  "lastUsed": 1234567890,
  "useCount": 5
}
```

#### Tag Object
```json
{
  "id": "tag_id",
  "name": "Display Name",
  "color": "#45B7D1"
}
```

## 🎨 Design System

### Color Palette

#### Dark Mode
- Background: `#000000`
- Secondary: `#0a0a0a`
- Tertiary: `#141414`
- Steel: `#43464B`
- Light Gray: `#F5F5F5`

#### Accent Colors
- Primary: `#45B7D1`
- Secondary: `#4ECDC4`
- Danger: `#FF6B6B`
- Warning: `#F7DC6F`
- Success: `#52C41A`
- Purple: `#BB8FCE`

### Typography
- **Headings**: Montserrat (500-600 weight)
- **Body**: Sora (300-400 weight)
- **No bold**: Context-aware colors for emphasis

### Effects
- **Glassmorphism**: `backdrop-filter: blur(20px)`
- **Shadows**: Multi-layer for depth
- **Transitions**: 150-250ms ease-out
- **Animations**: Subtle scale and translate

## 🔧 Configuration

### Settings Available
- **Dark Mode**: Toggle between themes
- **Fuzzy Search**: Enable/disable fuzzy matching
- **Auto-Suggest**: Automatic dropdown on "/"
- **Max Suggestions**: Limit dropdown items (5-20)

### Storage Limits
- Chrome sync storage: 100KB total
- Local storage: 5MB recommended max
- Optimized for 1000+ prompts

## 🔐 Permissions

The extension requires:
- `storage`: Save prompts locally
- `activeTab`: Inject content script
- `scripting`: Dynamic script injection
- `contextMenus`: Right-click menu

## 🚧 Future Enhancements

- Cloud sync across devices
- Team sharing capabilities
- AI-powered prompt suggestions
- Advanced syntax (`:tag`, `#category`, `@user`)
- Prompt templates and variables
- Analytics dashboard
- Backup scheduling

## 🐛 Troubleshooting

### Extension Not Working
1. Check if site is in supported list
2. Refresh the page after installation
3. Ensure developer mode is enabled

### Slash Command Not Triggering
1. Click in chat input first
2. Check if content script loaded (DevTools)
3. Try reloading extension

### Import Failing
1. Verify JSON format matches schema
2. Check file size (<5MB recommended)
3. Ensure valid UTF-8 encoding


## 📞 Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check existing issues first
- Provide reproduction steps

