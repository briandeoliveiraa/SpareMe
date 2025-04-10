// Function declarations
function updateQueueDisplay(queue) {
  const queueItems = document.getElementById('queue-items');
  if (queueItems) {
    queueItems.innerHTML = '';
    if (!queue || queue.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'queue-item';
      emptyMessage.textContent = 'Queue is empty';
      queueItems.appendChild(emptyMessage);
      return;
    }
    
    queue.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'queue-item';
      div.textContent = `${index + 1}. ${item}`;
      queueItems.appendChild(div);
    });
  }
}

function updateSavedQueuesList(savedQueues) {
  const savedQueuesList = document.getElementById('saved-queues-list');
  if (savedQueuesList) {
    savedQueuesList.innerHTML = '';
    Object.keys(savedQueues).forEach(queueName => {
      const option = document.createElement('option');
      option.value = queueName;
      option.textContent = queueName;
      savedQueuesList.appendChild(option);
    });
  }
}

function addToQueue() {
  const newItemInput = document.getElementById('new-item');
  const text = newItemInput.value.trim();
  if (text) {
    chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
      const queue = response.queue || [];
      queue.push(text);
      chrome.runtime.sendMessage({ action: 'setQueue', queue }, () => {
        newItemInput.value = '';
        updateQueueDisplay(queue);
      });
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const queueItems = document.getElementById('queue-items');
  const newItemInput = document.getElementById('new-item');
  const clearQueueBtn = document.getElementById('clear-queue');
  const saveQueueBtn = document.getElementById('save-queue');
  const loadQueueBtn = document.getElementById('load-queue');
  const savedQueuesList = document.getElementById('saved-queues-list');
  const deleteQueueBtn = document.getElementById('delete-queue');
  const extensionToggle = document.getElementById('extension-toggle');
  const toggleStatus = document.getElementById('toggle-status');

  // Initialize extension toggle state
  chrome.storage.local.get(['enabled'], (result) => {
    // Default to enabled if not set
    const isEnabled = result.enabled !== false;
    if (extensionToggle) {
      extensionToggle.checked = isEnabled;
      console.log("Popup loaded with extension enabled:", isEnabled);
      
      // Update status indicator if it exists
      if (toggleStatus) {
        toggleStatus.textContent = isEnabled ? "ACTIVE" : "INACTIVE";
        toggleStatus.style.color = isEnabled ? "#4CAF50" : "#f44336";
      }
    }
  });

  // Handle extension toggle
  if (extensionToggle) {
    extensionToggle.addEventListener('change', () => {
      const isEnabled = extensionToggle.checked;
      chrome.storage.local.set({ enabled: isEnabled }, () => {
        console.log('Extension toggled to:', isEnabled);
        
        // Update status indicator if it exists
        if (toggleStatus) {
          toggleStatus.textContent = isEnabled ? "ACTIVE" : "INACTIVE";
          toggleStatus.style.color = isEnabled ? "#4CAF50" : "#f44336";
        }
      });
    });
  }

  // Initialize queue display
  chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
    if (response && response.queue) {
      updateQueueDisplay(response.queue);
    }
  });

  // Handle Enter key in textarea
  if (newItemInput) {
    newItemInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addToQueue();
      }
    });
  }

  // Clear queue
  if (clearQueueBtn) {
    clearQueueBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'setQueue', queue: [] }, () => {
        updateQueueDisplay([]);
      });
    });
  }

  // Save queue
  if (saveQueueBtn) {
    saveQueueBtn.addEventListener('click', () => {
      const queueName = prompt('Enter a name for this queue:');
      if (queueName) {
        chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
          chrome.storage.local.get(['savedQueues'], (result) => {
            const savedQueues = result.savedQueues || {};
            savedQueues[queueName] = response.queue || [];
            chrome.storage.local.set({ savedQueues }, () => {
              updateSavedQueuesList(savedQueues);
            });
          });
        });
      }
    });
  }

  // Load queue
  if (loadQueueBtn) {
    loadQueueBtn.addEventListener('click', () => {
      const selectedQueue = savedQueuesList.value;
      if (selectedQueue) {
        chrome.storage.local.get(['savedQueues'], (result) => {
          const queue = result.savedQueues[selectedQueue] || [];
          chrome.runtime.sendMessage({ action: 'setQueue', queue }, () => {
            updateQueueDisplay(queue);
          });
        });
      }
    });
  }

  // Delete queue
  if (deleteQueueBtn) {
    deleteQueueBtn.addEventListener('click', () => {
      const selectedQueue = savedQueuesList.value;
      if (selectedQueue) {
        chrome.storage.local.get(['savedQueues'], (result) => {
          const savedQueues = result.savedQueues || {};
          delete savedQueues[selectedQueue];
          chrome.storage.local.set({ savedQueues }, () => {
            updateSavedQueuesList(savedQueues);
          });
        });
      }
    });
  }

  // Load initial saved queues
  chrome.storage.local.get(['savedQueues'], (result) => {
    updateSavedQueuesList(result.savedQueues || {});
  });
});