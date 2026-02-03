# Icon Alignment Debug

## Current Setup

### Hamburger Icon (Prompts Tab)
```
Panel Edge → 12px (nav margin) → 12px (tab padding) → ICON
Total from edge: 24px
```

### Magnifying Glass Icon (Search Bar)
```
Panel Edge → 12px (search container padding) → 0px (icon left) → ICON
Total from edge: 12px
```

## The Problem
- Hamburger: **24px** from edge
- Magnifying glass: **12px** from edge
- **Difference: 12px** (magnifying glass is 12px too far left)

## Solution
The icon needs to be at `left: 12px` to match the hamburger icon at 24px total.

**Current**: 12px (container) + 0px (icon) = 12px ❌
**Need**: 12px (container) + 12px (icon) = 24px ✅

But we already tried this and it didn't work in the screenshot. This suggests there might be additional spacing or the wrapper has its own offset.

## Alternative Approach
Check if `.search-wrapper` or `.search-input-wrapper` has any margin/padding that's adding extra offset.
