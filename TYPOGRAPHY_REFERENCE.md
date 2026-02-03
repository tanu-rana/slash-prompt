# Typography Reference - Prompt Manager Extension

## **Modal Titles** 📝

### **All Modal Headers Use Consistent Typography**

```css
.modal-header h2 {
  font-size: 16px;
  font-weight: 500;
  font-family: 'Sora', sans-serif;
  color: var(--text-primary);  /* #000000 */
  text-align: center;
  margin: 0;
}
```

### **List of All Modals**

| Modal Name | Class | Font Size | Font Weight | Alignment |
|---|---|---|---|---|
| Add New Prompt | `.modal-header h2` | 16px | 500 | center |
| Edit Prompt | `.modal-header h2` | 16px | 500 | center |
| Create New Folder | `.modal-header h2` | 16px | 500 | center |
| Edit Folder | `.modal-header h2` | 16px | 500 | center |
| Share Prompt | `.share-modal-content .modal-header h2` | 16px | 500 | center |
| Delete All | `.confirmation-modal .modal-header h2` | 16px | 500 | center |
| Delete Favorites | `.confirmation-modal .modal-header h2` | 16px | 500 | center |
| Download Favourites | `.confirmation-modal .modal-header h2` | 16px | 500 | center |
| Confirm Delete | `.confirmation-modal .modal-header h2` | 16px | 500 | center |

---

## **Folder Typography** 📁

### **Folder Name**
```css
.folder-name-text {
  font-size: 11px;
  font-weight: 400;
  font-family: 'Sora', sans-serif;
  color: var(--text-primary);  /* #000000 */
}
```

### **Prompt Count** (in brackets)
```css
.folder-prompt-count {
  font-size: 11px;
  font-weight: 400;
  font-family: 'Sora', sans-serif;
  color: #9A9A9A;  /* Light Grey */
}
```

### **Example Display**
```
📁 Work Projects (15)
  ↳ 8 prompts
  ↳ 📁 Subfolder A (7)
```

---

## **Sort By Dropdown** 🔽

### **Sort Label** (Favorites Tab)
```css
#sortDropdownLabel {
  font-weight: 600;  /* Bold */
}
```

**Display**: "Sort By: Most Used" (Bold text)

---

## **Complete Typography Scale**

| Element | Font Family | Size | Weight | Color |
|---|---|---|---|---|
| **Modal Titles** | Sora | 16px | 500 | #000000 |
| **Folder Names** | Sora | 11px | 400 | #000000 |
| **Folder Counts** | Sora | 11px | 400 | #9A9A9A |
| **Sort By Label** | Sora | inherit | 600 | inherit |
| **Prompt Titles** | Sora | 13px | 500 | #000000 |
| **Prompt Content** | Sora | 12px | 400 | #666666 |
| **Tag Labels** | Sora | 11px | 500 | varies |
| **Button Text** | Sora | 12px | 500 | varies |
| **Input Fields** | Sora | 13px | 400 | #000000 |

---

## **Font Weights Reference**

| Weight | Name | Usage |
|---|---|---|
| **400** | Regular | Body text, descriptions, counts |
| **500** | Medium | Headings, titles, buttons, labels |
| **600** | Semi-Bold | Emphasis, important labels (Sort By) |

---

## **Color Palette**

| Variable | Hex | Usage |
|---|---|---|
| `--text-primary` | #000000 | Main text, headings |
| `--text-secondary` | #9A9A9A | Secondary text, counts |
| `--accent-primary` | #22B8CF | Buttons, links, active states |
| `--border-color` | #E0E0E0 | Borders, dividers |
| `--white` | #FFFFFF | Backgrounds, cards |
| `--bg-secondary` | #F5F5F5 | Subtle backgrounds |

---

## **Quick Copy-Paste** 📋

### **For New Modal Title**
```css
your-modal-class .modal-header h2 {
  font-size: 16px;
  font-weight: 500;
  font-family: 'Sora', sans-serif;
  color: var(--text-primary);
  text-align: center;
  margin: 0;
}
```

### **For Folder-Like Elements**
```css
.your-folder-name {
  font-size: 11px;
  font-weight: 400;
  font-family: 'Sora', sans-serif;
  color: var(--text-primary);
}
```

### **For Important Labels**
```css
.your-label {
  font-weight: 600;  /* Bold for emphasis */
  font-family: 'Sora', sans-serif;
}
```

---

## **Design Principles**

1. **Consistency**: All similar elements use identical typography
2. **Hierarchy**: Larger sizes = more important (16px > 13px > 11px)
3. **Weight Progression**: 400 (body) → 500 (headings) → 600 (emphasis)
4. **Single Font Family**: Sora throughout for cohesion
5. **Centered Titles**: All modal titles centered for elegance

---

## **Accessibility Notes**

- ✅ Minimum 11px font size (readable)
- ✅ 500 weight for headings (clear hierarchy)
- ✅ High contrast: Black (#000000) on White (#FFFFFF)
- ✅ Consistent spacing for readability
- ✅ Centered alignment reduces eye strain

---

## **Responsive Behavior**

All typography is **fixed size** (px units), ensuring consistency across:
- Different screen sizes
- Browser zoom levels
- Operating systems

**Note**: If you need responsive typography, replace `px` with `rem` units (1rem = 16px by default).

---

This reference guide ensures consistent typography across the entire Prompt Manager extension! 🎨
