# Installation Guide

This guide explains how to install and run the Chrome extension from source (unpacked) and provides optional steps for packaging and publishing.

## Prerequisites
- Google Chrome (or Chromium-based browser that supports Manifest V3)
- Access to this repository on your local machine

## Directory Layout
The extension lives in the `chrome-extension/` directory.
```
chrome-extension/
├─ manifest.json
├─ popup.html
├─ popup.js
├─ background.js
├─ content.js
├─ styles.css
└─ icons/
```

## Install as Unpacked Extension (Development)
1. Open Chrome and go to `chrome://extensions`.
2. Toggle on "Developer mode" (top-right corner).
3. Click "Load unpacked".
4. Select the `chrome-extension/` directory in this project root.
5. The extension should appear in your list. Optionally click the pin icon to show it on the toolbar.

## Verify Installation
1. Navigate to a ShipStation order or shipment page.
2. Click the extension icon to open the popup.
3. Click "Extract & Copy Data".
4. You should see a status message and a preview of extracted fields.
5. Paste into Excel or Google Sheets to verify the tab-separated format.

## Common Tasks During Development
- After editing code, return to `chrome://extensions` and click "Reload" on the extension card to apply changes.
- Use DevTools Console on the target page to see logs from `content.js` and in the popup for logs from `popup.js`.
- Keep `manifest.json` and the UI version label in `popup.html` in sync when releasing updates.

## Troubleshooting
- If you see "Could not establish connection", refresh the page and try again.
- Some fields may show `N/A` if the page structure or CSS classes have changed.
- Ensure the page is not a restricted Chrome page (e.g., `chrome://` URLs) where content scripts cannot run.
- Confirm required permissions are present in `manifest.json` (`activeTab`, `clipboardWrite`, `scripting`).

## Optional: Packaging for Distribution
If you plan to publish to the Chrome Web Store:
1. Ensure `manifest.json` has the correct name, version, description, and icons.
2. Prepare icons in all required sizes and reference them under `icons` in `manifest.json`.
3. Create a high-quality listing description and screenshots (1280×800 recommended) or a short promo video.
4. From `chrome://extensions`, click "Pack extension" and select the `chrome-extension/` directory to generate a `.crx` and `.pem` (for local distribution/testing). For Web Store publishing, upload a ZIP of the `chrome-extension/` directory via the Chrome Developer Dashboard.
5. Follow the Chrome Web Store review guidelines.

## Uninstall
1. Open `chrome://extensions`.
2. Find the extension and toggle it off or click "Remove".

---
For feature requests or issues, see the root `README.md` for support options.
