let pasteQueue = [];
let indexInQueue = 0;

// On startup, load the queue from storage
chrome.storage.local.get(['pasteQueue'], (result) => {
  pasteQueue = result.pasteQueue || [];
  indexInQueue = 0; // Reset index on startup
});

// Utility to persist the queue
function persistQueue() {
  chrome.storage.local.set({ pasteQueue });
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getQueue') {
    // Return only the unpasted items
    sendResponse({ queue: pasteQueue.slice(indexInQueue) });
  } else if (request.action === 'setQueue') {
    pasteQueue = request.queue;
    indexInQueue = 0; // Reset the index when a new queue is set
    persistQueue();
    sendResponse({ success: true });
  } else if (request.action === 'paste') {
    if (pasteQueue.length > indexInQueue) {
      const textToPaste = pasteQueue[indexInQueue];
      indexInQueue++;
      persistQueue();
      sendResponse({ success: true, text: textToPaste });
    } else {
      sendResponse({ success: false });
    }
  } else if (request.action === 'undo') {
    // Simply move the index back one step, which effectively puts the last item
    // back at the front of the queue for the next paste operation
    if (indexInQueue > 0) {
      indexInQueue--;
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  } else if (request.action === 'getNextItem') {
    // Get the next item without changing the index - for preview
    if (pasteQueue.length > indexInQueue) {
      sendResponse({ success: true, text: pasteQueue[indexInQueue] });
    } else {
      sendResponse({ success: false });
    }
  }
  return true; // Keep the message channel open for async response
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // Open the popup in a new window
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 400,
      height: 600,
      left: 100,
      top: 100
    });
  }
});