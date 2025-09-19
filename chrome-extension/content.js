// Order Data Extractor - Content Script
// Extracts order/shipment data from web pages based on CSS selectors

(function(){
  // Prevent double-loading on reinjection
  if (window.__ORDER_EXTRACTOR_LOADED__) {
    console.log('Order Data Extractor content script already loaded');
    return;
  }
  window.__ORDER_EXTRACTOR_LOADED__ = true;

  class OrderDataExtractor {
    constructor() {
      this.data = {};
    }

  // Get today's date in MM/DD/YYYY format
  getTodaysDate() {
    return new Date().toLocaleDateString('en-US');
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

  // Extract Item Name
  extractItemName() {
    try {
      const itemElement = document.querySelector('.button-link.item-name-E__ZAJW');
      if (itemElement) {
        return itemElement.textContent.trim();
      }
      return 'N/A';
    } catch (error) {
      console.warn('Error extracting item name:', error);
      return 'N/A';
    }
  }

  // Extract SKU
  extractSKU() {
    try {
      const skuElement = document.querySelector('.item-sku-ONq0BTI');
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

  // Extract Quantity
  extractQuantity() {
    try {
      const quantityElement = document.querySelector('.h3-q6GsezA.quantity-text-UmGFNkF');
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
        const rawText = carrierElement.textContent.trim();
        const normalized = rawText.toLowerCase();

        // Only return USPS or FedEx. Anything else is treated as N/A
        if (normalized.includes('usps') || normalized.includes('united states postal')) {
          return 'USPS';
        }
        if (normalized.includes('fedex') || normalized.includes('fed ex')) {
          return 'FedEx';
        }

        // Not USPS or FedEx
        return 'N/A';
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
    
    this.data = {
      date: this.getTodaysDate(),
      orderNumber: this.extractOrderNumber(),
      recipient: this.extractRecipient(),
      itemName: this.extractItemName(),
      sku: this.extractSKU(),
      quantity: this.extractQuantity(),
      orderTotal: this.extractOrderTotal(),
      shippingTotal: this.extractShippingTotal(),
      weight: this.extractWeight(),
      dimension: this.extractDimension(),
      shipping: this.extractShipping(),
      carrier: this.extractCarrier()
    };

    console.log('Extracted data:', this.data);
    return this.data;
  }

  // Format data for Excel (tab-separated)
  formatForExcel() {
    const values = [
      this.data.date,
      this.data.orderNumber,
      this.data.recipient,
      this.data.itemName,
      this.data.sku,
      this.data.quantity,
      this.data.orderTotal,
      this.data.shippingTotal,
      this.data.weight,
      this.data.dimension,
      this.data.shipping,
      this.data.carrier
    ];
    
    return values.join('\t');
  }

  // Count successfully extracted fields
  getSuccessCount() {
    let count = 0;
    Object.values(this.data).forEach(value => {
      if (value && value !== 'N/A') count++;
    });
    return count;
  }
}

  // Expose the class to window for external usage
  window.OrderDataExtractor = OrderDataExtractor;

})();

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
      
      sendResponse({
        success: true,
        data: extractedData,
        formatted: formattedData,
        successCount: successCount,
        totalFields: 12
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
window.orderExtractorTest = function() {
  console.log('Extension test function called');
  return 'Order Data Extractor is working!';
};
