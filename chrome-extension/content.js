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
<<<<<<< HEAD
    }

    // Get current time in HH:MM AM/PM format
    getCurrentTime() {
      return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    // Extract Order Number
    extractOrderNumber() {
      try {
        // 1) Preferred: look for the dedicated order number block
        const orderSelectors = [
          '[class*="order-info-order-number-"]',
          '[class*="order-number-"]'
        ];

        for (const selector of orderSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            const text = (el.textContent || '').trim();
            const match = text.match(/Order\s*#?\s*([0-9][0-9-]*)/i);
            if (match) {
              return match[1];
            }
          }
        }

        // 2) Fallback: iterate matching activity entries and find the one that actually has 'Order #'
        const entries = document.querySelectorAll('.fulfillment-plan-activity-entry-zYYrn3H.od-canvas-fulfillment-plan-activity-entry');
        for (const el of entries) {
          const text = (el.textContent || '').trim();
          const match = text.match(/Order\s*#?\s*([0-9][0-9-]*)/i);
          if (match) {
            return match[1];
          }
        }

        // 3) Fallback: scan common text elements across the page for 'Order #' pattern
        const candidates = document.querySelectorAll('div, span, p, li');
        for (const el of candidates) {
          const text = (el.textContent || '').trim();
          const match = text.match(/Order\s*#?\s*([0-9][0-9-]*)/i);
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
        const addressSelectors = [
          '[class*="read-only-address-"]',
          '[class*="address-"]'
        ];

        let addressElement = null;
        for (const selector of addressSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = (element.textContent || '').trim();
            if (text && /USA|[A-Z]{2}\s+\d{5}/.test(text)) {
              addressElement = element;
              break;
            }
          }
          if (addressElement) break;
        }

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

        // Joint recipients often use slash separators; most downstream systems
        // only accept a single person name, so keep the first recipient.
        cleanText = cleanText.split('/')[0].trim();

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
        const itemElement = document.querySelector('[class*="item-name-"]');
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
        const skuElement = document.querySelector('[class*="item-sku-"]:not([class*="with-order-number"])');
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
        const quantityElement = document.querySelector('[class*="quantity-text-"]');
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
        const rows = document.querySelectorAll('[class*="react-table-body-row-"]');

        if (rows && rows.length > 0) {
          for (let row of rows) {
            let itemName = 'N/A';
            let sku = 'N/A';
            let quantity = 'N/A';
            let itemOrderNumber = null;
            let itemTotal = null;

            const nameEl = row.querySelector('[class*="item-name-"]');
            if (nameEl) itemName = nameEl.textContent.trim();

            const skuEl = row.querySelector('[class*="item-sku-with-order-number-"], [class*="item-sku-"]');
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

            const qtyEl = row.querySelector('[aria-labelledby="quantity"]');
            if (qtyEl) {
              const match = qtyEl.textContent.trim().match(/\d+/);
              if (match) quantity = match[0];
            }

            const costEl = row.querySelector('[aria-labelledby="costTotal"]') || row.querySelector('[aria-labelledby="unitPrice"]');
            if (costEl) {
              const match = costEl.textContent.trim().match(/\$([0-9,]+\.?\d*)/);
              if (match) itemTotal = match[1].replace(/,/g, '');
            }

            // Only add if it's uniquely an item row (has a name or sku)
            if (itemName !== 'N/A' || sku !== 'N/A') {
              items.push({ itemName, sku, quantity, itemOrderNumber, itemTotal });
            }
          }
        }

        // If we couldn't find rows or they didn't have items, try the fallback
        if (items.length === 0) {
          const names = document.querySelectorAll('[class*="item-name-"]');
          const skus = document.querySelectorAll('[class*="item-sku-"]:not([class*="with-order-number"])');
          const qtys = document.querySelectorAll('[class*="quantity-text-"]');

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
              items.push({ itemName, sku, quantity, itemOrderNumber: null, itemTotal: null });
            }
          }
        }

        return items.length > 0 ? items : [{ itemName: 'N/A', sku: 'N/A', quantity: 'N/A', itemOrderNumber: null, itemTotal: null }];
      } catch (error) {
        console.warn('Error extracting items list:', error);
        return [{ itemName: this.extractItemName(), sku: this.extractSKU(), quantity: this.extractQuantity(), itemOrderNumber: null, itemTotal: null }];
      }
    }

    // Extract Order Total (Price)
    extractOrderTotal() {
      try {
        // 1) Reliable approach: find the "Total" summary row at the bottom
        const summaryLabels = document.querySelectorAll('[class*="amount-summary-row-label-"]');
        for (let label of summaryLabels) {
          if (label.textContent.includes('Total') && !label.textContent.includes('Shipping')) {
            const nextDiv = label.nextElementSibling;
            if (nextDiv) {
              const match = nextDiv.textContent.match(/\$([0-9,]+\.?\d*)/);
              if (match) return match[1].replace(/,/g, '');
            }
          }
        }

        // 2) Fallback: get the very first span looking like a price description
        const priceElement = document.querySelector('[class*="description-qbJBh2Z"], [class*="description-"]');
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
        const shippingLabels = document.querySelectorAll('[class*="amount-summary-row-label-"]');
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
        const labels = document.querySelectorAll('[class*="label-"]');
        for (let label of labels) {
          if (label.textContent.includes('Weight')) {
            const valueSpan = label.parentElement.querySelector('[class*="readonly-value-"]');
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
        const labels = document.querySelectorAll('[class*="label-"]');
        for (let label of labels) {
          if (label.textContent.includes('Size (in)')) {
            const valueSpan = label.parentElement.querySelector('[class*="readonly-value-"]');
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
        const shippingElements = document.querySelectorAll('[class*="caption-"][aria-describedby="rate-card-label-cost"]');
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
        const carrierElement = document.querySelector('[class*="service-name-"]');
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
      let shippingTotal = this.extractShippingTotal();
      let weight = this.extractWeight();
      const dimension = this.extractDimension();
      let shipping = this.extractShipping();
      const carrier = this.extractCarrier();

      // Extract all items
      const items = this.extractItems();
      this.dataRows = [];

      const numItems = items.length > 0 ? items.length : 1;

      // Divide globally shared numeric costs evenly if this happens to be a multi-item combined order
      if (numItems > 1) {
        if (weight !== 'N/A' && !isNaN(parseFloat(weight))) {
          weight = (parseFloat(weight) / numItems).toFixed(2);
          weight = parseFloat(weight).toString(); // clean off trailing decimals if .00
        }
        if (shipping !== 'N/A' && !isNaN(parseFloat(shipping))) {
          shipping = (parseFloat(shipping) / numItems).toFixed(2);
        }
      }

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
          orderTotal: item.itemTotal || orderTotal,
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

    // Helper to programmatically set input values and trigger React/framework change detection
    setInputValue(inputElement, value) {
      if (!inputElement) return false;
      try {
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        const prototype = Object.getPrototypeOf(inputElement);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        
        if (valueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(inputElement, value);
        } else if (valueSetter) {
          valueSetter.call(inputElement, value);
        } else {
          inputElement.value = value;
        }
        
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        inputElement.dispatchEvent(new Event('blur', { bubbles: true }));
        return true;
      } catch (e) {
        console.warn('Error setting react value:', e);
        inputElement.value = value;
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }

    // Populate weight and dimensions fields on the active page with async delay to let React process updates
    async populateFieldsAsync(data) {
      console.log('Populating fields with data asynchronously:', data);
      
      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
      let successCount = 0;
      
      const setAndVerify = async (selectorList, val) => {
        if (val === undefined || val === '') return false;
        
        // Try up to 3 times to find and set the value, in case of React re-renders replacing the element
        for (let attempt = 1; attempt <= 3; attempt++) {
          let input = null;
          for (const selector of selectorList) {
            input = document.querySelector(selector);
            if (input) break;
          }
          
          if (input) {
            this.setInputValue(input, val.toString());
            
            // Wait 50ms for React/DOM to process the change
            await sleep(50);
            
            // Verify if value stuck by re-querying the selector (in case node was replaced)
            let checkInput = null;
            for (const selector of selectorList) {
              checkInput = document.querySelector(selector);
              if (checkInput) break;
            }
            
            if (checkInput && checkInput.value === val.toString()) {
              return true;
            }
=======
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
>>>>>>> 6b9a9f6e8afb654a6ed6b6dd83c7965a4221895a
          }
          
          // If value did not stick, wait a bit longer before retrying
          await sleep(100);
        }
<<<<<<< HEAD
        return false;
      };

      // 1) Populate Weight
      if (data.weight !== undefined && data.weight !== '') {
        const lbsSelectors = [
          'input[aria-labelledby="order-details-weight pounds"]',
          'div[data-input-type="(lb)"] input',
          'input[aria-labelledby*="pounds"]'
        ];
        const ozSelectors = [
          'input[aria-labelledby="order-details-weight ounces"]',
          'div[data-input-type="(oz)"] input',
          'input[aria-labelledby*="ounces"]'
        ];

        if (await setAndVerify(lbsSelectors, data.weight)) {
          successCount++;
          
          await sleep(50);
          let lbsInput = null;
          for (const selector of lbsSelectors) {
            lbsInput = document.querySelector(selector);
            if (lbsInput) break;
=======

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
>>>>>>> 6b9a9f6e8afb654a6ed6b6dd83c7965a4221895a
          }
          
          let ozInput = null;
          for (const selector of ozSelectors) {
            ozInput = document.querySelector(selector);
            if (ozInput) break;
          }
          
          if (lbsInput) {
            lbsInput.focus();
            
            // Dispatch simulated Tab key down and press events on the lbs input field
            lbsInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true }));
            lbsInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true }));
            
            // Move focus to ounces input field to place the cursor there
            if (ozInput) {
              ozInput.focus();
              ozInput.dispatchEvent(new Event('focus', { bubbles: true }));
            }
            
            // Dispatch simulated Tab key up on the lbs input field
            lbsInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true }));
            lbsInput.dispatchEvent(new Event('change', { bubbles: true }));
            lbsInput.dispatchEvent(new Event('blur', { bubbles: true }));
          }
          
          // Wait 500ms to allow the remote software (ShipStation) to perform its automatic weight calculations
          await sleep(500);
        }

        return nameWords.length > 0 ? nameWords.join(' ') : 'N/A';
      } catch (error) {
        console.warn('Error parsing name from text:', error);
        return text.split(/\s+/).slice(0, 2).join(' ') || 'N/A';
      }
<<<<<<< HEAD

      // 2) Populate Dimensions (Length)
      if (data.length !== undefined && data.length !== '') {
        const lengthSelectors = [
          'input[aria-labelledby="order-details-size length"]',
          'div[data-input-type="length"] input',
          'input[aria-labelledby*="length"]'
        ];
        await sleep(50);
        if (await setAndVerify(lengthSelectors, data.length)) successCount++;
      }

      // 3) Populate Dimensions (Width)
      if (data.width !== undefined && data.width !== '') {
        const widthSelectors = [
          'input[aria-labelledby="order-details-size width"]',
          'div[data-input-type="width"] input',
          'input[aria-labelledby*="width"]'
        ];
        await sleep(50);
        if (await setAndVerify(widthSelectors, data.width)) successCount++;
      }

      // 4) Populate Dimensions (Height)
      if (data.height !== undefined && data.height !== '') {
        const heightSelectors = [
          'input[aria-labelledby="order-details-size height"]',
          'div[data-input-type="height"] input',
          'input[aria-labelledby*="height"]'
        ];
        await sleep(50);
        if (await setAndVerify(heightSelectors, data.height)) successCount++;
      }

      return {
        success: successCount > 0,
        successCount: successCount,
        error: successCount === 0 ? 'Could not find weight or dimension input fields on this page. Make sure the Configure Shipment panel is expanded.' : null
      };
    }
=======
    }

    // Extract Item Name (Legacy fallback)
    extractItemName() {
      try {
        const itemElement = document.querySelector('[class*="item-name-"]');
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
        const skuElement = document.querySelector('[class*="item-sku-"]:not([class*="with-order-number"])');
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
        const quantityElement = document.querySelector('[class*="quantity-text-"]');
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
        const rows = document.querySelectorAll('[class*="react-table-body-row-"]');

        if (rows && rows.length > 0) {
          for (let row of rows) {
            let itemName = 'N/A';
            let sku = 'N/A';
            let quantity = 'N/A';
            let itemOrderNumber = null;
            let itemTotal = null;

            const nameEl = row.querySelector('[class*="item-name-"]');
            if (nameEl) itemName = nameEl.textContent.trim();

            const skuEl = row.querySelector('[class*="item-sku-with-order-number-"], [class*="item-sku-"]');
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

            const qtyEl = row.querySelector('[aria-labelledby="quantity"]');
            if (qtyEl) {
              const match = qtyEl.textContent.trim().match(/\d+/);
              if (match) quantity = match[0];
            }

            const costEl = row.querySelector('[aria-labelledby="costTotal"]') || row.querySelector('[aria-labelledby="unitPrice"]');
            if (costEl) {
              const match = costEl.textContent.trim().match(/\$([0-9,]+\.?\d*)/);
              if (match) itemTotal = match[1].replace(/,/g, '');
            }

            // Only add if it's uniquely an item row (has a name or sku)
            if (itemName !== 'N/A' || sku !== 'N/A') {
              items.push({ itemName, sku, quantity, itemOrderNumber, itemTotal });
            }
          }
        }

        // If we couldn't find rows or they didn't have items, try the fallback
        if (items.length === 0) {
          const names = document.querySelectorAll('[class*="item-name-"]');
          const skus = document.querySelectorAll('[class*="item-sku-"]:not([class*="with-order-number"])');
          const qtys = document.querySelectorAll('[class*="quantity-text-"]');

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
              items.push({ itemName, sku, quantity, itemOrderNumber: null, itemTotal: null });
            }
          }
        }

        return items.length > 0 ? items : [{ itemName: 'N/A', sku: 'N/A', quantity: 'N/A', itemOrderNumber: null, itemTotal: null }];
      } catch (error) {
        console.warn('Error extracting items list:', error);
        return [{ itemName: this.extractItemName(), sku: this.extractSKU(), quantity: this.extractQuantity(), itemOrderNumber: null, itemTotal: null }];
      }
    }

    // Extract Order Total (Price)
    extractOrderTotal() {
      try {
        // 1) Reliable approach: find the "Total" summary row at the bottom
        const summaryLabels = document.querySelectorAll('[class*="amount-summary-row-label-"]');
        for (let label of summaryLabels) {
          if (label.textContent.includes('Total') && !label.textContent.includes('Shipping')) {
            const nextDiv = label.nextElementSibling;
            if (nextDiv) {
              const match = nextDiv.textContent.match(/\$([0-9,]+\.?\d*)/);
              if (match) return match[1].replace(/,/g, '');
            }
          }
        }

        // 2) Fallback: get the very first span looking like a price description
        const priceElement = document.querySelector('[class*="description-qbJBh2Z"], [class*="description-"]');
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
        const shippingLabels = document.querySelectorAll('[class*="amount-summary-row-label-"]');
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
        const labels = document.querySelectorAll('[class*="label-"]');
        for (let label of labels) {
          if (label.textContent.includes('Weight')) {
            const valueSpan = label.parentElement.querySelector('[class*="readonly-value-"]');
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
        const labels = document.querySelectorAll('[class*="label-"]');
        for (let label of labels) {
          if (label.textContent.includes('Size (in)')) {
            const valueSpan = label.parentElement.querySelector('[class*="readonly-value-"]');
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
        const shippingElements = document.querySelectorAll('[class*="caption-"][aria-describedby="rate-card-label-cost"]');
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
        const carrierElement = document.querySelector('[class*="service-name-"]');
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
      let shippingTotal = this.extractShippingTotal();
      let weight = this.extractWeight();
      const dimension = this.extractDimension();
      let shipping = this.extractShipping();
      const carrier = this.extractCarrier();

      // Extract all items
      const items = this.extractItems();
      this.dataRows = [];

      const numItems = items.length > 0 ? items.length : 1;

      // Divide globally shared numeric costs evenly if this happens to be a multi-item combined order
      if (numItems > 1) {
        if (weight !== 'N/A' && !isNaN(parseFloat(weight))) {
          weight = (parseFloat(weight) / numItems).toFixed(2);
          weight = parseFloat(weight).toString(); // clean off trailing decimals if .00
        }
        if (shipping !== 'N/A' && !isNaN(parseFloat(shipping))) {
          shipping = (parseFloat(shipping) / numItems).toFixed(2);
        }
      }

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
          orderTotal: item.itemTotal || orderTotal,
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
>>>>>>> 6b9a9f6e8afb654a6ed6b6dd83c7965a4221895a
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
  } else if (request.action === 'populateFields') {
    console.log('Starting page field population asynchronously...');
    (async () => {
      try {
        const extractor = new window.OrderDataExtractor();
        const result = await extractor.populateFieldsAsync(request.data);
        console.log('Population result:', result);
        sendResponse(result);
      } catch (error) {
        console.error('Error during field population:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      }
    })();
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
