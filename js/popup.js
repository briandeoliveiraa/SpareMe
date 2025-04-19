// Function declarations
function updateQueueDisplay(scrollPosition = null) {
  const queueItems = document.getElementById('queue-items');
  // Save scroll position if not provided
  if (scrollPosition === null) {
    scrollPosition = queueItems.scrollTop;
  }
  queueItems.innerHTML = '';
  
  chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
    if (response && response.queue) {
      response.queue.forEach((item, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.draggable = true;
        queueItem.dataset.index = index;
        
        const itemText = document.createElement('span');
        itemText.textContent = item;
        itemText.className = 'item-text';
        itemText.dataset.index = index;
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-item';
        deleteButton.dataset.index = index;
        
        queueItem.appendChild(itemText);
        queueItem.appendChild(deleteButton);
        queueItems.appendChild(queueItem);

        // Add double-click handler for editing
        itemText.addEventListener('dblclick', () => {
          const currentText = itemText.textContent;
          const textarea = document.createElement('textarea');
          textarea.value = currentText;
          textarea.className = 'edit-textarea';
          
          // Replace the text with the textarea
          itemText.replaceWith(textarea);
          textarea.focus();
          
          // Auto-resize the textarea
          const resizeTextarea = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
          };
          
          // Initial resize
          resizeTextarea();
          
          // Handle saving the changes
          const saveChanges = () => {
            const newText = textarea.value.trim();
            if (newText && newText !== currentText) {
              // Update the queue with the new text
              chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
                if (response && response.queue) {
                  const queue = response.queue;
                  queue[index] = newText;
                  chrome.runtime.sendMessage({ action: 'setQueue', queue: queue }, () => {
                    updateQueueDisplay(queueItems.scrollTop);
                  });
                }
              });
            } else {
              // If no changes or empty text, revert to original
              textarea.replaceWith(itemText);
            }
          };

          // Save on Enter or blur
          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              saveChanges();
            } else if (e.key === 'Escape') {
              textarea.replaceWith(itemText);
            } else {
              // Resize on input
              resizeTextarea();
            }
          });

          textarea.addEventListener('blur', saveChanges);
          textarea.addEventListener('input', resizeTextarea);
        });
      });
      
      // Restore scroll position
      queueItems.scrollTop = scrollPosition;
    }
  });
}

function updateSavedQueuesList() {
  const savedQueuesList = document.getElementById('saved-queues-list');
  savedQueuesList.innerHTML = '';
  
  chrome.storage.local.get(null, (result) => {
    Object.keys(result).forEach(key => {
      if (key.startsWith('savedQueue_')) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key.replace('savedQueue_', '');
        savedQueuesList.appendChild(option);
      }
    });
  });
}

function addToQueue(text) {
  chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
    if (response && response.queue) {
      const queue = response.queue;
      queue.push(text);
      chrome.runtime.sendMessage({ action: 'setQueue', queue: queue }, () => {
        updateQueueDisplay();
      });
    }
  });
}

function deleteFromQueue() {
  const newItemInput = document.getElementById('new-item');
  const text = newItemInput.value.trim();
  if (text) {
    chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
      const queue = response.queue || [];
      queue.push(text);
      chrome.runtime.sendMessage({ action: 'setQueue', queue }, () => {
        newItemInput.value = '';
        updateQueueDisplay();
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
  updateQueueDisplay();
  updateSavedQueuesList();

  // Handle Enter key in textarea
  if (newItemInput) {
    newItemInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addToQueue(newItemInput.value.trim());
        newItemInput.value = '';
      }
    });
  }

  // Clear queue
  if (clearQueueBtn) {
    clearQueueBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'setQueue', queue: [] }, () => {
        updateQueueDisplay();
      });
    });
  }

  // Save queue
  if (saveQueueBtn) {
    saveQueueBtn.addEventListener('click', () => {
      const queueName = prompt('Enter a name for this queue:');
      if (queueName) {
        chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
          if (response && response.queue) {
            chrome.storage.local.set({ [`savedQueue_${queueName}`]: response.queue }, () => {
              updateSavedQueuesList();
            });
          }
        });
      }
    });
  }

  // Load queue
  if (loadQueueBtn) {
    loadQueueBtn.addEventListener('click', () => {
      const selectedQueue = savedQueuesList.value;
      if (selectedQueue) {
        chrome.storage.local.get(selectedQueue, (result) => {
          if (result[selectedQueue]) {
            chrome.runtime.sendMessage({ action: 'setQueue', queue: result[selectedQueue] }, () => {
              updateQueueDisplay();
            });
          }
        });
      }
    });
  }

  // Delete queue
  if (deleteQueueBtn) {
    deleteQueueBtn.addEventListener('click', () => {
      const selectedQueue = savedQueuesList.value;
      if (selectedQueue) {
        chrome.storage.local.remove(selectedQueue, () => {
          updateSavedQueuesList();
        });
      }
    });
  }

  // Delete individual queue items
  queueItems.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-item')) {
      const itemToDelete = e.target.closest('.queue-item');
      const index = parseInt(e.target.dataset.index);
      
      // Add deletion animation
      itemToDelete.style.transition = 'all 0.3s ease';
      itemToDelete.style.transform = 'translateX(10px)';
      itemToDelete.style.opacity = '0';
      
      chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
        if (response && response.queue) {
          const queue = response.queue;
          queue.splice(index, 1);
          
          // Update storage without refreshing display
          chrome.runtime.sendMessage({ action: 'setQueue', queue: queue }, () => {
            // After animation, remove the element and update indices
            setTimeout(() => {
              itemToDelete.remove();
              
              // Update indices for remaining items
              const remainingItems = queueItems.querySelectorAll('.queue-item');
              remainingItems.forEach((item, newIndex) => {
                item.dataset.index = newIndex;
                const deleteBtn = item.querySelector('.delete-item');
                if (deleteBtn) {
                  deleteBtn.dataset.index = newIndex;
                }
              });
            }, 300); // Match the animation duration
          });
        }
      });
    }
  });

  let draggedItem = null;
  let originalQueue = [];
  
  // Drag and drop event listeners
  queueItems.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('queue-item')) {
      draggedItem = e.target;
      e.target.classList.add('dragging');
      
      // Store the original queue order
      chrome.runtime.sendMessage({ action: 'getQueue' }, (response) => {
        if (response && response.queue) {
          originalQueue = [...response.queue];
        }
      });
    }
  });
  
  queueItems.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('queue-item')) {
      e.target.classList.remove('dragging');
      draggedItem = null;
    }
  });
  
  queueItems.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggable = document.querySelector('.dragging');
    if (!draggable) return;
    
    const afterElement = getDragAfterElement(queueItems, e.clientY);
    if (afterElement) {
      queueItems.insertBefore(draggable, afterElement);
    } else {
      queueItems.appendChild(draggable);
    }
  });
  
  queueItems.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    // Get the new order of items without refreshing the display
    const items = Array.from(queueItems.querySelectorAll('.queue-item'));
    const newQueue = items.map(item => {
      const textSpan = item.querySelector('.item-text');
      return textSpan.textContent;
    });
    
    // Only update storage if the order has changed
    if (JSON.stringify(newQueue) !== JSON.stringify(originalQueue)) {
      chrome.runtime.sendMessage({ action: 'setQueue', queue: newQueue });
    }
    
    // Update indices for all items
    items.forEach((item, index) => {
      item.dataset.index = index;
      const deleteButton = item.querySelector('.delete-item');
      if (deleteButton) {
        deleteButton.dataset.index = index;
      }
    });
  });
  
  // Helper function to determine where to place dragged item
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.queue-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
});