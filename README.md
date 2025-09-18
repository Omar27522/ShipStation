# Order Data Extractor for ShipStation

## Overview
A Chrome Extension that extracts key order and shipment details from the ShipStation web app and copies them to your clipboard in an Excel‑friendly, tab‑separated format (TSV). The extension uses resilient DOM selectors and parsing helpers to retrieve the most useful fields for spreadsheet workflows.

## Features
- One‑click data extraction from order/shipment pages
- Excel‑ready output (tab‑separated values)
- Clear visual feedback in the popup (success, partial, or error)
- In‑popup preview of extracted fields
- Graceful handling of partial data and page variations

## Extracted Fields
The extension attempts to extract the following fields in this order:
1. Date (today)
2. Order Number
3. Recipient Name
4. Item Name
5. SKU
6. Quantity
7. Order Total
8. Shipping Total
9. Weight (standardized, lb when possible)
10. Dimension (e.g., 16x13x5)
11. Shipping (cost)
12. Carrier

## File Structure
```
chrome-extension/
├─ manifest.json          # Extension configuration (MV3)
├─ popup.html             # Popup UI
├─ popup.js               # Popup logic & clipboard
├─ background.js          # Background service worker
├─ content.js             # DOM extraction & formatting
├─ styles.css             # Popup styling
└─ icons/                 # Icon assets & guidance
   └─ README.md           # Icon requirements and best practices
```

## Architecture
- `popup.html` / `popup.js` — User interface and action handling (extract, copy, status, preview).
- `content.js` — Extracts data from the current page using selectors and parsing helpers, formats TSV.
- `background.js` — MV3 service worker for lifecycle and logging.
- `manifest.json` — Declares permissions, scripts, and icons.

## Installation
1. Download or clone this repository.
2. In Chrome, open `chrome://extensions`.
3. Enable Developer mode.
4. Click "Load unpacked" and select the `chrome-extension/` directory.

## Usage
1. Navigate to a ShipStation order or shipment page.
2. Click the extension icon to open the popup.
3. Click "Extract & Copy Data".
4. Paste into Excel or Google Sheets.

## Permissions
From `manifest.json` (MV3):
- `activeTab` — Access the current page when you use the extension.
- `clipboardWrite` — Copy the compiled TSV to your clipboard.
- `scripting` — Inject the content script when needed.

## Troubleshooting
- Ensure the page is fully loaded before extraction.
- If you see "Could not establish connection", refresh the page and try again.
- Some fields may show `N/A` if elements are missing or the DOM structure has changed.

## Privacy & Data
- No data leaves your browser; extraction runs locally.
- Data is only copied to your clipboard on user action.

## Development
- Update selectors and parsing in `content.js` as ShipStation’s UI evolves.
- Keep `manifest.json` in sync with assets (icons) and versions.
- See `chrome-extension/icons/README.md` for icon requirements and best practices.
- After changes, reload the extension from `chrome://extensions`.

## Versioning
- UI displays `v1.2` in `popup.html`.
- Manifest version is `1.0` in `manifest.json`.
Keep these in sync when releasing updates.

## License
Specify your license (e.g., MIT). If using third‑party icons/assets, include proper attribution.

## Support
For issues or feature requests, open an issue on the repository or contact the maintainer.
