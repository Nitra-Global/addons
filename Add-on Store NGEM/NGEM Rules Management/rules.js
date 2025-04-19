(function() {
  'use strict';

  // --- Constants ---
  const SELECTORS = {
    form: '#new-rule-form',
    ruleNameInput: '#rule-name',
    extensionSelect: '#extension-select',
    actionSelect: '#action-select',
    scheduleTimeInput: '#schedule-time',
    dayButtons: '.day-btn',
    selectedDaysInput: '#selected-days',
    startDateInput: '#start-date',
    endDateInput: '#end-date',
    rulesList: '#rules-list',
    noRulesMessage: '#no-rules',
    ruleFeedback: '#rule-feedback',
    submitButton: '#submit-rule-btn',
    cancelEditButton: '#cancel-edit-btn',
    editingRuleIndexInput: '#editing-rule-index',
    ruleSearchInput: '#rule-search',
    currentYearSpan: '#current-year',
    advancedOptionsDetails: '.advanced-options',
  };

  const MESSAGES = {
    ruleAdded: 'Rule Added Successfully!',
    ruleEdited: 'Rule Edited Successfully!',
    ruleDeleted: 'Rule Deleted!',
    ruleActivated: 'Rule Activated!',
    ruleDeactivated: 'Rule Deactivated!',
    deleteConfirm: 'Are you sure you want to delete this rule?',
    loadError: 'Error loading rules from storage.',
    parseError: 'Error parsing stored rules data.',
    formError: 'Please fill out all required fields correctly.',
    fetchExtError: 'Could not fetch installed extensions.',
  };

  const STORAGE_KEY = 'extensionScheduleRules_v2'; // Use a new key if format changed significantly

  // --- State ---
  let rules = [];
  let allInstalledExtensions = []; // Store all installed extensions info
  let currentEditingIndex = -1; // Track index of rule being edited

  // --- DOM Elements ---
  // Find elements once and store them
  const dom = {};
  for (const key in SELECTORS) {
    if (SELECTORS.hasOwnProperty(key)) {
      dom[key] = document.querySelector(SELECTORS[key]);
      // Check if crucial elements exist
      if (!dom[key] && ['form', 'rulesList', 'extensionSelect', 'actionSelect', 'scheduleTimeInput'].includes(key)) {
          console.error(`Critical DOM element not found: ${SELECTORS[key]}`);
          // Optionally disable functionality or show an error message to the user
          // For now, we'll just log it. Errors will occur later if these are null.
      }
    }
  }
  // Get multiple elements
  dom.dayButtons = document.querySelectorAll(SELECTORS.dayButtons);


  // --- Helper Functions ---

  /**
   * Displays a feedback message to the user.
   * @param {string} message The message to display.
   * @param {'success' | 'error'} type The type of message.
   * @param {number} duration How long to show the message (in ms).
   */
  function showFeedback(message, type = 'success', duration = 3000) {
    if (!dom.ruleFeedback) return;
    dom.ruleFeedback.textContent = message;
    dom.ruleFeedback.className = `feedback ${type}`; // Reset classes
    dom.ruleFeedback.classList.remove('hidden');
    dom.ruleFeedback.setAttribute('role', type === 'error' ? 'alert' : 'status');

    // Clear previous timeout if any
    if (dom.ruleFeedback.timeoutId) {
      clearTimeout(dom.ruleFeedback.timeoutId);
    }

    dom.ruleFeedback.timeoutId = setTimeout(() => {
      dom.ruleFeedback.classList.add('hidden');
      dom.ruleFeedback.removeAttribute('role');
      dom.ruleFeedback.timeoutId = null;
    }, duration);
  }

  /**
   * Gets the name of the current day (e.g., "Monday").
   * @returns {string} The name of the current day.
   */
  function getCurrentDayName() {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return days[new Date().getDay()];
  }

  /**
   * Checks if a rule should be active based on the current date and day.
   * @param {object} rule The rule object.
   * @returns {boolean} True if the rule should be active today, false otherwise.
   */
  function isRuleActiveToday(rule) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Compare dates only

    // 1. Check overall active status
    if (rule.active === false) return false; // Explicitly deactivated by user

    // 2. Check date range
    if (rule.startDate) {
        const startDate = new Date(rule.startDate + 'T00:00:00'); // Ensure comparison starts at beginning of day
        if (today < startDate) return false;
    }
    if (rule.endDate) {
        const endDate = new Date(rule.endDate + 'T23:59:59'); // Ensure comparison ends at end of day
        if (today > endDate) return false;
    }

    // 3. Check days of the week
    if (rule.days && rule.days.length > 0) {
        const currentDay = getCurrentDayName();
        if (!rule.days.includes(currentDay)) {
            return false;
        }
    }

    // If all checks pass, the rule is active for today
    return true;
  }


  // --- Core Logic ---

  /**
   * Loads extensions from chrome.management API and populates the select dropdown.
   */
  function loadExtensions() {
    if (!chrome || !chrome.management || !chrome.management.getAll) {
        showFeedback('Cannot access Chrome Extension Management API.', 'error', 5000);
        return;
    }
    chrome.management.getAll(extensions => {
      if (chrome.runtime.lastError) {
        console.error(MESSAGES.fetchExtError, chrome.runtime.lastError);
        showFeedback(MESSAGES.fetchExtError, 'error', 5000);
        return;
      }
      // Filter out themes and self
      allInstalledExtensions = extensions.filter(ext => ext.type === 'extension' && ext.id !== chrome.runtime.id);
      allInstalledExtensions.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

      if (!dom.extensionSelect) return;

      dom.extensionSelect.innerHTML = '<option value="">-- Select an extension --</option>'; // Clear existing options
      allInstalledExtensions.forEach(extension => {
        const option = document.createElement('option');
        option.value = extension.id;
        option.textContent = extension.name;
        // Store icon URL and enabled status in data attributes for easy access
        option.dataset.iconUrl = extension.icons && extension.icons.length > 0 ? extension.icons[extension.icons.length - 1].url : 'default_icon.png'; // Provide a fallback icon
        option.dataset.enabled = extension.enabled;
        dom.extensionSelect.appendChild(option);
      });

      // Now that extensions are loaded, load the rules that might depend on them
      loadRules();
    });
  }

  /**
   * Saves the current rules array to chrome.storage.local.
   */
  function saveRules() {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
        showFeedback('Cannot access Chrome Storage API.', 'error', 5000);
        return;
    }
    try {
        const dataToSave = JSON.stringify(rules);
        chrome.storage.local.set({ [STORAGE_KEY]: dataToSave }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving rules:", chrome.runtime.lastError);
                showFeedback('Error saving rules.', 'error');
            }
            // Optional: Add a subtle save indicator if needed
        });
    } catch (e) {
        console.error("Could not stringify rules for saving:", e);
        showFeedback('Error preparing rules for saving.', 'error');
    }
  }

  /**
   * Loads rules from chrome.storage.local.
   */
  function loadRules() {
     if (!chrome || !chrome.storage || !chrome.storage.local) {
        showFeedback('Cannot access Chrome Storage API.', 'error', 5000);
        return;
    }
    chrome.storage.local.get(STORAGE_KEY, data => {
      if (chrome.runtime.lastError) {
        console.error(MESSAGES.loadError, chrome.runtime.lastError);
        showFeedback(MESSAGES.loadError, 'error');
        rules = []; // Reset rules on load error
      } else if (data && data[STORAGE_KEY]) {
        try {
          rules = JSON.parse(data[STORAGE_KEY]);
          // Basic validation: ensure it's an array
          if (!Array.isArray(rules)) {
              console.warn("Stored rules data is not an array. Resetting.");
              rules = [];
          }
          // Ensure default 'active' state if missing from older rules
          rules.forEach(rule => {
              if (rule.active === undefined) {
                  rule.active = true;
              }
          });
        } catch (e) {
          console.error(MESSAGES.parseError, e);
          showFeedback(MESSAGES.parseError, 'error');
          rules = []; // Reset rules on parse error
        }
      } else {
        rules = []; // No rules saved yet
      }
      displayRules(); // Display rules after loading
      scheduleAlarms(); // Schedule alarms based on loaded rules
    });
  }

  /**
 * Escapes basic HTML characters to prevent XSS in display.
 * Safer than the previous version for attributes.
 * @param {string} str The string to escape.
 * @returns {string} Escaped string.
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  str = String(str); // Ensure it's a string
  return str.replace(/[&<>"']/g, function (match) {
      switch (match) {
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#39;'; // or '&#x27;'
          default: return match;
      }
  });
}


/**
* Displays the current list of rules in the UI.
*/
function displayRules() {
  // Ensure required DOM elements exist
  if (!dom.rulesList || !dom.noRulesMessage || !dom.ruleSearchInput) {
      console.error("Cannot display rules: Essential DOM elements missing.");
      return;
  }

  dom.rulesList.innerHTML = ''; // Clear previous list
  const searchTerm = dom.ruleSearchInput.value.toLowerCase();

  // Filter rules based on search term before processing
  const filteredRules = rules.filter((rule, index) => {
      const extensionInfo = allInstalledExtensions.find(ext => ext.id === rule.extensionId) || { name: 'Unknown Extension', iconUrl: null };
      const ruleName = rule.name ? rule.name.toLowerCase() : '';
      const extensionName = extensionInfo.name.toLowerCase();
      // Include index in a temporary object for later use
      rule._originalIndex = index; // Store original index before filtering

      if (!searchTerm) return true; // Show all if search is empty
      return ruleName.includes(searchTerm) || extensionName.includes(searchTerm);
  });


  if (filteredRules.length === 0) {
      dom.noRulesMessage.classList.remove('hidden');
      dom.rulesList.classList.add('hidden'); // Hide the list itself
      // If search term exists, adjust the no rules message
      if (searchTerm) {
          dom.noRulesMessage.textContent = `No rules found matching "${escapeHTML(searchTerm)}".`;
          dom.noRulesMessage.style.fontStyle = 'normal'; // Reset style
      } else {
          dom.noRulesMessage.textContent = "No rules created yet. Use the form on the left to add one!";
           dom.noRulesMessage.style.fontStyle = 'italic';
      }
      return;
  }

  // Rules exist (or filtered rules exist)
  dom.noRulesMessage.classList.add('hidden');
  dom.rulesList.classList.remove('hidden');

  const fragment = document.createDocumentFragment(); // Use fragment for performance

  filteredRules.forEach((rule) => {
      const index = rule._originalIndex; // Get the original index for data attributes
      const extensionInfo = allInstalledExtensions.find(ext => ext.id === rule.extensionId) || { name: 'Unknown Extension (Removed?)', iconUrl: null }; // Handle missing extensions gracefully
      const isActive = rule.active !== undefined ? rule.active : true;
      const timeFormatted = formatTimeForDisplay(rule.time);

      const listItem = document.createElement('li');
      listItem.dataset.index = index; // Use original index
      if (!isActive) {
          listItem.classList.add('rule-inactive'); // Add class for styling inactive rules
      }
      if (index === currentEditingIndex) {
          listItem.classList.add('is-editing');
      }

      let dateRangeString = '';
      if (rule.startDate && rule.endDate) {
          dateRangeString = `Active: ${escapeHTML(rule.startDate)} to ${escapeHTML(rule.endDate)}`;
      } else if (rule.startDate) {
          dateRangeString = `Active from: ${escapeHTML(rule.startDate)}`;
      } else if (rule.endDate) {
          dateRangeString = `Active until: ${escapeHTML(rule.endDate)}`;
      }

      // *** CSP Fix: Removed onerror attribute from innerHTML ***
      // *** Icon Path Fix: Use absolute path /icons/default_icon.png ***
      listItem.innerHTML = `
        <div class="rule-details">
          <img src="${escapeHTML(extensionInfo.iconUrl || '/icons/default_icon.png')}" alt="${escapeHTML(extensionInfo.name)} Icon" class="extension-icon">
          <div class="rule-info">
            ${rule.name ? `<strong class="rule-custom-name">${escapeHTML(rule.name)}</strong>` : `<strong class="rule-custom-name rule-name-missing">Rule for ${escapeHTML(extensionInfo.name)}</strong>`}
            <span class="rule-action">
              <strong class="rule-ext-name">${escapeHTML(extensionInfo.name)}</strong> will
              <strong>${escapeHTML(rule.action)}</strong>
            </span>
            <span class="rule-schedule">at <strong>${escapeHTML(timeFormatted)}</strong>, ${escapeHTML(rule.days && rule.days.length > 0 ? rule.days.join(', ') : 'Daily')}</span>
            ${dateRangeString ? `<span class="rule-date-range">${dateRangeString}</span>` : ''}
          </div>
        </div>
        <div class="rule-actions">
          <div class="toggle-container">
            <label for="toggle-${index}" class="toggle-label">Active:</label>
            <label class="switch">
              <input type="checkbox" id="toggle-${index}" data-index="${index}" ${isActive ? 'checked' : ''} aria-label="Activate or Deactivate Rule ${escapeHTML(rule.name || extensionInfo.name)}">
              <span class="slider round"></span>
            </label>
          </div>
          <div class="button-group"> <button class="edit-rule-btn" data-index="${index}" title="Edit Rule">Edit</button>
            <button class="delete-rule-btn" data-index="${index}" title="Delete Rule">Delete</button>
          </div>
        </div>
      `;

      // *** CSP Fix: Attach onerror listener programmatically ***
      const iconImg = listItem.querySelector('.extension-icon');
      if (iconImg) {
          iconImg.addEventListener('error', function handleIconError() {
              // Check if src is already the default to prevent infinite loops if default is also missing
              if (this.src !== chrome.runtime.getURL('/icons/default_icon.png')) {
                  this.src = '/icons/default_icon.png'; // Use absolute path
                  this.alt = 'Default Icon';
              }
               // Optionally remove the listener if you only want it to trigger once
               // this.removeEventListener('error', handleIconError);
          });
      }

      fragment.appendChild(listItem);
  });

  dom.rulesList.appendChild(fragment);

    // Add event listeners AFTER appending to the DOM (event delegation could be an alternative)
    addRuleActionListeners();
  }

 /**
 * Formats time (HH:MM) for display, potentially converting to AM/PM.
 * @param {string} timeString - Time in HH:MM format.
 * @returns {string} Formatted time string.
 */
 function formatTimeForDisplay(timeString) {
    if (!timeString) return '??:??';
    try {
        const [hours, minutes] = timeString.split(':').map(Number);
        // Basic formatting, could be extended for AM/PM if desired
        const hh = String(hours).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        return `${hh}:${mm}`;
        // // Example AM/PM conversion:
        // const ampm = hours >= 12 ? 'PM' : 'AM';
        // const displayHours = hours % 12 || 12; // Convert hour 0 to 12
        // return `${String(displayHours).padStart(2, '0')}:${mm} ${ampm}`;
    } catch (e) {
        console.error("Error formatting time:", timeString, e);
        return timeString; // Return original on error
    }
}

/**
 * Escapes basic HTML characters to prevent XSS in display.
 * @param {string} str The string to escape.
 * @returns {string} Escaped string.
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;' // او &#x27;
        }[match];
    });
}


  /**
   * Adds event listeners to the edit, delete, and toggle buttons on rule items.
   */
  function addRuleActionListeners() {
      if (!dom.rulesList) return;

      dom.rulesList.querySelectorAll('.delete-rule-btn').forEach(button => {
          // Remove existing listener before adding a new one to prevent duplicates if displayRules is called often
          button.replaceWith(button.cloneNode(true)); // Simple way to remove listeners
      });
      dom.rulesList.querySelectorAll('.edit-rule-btn').forEach(button => {
          button.replaceWith(button.cloneNode(true));
      });
      dom.rulesList.querySelectorAll('.rule-actions input[type="checkbox"]').forEach(toggle => {
          toggle.replaceWith(toggle.cloneNode(true));
      });

      // Add new listeners
      dom.rulesList.addEventListener('click', handleRuleListClick);
      dom.rulesList.addEventListener('change', handleRuleListChange);

  }

  function handleRuleListClick(event) {
       if (event.target.matches('.delete-rule-btn')) {
            const indexToDelete = parseInt(event.target.dataset.index);
            if (!isNaN(indexToDelete)) {
                deleteRule(indexToDelete);
            }
        } else if (event.target.matches('.edit-rule-btn')) {
            const indexToEdit = parseInt(event.target.dataset.index);
             if (!isNaN(indexToEdit)) {
                prepareEditRule(indexToEdit);
            }
        }
  }

   function handleRuleListChange(event) {
       if (event.target.matches('.rule-actions input[type="checkbox"]')) {
            const indexToToggle = parseInt(event.target.dataset.index);
            if (!isNaN(indexToToggle)) {
                toggleRuleActiveState(indexToToggle, event.target.checked);
            }
        }
   }


  /**
   * Toggles the active state of a rule.
   * @param {number} index The index of the rule to toggle.
   * @param {boolean} isActive The new active state.
   */
  function toggleRuleActiveState(index, isActive) {
     if (rules[index]) {
        rules[index].active = isActive;
        saveRules();
        scheduleAlarms(); // Reschedule alarms as active state changed
        showFeedback(isActive ? MESSAGES.ruleActivated : MESSAGES.ruleDeactivated);
        displayRules(); // Refresh display to update visual state (e.g., opacity)
      }
  }

  /**
   * Handles the selection/deselection of day buttons.
   */
  function handleDayButtonClick(event) {
      if (!event.target.matches(SELECTORS.dayButtons)) return;
      event.target.classList.toggle('selected');
      updateSelectedDaysInput();
  }

  /**
   * Updates the hidden input field with the currently selected days.
   */
  function updateSelectedDaysInput() {
    if (!dom.selectedDaysInput) return;
    const selected = Array.from(dom.dayButtons)
      .filter(button => button.classList.contains('selected'))
      .map(button => button.dataset.day);
    dom.selectedDaysInput.value = selected.join(',');
  }

  /**
   * Selects the day buttons in the UI based on an array of day names.
   * @param {string[]} daysArray Array of day names (e.g., ["Monday", "Friday"]).
   */
  function selectDaysForEdit(daysArray = []) {
    dom.dayButtons.forEach(button => {
      if (daysArray.includes(button.dataset.day)) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
    });
    updateSelectedDaysInput();
  }

  /**
   * Deletes a rule after confirmation.
   * @param {number} index The index of the rule to delete.
   */
  function deleteRule(index) {
    if (confirm(MESSAGES.deleteConfirm)) {
      rules.splice(index, 1);
      saveRules();
      if (index === currentEditingIndex) { // If deleting the rule currently being edited
          resetForm();
      }
      displayRules();
      scheduleAlarms(); // Re-schedule alarms after deletion
      showFeedback(MESSAGES.ruleDeleted);
    }
  }

  /**
   * Populates the form with the details of the rule to be edited.
   * @param {number} index The index of the rule to edit.
   */
  function prepareEditRule(index) {
    if (!dom.form || !rules[index]) return;

    currentEditingIndex = index; // Set global editing index
    const ruleToEdit = rules[index];

    // Populate form fields
    if (dom.ruleNameInput) dom.ruleNameInput.value = ruleToEdit.name || '';
    if (dom.extensionSelect) dom.extensionSelect.value = ruleToEdit.extensionId;
    if (dom.actionSelect) {
        // Temporarily allow both actions during edit, then update based on selection
        updateActionSelectOptions(ruleToEdit.extensionId, true);
        dom.actionSelect.value = ruleToEdit.action;
    }
    if (dom.scheduleTimeInput) dom.scheduleTimeInput.value = ruleToEdit.time;
    if (dom.startDateInput) dom.startDateInput.value = ruleToEdit.startDate || '';
    if (dom.endDateInput) dom.endDateInput.value = ruleToEdit.endDate || '';

    selectDaysForEdit(ruleToEdit.days);

    // Update button text and visibility
    if (dom.submitButton) dom.submitButton.textContent = 'Save Edit';
    if (dom.cancelEditButton) dom.cancelEditButton.classList.remove('hidden');
    if (dom.editingRuleIndexInput) dom.editingRuleIndexInput.value = index;

    // Open advanced options if dates are set
    if (dom.advancedOptionsDetails && (ruleToEdit.startDate || ruleToEdit.endDate)) {
        dom.advancedOptionsDetails.open = true;
    }

    // Highlight the rule being edited in the list
    displayRules(); // Re-render to apply highlighting

    // Scroll form into view (optional)
    dom.form.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Resets the form to its default state, cancelling any ongoing edit.
   */
  function resetForm() {
    if (!dom.form) return;
    dom.form.reset(); // Resets native form elements
    selectDaysForEdit([]); // Clear day selections
    if (dom.ruleNameInput) dom.ruleNameInput.value = ''; // Clear custom fields
    if (dom.startDateInput) dom.startDateInput.value = '';
    if (dom.endDateInput) dom.endDateInput.value = '';

    if (dom.submitButton) dom.submitButton.textContent = 'Add New Rule';
    if (dom.cancelEditButton) dom.cancelEditButton.classList.add('hidden');
    if (dom.editingRuleIndexInput) dom.editingRuleIndexInput.value = "-1"; // Reset hidden index
    if (dom.advancedOptionsDetails) dom.advancedOptionsDetails.open = false; // Close advanced options

    currentEditingIndex = -1; // Reset global state

    // Update action dropdown for the default "-- Select --" state
    updateActionSelectOptions('');

    // Remove any editing highlight from the list
    displayRules();
  }

  /**
   * Handles the form submission for adding or editing a rule.
   * @param {Event} event The form submission event.
   */
  function handleFormSubmit(event) {
    event.preventDefault();
    if (!dom.extensionSelect || !dom.actionSelect || !dom.scheduleTimeInput || !dom.selectedDaysInput || !dom.editingRuleIndexInput) {
      console.error("Required form elements not found.");
      showFeedback(MESSAGES.formError, 'error');
      return;
    }

    const extensionId = dom.extensionSelect.value;
    const action = dom.actionSelect.value;
    const time = dom.scheduleTimeInput.value;
    const name = dom.ruleNameInput ? dom.ruleNameInput.value.trim() : '';
    const selectedDays = dom.selectedDaysInput.value ? dom.selectedDaysInput.value.split(',') : [];
    const startDate = dom.startDateInput ? dom.startDateInput.value : '';
    const endDate = dom.endDateInput ? dom.endDateInput.value : '';
    const editIndex = parseInt(dom.editingRuleIndexInput.value, 10);

    // Basic Validation
    if (!extensionId || !action || !time) {
        showFeedback(MESSAGES.formError, 'error');
        // Optionally highlight specific fields
        return;
    }
    // Date range validation (end date should not be before start date)
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        showFeedback("End date cannot be before start date.", 'error');
        if(dom.endDateInput) dom.endDateInput.focus();
        return;
    }


    const newRule = {
        name: name, // Store even if empty
        extensionId,
        action,
        time,
        days: selectedDays.filter(day => day), // Ensure no empty strings if split resulted in them
        startDate: startDate || null, // Store null if empty
        endDate: endDate || null,   // Store null if empty
        active: true // Default to active, preserve state if editing? Let's default to true on edit too.
    };

    if (editIndex >= 0 && rules[editIndex]) { // Editing existing rule
      // Preserve the original 'active' state unless explicitly changed via toggle
      newRule.active = rules[editIndex].active;
      rules[editIndex] = newRule;
      showFeedback(MESSAGES.ruleEdited);
    } else { // Adding new rule
      rules.push(newRule);
      showFeedback(MESSAGES.ruleAdded);
    }

    saveRules();
    resetForm(); // Reset form after successful add/edit
    displayRules(); // Refresh list immediately
    scheduleAlarms(); // Update alarms
  }

  /**
   * Schedules alarms using the chrome.alarms API based on active rules.
   */
 function scheduleAlarms() {
    if (!chrome || !chrome.alarms) {
      console.warn("Chrome Alarms API not available.");
      return;
    }

    chrome.alarms.clearAll(() => { // Clear existing alarms first
        if (chrome.runtime.lastError) {
            console.error("Error clearing alarms:", chrome.runtime.lastError);
        }

        rules.forEach((rule, index) => {
            const isActive = rule.active !== undefined ? rule.active : true;

            // Only schedule alarms for rules that are *globally* active
            // The isRuleActiveToday check happens *when the alarm fires*
            if (isActive) {
                try {
                    const [hours, minutes] = rule.time.split(':').map(Number);

                    // Create a unique alarm name including the rule index for easy lookup
                    // Format: rule-<index>-<extId>-<action> (Keep simple for parsing)
                    const alarmName = `rule-${index}-${rule.extensionId}-${rule.action}`;

                    // Calculate the next occurrence time
                    const now = new Date();
                    let nextRun = new Date();
                    nextRun.setHours(hours, minutes, 0, 0); // Set target time for today

                    // If target time is already past for today, schedule for tomorrow
                    if (nextRun <= now) {
                         nextRun.setDate(nextRun.getDate() + 1);
                    }

                    // Create a repeating daily alarm. The listener will check day/date constraints.
                    chrome.alarms.create(alarmName, {
                         when: nextRun.getTime(),
                         periodInMinutes: 24 * 60 // Repeat every day
                    });
                     // console.log(`Alarm scheduled: ${alarmName} for ${nextRun}`); // DEBUG

                } catch (e) {
                    console.error(`Error scheduling alarm for rule index ${index}:`, rule, e);
                }
            }
        });
        // console.log("Alarms scheduling complete."); // DEBUG
    });
}


  /**
   * Handles incoming alarms from the chrome.alarms API.
   * This function needs to run in the background script context (service worker).
   * Here, we simulate its core logic for demonstration within the options page JS.
   * *** IMPORTANT: This logic MUST exist in your background script (service worker) for the extension to function when the options page is closed. ***
   */
  function handleAlarm(alarm) {
      console.log("Alarm fired:", alarm.name); // DEBUG

      if (alarm.name.startsWith('rule-')) {
          try {
                const parts = alarm.name.split('-');
                const ruleIndex = parseInt(parts[1], 10);
                const extensionId = parts[2];
                const action = parts[3]; // 'enable' or 'disable'

                // Find the rule based on the index from the alarm name
                const rule = rules[ruleIndex];

                if (!rule) {
                    console.warn(`Alarm fired for non-existent rule index: ${ruleIndex}`);
                    // Optionally clear this specific alarm if the rule was deleted
                    chrome.alarms.clear(alarm.name);
                    return;
                }

                // *** CRUCIAL CHECK ***
                // Verify if the rule should actually run *today* based on its settings
                if (isRuleActiveToday(rule)) {
                    console.log(`Executing action '${action}' for extension ${extensionId} based on rule:`, rule);
                     if (chrome && chrome.management && chrome.management.setEnabled) {
                         chrome.management.setEnabled(extensionId, action === 'enable', () => {
                            if (chrome.runtime.lastError) {
                                console.error(`Error executing rule action for ${extensionId}:`, chrome.runtime.lastError);
                            } else {
                                console.log(`Action '${action}' completed for ${extensionId}.`);
                            }
                        });
                     } else {
                         console.warn("Simulating action - chrome.management API not available in this context.");
                     }
                } else {
                    console.log(`Rule ${ruleIndex} (${rule.name || extensionId}) skipped today (Not active or outside date/day constraints).`);
                }

          } catch (e) {
              console.error("Error processing alarm:", alarm.name, e);
          }
      }
  }

  /**
   * Updates the action select dropdown based on the selected extension's current state.
   * @param {string} selectedExtensionId The ID of the currently selected extension.
   * @param {boolean} [allowBoth=false] If true, show both Enable and Disable options (used during edit).
   */
  function updateActionSelectOptions(selectedExtensionId, allowBoth = false) {
    if (!dom.actionSelect) return;

    const selectedExtension = allInstalledExtensions.find(ext => ext.id === selectedExtensionId);
    const currentActionValue = dom.actionSelect.value; // Preserve selection if possible

    dom.actionSelect.innerHTML = ''; // Clear existing

    if (allowBoth) {
         // Add both options when editing, regardless of current state
         const enableOption = document.createElement('option');
         enableOption.value = 'enable';
         enableOption.textContent = 'Enable';
         dom.actionSelect.appendChild(enableOption);

         const disableOption = document.createElement('option');
         disableOption.value = 'disable';
         disableOption.textContent = 'Disable';
         dom.actionSelect.appendChild(disableOption);

         // Try to restore previous selection
         if (currentActionValue) {
            dom.actionSelect.value = currentActionValue;
         }

    } else if (selectedExtension) {
        // Standard behavior: Show only the relevant action based on current state
      if (!selectedExtension.enabled) {
        const enableOption = document.createElement('option');
        enableOption.value = 'enable';
        enableOption.textContent = 'Enable';
        dom.actionSelect.appendChild(enableOption);
      } else {
        const disableOption = document.createElement('option');
        disableOption.value = 'disable';
        disableOption.textContent = 'Disable';
        dom.actionSelect.appendChild(disableOption);
      }
    } else {
      // Add placeholder if no extension is selected
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select action --';
      dom.actionSelect.appendChild(defaultOption);
    }
  }


  // --- Event Listeners Setup ---

  function setupEventListeners() {
      // Form submission
      if (dom.form) {
          dom.form.addEventListener('submit', handleFormSubmit);
      } else {
          console.error("Rule creation form not found.");
      }

      // Day selection buttons (using event delegation on the container)
      const dayButtonGroup = document.querySelector('.day-button-group');
      if (dayButtonGroup) {
          dayButtonGroup.addEventListener('click', handleDayButtonClick);
      }

      // Cancel Edit Button
      if (dom.cancelEditButton) {
          dom.cancelEditButton.addEventListener('click', resetForm);
      }

      // Extension selection change
      if (dom.extensionSelect) {
          dom.extensionSelect.addEventListener('change', (event) => {
              updateActionSelectOptions(event.target.value);
          });
      }

       // Rule search/filter
      if (dom.ruleSearchInput) {
          dom.ruleSearchInput.addEventListener('input', displayRules); // Re-display rules on search input
      }

      // Set current year in footer
      if (dom.currentYearSpan) {
          dom.currentYearSpan.textContent = new Date().getFullYear();
      }

      // Listener for Alarms (Needs to be in background script)
      // We attach it here *only for simulation/testing* if the background script isn't running.
      // **Remove or guard this in the actual extension options page.**
      if (chrome && chrome.alarms && chrome.alarms.onAlarm) {
          chrome.alarms.onAlarm.addListener(handleAlarm);
          console.warn("Attached alarm listener to options page for simulation. Ensure this logic is in your background script.");
      }
  }

  // --- Initialization ---
  document.addEventListener('DOMContentLoaded', () => {
      loadExtensions(); // Start by loading extensions, which then loads rules
      setupEventListeners();
  });

})(); // End IIFE
