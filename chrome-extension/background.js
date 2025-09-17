// Order Data Extractor - Background Service Worker
// Handles extension lifecycle and clipboard operations

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('Order Data Extractor installed');
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'copyToClipboard') {
    // Handle clipboard operations if needed
    // Note: In Manifest V3, clipboard operations are typically handled in popup/content scripts
    console.log('Clipboard operation requested');
  }
  
  return true;
});
