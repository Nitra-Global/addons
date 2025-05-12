// backup.js

// --- DOM Elements ---
const logElement = document.getElementById('log');
const progressBarContainer = document.getElementById('progressBarContainer');
const progressBar = document.getElementById('progressBar');
const backupBtn = document.getElementById('backupBtn');
const restoreInput = document.getElementById('restoreInput');
const restoreOptionsDiv = document.getElementById('restoreOptions');
const backupDetailsDiv = document.getElementById('backupDetails');
const storageSelectionDiv = document.getElementById('storageSelection');
const executeRestoreBtn = document.getElementById('executeRestoreBtn');
const cancelRestoreBtn = document.getElementById('cancelRestoreBtn');
const logHistoryContainer = document.getElementById('logHistoryContainer');
const showLogHistoryBtn = document.getElementById('showLogHistoryBtn');
const logHistoryDiv = document.getElementById('logHistory');
const selectAllStorageBtn = document.getElementById('selectAllStorage');
const deselectAllStorageBtn = document.getElementById('deselectAllStorage');
const permissionWarningDiv = document.getElementById('permissionWarning');

// New Data Management Elements
const currentDataManagerDiv = document.getElementById('currentDataManager');
const viewCurrentDataBtn = document.getElementById('viewCurrentDataBtn');
const currentDataDisplayDiv = document.getElementById('currentDataDisplay');
const showDeleteOptionsBtn = document.getElementById('showDeleteOptionsBtn');
const deleteDataOptionsDiv = document.getElementById('deleteDataOptions');
const deleteStorageSelectionDiv = document.getElementById('deleteStorageSelection');
const executeDeleteBtnConfirm = document.getElementById('executeDeleteBtnConfirm');
const cancelDeleteOptionsBtn = document.getElementById('cancelDeleteOptionsBtn');
const selectAllDeleteStorageBtn = document.getElementById('selectAllDeleteStorage');
const deselectAllDeleteStorageBtn = document.getElementById('deselectAllDeleteStorage');


// --- State ---
let currentBackupData = null; // Store the parsed data of the selected backup file
let logHistory = []; // Array to store log messages
const STORAGE_TYPES = { // Define storage types for easier management and display
    chrome_local: 'Chrome Local Storage',
    chrome_sync: 'Chrome Sync Storage',
    web_localStorage: 'Web Local Storage',
    web_sessionStorage: 'Web Session Storage'
};

// --- Utility Functions ---

function logMessage(message, isError = false) {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMessage = `${timestamp}: ${message}`;
  logHistory.push(formattedMessage); // Add to history

  // Update the main log display (shows only the latest message)
  logElement.textContent = formattedMessage;
  logElement.className = isError ? 'log error' : 'log'; // Apply error class

  // Update the detailed log history view (if visible)
  if (logHistoryDiv.style.display !== 'none') {
      displayLogHistory();
  }

  if (isError) {
    console.error(message); // Also log errors to console
  }
}

function displayLogHistory() {
    logHistoryDiv.innerHTML = logHistory.join('<br>');
    // Scroll to the bottom of the log history
    logHistoryDiv.scrollTop = logHistoryDiv.scrollHeight;
}


function updateProgressBar(percentage) {
   let safePercentage = Math.max(0, Math.min(100, percentage)); // Ensure percentage is between 0 and 100

  progressBar.style.width = safePercentage + '%';
  progressBar.textContent = Math.round(safePercentage) + '%'; // Display rounded percentage

  if (safePercentage > 0 && safePercentage < 100) {
    progressBarContainer.style.display = 'block';
  } else {
    // Keep visible briefly on completion/error before hiding
     if (safePercentage === 100) {
          setTimeout(() => progressBarContainer.style.display = 'none', 1000); // Show for 1 second on completion
     } else {
         progressBarContainer.style.display = 'none';
     }
  }
}

// --- UI State Management ---

// Show the restore options area
function showRestoreOptions() {
    restoreInput.parentElement.style.display = 'none'; // Hide the file input container
    restoreOptionsDiv.style.display = 'block'; // Show the options
    // Use setTimeout to allow the display: block to take effect before triggering animation
    setTimeout(() => {
        restoreOptionsDiv.classList.add('visible');
    }, 10); // A small delay (e.g., 10ms) is often needed

    logMessage("Backup file loaded. Review details and select data to restore.");
     // Ensure buttons are enabled
    executeRestoreBtn.disabled = false;
    cancelRestoreBtn.disabled = false;
     selectAllStorageBtn.disabled = false;
     deselectAllStorageBtn.disabled = false;
}

// Hide the restore options area and reset
function hideRestoreOptions() {
    // Remove the visible class before hiding to allow animation reverse if desired,
    // or simply hide immediately if reduced motion is preferred (handled by CSS).
    restoreOptionsDiv.classList.remove('visible');

    // Delay hiding display property to allow fade-out if transition is active
    // However, with reduced motion, transitions are off, so immediate hide is fine.
    // The CSS handles which transition applies.
     setTimeout(() => {
         restoreInput.parentElement.style.display = 'block'; // Show the file input container
         restoreInput.value = ''; // Clear the selected file
         restoreOptionsDiv.style.display = 'none'; // Hide the options display property
         backupDetailsDiv.innerHTML = ''; // Clear details
         storageSelectionDiv.innerHTML = ''; // Clear checkboxes
         currentBackupData = null; // Clear stored data
         updateProgressBar(0); // Reset progress bar
         logMessage("Restore process cancelled or completed. Select a new file to start again.");
          // Ensure buttons are enabled if options are hidden
         backupBtn.disabled = false;
          // Also re-enable data management buttons if they were disabled
         viewCurrentDataBtn.disabled = false;
         showDeleteOptionsBtn.disabled = false;
     }, 500); // Match this delay to the transition duration in CSS (0.5s)
}


// Show the delete data options area
function showDeleteOptions() {
     // Populate deletion checkboxes based on available storage types
     deleteStorageSelectionDiv.innerHTML = ''; // Clear previous checkboxes
     Object.keys(STORAGE_TYPES).forEach(key => {
         const label = document.createElement('label');
         label.innerHTML = `<input type="checkbox" class="delete-storage-checkbox" value="${key}" checked> ${STORAGE_TYPES[key]}`;
         deleteStorageSelectionDiv.appendChild(label);
     });

    deleteDataOptionsDiv.style.display = 'block';
     // Disable other main buttons while delete options are shown
     backupBtn.disabled = true;
     restoreInput.disabled = true;
     viewCurrentDataBtn.disabled = true;
     showDeleteOptionsBtn.disabled = true;
      // Enable delete option buttons
     executeDeleteBtnConfirm.disabled = false;
     cancelDeleteOptionsBtn.disabled = false;
     selectAllDeleteStorageBtn.disabled = false;
     deselectAllDeleteStorageBtn.disabled = false;

    logMessage("Select data areas to delete.");
}

// Hide the delete data options area and reset
function hideDeleteOptions() {
    deleteDataOptionsDiv.style.display = 'none';
    // Clear checkboxes
     deleteStorageSelectionDiv.innerHTML = '';
     // Re-enable main buttons
     backupBtn.disabled = false;
     restoreInput.disabled = false;
     viewCurrentDataBtn.disabled = false;
     showDeleteOptionsBtn.disabled = false;
     // Ensure delete option buttons are disabled if options are hidden
     executeDeleteBtnConfirm.disabled = true;
     cancelDeleteOptionsBtn.disabled = true;
     selectAllDeleteStorageBtn.disabled = true;
     deselectAllDeleteStorageBtn.disabled = true;
     logMessage("Delete options cancelled.");
}


// --- Permission Check ---

async function checkStoragePermission() {
    const granted = await chrome.permissions.contains({ permissions: ['storage'] });
    if (granted) {
        logMessage("Storage permission granted.");
        permissionWarningDiv.style.display = 'none';
        // Enable main functionality if permission is granted
        backupBtn.disabled = false;
        restoreInput.disabled = false;
         viewCurrentDataBtn.disabled = false;
         showDeleteOptionsBtn.disabled = false;
    } else {
        logMessage("Storage permission is not granted.", true);
        permissionWarningDiv.style.display = 'block';
        // Disable functionality if permission is missing
        backupBtn.disabled = true;
        restoreInput.disabled = true;
         viewCurrentDataBtn.disabled = true;
         showDeleteOptionsBtn.disabled = true;
        logElement.textContent = "Error: Storage permission is required."; // Clear main log for specific error
         logElement.className = 'log error';
    }
    return granted; // Return permission status
}


// --- Backup Functionality (Remains the same) ---

async function createBackup() {
   const hasPermission = await checkStoragePermission(); // Check permission
   if (!hasPermission) {
       logMessage("Backup failed: Storage permission is not granted.", true);
       return;
   }

  logMessage('Initiating backup creation process...');
  updateProgressBar(0);
  backupBtn.disabled = true; // Disable button during process
  restoreInput.disabled = true; // Disable restore during backup
   viewCurrentDataBtn.disabled = true; // Disable other management during backup
   showDeleteOptionsBtn.disabled = true;


  try {
    // Fetch data from different storage areas concurrently
    const [localData, syncData] = await Promise.all([
      new Promise((resolve, reject) => chrome.storage.local.get(null, (items) => {
        if (chrome.runtime.lastError) {
            reject(new Error(`chrome.storage.local.get error: ${chrome.runtime.lastError.message}`));
        } else {
            resolve(items);
        }
      })),
      new Promise((resolve, reject) => chrome.storage.sync.get(null, (items) => {
        if (chrome.runtime.lastError) {
             reject(new Error(`chrome.storage.sync.get error: ${chrome.runtime.lastError.message}`));
        } else {
             resolve(items);
        }
      }))
    ]);

    updateProgressBar(40); // Progress after fetching Chrome storage
    logMessage("Chrome storage data fetched.");

    // Include web storage data - these are synchronous
    const localStorageData = { ...localStorage };
    updateProgressBar(60);
    logMessage("Web Local Storage data fetched.");
    const sessionStorageData = { ...sessionStorage };
    updateProgressBar(80);
     logMessage("Web Session Storage data fetched.");

    // Construct the backup data object
    const backupData = {
      description: "Extension Data Backup", // Professional description
      date: new Date().toISOString(),
      version: 1, // Versioning for future compatibility/validation
      storage: {
        chrome_local: localData,
        chrome_sync: syncData,
        web_localStorage: localStorageData,
        web_sessionStorage: sessionStorageData
      }
    };

    // Check if any data was actually retrieved before creating the file
    if (Object.keys(localData).length === 0 &&
        Object.keys(syncData).length === 0 &&
        Object.keys(localStorageData).length === 0 &&
        Object.keys(sessionStorageData).length === 0) {
        logMessage("No data found in any storage area to create a backup.", false); // Not an error, just informative
        updateProgressBar(100); // Mark as completed process (no backup file created)
        return; // Stop the process if no data
    }


    // Create a Blob and trigger download
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extension-backup-${new Date().toISOString().split('T')[0]}.json`; // Standardized filename
    a.click();

    // Clean up the object URL
    URL.revokeObjectURL(url);

    updateProgressBar(100);
    logMessage('Backup successfully created and downloaded.');

  } catch (e) {
    updateProgressBar(0); // Reset on error
    logMessage(`Error during backup creation: ${e.message}`, true);
  } finally {
      backupBtn.disabled = false; // Re-enable button
      restoreInput.disabled = false; // Re-enable restore input
       viewCurrentDataBtn.disabled = false; // Re-enable other management
       showDeleteOptionsBtn.disabled = false;
  }
}

// --- Restore Functionality (Remains largely the same, uses granular updates) ---

// Validate backup data structure and basic integrity
function validateBackupData(data) {
  logMessage("Starting backup data validation...");
  if (!data || typeof data !== 'object') {
    logMessage("Validation failed: Backup data is not a valid object.", true);
    return false;
  }
  if (data.description !== "Extension Data Backup" || typeof data.date !== 'string' || typeof data.version !== 'number') {
     logMessage("Validation failed: Missing or invalid core backup information (description, date, version).", true);
     return false;
  }
  if (!data.storage || typeof data.storage !== 'object') {
    logMessage("Validation failed: 'storage' key is missing or invalid.", true);
    return false;
  }

  // Check for the presence of expected storage keys and ensure they are objects
  const expectedStorageKeys = Object.keys(STORAGE_TYPES); // Use the defined types
  for (const key of expectedStorageKeys) {
      // Check for presence OR if present, ensure it's a non-null object
      if (data.storage.hasOwnProperty(key)) {
          if (typeof data.storage[key] !== 'object' || data.storage[key] === null) {
               logMessage(`Validation failed: Data for storage area '${key}' is not a valid object.`, true);
               return false;
          }
      } else {
          // Log as info/warning if a key is missing, it allows selective restore to work
          logMessage(`Validation info: Missing expected storage key: '${key}'.`, false);
      }
  }

  // Basic integrity check: Attempt to re-stringify and parse to catch subtle issues
  try {
      JSON.parse(JSON.stringify(data));
  } catch (e) {
       logMessage(`Validation failed: Data integrity check failed during internal check: ${e.message}`, true);
       return false;
  }

  logMessage("Backup data validation successful. Ready to display details.");
  return true;
}


// Triggered when a file is selected - displays options
async function handleFileSelect(event) {
    const hasPermission = await checkStoragePermission(); // Check permission
   if (!hasPermission || restoreInput.disabled) { // Check again
       logMessage("Restore failed: Storage permission is not granted.", true);
       // Clear the file input
        event.target.value = '';
       return;
   }

  const file = event.target.files[0];
  if (!file) {
    logMessage('No file selected.');
     // Clear the file input in case user cancels file selection
    event.target.value = '';
    return;
  }

  logMessage(`Reading file "${file.name}"...`);
  updateProgressBar(10);

   // Disable other main buttons while file is being processed
    backupBtn.disabled = true;
    restoreInput.disabled = true; // Keep disabled while processing file
    viewCurrentDataBtn.disabled = true;
    showDeleteOptionsBtn.disabled = true;


  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const text = e.target.result;
      const data = JSON.parse(text);
      updateProgressBar(30);
      logMessage("File parsed successfully.");


      // Perform comprehensive validation
      if (!validateBackupData(data)) {
        // Error message already logged by validateBackupData
        updateProgressBar(0);
         // Clear the file input on validation failure
        event.target.value = '';
        return; // Stop process on validation failure
      }

      currentBackupData = data; // Store the validated data

      // Display backup details
      const details = currentBackupData;
      backupDetailsDiv.innerHTML = `
        <p><strong>File:</strong> ${file.name}</p>
        <p><strong>Date:</strong> ${new Date(details.date).toLocaleString()}</p>
        <p><strong>Version:</strong> ${details.version}</p>
        <p><strong>Description:</strong> ${details.description}</p>
      `;

      // Dynamically populate storage selection checkboxes
      storageSelectionDiv.innerHTML = ''; // Clear previous checkboxes

      const storage = details.storage || {};

      Object.keys(STORAGE_TYPES).forEach(key => {
          // Handle null or missing key gracefully for count
          const count = (storage.hasOwnProperty(key) && storage[key] !== null && typeof storage[key] === 'object') ? Object.keys(storage[key]).length : 0;
           const label = document.createElement('label');
           // Use a span to apply styling to the text part of the label
           label.innerHTML = `
              <input type="checkbox" class="storage-checkbox" value="${key}" ${count > 0 ? 'checked' : ''}>
              <span>${STORAGE_TYPES[key]}</span> (${count} items)
           `;
           // Disable checkbox if no data is present for this type in the backup OR key is missing OR data is not a valid object
           const isInvalidOrEmptyInBackup = !storage.hasOwnProperty(key) || storage[key] === null || typeof storage[key] !== 'object' || count === 0;

           if (isInvalidOrEmptyInBackup) {
              const checkbox = label.querySelector('input');
               checkbox.disabled = true;
               checkbox.checked = false; // Ensure it's not checked if disabled
                // Add info text if empty or missing
               const infoSpan = document.createElement('span');
               infoSpan.className = 'storage-item-info';
               if (!storage.hasOwnProperty(key)) {
                   infoSpan.textContent = "(Missing in backup - cannot restore this)";
               } else if (storage[key] === null || typeof storage[key] !== 'object') {
                    infoSpan.textContent = "(Invalid data format in backup)";
               }
               else if (count === 0) {
                  infoSpan.textContent = "(Empty in backup)";
               }

               label.appendChild(infoSpan);
           }
           storageSelectionDiv.appendChild(label);
      });

      updateProgressBar(50); // Progress after displaying details and options
      showRestoreOptions(); // Show the options and hide file input

    } catch (e) {
      updateProgressBar(0); // Reset on error
      logMessage(`Error reading or parsing file: ${e.message}`, true);
       // Clear the file input on error
      event.target.value = '';
    } finally {
        // Re-enable main buttons after file processing is complete (success or failure)
        backupBtn.disabled = false;
        // restoreInput is hidden if options are shown, re-enabled if hidden
        viewCurrentDataBtn.disabled = false;
        showDeleteOptionsBtn.disabled = false;
    }
  };

  reader.onerror = () => {
     updateProgressBar(0); // Reset on error
     logMessage('Error reading file.', true);
      // Clear the file input on error
     event.target.value = '';
      // Re-enable main buttons on file read error
    backupBtn.disabled = false;
    restoreInput.disabled = false;
    viewCurrentDataBtn.disabled = false;
    showDeleteOptionsBtn.disabled = false;
  };

  // Read the file as text
  reader.readAsText(file);
}

// Triggered when the user clicks "Restore Selected Data"
async function executeRestore() {
     const hasPermission = await checkStoragePermission(); // Ensure permission before starting
    if (!hasPermission || executeRestoreBtn.disabled) { // Check again
       logMessage("Restore failed: Storage permission is not granted or buttons are disabled.", true);
       return;
    }

    if (!currentBackupData) {
        logMessage("No backup data loaded. Please select a file first.", true);
        return;
    }

    // Get selected storage areas
    const selectedStorageAreas = Array.from(document.querySelectorAll('.storage-checkbox:checked'))
                                      .map(cb => cb.value);

    if (selectedStorageAreas.length === 0) {
        logMessage("No storage areas selected for restore. Please select at least one.", false); // Not an error, just info
        return;
    }

    // Add a confirmation prompt before proceeding
    if (!confirm(`Are you sure you want to restore data to the following areas?\n\n- ${selectedStorageAreas.map(key => STORAGE_TYPES[key] || key).join('\n- ')}\n\nThis will overwrite your current data in these areas.`)) {
        logMessage('Restore cancelled by user.');
        return; // Stop restore if cancelled
    }

    logMessage(`Initiating selected data restore process for: ${selectedStorageAreas.map(key => STORAGE_TYPES[key] || key).join(', ')}...`);
    updateProgressBar(0);
     executeRestoreBtn.disabled = true; // Disable buttons during restore
     cancelRestoreBtn.disabled = true;
     selectAllStorageBtn.disabled = true;
     deselectAllStorageBtn.disabled = true;


    const { storage } = currentBackupData;
    // There are 2 steps per selected area: clear and restore
    const totalSteps = selectedStorageAreas.length * 2;
    let completedSteps = 0;

    try {
        // Step 1: Clear existing storage *only* for selected areas before restoring
        logMessage(`Step 1 of 2: Clearing existing data in selected storage areas...`);
         const clearPromises = [];

         for (const key of selectedStorageAreas) {
             if (key.startsWith('chrome_')) {
                  logMessage(`Clearing ${STORAGE_TYPES[key]}...`);
                   clearPromises.push(new Promise((resolve, reject) => chrome.storage[key.replace('chrome_', '')].clear(() => {
                     if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                     else {
                          completedSteps++;
                          updateProgressBar((completedSteps / totalSteps) * 100);
                           logMessage(`${STORAGE_TYPES[key]} cleared.`);
                          resolve();
                     }
                   })));
             } else if (key === 'web_localStorage') {
                  logMessage("Clearing web_localStorage...");
                  localStorage.clear(); // localStorage.clear is synchronous
                   completedSteps++;
                   updateProgressBar((completedSteps / totalSteps) * 100);
                   logMessage("web_localStorage cleared.");
             } else if (key === 'web_sessionStorage') {
                  logMessage("Clearing web_sessionStorage...");
                  sessionStorage.clear(); // sessionStorage.clear is synchronous
                   completedSteps++;
                   updateProgressBar((completedSteps / totalSteps) * 100);
                   logMessage("web_sessionStorage cleared.");
             }
         }

        await Promise.all(clearPromises); // Wait for asynchronous clears


        logMessage("Step 1 Complete: Existing data cleared in selected areas.");


        // Step 2: Restore data to the correct different storage areas based on selection
        logMessage("Step 2 of 2: Restoring selected data from backup...");


        const restorePromises = [];

         for (const key of selectedStorageAreas) {
             if (key.startsWith('chrome_')) {
                  logMessage(`Restoring ${STORAGE_TYPES[key]}...`);
                  if (storage.hasOwnProperty(key) && storage[key] !== null && typeof storage[key] === 'object' && Object.keys(storage[key]).length > 0) {
                     restorePromises.push(new Promise((resolve, reject) => {
                        chrome.storage[key.replace('chrome_', '')].set(storage[key], () => {
                           if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                           else {
                               completedSteps++;
                               updateProgressBar((completedSteps / totalSteps) * 100);
                               logMessage(`${STORAGE_TYPES[key]} restore complete.`);
                               resolve();
                           }
                         });
                     }));
                  } else {
                       logMessage(`No data found in backup for ${STORAGE_TYPES[key]}.`, false);
                       completedSteps++; updateProgressBar((completedSteps / totalSteps) * 100); // Still count as processed
                  }
             } else if (key === 'web_localStorage') {
                 logMessage("Restoring web_localStorage...");
                 if (storage.hasOwnProperty(key) && storage[key] !== null && typeof storage[key] === 'object' && Object.keys(storage[key]).length > 0) {
                    Object.entries(storage[key]).forEach(([k, v]) => {
                        try {
                             localStorage.setItem(k, v);
                        } catch (e) {
                             console.warn(`Failed to restore localStorage key "${k}": ${e.message}`);
                             logMessage(`Warning: Failed to restore localStorage key "${k}".`, true);
                        }
                    });
                    completedSteps++;
                    updateProgressBar((completedSteps / totalSteps) * 100);
                    logMessage("web_localStorage restore complete.");
                 } else {
                     logMessage("No data found in backup for web_localStorage.", false);
                     completedSteps++; updateProgressBar((completedSteps / totalSteps) * 100); // Still count as processed
                 }
             } else if (key === 'web_sessionStorage') {
                 logMessage("Restoring web_sessionStorage...");
                 if (storage.hasOwnProperty(key) && storage[key] !== null && typeof storage[key] === 'object' && Object.keys(storage[key]).length > 0) {
                    Object.entries(storage[key]).forEach(([k, v]) => {
                         try {
                           sessionStorage.setItem(k, v);
                         } catch (e) {
                             console.warn(`Failed to restore sessionStorage key "${k}": ${e.message}`);
                             logMessage(`Warning: Failed to restore sessionStorage key "${k}".`, true);
                         }
                    });
                    completedSteps++;
                    updateProgressBar((completedSteps / totalSteps) * 100);
                    logMessage("web_sessionStorage restore complete.");
                 } else {
                     logMessage("No data found in backup for web_sessionStorage.", false);
                     completedSteps++; updateProgressBar((completedSteps / totalSteps) * 100); // Still count as processed
                 }
             }
         }


        await Promise.all(restorePromises); // Wait for asynchronous restores (chrome.storage)


        updateProgressBar(100);
        logMessage('Step 2 Complete: Selected data successfully restored. Please reload the extension or relevant pages for changes to take effect.');

    } catch (e) {
      updateProgressBar(0); // Reset on error
      logMessage(`Error during restore process: ${e.message}`, true);
    } finally {
        executeRestoreBtn.disabled = false; // Re-enable buttons
        cancelRestoreBtn.disabled = false;
        selectAllStorageBtn.disabled = false;
        deselectAllStorageBtn.disabled = false;
        // Optionally hide options after successful restore
        // hideRestoreOptions(); // Uncomment to auto-hide options after restore
    }
}


// --- Current Data Management Functionality ---

async function viewCurrentData() {
     const hasPermission = await checkStoragePermission(); // Check permission
    if (!hasPermission || viewCurrentDataBtn.disabled) { // Check again
       logMessage("Viewing data failed: Storage permission is not granted.", true);
       return;
    }

    logMessage("Fetching current extension data...");
    updateProgressBar(0);
     viewCurrentDataBtn.disabled = true; // Disable button during process
     backupBtn.disabled = true;
     restoreInput.disabled = true;
     showDeleteOptionsBtn.disabled = true;


    try {
         // Fetch data from different storage areas concurrently
        const [localData, syncData] = await Promise.all([
          new Promise((resolve, reject) => chrome.storage.local.get(null, (items) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(items);
          })),
          new Promise((resolve, reject) => chrome.storage.sync.get(null, (items) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(items);
          }))
        ]);
        updateProgressBar(40); logMessage("Chrome storage data fetched.");

        const localStorageData = { ...localStorage };
        updateProgressBar(60); logMessage("Web Local Storage data fetched.");
        const sessionStorageData = { ...sessionStorage };
        updateProgressBar(80); logMessage("Web Session Storage data fetched.");

        const currentData = {
            chrome_local: localData,
            chrome_sync: syncData,
            web_localStorage: localStorageData,
            web_sessionStorage: sessionStorageData
        };

        // Display the data
        currentDataDisplayDiv.innerHTML = ''; // Clear previous content
        currentDataDisplayDiv.style.display = 'block'; // Show the display area

        let hasData = false;
        Object.keys(STORAGE_TYPES).forEach(key => {
            const data = currentData[key];
            // Check if the data exists and is not empty
            if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                 hasData = true;
                 const title = document.createElement('h3');
                 title.textContent = STORAGE_TYPES[key];
                 currentDataDisplayDiv.appendChild(title);

                 const pre = document.createElement('pre');
                 // Use a try-catch just in case JSON.stringify fails for some reason, though unlikely for storage data
                 try {
                    pre.textContent = JSON.stringify(data, null, 2);
                 } catch (e) {
                     pre.textContent = `Error displaying data for ${STORAGE_TYPES[key]}: ${e.message}`;
                     console.error(`Error stringifying data for ${key}:`, e);
                 }
                 currentDataDisplayDiv.appendChild(pre);
            } else {
                 // Optional: display a message for empty areas
                 // const title = document.createElement('h3');
                 // title.textContent = STORAGE_TYPES[key];
                 // currentDataDisplayDiv.appendChild(title);
                 // const p = document.createElement('p');
                 // p.textContent = "(Empty)";
                 // currentDataDisplayDiv.appendChild(p);
            }
        });

        if (!hasData) {
             currentDataDisplayDiv.innerHTML = '<p>No data found in any storage area.</p>';
        }


        updateProgressBar(100);
        logMessage("Current extension data displayed.");

    } catch (e) {
        updateProgressBar(0); // Reset on error
        logMessage(`Error fetching or displaying current data: ${e.message}`, true);
         currentDataDisplayDiv.innerHTML = `<p class="error">Error fetching or displaying data: ${e.message}</p>`;
         currentDataDisplayDiv.style.display = 'block'; // Show the display area with the error
    } finally {
         viewCurrentDataBtn.disabled = false; // Re-enable button
         backupBtn.disabled = false;
         restoreInput.disabled = false;
         showDeleteOptionsBtn.disabled = false;
    }
}


async function executeDeleteSelectedData() {
     const hasPermission = await checkStoragePermission(); // Ensure permission before starting
    if (!hasPermission || executeDeleteBtnConfirm.disabled) { // Check again
       logMessage("Deletion failed: Storage permission is not granted or buttons are disabled.", true);
       return;
    }


    // Get selected storage areas for deletion
    const selectedStorageAreas = Array.from(document.querySelectorAll('.delete-storage-checkbox:checked'))
                                      .map(cb => cb.value);

    if (selectedStorageAreas.length === 0) {
        logMessage("No storage areas selected for deletion. Please select at least one.", false);
        return;
    }

    // Add a strong confirmation prompt for deletion
    if (!confirm(`WARNING: You are about to permanently delete data from the following areas:\n\n- ${selectedStorageAreas.map(key => STORAGE_TYPES[key] || key).join('\n- ')}\n\nThis action is irreversible. Are you absolutely sure you want to proceed?`)) {
        logMessage('Deletion cancelled by user.');
        return; // Stop deletion if cancelled
    }

    logMessage(`Initiating deletion process for selected data areas: ${selectedStorageAreas.map(key => STORAGE_TYPES[key] || key).join(', ')}...`);
    updateProgressBar(0);
     executeDeleteBtnConfirm.disabled = true; // Disable buttons during deletion
     cancelDeleteOptionsBtn.disabled = true;
     selectAllDeleteStorageBtn.disabled = true;
     deselectAllDeleteStorageBtn.disabled = true;


    const totalAreasToDelete = selectedStorageAreas.length;
    let completedDeletions = 0;

    try {
         const deletePromises = [];

         for (const key of selectedStorageAreas) {
             if (key.startsWith('chrome_')) {
                  logMessage(`Deleting data from ${STORAGE_TYPES[key]}...`);
                   deletePromises.push(new Promise((resolve, reject) => chrome.storage[key.replace('chrome_', '')].clear(() => {
                     if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                     else {
                          completedDeletions++;
                          updateProgressBar((completedDeletions / totalAreasToDelete) * 100);
                           logMessage(`${STORAGE_TYPES[key]} deleted.`);
                          resolve();
                     }
                   })));
             } else if (key === 'web_localStorage') {
                  logMessage("Deleting data from web_localStorage...");
                  localStorage.clear(); // localStorage.clear is synchronous
                   completedDeletions++;
                   updateProgressBar((completedDeletions / totalAreasToDelete) * 100);
                   logMessage("web_localStorage deleted.");
             } else if (key === 'web_sessionStorage') {
                  logMessage("Deleting data from web_sessionStorage...");
                  sessionStorage.clear(); // sessionStorage.clear is synchronous
                   completedDeletions++;
                   updateProgressBar((completedDeletions / totalAreasToDelete) * 100);
                   logMessage("web_sessionStorage deleted.");
             }
         }

        await Promise.all(deletePromises); // Wait for asynchronous deletions


        updateProgressBar(100);
        logMessage('Selected data successfully deleted.');
        hideDeleteOptions(); // Hide the delete options after successful deletion
         // Optionally refresh the view data display if it's visible
         if (currentDataDisplayDiv.style.display !== 'none') {
             viewCurrentData();
         }


    } catch (e) {
      updateProgressBar(0); // Reset on error
      logMessage(`Error during deletion process: ${e.message}`, true);
    } finally {
        executeDeleteBtnConfirm.disabled = false; // Re-enable buttons
        cancelDeleteOptionsBtn.disabled = false;
        selectAllDeleteStorageBtn.disabled = false;
        deselectAllDeleteStorageBtn.disabled = false;
    }
}


// --- Event Listeners ---

backupBtn.addEventListener('click', createBackup);
restoreInput.addEventListener('change', handleFileSelect);
executeRestoreBtn.addEventListener('click', executeRestore);
cancelRestoreBtn.addEventListener('click', hideRestoreOptions);

showLogHistoryBtn.addEventListener('click', () => {
    const isHidden = logHistoryDiv.style.display === 'none';
    logHistoryDiv.style.display = isHidden ? 'block' : 'none';
    showLogHistoryBtn.textContent = isHidden ? 'Hide Activity Log' : 'Show Activity Log';
    if (isHidden) {
        displayLogHistory(); // Refresh display when showing
    }
});

selectAllStorageBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent form submission
    document.querySelectorAll('#storageSelection .storage-checkbox').forEach(checkbox => {
        if (!checkbox.disabled) { // Only select if not disabled
            checkbox.checked = true;
        }
    });
});

deselectAllStorageBtn.addEventListener('click', (event) => {
     event.preventDefault(); // Prevent form submission
    document.querySelectorAll('#storageSelection .storage-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
});

// New Data Management Event Listeners
viewCurrentDataBtn.addEventListener('click', viewCurrentData);

showDeleteOptionsBtn.addEventListener('click', showDeleteOptions);

executeDeleteBtnConfirm.addEventListener('click', executeDeleteSelectedData);
cancelDeleteOptionsBtn.addEventListener('click', hideDeleteOptions);

selectAllDeleteStorageBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent form submission
     document.querySelectorAll('#deleteStorageSelection .delete-storage-checkbox').forEach(checkbox => {
         checkbox.checked = true;
     });
});

deselectAllDeleteStorageBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent form submission
     document.querySelectorAll('#deleteStorageSelection .delete-storage-checkbox').forEach(checkbox => {
         checkbox.checked = false;
     });
});


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initially disable buttons that depend on file selection/other processes
    executeRestoreBtn.disabled = true;
    cancelRestoreBtn.disabled = true;
     selectAllStorageBtn.disabled = true;
     deselectAllStorageBtn.disabled = true;

     executeDeleteBtnConfirm.disabled = true;
     cancelDeleteOptionsBtn.disabled = true;
      selectAllDeleteStorageBtn.disabled = true;
      deselectAllDeleteStorageBtn.disabled = true;


    // Check for storage permission on page load
    checkStoragePermission();
});
