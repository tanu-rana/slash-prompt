# 🎨 Pro Prompter Design System

**Version:** 1.0  
**Last Updated:** 2025-10-08  
**Purpose:** Comprehensive design system for all UI components in Pro Prompter Chrome Extension

---

## 📋 Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Component Patterns](#component-patterns)
4. [Spacing & Layout](#spacing--layout)
5. [Animations & Transitions](#animations--transitions)
6. [Interactive States](#interactive-states)
7. [Icons & SVGs](#icons--svgs)
8. [Accessibility](#accessibility)

---

## 🎨 Color Palette

### CSS Variables
All colors are defined in `:root` of `popup-panel-refined.css`:

```css
:root {
  /* Base Colors */
  --white: #FFFFFF;
  --light-bg: #F8F9FA;
  --light-gray: #E9ECEF;
  --border-gray: #DEE2E6;
  --text-dark: #212529;
  --text-gray: #6C757D;
  --text-light: #ADB5BD;
  
  /* Semantic Colors */
  --bg-primary: var(--white);           /* Main backgrounds */
  --bg-secondary: var(--light-bg);      /* Secondary surfaces */
  --bg-tertiary: var(--light-gray);     /* Tertiary surfaces */
  --text-primary: var(--text-dark);     /* Primary text */
  --text-secondary: var(--text-gray);   /* Secondary text */
  --border-color: var(--border-gray);   /* Borders */
  
  /* Accent Colors */
  --accent-primary: #22B8CF;            /* Primary cyan accent */
  --accent-hover: #1DA2B8;              /* Hover state cyan */
  --accent-light: #E6F7F9;              /* Light cyan background */
  --accent-success: #28A745;            /* Success green */
  --accent-danger: #DC3545;             /* Danger red */
  --accent-warning: #FFC107;            /* Warning yellow */
}
```

### Color Usage Guidelines

| Use Case | Variable | Hex | Example |
|----------|----------|-----|---------|
| **Primary Actions** | `--accent-primary` | #22B8CF | Buttons, links, active states |
| **Hover States** | `--accent-hover` | #1DA2B8 | Button hovers, link hovers |
| **Light Backgrounds** | `--accent-light` | #E6F7F9 | Hover backgrounds, subtle highlights |
| **Primary Text** | `--text-primary` | #212529 | Headings, body text, labels |
| **Secondary Text** | `--text-secondary` | #6C757D | Descriptions, hints, placeholders |
| **Borders** | `--border-color` | #DEE2E6 | Dividers, card borders, input borders |
| **Success** | `--accent-success` | #28A745 | Success messages, checkmarks |
| **Danger** | `--accent-danger` | #DC3545 | Delete buttons, error messages |

### Tag Color System

Dynamic tag colors are generated using a hash-based algorithm:

```javascript
getTagColor(tag) {
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const hue = hash % 360;
  return {
    bg: `hsla(${hue}, 65%, 92%, 1)`,
    text: `hsla(${hue}, 60%, 35%, 1)`
  };
}
```

**Result:** Each tag gets a unique, consistent color based on its name.

---

## 📝 Typography

### Font Family

**Primary Font:** [Sora](https://fonts.google.com/specimen/Sora) (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

body {
  font-family: 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| **Light** | 300 | Large display text, subtle emphasis |
| **Regular** | 400 | Body text, descriptions |
| **Medium** | 500 | Labels, button text, dropdown text |
| **Semibold** | 600 | Headings, emphasized text, titles |

### Font Sizes

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| **Display Title** | 16px | 600 | Page titles (e.g., "Settings") |
| **Section Heading** | 14px | 600 | Section headers (e.g., "Slash Command") |
| **Card Title** | 13px | 500 | Prompt card titles |
| **Body Text** | 13px | 400 | Default text, descriptions |
| **Button Text** | 12px | 500 | All buttons, dropdowns |
| **Small Text** | 11px | 400 | Labels, hints, meta info |
| **Micro Text** | 10px | 400 | Timestamps, badges |

### Typography Rules

1. ✅ **Always use Sora** - No fallback to system fonts in primary UI
2. ✅ **Consistent weights** - Use predefined weights only
3. ✅ **Line height** - Default `1.5` for readability
4. ✅ **Letter spacing** - `-0.01em` for titles, `0` for body
5. ❌ **No italic** - Use weight for emphasis instead
6. ❌ **No all caps** - Use sentence case or title case

---

## 🧩 Component Patterns

### 1. Dropdown / Select Components

**Standard Cyan Theme Dropdown** - Use this for ALL dropdown/select elements:

```css
.dropdown-name {
  /* Sizing */
  min-width: 140px;
  padding: 8px 28px 8px 12px;
  
  /* Colors */
  background: var(--white);
  border: 1.5px solid var(--accent-primary);
  color: var(--accent-primary);
  
  /* Typography */
  font-size: 12px;
  font-family: 'Sora', sans-serif;
  font-weight: 500;
  
  /* Styling */
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  /* Remove default styling */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  
  /* Cyan dropdown arrow */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2322B8CF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
}

/* Hover State */
.dropdown-name:hover {
  border-color: var(--accent-primary);
  background-color: var(--accent-light);
}

/* Focus State */
.dropdown-name:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(34, 184, 207, 0.1);
  outline: none;
}

/* Options */
.dropdown-name option {
  background: var(--white);
  color: var(--text-primary);
  padding: 8px;
  font-family: 'Sora', sans-serif;
}

/* Selected/Hovered Options */
.dropdown-name option:checked,
.dropdown-name option:hover {
  background: var(--accent-primary) !important;
  color: var(--white) !important;
}

.dropdown-name option:focus {
  background: var(--accent-primary) !important;
  color: var(--white) !important;
}
```

**Examples in codebase:**
- `.sort-dropdown` (Favorites tab)
- `.format-select` (Settings tab)

**Rules:**
- ✅ Always use 1.5px cyan border
- ✅ Always use cyan dropdown arrow SVG
- ✅ Always use cyan for selected options
- ✅ Font size: 12px, weight: 500
- ✅ Padding: 8px vertical, 12px left, 28px right (for arrow space)
- ❌ Never use default browser select styling

---

### 2. Buttons

#### Primary Action Button

```css
.primary-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #22B8CF 0%, #1DA2B8 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Sora', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(34, 184, 207, 0.2);
}

.primary-btn:hover {
  background: linear-gradient(135deg, #1DA2B8 0%, #188A9A 100%);
  transform: scale(1.02);
  box-shadow: 0 4px 10px rgba(34, 184, 207, 0.3);
}
```

#### Secondary/Text Button

```css
.text-btn {
  padding: 6px 12px;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Sora', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.text-btn:hover {
  background: var(--accent-light);
  color: var(--accent-primary);
}
```

#### Icon Button (Action Buttons)

```css
.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: linear-gradient(135deg, #22B8CF 0%, #1DA2B8 100%);
  color: #FFFFFF;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  box-shadow: 0 2px 4px rgba(34, 184, 207, 0.2);
}

.icon-btn:hover {
  background: linear-gradient(135deg, #1DA2B8 0%, #188A9A 100%);
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(34, 184, 207, 0.3);
}
```

---

### 3. Input Fields

```css
.input-field {
  padding: 10px 12px;
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  font-family: 'Sora', sans-serif;
  font-weight: 400;
  transition: all 0.2s ease;
}

.input-field:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(34, 184, 207, 0.1);
  outline: none;
}

.input-field::placeholder {
  color: var(--text-light);
}
```

---

### 4. Cards

```css
.card {
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(34, 184, 207, 0.1);
}
```

---

### 5. Toggle Switches

```css
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: 0.3s;
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--accent-primary);
}

input:checked + .slider:before {
  transform: translateX(18px);
}
```

---

### 6. Tags/Chips

```css
.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  font-family: 'Sora', sans-serif;
  transition: all 0.2s ease;
  cursor: pointer;
  /* Background and color set dynamically via JS */
}

.tag-chip:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}
```

---

### 7. Empty States

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-state svg {
  color: var(--accent-primary);
  margin-bottom: 16px;
  opacity: 0.3;
  width: 48px;
  height: 48px;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-family: 'Sora', sans-serif;
}

.empty-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.7;
  font-family: 'Sora', sans-serif;
}
```

---

### 8. Modals

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--white);
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}
```

---

## 📏 Spacing & Layout

### Spacing Scale

Use consistent spacing multiples of 4px:

```css
--spacing-xs: 4px;    /* Tight spacing */
--spacing-sm: 8px;    /* Small spacing */
--spacing-md: 12px;   /* Medium spacing */
--spacing-lg: 16px;   /* Large spacing */
--spacing-xl: 20px;   /* Extra large */
--spacing-2xl: 24px;  /* 2X large */
```

### Component Dimensions

```css
--header-height: 52px;
--tabs-height: 40px;
--footer-height: 48px;
--popup-width: 400px;
--popup-height: 600px;
--sidepanel-width: 360px;
```

### Padding Standards

| Component | Padding |
|-----------|---------|
| **Cards** | 12px |
| **Buttons** | 8px 16px |
| **Input Fields** | 10px 12px |
| **Modals** | 24px |
| **Tab Panels** | 16px |

### Gap Standards

| Context | Gap |
|---------|-----|
| **Button Groups** | 8px |
| **Form Fields** | 12px |
| **Card Grid** | 12px |
| **Tags** | 4px |

---

## ⚡ Animations & Transitions

### Standard Transition

```css
transition: all 0.2s ease;
```

**Use for:** Colors, backgrounds, opacity, small transforms

### Smooth Transition

```css
transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

**Use for:** Buttons, cards, important interactions

### Fast Transition

```css
transition: all 0.15s ease;
```

**Use for:** Hover effects, tooltips, micro-interactions

### Transition Rules

1. ✅ **Always define transitions** - No abrupt changes
2. ✅ **Use ease or cubic-bezier** - Smooth, natural motion
3. ✅ **Keep durations short** - 150ms-250ms range
4. ❌ **No linear timing** - Feels robotic
5. ❌ **No long animations** - >500ms is too slow

### Transform Standards

```css
/* Hover lift */
transform: translateY(-2px);

/* Button press */
transform: scale(1.02);

/* Icon button hover */
transform: scale(1.05);

/* Disabled state */
transform: none;
opacity: 0.5;
```

---

## 🎯 Interactive States

### Hover States

| Element | Hover Effect |
|---------|-------------|
| **Buttons** | Darker gradient + scale(1.02) + shadow |
| **Cards** | Cyan border + subtle shadow |
| **Links** | Cyan color + underline |
| **Dropdowns** | Light cyan background |
| **Tags** | Opacity 0.8 + translateY(-1px) |

### Focus States

```css
:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(34, 184, 207, 0.1);
}
```

**Accessibility:** Always visible focus ring with cyan accent.

### Active States

```css
:active {
  transform: scale(0.98);
}
```

### Disabled States

```css
:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

## 🎨 Icons & SVGs

### Icon Sizing

| Size | Dimensions | Usage |
|------|------------|-------|
| **Small** | 12px × 12px | Action buttons, inline icons |
| **Medium** | 14px × 14px | Dropdowns, form icons |
| **Large** | 16px × 16px | Header icons, navigation |
| **XLarge** | 24px × 24px | Feature icons |
| **Display** | 48px × 48px | Empty states, splash |

### Icon Color Standards

```css
/* Default icon color */
stroke: currentColor;
fill: none;

/* Primary action */
stroke: var(--accent-primary);

/* Success state */
stroke: var(--accent-success);

/* Danger state */
stroke: var(--accent-danger);

/* Favorited heart */
fill: var(--accent-primary);
stroke: var(--accent-primary);

/* Unfavorited heart */
fill: none;
stroke: white;
```

### SVG Stroke Width

- **UI Icons**: `stroke-width="2"`
- **Emphasis Icons**: `stroke-width="2.5"`

### Icon Standards

1. ✅ Use Lucide icon style (outline, rounded)
2. ✅ Consistent stroke width
3. ✅ 24×24 viewBox for all icons
4. ✅ Semantic color usage
5. ❌ No filled icons (except heart when favorited)

---

## ♿ Accessibility

### Color Contrast

- **Text on white:** Minimum 4.5:1 contrast
- **Primary text:** `#212529` (passes AAA)
- **Secondary text:** `#6C757D` (passes AA)
- **Cyan on white:** `#22B8CF` (passes AA for UI)

### Keyboard Navigation

1. ✅ All interactive elements focusable
2. ✅ Visible focus rings (cyan)
3. ✅ Tab order follows visual order
4. ✅ Escape key closes modals
5. ✅ Enter activates buttons

### Screen Readers

```html
<!-- Good -->
<button aria-label="Delete prompt">🗑️</button>
<input aria-label="Search prompts" placeholder="Search...">

<!-- Use semantic HTML -->
<button> over <div role="button">
<label> for all form fields
```

---

## 📋 Implementation Checklist

When creating a new component:

- [ ] Uses Sora font family
- [ ] Uses CSS variables for colors
- [ ] Follows spacing standards (multiples of 4px)
- [ ] Has proper hover states
- [ ] Has visible focus states
- [ ] Includes smooth transitions (0.2s ease)
- [ ] Uses semantic HTML
- [ ] Accessible keyboard navigation
- [ ] Matches existing component patterns
- [ ] Follows dropdown pattern (if applicable)
- [ ] Uses consistent icon sizing
- [ ] Cyan accent color for interactive elements

---

## 🔄 Updates & Maintenance

**Updating this document:**
- Add new patterns as they're created
- Document any deviations from standards
- Include code examples for all patterns
- Update version number and date

**Enforcing standards:**
- Review all new components against this guide
- Refactor inconsistent components
- Use CSS variables exclusively (no hardcoded colors)

---

## 📚 Quick Reference

### Most Common Patterns

**Dropdown:**
```css
border: 1.5px solid var(--accent-primary);
color: var(--accent-primary);
font-size: 12px;
font-weight: 500;
padding: 8px 28px 8px 12px;
```

**Button:**
```css
background: linear-gradient(135deg, #22B8CF 0%, #1DA2B8 100%);
border-radius: 6px;
font-size: 12px;
font-weight: 500;
transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

**Input:**
```css
border: 1px solid var(--border-color);
border-radius: 6px;
padding: 10px 12px;
font-size: 13px;
```

**Card:**
```css
border: 1px solid var(--border-color);
border-radius: 8px;
padding: 12px;
transition: all 0.2s ease;
```

---

## 💡 Design Principles

1. **Consistency** - Same patterns across all components
2. **Clarity** - Clear visual hierarchy
3. **Feedback** - Immediate response to user actions
4. **Accessibility** - Usable by everyone
5. **Performance** - Smooth, optimized animations
6. **Scalability** - Patterns that work at any scale

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-08  
**Maintained By:** Pro Prompter Development Team

For questions or suggestions, create an issue in the project repository.
