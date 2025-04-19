let isCommandDown = false;
let lastPasteTime = 0;
let extensionEnabled = true; // Default to enabled
let undoCount = 0; // Track consecutive undo operations

// Initialize extensionEnabled from storage (default true)
chrome.storage.local.get('enabled', (result) => {
  // Explicitly check if it's false - this handles both undefined and true cases
  extensionEnabled = result.enabled !== false;
  console.log("Content script: custom paste enabled state loaded:", extensionEnabled);
});

// Listen for changes to update our flag in real time
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && 'enabled' in changes) {
    extensionEnabled = changes.enabled.newValue;
    console.log("Content script: custom paste updated to", extensionEnabled);
  }
});

function safeSendMessage(message, callback) {
  if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage(message, callback);
  } else {
    console.warn("chrome.runtime.sendMessage is not available in this context.");
    if (typeof callback === "function") {
      callback(); // or handle fallback
    }
  }
}

// Function to handle paste action
function handlePaste(e) {
  // Only intercept paste if the extension is enabled
  if (!extensionEnabled) {
    // Let the default paste behavior happen when disabled
    return;
  }

  // Check if it's a paste command
  if ((isCommandDown || e.ctrlKey || e.metaKey) && e.key === 'v') {
    console.log("Custom paste intercepted, extension enabled:", extensionEnabled);
    
    // Prevent the default paste behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Use our custom paste from queue
    safeSendMessage({ action: 'paste' }, (response) => {
      if (response && response.success && response.text) {
        // Reset undo counter on new paste
        undoCount = 0;
        
        const activeElement = document.activeElement;
        
        try {
          // Handle input and textarea elements
          if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const text = activeElement.value;
            
            activeElement.value = text.substring(0, start) + response.text + text.substring(end);
            
            const newPosition = start + response.text.length;
            activeElement.setSelectionRange(newPosition, newPosition);
            
            const inputEvent = new Event('input', { bubbles: true });
            activeElement.dispatchEvent(inputEvent);
          }
          // Handle contenteditable elements
          else if (activeElement.isContentEditable) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();

              const frag = document.createDocumentFragment();
              const lines = response.text.split('\n');

              lines.forEach((line, idx) => {
                // Replace each leading space with a non-breaking space
                const leading = line.match(/^ */)[0];
                for (let i = 0; i < leading.length; i++) {
                  frag.appendChild(document.createTextNode('\u00A0'));
                }
                frag.appendChild(document.createTextNode(line.slice(leading.length)));

                // Add a <br> after every line except the last
                if (idx < lines.length - 1) {
                  frag.appendChild(document.createElement('br'));
                }
              });

              range.insertNode(frag);
              // Move cursor to the end of the inserted fragment
              selection.collapseToEnd();
            } else {
              // Fallback for when there's no selection
              const frag = document.createDocumentFragment();
              const lines = response.text.split('\n');

              lines.forEach((line, idx) => {
                const leading = line.match(/^ */)[0];
                for (let i = 0; i < leading.length; i++) {
                  frag.appendChild(document.createTextNode('\u00A0'));
                }
                frag.appendChild(document.createTextNode(line.slice(leading.length)));

                if (idx < lines.length - 1) {
                  frag.appendChild(document.createElement('br'));
                }
              });

              activeElement.appendChild(frag);
            }
          }
          // Fallback: use execCommand
          else {
            document.execCommand('insertText', false, response.text);
          }
          
          lastPasteTime = Date.now();
        } catch (error) {
          console.error('Error during paste:', error);
        }
      }
    });
  }
}

// Function to handle undo action
function handleUndo(e) {
  // Only intercept undo if the extension is enabled
  if (!extensionEnabled) {
    return;
  }

  // Check if it's an undo command
  if ((isCommandDown || e.ctrlKey || e.metaKey) && e.key === 'z') {
    // Allow the browser's default undo to happen
    // But also update our queue state
    
    // We only want to move items back in the queue when undoing a paste
    // Track if this is close to a paste operation OR if we're doing consecutive undos
    const isRecentPaste = Date.now() - lastPasteTime < 5000;  // Within 5 seconds of paste
    
    if (isRecentPaste || undoCount > 0) {
      // Let the browser's undo happen first
      setTimeout(() => {
        // Then update our queue state
        safeSendMessage({ action: 'undo' }, (response) => {
          if (response && response.success) {
            console.log(`Undo operation #${undoCount + 1} successful`);
            undoCount++; // Increment undo counter for consecutive undos
          }
        });
      }, 10); // Short delay to ensure browser undo happens first
    }
  }
}

// Add event listeners for keydown and keyup events
document.addEventListener('keydown', (e) => {
  if (e.key === 'Meta' || e.key === 'Control') {
    isCommandDown = true;
  }
  
  // Only handle paste and undo if the key combo is right
  if ((isCommandDown || e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'z')) {
    if (e.key === 'v') {
      handlePaste(e);
    } else if (e.key === 'z') {
      handleUndo(e);
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Meta' || e.key === 'Control') {
    isCommandDown = false;
  }
  
  // Reset undo counter after releasing modifier keys
  if (e.key === 'z') {
    // We want to keep undo count if they release just z
    // but might press it again quickly
    setTimeout(() => {
      // If no new undo in 500ms, reset counter
      if (!isCommandDown) {
        undoCount = 0;
      }
    }, 500);
  }
});

// CRITICAL FIX: Only intercept paste events when the extension is enabled
document.addEventListener('paste', (e) => {
  // Only prevent default paste behavior when extension is enabled
  if (extensionEnabled) {
    console.log("Intercepting paste event, extension enabled:", extensionEnabled);
    e.preventDefault();
    e.stopPropagation();
    
    // Reset undo counter on new paste
    undoCount = 0;
    
    // Use our custom paste from queue
    safeSendMessage({ action: 'paste' }, (response) => {
      if (response && response.success && response.text) {
        const activeElement = document.activeElement;
        
        try {
          // Similar paste handling as above
          if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const text = activeElement.value;
            
            activeElement.value = text.substring(0, start) + response.text + text.substring(end);
            
            const newPosition = start + response.text.length;
            activeElement.setSelectionRange(newPosition, newPosition);
            
            const inputEvent = new Event('input', { bubbles: true });
            activeElement.dispatchEvent(inputEvent);
          }
          else if (activeElement.isContentEditable) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(document.createTextNode(response.text));
              
              range.setStartAfter(range.endContainer);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              activeElement.innerHTML += response.text;
            }
          }
          else {
            document.execCommand('insertText', false, response.text);
          }
          
          lastPasteTime = Date.now();
        } catch (error) {
          console.error('Error during paste:', error);
        }
      }
    });
  }
  // When extension is disabled, we do nothing and let default paste behavior happen
}, true);

// Add debug message on content script load
console.log("SpareMe content script loaded, extensionEnabled:", extensionEnabled);