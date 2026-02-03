# PROJECT CONTEXT: Pro Prompter Chrome Extension

## Executive Summary
Pro Prompter is a premium Chrome extension designed for power users of Large Language Model (LLM) interfaces. It provides an elite, top-tier user experience for managing, organizing, and quickly accessing a personal library of prompts through an innovative double-slash (`//`) command system.

## Core Philosophy
- **Premium Experience First**: Every interaction must feel premium, with smooth animations, thoughtful micro-interactions, and a cohesive design language
- **Universal Access**: Works on ALL web pages including system pages, PDFs, and new tabs through a hybrid popup/panel approach
- **Minimalist Efficiency**: Clean, distraction-free interface focusing on speed and utility
- **Professional Aesthetics**: Modern color scheme with cyan accents (#22B8CF) for interactive elements

## Architecture Overview

### Technical Stack
- **Manifest Version**: V3 (latest Chrome extension standard)
- **Primary Language**: Vanilla JavaScript (ES6+)
- **Styling**: Pure CSS with CSS Variables for theming
- **Storage**: Chrome Storage API (local)
- **Fonts**: Sora (primary UI, all text)
- **Icons**: Custom SVG icons throughout

### Design Documentation
📚 **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - Comprehensive design system documentation
- Complete color palette and CSS variables
- Typography standards and font usage
- Component patterns (dropdowns, buttons, inputs, cards, etc.)
- Spacing, layout, and animation guidelines
- Interactive states and accessibility standards
- **Always reference this when creating new UI components**

### Component Structure

```
prompt-manager-extension/
├── Core Files
│   ├── manifest.json                 # Extension configuration
│   ├── background.js                 # Service worker for storage/messaging
│   └── PROJECT_CONTEXT.md           # This documentation
│
├── Popup Interface (Refined Version)
│   ├── popup-panel-refined.html     # Main popup UI (400x600px)
│   ├── popup-panel-refined.js       # Popup logic with dynamic UI states
│   └── popup-panel-refined.css      # Premium dark theme styling
│
├── Side Panel (Optional Mode)
│   ├── inject-panel.js              # Injects side panel on regular sites
│   ├── sidepanel.html               # Side panel UI (360px width)
│   ├── sidepanel.js                 # Side panel logic
│   └── sidepanel.css               # Side panel styles
│
├── Content Scripts
│   ├── content.js                   # Double-slash command detection
│   └── content-refined.css          # Autocomplete dropdown styles
│
├── Options Page
│   ├── options.html                 # Full management interface
│   ├── options.js                   # Library management logic
│   └── options.css                  # Options page styles
│
└── Assets
    └── icons/                        # Extension icons (16x16, 48x48, 128x128)
```

## Key Features & Implementation

### 1. Double-Slash Command System (`//`)
**Location**: `content.js`
- Triggers autocomplete when user types `//` followed by at least one character
- Deactivates if space immediately follows `//`
- Shows suggestions ABOVE the input field (not below)
- Simple, clean list showing only prompt titles
- No hover effects or previews
- Responsive positioning based on viewport

**Technical Details**:
```javascript
// Trigger detection
const doubleSlashIndex = text.lastIndexOf('//', cursorPos);
// Only activate after //[character], not after "// "
if (afterDoubleSlash.startsWith(' ')) return;
```

### 2. Hybrid Popup/Panel System
**Locations**: `popup-panel-refined.*`, `sidepanel.*`, `inject-panel.js`

**Popup Mode** (Default):
- Works on ALL pages including chrome://, PDFs, new tabs
- Fixed 400x600px dimensions
- Max-height: 60vh for responsive design
- Opens instantly on extension icon click

**Side Panel Mode** (Optional):
- Only available on regular websites
- Fixed 360px width panel on right side
- Injected via iframe for isolation
- Persistent across page navigation

### 3. Dynamic UI States
**Location**: `popup-panel-refined.js`

**Empty State**:
- Shows full "New Prompt" and "Manage" buttons below search
- Friendly empty state illustration

**Populated State**:
- Compact icon buttons (+ and 🔧) inside search bar
- Tooltips on hover for clarity
- Optimized for quick access

### 4. Prompt Card Design
**Visual Hierarchy**:
- Sleek compact cards (12px padding, 8px margin)
- Title only (no content preview)
- Single row of 4 action icons on hover (Copy | Edit | Delete | Share)
- Tags ALWAYS visible with color coding (no hover required)
- Click-to-filter by tag functionality
- No tooltips on card action buttons for cleaner UX

### 5. Tab Structure
**Three Main Tabs**:
1. **Prompts**: Main library view with search/filter
2. **Settings**: Configuration options
3. **Feedback**: GitHub issue submission form

**Note**: Tags tab removed for streamlined experience

### 6. Spacing & Layout System

**Vertical Spacing**:
- Header top margin: 25px
- Header to tabs: 32px (2x base spacing)
- Tabs to content: 24px (2x base spacing)
- Between components: 16px (base spacing)
- Modal padding: 18px top, 16px sides

**Component Dimensions**:
- Popup: 400×600px fixed
- Modal width: 480px max
- Modal height: 480px fixed (for add/edit)
- Search bar: 34px height (9px padding)
- Prompt cards: Compact with 12px padding, 8px margin
- Icon buttons: 34×34px (inline actions), 32×32px (header), 28×28px (card actions)

**Border Radius**:
- Primary buttons: 10px
- Secondary buttons: 10px
- Icon buttons: 10px (inline), 8px (header), 7px (card actions)
- Search input: 10px
- Prompt cards: 10px
- Modals: 12px
- Tags: 5px

### 7. Color Palette & Design System

**Primary Colors**:
```css
:root {
  --black: #000000;              /* Primary background */
  --steel: #2A2A2A;              /* Secondary surfaces */
  --steel-light: #3A3A3A;        /* Tertiary elements */
  --platinum: #E5E5E5;           /* Primary text */
  --light-grey: #9A9A9A;         /* Secondary text */
  --white: #FFFFFF;              /* Form backgrounds, cards */
  
  /* Accent Colors */
  --accent-cyan: #22B8CF;        /* Primary interactive color */
  --accent-cyan-hover: #1DA2B8;  /* Hover state */
  --accent-cyan-light: rgba(34, 184, 207, 0.1);  /* Backgrounds */
}
```

**Typography System**:
- **Brand Name (Pro Prompter)**: Sora Bold (700), 14px
- **Tab Buttons (Prompts)**: Sora Bold (700), regular size
- **Page Headings (Settings, Feedback)**: Sora Bold (700), 14px
- **Section Headings**: Sora SemiBold (600), 14px
- **Modal Headings**: Sora Medium (500), 16px, center-aligned
- **Prompt Card Titles**: Sora Medium (500), 13px
- **Body Text**: Sora Regular (400), 13px
- **Form Inputs/Textareas**: Sora Regular (400), 13px (title), 10.4px (content)
- **Button Text**: Sora Medium (500), 12-13px
- **Tags**: Sora Medium (500), 10px

**Interactive Elements**:
- **Primary Action Buttons**: 
  - Cyan gradient (#22B8CF → #1DA2B8)
  - No border, 9px padding, 10px radius
  - Lift + scale on hover (translateY(-2px) scale(1.01))
  - Dramatic cyan glow shadow
  - Tactile press effect on active
- **Secondary Buttons**: 
  - White fill, subtle border (rgba(0,0,0,0.08))
  - 9px padding, 10px radius
  - Subtle lift on hover
- **Icon Buttons**: 
  - Transparent default
  - Cyan background on hover/active
  - Smooth scale transitions
- **Search Bar**:
  - White background, 34px height
  - Premium focus effect: lift + ambient cyan glow
  - No harsh border ring
- **Toggle Switches**: Cyan when ON, gray when OFF
- **Tab Buttons**: Subtle border, cyan gradient when active
- **Tooltips**:
  - 1-second hover delay
  - Instant disappear on mouse leave
  - 9px font, compact size
  - Disabled on card action buttons

## Data Models

### Prompt Object
```javascript
{
  id: "prompt_1234567890",
  title: "Code Review Assistant",
  content: "Please review the following code...",
  tags: ["coding", "review"],
  createdAt: 1699123456789,
  updatedAt: 1699123456789,
  useCount: 42,
  lastUsed: 1699123456789
}
```

### Settings Object
```javascript
{
  preferSidePanel: true,
  slashCommand: true,      // Enable // trigger
  fuzzySearch: true,
  darkMode: true           // Always true (premium experience)
}
```

## Key Interactions

### Search Algorithm
1. **Title Match** (highest priority)
2. **Tag Match** (medium priority)
3. **Fuzzy Match** (if enabled)
4. **Content Match** (lowest priority)

### Tag Filtering
- Click any tag to filter by that tag
- "← All Prompts" navigation appears when filtered
- Tags are user-created (no defaults)

### Import/Export
- JSON format for data portability
- Handles duplicates with user confirmation
- Preserves all metadata (usage counts, dates)

## Advanced Features

### 1. Prompt Sharing (Placeholder Implementation)
**Current**: Generates mock shareable URL
**Production**: Should integrate with backend service to:
- Generate unique public URLs
- Host minimal prompt viewing pages
- Include prominent copy button

### 2. GitHub Feedback Integration
**Current**: Console logging only
**Production**: Requires:
- GitHub Personal Access Token
- Repository configuration
- API integration for issue creation

### 3. Multi-Select Management
**Location**: `options.js`
- Checkbox selection for bulk operations
- Download selected as JSON
- Bulk delete with confirmation

## Performance Considerations

### Optimizations
1. **Debounced Search**: 100ms delay for fast response
2. **Efficient Rendering**: Only visible items rendered
3. **CSS Transitions**: Hardware-accelerated transforms
4. **Minimal Shadows**: Subtle effects for performance
5. **Efficient Storage**: Chrome local storage

### Limits
- Max 1000+ prompts supported
- Search results: Real-time filtering
- Autocomplete dropdown: Shows top 10 matches
- Modal max height: 480px fixed

## Browser Compatibility

### Supported Browsers
- ✅ Google Chrome (v88+)
- ✅ Microsoft Edge (Chromium)
- ✅ Brave Browser
- ✅ Opera (Chromium)
- ✅ Vivaldi

### Not Supported
- ❌ Firefox (requires WebExtension port)
- ❌ Safari (requires Safari Extension)
- ❌ Internet Explorer (deprecated)

## Quick Reference Guide

### Design Tokens (Copy-Paste Ready)
```css
/* Primary Accent Color */
background: linear-gradient(135deg, #22B8CF 0%, #1DA2B8 100%);
color: #FFFFFF;
box-shadow: 0 2px 4px rgba(34, 184, 207, 0.2);

/* Hover State */
background: linear-gradient(135deg, #1DA2B8 0%, #188A9A 100%);
transform: translateY(-2px);
box-shadow: 0 6px 16px rgba(34, 184, 207, 0.3);

/* Active/Selected State */
background: rgba(34, 184, 207, 0.1);
color: #22B8CF;
border-color: rgba(34, 184, 207, 0.3);

/* Typography Classes to Use */
font-family: 'Sora', sans-serif;        /* For ALL UI elements */
```

### Common Patterns
```css
/* Primary Button (Modal Actions) */
padding: 9px 16px;
background: linear-gradient(135deg, #22B8CF 0%, #1DA2B8 100%);
border: none;
border-radius: 10px;
font-family: 'Sora', sans-serif;
font-weight: 500;
box-shadow: 0 3px 8px rgba(34, 184, 207, 0.25);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Primary Button Hover */
transform: translateY(-2px) scale(1.01);
box-shadow: 0 6px 18px rgba(34, 184, 207, 0.35);

/* Secondary Button */
padding: 9px 16px;
background: #FFFFFF;
border: 1px solid rgba(0, 0, 0, 0.08);
border-radius: 10px;
font-family: 'Sora', sans-serif;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

/* Search Input */
padding: 9px 14px 9px 38px;
background: #FFFFFF;
border: 1px solid rgba(0, 0, 0, 0.06);
border-radius: 10px;
box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

/* Search Focus Effect */
border-color: rgba(34, 184, 207, 0.3);
box-shadow: 0 8px 20px rgba(34, 184, 207, 0.12), 0 3px 8px rgba(0, 0, 0, 0.08);
transform: translateY(-2px);

/* Prompt Card */
padding: 12px 14px;
margin: 0 0 8px 0;
background: #FFFFFF;
border: 1px solid rgba(0, 0, 0, 0.05);
border-radius: 10px;
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

/* Modal Heading (Always Center) */
text-align: center;
flex: 1;
margin: 0 8px;
font-family: 'Sora', sans-serif;
font-weight: 500;

/* Tooltip */
font-size: 9px;
padding: 5px 9px;
border-radius: 5px;
opacity: 0;
transition: opacity 0s 1s; /* 1s delay before showing */
/* Instant disappear on mouse leave */
```

## Development Guidelines

### Code Style
- **ES6+** JavaScript features
- **BEM** CSS methodology where applicable
- **Async/Await** for asynchronous operations
- **JSDoc** comments for complex functions

### Critical CSS Classes & Selectors

**Always Use Sora Font For ALL Elements**:
- `.app-title` (Pro Prompter brand) - Bold 700
- `.tab-btn`, `.tab-btn span` (Prompts tab button) - Bold 700
- `.tab-heading` (Settings, Feedback page headings) - Bold 700
- `.modal-header h2` (Modal titles) - Medium 500
- `.prompt-card-title` (Prompt titles) - Medium 500
- `.form-group label` (Form labels) - Medium 500
- `.form-input`, `.form-textarea` (Input fields) - Regular 400
- `.action-btn` (All buttons) - Medium 500

**Always Apply Cyan Accent To**:
- `.action-btn.primary` (Save, Update, Delete All buttons)
- `.inline-action-btn` (+ and grid icons)
- `.copy-link-btn` (Share modal copy button)
- `.tab-btn.active` (Active tab state)
- `.header-icon-btn:hover` or `.active` (Gear, flag, close icons)
- `input:checked + .slider` (Toggle switches)

**Always Center-Align**:
- All `.modal-header h2` (except confirmation modals which handle it separately)
- Share modal description text

### Testing Checklist
- [ ] Popup opens on all page types
- [ ] // command triggers correctly
- [ ] Space after // hides suggestions
- [ ] Tags filter properly and are always visible on cards
- [ ] Import/Export works with large datasets
- [ ] All buttons have cyan gradient (primary) or white fill (secondary)
- [ ] All active states show cyan highlights
- [ ] Modal headings are center-aligned
- [ ] Typography uses Sora throughout (unified font)
- [ ] Spacing is consistent (16px base, 2x between major sections)
- [ ] Search bar lifts with ambient glow on focus
- [ ] Tooltips appear after 1s delay, disappear instantly
- [ ] Card action buttons have no tooltips
- [ ] Primary buttons have lift + scale micro-interactions
- [ ] Prompt cards are compact and sleek

### Future Enhancements
1. **Cloud Sync**: Optional backup to cloud service
2. **Team Sharing**: Share prompt libraries with teams
3. **AI Enhancement**: Auto-generate prompt variations
4. **Analytics**: Usage patterns and insights
5. **Templates**: Pre-built prompt templates by category

## Security Considerations

### Permissions
- **storage**: Save prompts locally
- **activeTab**: Detect input fields
- **scripting**: Inject autocomplete
- **contextMenus**: Right-click options
- **host_permissions**: <all_urls> for universal access

### Best Practices
- No external dependencies (security)
- Content Security Policy compliance
- Sanitized user input
- Encrypted storage for sensitive data (future)

## Deployment

### Build Process
1. Ensure all icon sizes generated (16x16, 48x48, 128x128)
2. Verify manifest.json version number
3. Test on multiple browsers
4. Package as .zip for Chrome Web Store

### Version Strategy
- **Major**: Breaking changes or significant features
- **Minor**: New features, backwards compatible
- **Patch**: Bug fixes and minor improvements

## Support & Maintenance

### Known Issues
- Side panel not available on system pages (browser limitation)
- Autocomplete may not work in some Shadow DOM contexts
- Some contenteditable implementations may require specific handling

### Debug Mode
Enable via console:
```javascript
localStorage.setItem('DEBUG_MODE', 'true');
```

### Error Handling
- Graceful fallbacks for all operations
- User-friendly error messages
- Automatic recovery where possible

## Contact & Contribution

### Repository Structure
```
main
├── develop (active development)
├── feature/* (feature branches)
└── release/* (release candidates)
```

### Contribution Guidelines
1. Follow existing code style
2. Maintain dark theme consistency
3. Test on multiple page types
4. Update documentation for significant changes

---

**Last Updated**: January 2025
**Version**: 3.0.0
**Status**: Production Ready - Rebranded as Pro Prompter

## Changelog v3.0.0

### Rebranding
- Extension renamed from "Prompt Manager Pro" to "Pro Prompter"
- Updated all UI text, manifest, and documentation

### Design System Overhaul
- **New Color Scheme**: Cyan (#22B8CF) as primary accent color throughout
- **Typography Refinement**: Sora for ALL UI elements (unified font family)
- **Consistent Spacing**: 2x spacing between major sections (25px header, 32px to tabs, 24px to content)
- **Bold Headers**: All page/section/tab headings now bold (700 weight)
- **Modern Minimalist Aesthetic**: Clean, sleek components with subtle shadows

### Search Bar & Input Refinements
- **Reduced Height**: Search bar 40% thinner (9px padding)
- **Premium Focus Effect**: Elegant lift with ambient cyan glow (no harsh border ring)
- **Icon Animation**: Search icon scales and brightens on focus
- **Inline Action Buttons**: 22% smaller (34×34px), better proportions

### Prompt Cards - Sleek Modern Look
- **Compact Design**: 25% less padding (12px vs 16px)
- **Tighter Spacing**: 33% reduced margin (8px vs 12px)
- **Pure White Background**: No gradients for cleaner look
- **Subtle Shadows**: Minimal elevation (0 1px 2px)
- **Always-Visible Tags**: Tags shown by default with color coding
- **Single Row Actions**: 4 action icons in one row on hover
- **Smaller Action Buttons**: 28×28px for sleeker appearance
- **No Action Tooltips**: Removed for cleaner card hover experience

### Modal Button System - Modern & Sleek
- **Primary Buttons**: 
  - Borderless design with cyan gradient
  - Lift + scale micro-interaction (translateY(-2px) scale(1.01))
  - Dramatic cyan glow on hover
  - Tactile press effect on active
  - 9px padding for slim profile
- **Secondary Buttons**:
  - Clean white fill with subtle border
  - Soft shadows for depth
  - Hover lift animation
- **Consistent Styling**: All modals use same button system
  - Add New Prompt
  - Edit Prompt
  - Confirm Delete All
  - Share Prompt
- **Better Spacing**: 10-12px gaps, increased footer padding

### Tooltip System Enhancement
- **1-Second Hover Delay**: Prevents accidental tooltip triggers
- **Instant Disappearance**: Tooltips vanish immediately when mouse leaves
- **15% Size Reduction**: Smaller, more elegant (9px font, 5px padding)
- **Right-Align Fix**: "Manage Prompts" tooltip no longer cut off
- **Card Actions Disabled**: No tooltips on Copy/Edit/Delete/Share buttons
- **Fixed Positioning**: Always in foreground, never cut off by boundaries
- **Maximum Z-Index**: Ensures tooltips always visible

### UI Improvements
- All modal headings center-aligned for visual balance
- Primary action buttons with enhanced elevation and micro-interactions
- Active states with cyan backgrounds (tabs, icons, toggles)
- Inline action icons with cyan fill and elevation
- Improved button hierarchy with clear visual distinction
- Modal width increased to 480px for better readability
- Content textarea font reduced 20% (10.4px) for more content visibility
- Consistent 10px border radius throughout interface

### Spacing & Layout
- Header top padding: 25px (increased for breathing room)
- Header to tabs: 32px (2x base spacing)
- Tabs to search: 24px (2x base spacing)
- Component spacing: 16px base throughout
- Modal footer: 16-20px padding with 10-12px button gaps
- Prompt card gap: 8px for modern tight layout

### Component Refinements
- Close buttons: Clean, borderless with cyan hover effect
- Toggle switches: Cyan when active with smooth transitions
- Share modal text: Center-aligned, black color for readability
- Tab buttons: Sora Bold font, cyan gradient when active
- Search icon: Cyan accent with scale animation on focus
- All buttons: Smooth 0.3s cubic-bezier transitions
