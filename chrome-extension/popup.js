// Order Data Extractor - Popup Script
// Handles UI interactions and communication with content script

document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const statusDiv = document.getElementById('status');
  const previewDiv = document.getElementById('preview');

  // Extract button click handler
  extractBtn.addEventListener('click', async function() {
    console.log('Extract button clicked');
    
    // Update UI to show loading state
    setLoadingState();
    
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Current tab:', tab);
      
      // Try to inject content script if not already loaded
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('Content script injected successfully');
      } catch (injectionError) {
        console.log('Content script already loaded or injection failed:', injectionError.message);
      }
      
      // Wait a moment for script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send message to content script
      console.log('Sending message to content script...');
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
      console.log('Received response:', response);
      
      if (response && response.success) {
        // Copy to clipboard
        await copyToClipboard(response.formatted);
        
        // Show success status
        showSuccessStatus(response.successCount, response.totalFields);
        
        // Show preview of extracted data
        showPreview(response.data);
        
      } else if (response && !response.success) {
        showErrorStatus('Extraction failed: ' + (response.error || 'Unknown error'));
      } else {
        showErrorStatus('No response from content script. Make sure you are on a web page (not chrome:// or extension pages).');
      }
      
    } catch (error) {
      console.error('Error during extraction:', error);
      if (error.message.includes('Could not establish connection')) {
        showErrorStatus('Connection Error: Content script not loaded. Try refreshing the page and try again.');
      } else {
        showErrorStatus('Error: ' + error.message);
      }
    }
    
    // Reset button state
    resetButtonState();
  });

  // Set loading state
  function setLoadingState() {
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span class="button-icon">⏳</span>Extracting...';
    statusDiv.innerHTML = '';
    previewDiv.innerHTML = '';
  }

  // Reset button state
  function resetButtonState() {
    extractBtn.disabled = false;
    extractBtn.innerHTML = '<span class="button-icon">📋</span>Extract & Copy Data';
  }

  // Copy text to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Data copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy to clipboard');
    }
  }

  // Show success status
  function showSuccessStatus(successCount, totalFields) {
    const percentage = Math.round((successCount / totalFields) * 100);
    
    let statusClass = 'success';
    let statusIcon = '✅';
    let statusText = `Success! ${successCount}/${totalFields} fields extracted (${percentage}%)`;
    
    if (successCount < totalFields) {
      if (successCount >= totalFields * 0.7) {
        statusClass = 'warning';
        statusIcon = '⚠️';
        statusText = `Partial success: ${successCount}/${totalFields} fields extracted (${percentage}%)`;
      } else {
        statusClass = 'error';
        statusIcon = '❌';
        statusText = `Limited data: Only ${successCount}/${totalFields} fields extracted (${percentage}%)`;
      }
    }
    
    statusDiv.innerHTML = `
      <div class="status ${statusClass}">
        <span class="status-icon">${statusIcon}</span>
        <span class="status-text">${statusText}</span>
      </div>
      <div class="clipboard-notice">
        📋 Data copied to clipboard - ready to paste into Excel!
      </div>
    `;
  }

  // Show error status
  function showErrorStatus(message) {
    statusDiv.innerHTML = `
      <div class="status error">
        <span class="status-icon">❌</span>
        <span class="status-text">${message}</span>
      </div>
      <div class="help-notice">
        💡 Make sure you're on an order or shipment page with the expected data structure.
      </div>
    `;
  }

  // Show preview of extracted data
  function showPreview(data) {
    const fields = [
      { label: 'Date', value: data.date },
      { label: 'Order #', value: data.orderNumber },
      { label: 'Recipient', value: data.recipient },
      { label: 'Item Name', value: data.itemName },
      { label: 'SKU', value: data.sku },
      { label: 'Quantity', value: data.quantity },
      { label: 'Order Total', value: data.orderTotal },
      { label: 'Shipping Total', value: data.shippingTotal },
      { label: 'Weight', value: data.weight },
      { label: 'Dimension', value: data.dimension },
      { label: 'Shipping', value: data.shipping },
      { label: 'Carrier', value: data.carrier }
    ];

    let previewHTML = '<div class="preview-header">📋 Extracted Data Preview:</div>';
    previewHTML += '<div class="field-list">';
    
    fields.forEach(field => {
      const isFound = field.value && field.value !== 'N/A';
      const statusIcon = isFound ? '✅' : '❌';
      const fieldClass = isFound ? 'found' : 'missing';
      const displayValue = field.value || 'N/A';
      
      previewHTML += `
        <div class="field-item ${fieldClass}">
          <span class="field-status">${statusIcon}</span>
          <span class="field-label">${field.label}:</span>
          <span class="field-value">${displayValue}</span>
        </div>
      `;
    });
    
    previewHTML += '</div>';
    previewDiv.innerHTML = previewHTML;
  }
});
