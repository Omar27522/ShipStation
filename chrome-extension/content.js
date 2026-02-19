// Order Data Extractor - Content Script
// Extracts order/shipment data from web pages based on CSS selectors

if (typeof window.OrderDataExtractor === 'undefined') {
  window.OrderDataExtractor = class {
    constructor() {
      this.data = {};
      this.dataRows = [];
    }

    // Get today's date in MM/DD/YYYY format
    getTodaysDate() {
      return new Date().toLocaleDateString('en-US');
    }

    // Get current time in HH:MM AM/PM format
    getCurrentTime() {
      return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    // Extract Order Number
    extractOrderNumber() {
      try {
        // 1) Preferred: iterate all matching activity entries and find the one that actually has 'Order #'
        const entries = document.querySelectorAll('.fulfillment-plan-activity-entry-zYYrn3H.od-canvas-fulfillment-plan-activity-entry');
        for (const el of entries) {
          const text = (el.textContent || '').trim();
          const match = text.match(/Order\s*#\s*([^\s]+)/i);
          if (match) {
            return match[1];
          }
        }

        // 2) Fallback: scan common text elements across the page for 'Order #' pattern
        const candidates = document.querySelectorAll('div, span, p, li');
        for (const el of candidates) {
          const text = (el.textContent || '').trim();
          const match = text.match(/Order\s*#\s*([^\s]+)/i);
          if (match) {
            return match[1];
          }
        }

        return 'N/A';
      } catch (error) {
        console.warn('Error extracting order number:', error);
        return 'N/A';
      }
    }

    // Extract Recipient Name (only the name, not full address)
    extractRecipient() {
      try {
        const addressElement = document.querySelector('.read-only-address-t7avJZZ');
        if (addressElement) {
          // Get the first div which typically contains the name
          const firstDiv = addressElement.querySelector('div');
          if (firstDiv) {
            let nameText = firstDiv.textContent.trim();
            // Extract just the name part - remove any leading # or ID codes
            nameText = this.extractNameFromText(nameText);
            return nameText;
          }

          // Fallback: get all text and extract name
          const textContent = addressElement.textContent.trim();
          return this.extractNameFromText(textContent);
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting recipient:', error);
        return 'N/A';
      }
    }

    // Extract name from text that might contain ID codes, addresses, etc.
    extractNameFromText(text) {
      try {
        // Remove leading # codes like "#ICC40235"
        let cleanText = text.replace(/^#[A-Z0-9]+\s*/, '');

        // Split by common separators and take the first part (usually the name)
        const parts = cleanText.split(/\d{3,}|@|[A-Z]{2}\s+\d{5}/);
        let namePart = parts[0].trim();

        // Remove any trailing numbers or codes
        namePart = namePart.replace(/\d+.*$/, '').trim();

        // If we have a reasonable name length, return it
        if (namePart.length > 2 && namePart.length < 50) {
          return namePart;
        }

        // Fallback: try to extract first two words (first and last name)
        const words = text.split(/\s+/);
        const nameWords = [];

        for (let word of words) {
          // Skip codes, numbers, and short words
          if (word.match(/^[A-Za-z]+$/) && word.length > 1) {
            nameWords.push(word);
            if (nameWords.length >= 2) break; // Usually first and last name
          }
        }

        return nameWords.length > 0 ? nameWords.join(' ') : 'N/A';
      } catch (error) {
        console.warn('Error parsing name from text:', error);
        return text.split(/\s+/).slice(0, 2).join(' ') || 'N/A';
      }
    }

    // Extract Item Name (Legacy fallback)
    extractItemName() {
      try {
        const itemElement = document.querySelector('button[class*="item-name-"]');
        if (itemElement) {
          return itemElement.textContent.trim();
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting item name:', error);
        return 'N/A';
      }
    }

    // Extract SKU (Legacy fallback)
    extractSKU() {
      try {
        const skuElement = document.querySelector('div[class*="item-sku-"]');
        if (skuElement) {
          let sku = skuElement.textContent.trim();
          // Remove "SKU:" prefix if present
          sku = sku.replace(/^SKU:\s*/i, '');
          return sku;
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting SKU:', error);
        return 'N/A';
      }
    }

    // Extract Quantity (Legacy fallback)
    extractQuantity() {
      try {
        const quantityElement = document.querySelector('p[class*="quantity-text-"]');
        if (quantityElement) {
          const text = quantityElement.textContent.trim();
          const match = text.match(/\d+/);
          return match ? match[0] : 'N/A';
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting quantity:', error);
        return 'N/A';
      }
    }

    // Extract all items for combined orders
    extractItems() {
      try {
        const items = [];
        // Look for table rows containing items
        const rows = document.querySelectorAll('div[class*="react-table-body-row-"]');

        if (rows && rows.length > 0) {
          for (let row of rows) {
            let itemName = 'N/A';
            let sku = 'N/A';
            let quantity = 'N/A';
            let itemOrderNumber = null;

            const nameEl = row.querySelector('button[class*="item-name-"]');
            if (nameEl) itemName = nameEl.textContent.trim();

            const skuEl = row.querySelector('div[class*="item-sku-with-order-number-"], div[class*="item-sku-"]');
            if (skuEl) {
              let skuText = skuEl.textContent.trim();

              // Check if there is an explicit order number for this combined item
              const orderNumMatch = skuText.match(/\*from Order #\s*([^\s]+)/i);
              if (orderNumMatch) {
                itemOrderNumber = orderNumMatch[1];
              }

              // In combined orders it might have parts like "from Order #..."
              skuText = skuText.split('*from Order')[0].trim();
              sku = skuText.replace(/^SKU:\s*/i, '');
            }

            const qtyEl = row.querySelector('p[class*="quantity-text-"]');
            if (qtyEl) {
              const match = qtyEl.textContent.trim().match(/\d+/);
              if (match) quantity = match[0];
            }

            // Only add if it's uniquely an item row (has a name or sku)
            if (itemName !== 'N/A' || sku !== 'N/A') {
              items.push({ itemName, sku, quantity, itemOrderNumber });
            }
          }
        }

        // If we couldn't find rows or they didn't have items, try the fallback
        if (items.length === 0) {
          const names = document.querySelectorAll('button[class*="item-name-"]');
          const skus = document.querySelectorAll('div[class*="item-sku-"]:not([class*="with-order-number"])');
          const qtys = document.querySelectorAll('p[class*="quantity-text-"]');

          const count = Math.max(names.length, 1);
          for (let i = 0; i < count; i++) {
            let itemName = 'N/A';
            let sku = 'N/A';
            let quantity = 'N/A';

            if (names[i]) itemName = names[i].textContent.trim();
            if (skus[i]) sku = skus[i].textContent.trim().replace(/^SKU:\s*/i, '');
            if (qtys[i]) {
              const match = qtys[i].textContent.trim().match(/\d+/);
              if (match) quantity = match[0];
            }

            if (itemName !== 'N/A' || sku !== 'N/A') {
              items.push({ itemName, sku, quantity, itemOrderNumber: null });
            }
          }
        }

        return items.length > 0 ? items : [{ itemName: 'N/A', sku: 'N/A', quantity: 'N/A', itemOrderNumber: null }];
      } catch (error) {
        console.warn('Error extracting items list:', error);
        return [{ itemName: this.extractItemName(), sku: this.extractSKU(), quantity: this.extractQuantity(), itemOrderNumber: null }];
      }
    }

    // Extract Order Total (Price)
    extractOrderTotal() {
      try {
        const priceElement = document.querySelector('.description-qbJBh2Z');
        if (priceElement) {
          const text = priceElement.textContent;
          const match = text.match(/\$([0-9,]+\.?\d*)/);
          return match ? match[1].replace(/,/g, '') : 'N/A';
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting order total:', error);
        return 'N/A';
      }
    }

    // Extract Shipping Total
    extractShippingTotal() {
      try {
        // Find label with "Shipping" text
        const shippingLabels = document.querySelectorAll('.amount-summary-row-label-Peq42k9');
        for (let label of shippingLabels) {
          if (label.textContent.includes('Shipping')) {
            // Find the adjacent div with the price
            const nextDiv = label.nextElementSibling;
            if (nextDiv) {
              const text = nextDiv.textContent;
              const match = text.match(/\$([0-9,]+\.?\d*)/);
              return match ? match[1].replace(/,/g, '') : 'N/A';
            }
          }
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting shipping total:', error);
        return 'N/A';
      }
    }

    // Extract Weight
    extractWeight() {
      try {
        const labels = document.querySelectorAll('.label-Pg0dC8r.field-label-xuTxiUg');
        for (let label of labels) {
          if (label.textContent.includes('Weight')) {
            const valueSpan = label.parentElement.querySelector('.readonly-value-iLmxDlc');
            if (valueSpan) {
              const text = valueSpan.textContent.trim();
              return this.parseWeight(text);
            }
          }
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting weight:', error);
        return 'N/A';
      }
    }

    // Parse and convert weight to standardized format
    parseWeight(weightText) {
      try {
        // Remove extra whitespace and convert to lowercase for easier parsing
        const text = weightText.toLowerCase().trim();

        // Match patterns like "5 lb 8 oz", "5.5 lb", "24 oz", "5lb 8oz", etc.
        const lbOzMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\s*(\d+(?:\.\d+)?)\s*(?:oz|ounces?)?/);
        const lbOnlyMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)/);
        const ozOnlyMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounces?)/);
        const numberOnlyMatch = text.match(/(\d+(?:\.\d+)?)/);

        let totalPounds = 0;

        if (lbOzMatch) {
          // Format: "5 lb 8 oz" or "5.5 lb 2 oz"
          const pounds = parseFloat(lbOzMatch[1]) || 0;
          const ounces = parseFloat(lbOzMatch[2]) || 0;
          totalPounds = pounds + (ounces / 16);
        } else if (lbOnlyMatch) {
          // Format: "5.5 lb" or "5 pounds"
          totalPounds = parseFloat(lbOnlyMatch[1]) || 0;
        } else if (ozOnlyMatch) {
          // Format: "24 oz" or "24 ounces"
          const ounces = parseFloat(ozOnlyMatch[1]) || 0;
          totalPounds = ounces / 16;
        } else if (numberOnlyMatch) {
          // Just a number - assume it's pounds if > 10, otherwise assume ounces
          const number = parseFloat(numberOnlyMatch[1]);
          if (number > 10) {
            totalPounds = number; // Assume pounds
          } else {
            totalPounds = number / 16; // Assume ounces
          }
        }

        if (totalPounds > 0) {
          // Round to 2 decimal places and format nicely
          return Math.round(totalPounds * 100) / 100;
        }

        return 'N/A';
      } catch (error) {
        console.warn('Error parsing weight:', error);
        return 'N/A';
      }
    }

    // Extract Dimensions
    extractDimension() {
      try {
        const labels = document.querySelectorAll('.label-Pg0dC8r.field-label-xuTxiUg');
        for (let label of labels) {
          if (label.textContent.includes('Size (in)')) {
            const valueSpan = label.parentElement.querySelector('.readonly-value-iLmxDlc');
            if (valueSpan) {
              let dimensions = valueSpan.textContent.trim();
              // Remove spaces around 'x' to format like "16x13x5" instead of "16 x 13 x 5"
              dimensions = dimensions.replace(/\s*x\s*/gi, 'x');
              return dimensions;
            }
          }
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting dimensions:', error);
        return 'N/A';
      }
    }

    // Extract Shipping Cost
    extractShipping() {
      try {
        const shippingElements = document.querySelectorAll('.caption-oIOWlTB[aria-describedby="rate-card-label-cost"]');
        if (shippingElements.length > 0) {
          const text = shippingElements[0].textContent;
          const match = text.match(/([0-9.]+)/);
          return match ? match[1] : 'N/A';
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting shipping cost:', error);
        return 'N/A';
      }
    }

    // Extract Carrier
    extractCarrier() {
      try {
        const carrierElement = document.querySelector('.h3-q6GsezA.service-name-gQ0OeUi');
        if (carrierElement) {
          return carrierElement.textContent.trim();
        }
        return 'N/A';
      } catch (error) {
        console.warn('Error extracting carrier:', error);
        return 'N/A';
      }
    }

    // Extract all data
    extractAllData() {
      console.log('Starting data extraction...');

      // Extract shared data once
      const date = this.getTodaysDate();
      const time = this.getCurrentTime();
      const orderNumber = this.extractOrderNumber();
      const recipient = this.extractRecipient();
      const orderTotal = this.extractOrderTotal();
      const shippingTotal = this.extractShippingTotal();
      const weight = this.extractWeight();
      const dimension = this.extractDimension();
      const shipping = this.extractShipping();
      const carrier = this.extractCarrier();

      // Extract all items
      const items = this.extractItems();
      this.dataRows = [];

      // Create a complete data row for each item
      for (const item of items) {
        this.dataRows.push({
          date,
          time,
          orderNumber: item.itemOrderNumber || orderNumber,
          recipient,
          itemName: item.itemName,
          sku: item.sku,
          quantity: item.quantity,
          orderTotal,
          shippingTotal,
          weight,
          dimension,
          shipping,
          carrier
        });
      }

      // Assign the primary data to the first item for legacy compatibility (preview UI)
      this.data = this.dataRows.length > 0 ? this.dataRows[0] : {};

      console.log(`Extracted ${this.dataRows.length} items. First item data:`, this.data);
      return this.dataRows;
    }

    // Format data for Excel (tab-separated)
    formatForExcel() {
      if (!this.dataRows || this.dataRows.length === 0) return '';

      const rows = this.dataRows.map(data => {
        const values = [
          data.date,
          data.time,
          data.orderNumber,
          data.recipient,
          data.itemName,
          data.sku,
          data.quantity,
          data.orderTotal,
          data.shippingTotal,
          data.weight,
          data.dimension,
          data.shipping,
          data.carrier
        ];
        return values.join('\t');
      });

      return rows.join('\n');
    }

    // Count successfully extracted fields across all items
    getSuccessCount() {
      let count = 0;
      if (this.dataRows && this.dataRows.length > 0) {
        this.dataRows.forEach(row => {
          Object.values(row).forEach(value => {
            if (value && value !== 'N/A') count++;
          });
        });
      } else if (this.data) {
        Object.values(this.data).forEach(value => {
          if (value && value !== 'N/A') count++;
        });
      }
      return count;
    }
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  if (request.action === 'extractData') {
    console.log('Starting data extraction...');

    try {
      const extractor = new window.OrderDataExtractor();
      const extractedData = extractor.extractAllData();
      const formattedData = extractor.formatForExcel();
      const successCount = extractor.getSuccessCount();

      console.log('Extraction completed, sending response');

      const totalExpectedFields = 13 * Math.max(1, extractedData.length);

      sendResponse({
        success: true,
        data: extractedData, // This is now an array of rows
        formatted: formattedData,
        successCount: successCount,
        totalFields: totalExpectedFields,
        itemCount: extractedData.length
      });
    } catch (error) {
      console.error('Error during extraction:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  return true; // Keep message channel open for async response
});

// Ensure content script is loaded
console.log('Order Data Extractor content script loaded');

// Add a simple test function
window.orderExtractorTest = function () {
  console.log('Extension test function called');
  return 'Order Data Extractor is working!';
};
