# Chrome Extension: Order Data Extractor

## Overview
A Chrome extension that automatically extracts order/shipment data from web pages and formats it for Excel import. The extension uses predefined CSS selectors to locate and extract specific data fields from order management pages.

## Features
- **One-click data extraction** from order/shipment pages
- **Excel-ready format** - copies data as tab-separated values
- **Smart field detection** using CSS selectors
- **Error handling** with field validation
- **Visual feedback** showing extraction status
- **Clipboard integration** for easy pasting

## Data Fields Extracted
The extension extracts the following fields in order (matching Excel header):
1. **Date** - Today's date (automatically added)
2. **Order #** - From fulfillment plan activity entry
3. **Recipient** - Full shipping address
4. **Item Name** - Product/item description
5. **SKU** - Product identifier
6. **Quantity** - Number of items
7. **Order Total** - Item price (after $ sign)
8. **Shipping Total** - Shipping cost paid
9. **Weight** - Package weight
10. **Dimension** - Package size (in inches)
11. **Shipping** - Calculated shipping cost
12. **Carrier** - Shipping service provider

## File Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── content.js             # Data extraction logic
├── background.js          # Background service worker
├── styles.css             # Popup styling
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Implementation Details

### 1. Manifest.json (Manifest V3)
```json
{
  "manifest_version": 3,
  "name": "Order Data Extractor",
  "version": "1.0",
  "description": "Extract order data for Excel import",
  "permissions": ["activeTab", "clipboardWrite"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icons/icon48.png"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }],
  "background": {
    "service_worker": "background.js"
  }
}
```

### 2. Content Script (content.js)
**Extraction Rules Implementation:**

- **Date**: 
  ```javascript
  // Get today's date in MM/DD/YYYY format
  const today = new Date().toLocaleDateString('en-US');
  ```

- **Order #**: 
  ```javascript
  // Find first occurrence of class="fulfillment-plan-activity-entry-zYYrn3H od-canvas-fulfillment-plan-activity-entry"
  // Extract text after "Order #" and before first space
  ```

- **Recipient**: 
  ```javascript
  // Find first occurrence of class="read-only-address-t7avJZZ"
  // Extract all text content until inner div closes
  // Handle dynamic target-element-id
  ```

- **Item Name**: 
  ```javascript
  // Find class="button-link item-name-E__ZAJW"
  // Extract button text content
  ```

- **SKU**: 
  ```javascript
  // Find class="item-sku-ONq0BTI"
  // Extract text content (exclude "SKU:" prefix)
  ```

- **Quantity**: 
  ```javascript
  // Find class="h3-q6GsezA quantity-text-UmGFNkF"
  // Extract numeric value
  ```

- **Order Total**: 
  ```javascript
  // Find class="description-qbJBh2Z"
  // Extract number after $ sign
  ```

- **Shipping Total**: 
  ```javascript
  // Find label with "Shipping" text and dynamic target-element-id
  // Extract price from adjacent div
  ```

- **Weight**: 
  ```javascript
  // Find label "Weight" with class="label-Pg0dC8r field-label-xuTxiUg"
  // Extract value from span class="readonly-value-iLmxDlc"
  ```

- **Dimension**: 
  ```javascript
  // Find label "Size (in)" with class="label-Pg0dC8r field-label-xuTxiUg"
  // Extract value from span class="readonly-value-iLmxDlc"
  ```

- **Shipping**: 
  ```javascript
  // Find class="caption-oIOWlTB" with aria-describedby="rate-card-label-cost"
  // Extract numeric value
  ```

- **Carrier**: 
  ```javascript
  // Find class="h3-q6GsezA service-name-gQ0OeUi"
  // Extract service name text
  ```

### 3. Popup Interface (popup.html)
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h2>Order Data Extractor</h2>
    <button id="extractBtn">Extract & Copy Data</button>
    <div id="status"></div>
    <div id="preview"></div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

### 4. Popup Logic (popup.js)
- Send message to content script to extract data
- Display extraction status and preview
- Copy formatted data to clipboard
- Handle errors and missing fields

### 5. Background Service Worker (background.js)
- Handle clipboard operations
- Manage extension lifecycle
- Process extracted data formatting

## Installation Steps

### Development Installation:
1. **Create Extension Folder**
   ```
   mkdir chrome-extension
   cd chrome-extension
   ```

2. **Create All Required Files**
   - manifest.json
   - popup.html, popup.js
   - content.js
   - background.js
   - styles.css
   - icons/ folder with icon files

3. **Load Extension in Chrome**
   - Open Chrome → Extensions (chrome://extensions/)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the chrome-extension folder

4. **Test Extension**
   - Navigate to a page with order data
   - Click extension icon
   - Click "Extract & Copy Data"
   - Paste into Excel to verify format

### Production Installation:
1. **Package Extension**
   - Zip all files
   - Upload to Chrome Web Store
   - Follow Chrome Web Store guidelines

## Usage Instructions

### Step-by-Step Usage:
1. **Navigate** to an order/shipment page
2. **Click** the extension icon in Chrome toolbar
3. **Click** "Extract & Copy Data" button
4. **Wait** for extraction confirmation
5. **Open** Excel or Google Sheets
6. **Paste** (Ctrl+V) the data into a new row

### Expected Output Format:
```
Date	Order #	Recipient	Item Name	SKU	Quantity	Order Total	Shipping Total	Weight	Dimension	Shipping	Carrier
9/17/2025	12-34567-89012	FirstName LastName	Laptop Computer Dell Model ABC	DELL-ABC-123	2	899.99	25.00	15.5	16x12x8	28.75	UPS
```

## Error Handling

### Field Detection Issues:
- **Missing Fields**: Extension will show "N/A" for missing data
- **Format Changes**: Logs warnings for unrecognized page structures
- **Dynamic IDs**: Handles changing target-element-id attributes

### User Feedback:
- **Success**: Green checkmark with field count
- **Partial**: Yellow warning with missing fields list
- **Failure**: Red error with troubleshooting tips

## Testing Strategy

### Test Cases:
1. **Complete Data Page**: All fields present and extractable
2. **Partial Data Page**: Some fields missing
3. **Wrong Page Type**: Non-order page (should show error)
4. **Dynamic Content**: Pages with changing element IDs
5. **Multiple Orders**: Pages with multiple order entries

### Test Data Sources:
- Use provided index.html and comparison.html files
- Test on actual order management websites
- Verify Excel import compatibility

## Troubleshooting

### Common Issues:
1. **No Data Extracted**: Check if page structure matches selectors
2. **Partial Extraction**: Some fields may have changed CSS classes
3. **Clipboard Issues**: Ensure clipboard permissions are granted
4. **Format Problems**: Verify tab-separated output in text editor

### Debug Mode:
- Console logging for each extraction step
- Field-by-field validation
- Selector matching verification

## Future Enhancements

### Planned Features:
1. **Custom Field Mapping**: User-configurable selectors
2. **Batch Processing**: Extract multiple orders at once
3. **Export Options**: CSV, JSON, direct Excel file
4. **Template System**: Different extraction templates for different sites
5. **Auto-Detection**: Automatically detect order page types

### Technical Improvements:
1. **Robust Selectors**: Fallback selectors for field detection
2. **Performance**: Optimize extraction speed
3. **Memory**: Efficient data handling for large pages
4. **Security**: Enhanced data validation

## Development Notes

### Key Considerations:
- **Dynamic Content**: Handle pages with JavaScript-loaded content
- **Cross-Site Compatibility**: Work across different order management systems
- **Data Validation**: Ensure extracted data integrity
- **User Experience**: Minimal clicks, clear feedback

### Code Organization:
- **Modular Design**: Separate extraction logic by field type
- **Error Recovery**: Graceful handling of missing elements
- **Maintainability**: Clear code structure for future updates
- **Performance**: Efficient DOM queries and data processing

## Support
For issues or feature requests, check the extraction rules in `promt.txt` and verify CSS selectors match the target website structure.
