# Bug Report: Action Menu Failure in Prompt Manager Extension

## 1. Overview

The core "quick access" feature of the Prompt Manager extension has failed. This feature is supposed to trigger an autocomplete menu when a user types `//` into a chat input field on supported AI platforms (ChatGPT, Claude, Gemini, etc.). The menu no longer appears, and the extension is effectively broken from a user's perspective.

This document provides context for a new development agent to understand the problem's history and the current state of the codebase in order to successfully fix it.

## 2. Symptoms & History

The failure is a regression that occurred after a previous fix. The initial bug reports were:

- **On ChatGPT:** The `//` trigger worked, but the dropdown menu appeared empty.
- **On Gemini & Claude:** The `//` trigger did not work at all. When it did, the menu was positioned incorrectly relative to the cursor, especially in `contenteditable` elements.

My attempts to resolve these issues led to a catastrophic failure of the `content.js` script.

## 3. Root Cause Analysis

The current failure is the result of two primary issues:

1.  **Initial Regression:** A previous bugfix inadvertently removed two critical variables (`recentText` and `searchStart`) from the `processInput` function call within `content.js`. These variables were essential for the script to correctly identify the search term and the trigger position, causing the logic to fail silently.

2.  **Tooling Failure & Code Corruption:** My subsequent attempts to fix the regression were unsuccessful. The automated `replace_file_content` tool I use repeatedly failed to apply patches correctly to the large and complex `content.js` file (~1400 lines). This resulted in a corrupted file with:
    -   Duplicated or incomplete class/function definitions.
    -   Mismatched code blocks from different repair attempts.
    -   Numerous syntax errors, as confirmed by the IDE's linter.

**The `content.js` file is now in a non-functional state and must be completely replaced.**

## 4. Recommended Action for the Next Agent

The primary task is to **replace the entire content of `content.js` with a clean, fully-functional implementation** of the `PromptAutocomplete` class. The previous versions of the file should be available in the local git history.

The new implementation must restore the following key features:

-   **Correct Triggering:** The menu must reliably appear when the user types `//` in a valid input field.
-   **Accurate Positioning:** The menu must be positioned directly next to the user's text cursor. This is especially critical for `contenteditable` divs (used by Claude.ai), which require using Selection and Range APIs to get coordinates, as opposed to simpler textareas.
-   **Real-time Filtering:** The list of prompts in the menu must filter correctly as the user types a search query after the `//` trigger.
-   **Reliable Insertion:** Selecting a prompt (via `Enter`, `Tab`, or click) must correctly replace the trigger and search query (`//search-term`) with the full content of the selected prompt.
-   **Prevent Auto-Send:** On platforms like Claude and Perplexity, inserting a prompt must **not** trigger an automatic form submission. This requires careful event handling (e.g., `event.preventDefault()`, `event.stopPropagation()`, `event.stopImmediatePropagation()`) on `keydown`, `keypress`, and `keyup` events for the `Enter` key.

## 5. Relevant Files

-   `c:\Users\TANNU\CascadeProjects\windsurf-project\prompt-manager-extension\content.js`: **(The broken file)** The main content script responsible for the action menu.
-   `c:\Users\TANNU\CascadeProjects\windsurf-project\prompt-manager-extension\manifest.json`: Defines how and where `content.js` is injected.
-   `c:\Users\TANNU\CascadeProjects\windsurf-project\prompt-manager-extension\background.js`: The service worker that provides the prompt data to `content.js` from storage.
