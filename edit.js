document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to menu items
    document.getElementById('archive-menu').addEventListener('click', navigateToArchive);
    document.getElementById('register-menu').addEventListener('click', navigateToRegistration);
    document.getElementById('settings-menu').addEventListener('click', showSettings);

    // Add event listeners to form buttons
    document.getElementById('cancel-btn').addEventListener('click', navigateToArchive);
    document.getElementById('account-edit-form').addEventListener('submit', saveAccount);
    document.getElementById('add-key-pair').addEventListener('click', addKeyPair);

    // Get current tab's domain and then load account data
    getCurrentTabDomain();
});

// Function to navigate to archive page
function navigateToArchive() {
    window.location.href = 'index.html';
}

// Function to navigate to registration page
function navigateToRegistration() {
    window.location.href = 'registration.html';
}

// Function to show settings (not implemented yet)
function showSettings() {
    alert('Settings functionality not implemented yet.');
}

// Function to get current tab's domain and load account data
function getCurrentTabDomain() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const url = new URL(currentTab.url);
        const currentDomain = url.hostname;

        // Store the current domain for later use
        window.currentDomain = currentDomain;

        // Load account data with the current domain
        loadAccountData(currentDomain);
    });
}

// Function to load account data from URL parameter
function loadAccountData(currentDomain) {
    // Get account ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('id');

    if (!accountId) {
        alert('No account ID provided');
        navigateToArchive();
        return;
    }

    // Store account ID in hidden field
    document.getElementById('account-id').value = accountId;

    // Get account data from storage
    chrome.storage.local.get(['accounts'], function(result) {
        const accounts = result.accounts || [];
        const account = accounts.find(acc => acc.id === accountId);

        if (!account) {
            alert('Account not found');
            navigateToArchive();
            return;
        }

        // Check if the account's domain matches the current domain
        if (account.domain !== currentDomain) {
            alert('This account cannot be edited from this domain');
            navigateToArchive();
            return;
        }

        // Show the register button since we're on a matching domain
        document.getElementById('register-menu').style.display = 'flex';

        // Populate form with account data
        document.getElementById('site-name').value = account.siteName;

        // Clear existing key pairs
        const container = document.getElementById('key-pairs-container');
        container.innerHTML = '';

        // Add key pairs from account data
        account.accounts.forEach((keyPair, index) => {
            addKeyPairWithData(keyPair.storageType, keyPair.key, index);
        });

        // Show remove buttons if there's more than one key pair
        if (account.accounts.length > 1) {
            const removeButtons = container.querySelectorAll('.remove-key-pair');
            removeButtons.forEach(button => {
                button.style.display = 'flex';
            });
        }

        // Setup event listeners for remove buttons
        setupRemoveButtons();
    });
}

// Function to add a new key-value pair with data
function addKeyPairWithData(storageType, keyValue, index) {
    const container = document.getElementById('key-pairs-container');

    const newKeyPair = document.createElement('div');
    newKeyPair.className = 'key-pair';
    newKeyPair.innerHTML = `
        <div class="key-pair-content">
            <div class="form-group storage-type-container">
                <label for="storage-type-${index}">Storage Type:</label>
                <div class="storage-type-wrapper">
                    <select id="storage-type-${index}" name="storage-type-${index}" class="storage-type" required>
                        <option value="session" ${storageType === 'session' ? 'selected' : ''}>Session</option>
                        <option value="cookie" ${storageType === 'cookie' ? 'selected' : ''}>Cookie</option>
                        <option value="local" ${storageType === 'local' ? 'selected' : ''}>Local</option>
                    </select>
                    <button type="button" class="remove-key-pair" style="display: none;"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="form-group">
                <label for="key-value-${index}">Key:</label>
                <select id="key-value-${index}" name="key-value-${index}" class="key-value" required>
                    <option value="${keyValue}" selected>${keyValue}</option>
                </select>
            </div>
        </div>
    `;

    container.appendChild(newKeyPair);

    // Add event listener to storage type select to update key options
    const storageTypeSelect = document.getElementById(`storage-type-${index}`);
    storageTypeSelect.addEventListener('change', function() {
        updateKeyOptions(this.value, index);
    });

    // Initial load of key options
    updateKeyOptions(storageType, index, keyValue);
}

// Function to add a new key-value pair
function addKeyPair() {
    const container = document.getElementById('key-pairs-container');
    const keyPairs = container.querySelectorAll('.key-pair');
    const newIndex = keyPairs.length;

    const newKeyPair = document.createElement('div');
    newKeyPair.className = 'key-pair';
    newKeyPair.innerHTML = `
        <div class="key-pair-content">
            <div class="form-group storage-type-container">
                <label for="storage-type-${newIndex}">Storage Type:</label>
                <div class="storage-type-wrapper">
                    <select id="storage-type-${newIndex}" name="storage-type-${newIndex}" class="storage-type" required>
                        <option value="session">Session</option>
                        <option value="cookie">Cookie</option>
                        <option value="local">Local</option>
                    </select>
                    <button type="button" class="remove-key-pair"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="form-group">
                <label for="key-value-${newIndex}">Key:</label>
                <select id="key-value-${newIndex}" name="key-value-${newIndex}" class="key-value" required>
                    <option value="" disabled selected>Select a key</option>
                </select>
            </div>
        </div>
    `;

    container.appendChild(newKeyPair);

    // Show all remove buttons if there's more than one key pair
    if (keyPairs.length > 0) {
        const removeButtons = container.querySelectorAll('.remove-key-pair');
        removeButtons.forEach(button => {
            button.style.display = 'flex';
        });
    }

    // Add event listener to storage type select to update key options
    const storageTypeSelect = document.getElementById(`storage-type-${newIndex}`);
    storageTypeSelect.addEventListener('change', function() {
        updateKeyOptions(this.value, newIndex);
    });

    // Initial load of key options
    updateKeyOptions(storageTypeSelect.value, newIndex);

    // Setup event listener for the new remove button
    setupRemoveButtons();
}

// Function to update key options based on storage type
function updateKeyOptions(storageType, index, selectedKey = null) {
    // Get the key select element
    const keySelect = document.getElementById(`key-value-${index}`);

    // Get all existing key pairs to check for uniqueness
    const existingPairs = [];
    const keyPairs = document.querySelectorAll('.key-pair');
    keyPairs.forEach((keyPair, i) => {
        if (i !== index) { // Skip the current pair
            const pairStorageType = keyPair.querySelector('.storage-type').value;
            const pairKey = keyPair.querySelector('.key-value').value;
            if (pairStorageType === storageType) {
                existingPairs.push(pairKey);
            }
        }
    });

    // Clear existing options
    keySelect.innerHTML = '';

    // Add a placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Loading keys...';
    placeholderOption.disabled = true;
    placeholderOption.selected = !selectedKey;
    keySelect.appendChild(placeholderOption);

    // Function to add keys to the select element
    const addKeysToSelect = (keys) => {
        // Filter out keys that are already used with the same storage type
        const availableKeys = keys.filter(key => !existingPairs.includes(key));

        // Remove the placeholder option if we have keys or a selected key
        if ((availableKeys.length > 0 || selectedKey) && keySelect.contains(placeholderOption)) {
            keySelect.removeChild(placeholderOption);
        }

        // Add the selected key if it exists
        if (selectedKey && !availableKeys.includes(selectedKey)) {
            const option = document.createElement('option');
            option.value = selectedKey;
            option.textContent = selectedKey;
            option.selected = true;
            keySelect.appendChild(option);
        }

        // Add available keys
        availableKeys.forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            option.selected = key === selectedKey;
            keySelect.appendChild(option);
        });

        // Update placeholder text if no keys are available
        if (availableKeys.length === 0 && !selectedKey) {
            placeholderOption.textContent = 'No keys available';
        }
    };

    // Get the current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];

        // Get keys based on storage type
        if (storageType === 'local') {
            // Get keys from local storage
            chrome.scripting.executeScript({
                target: {tabId: currentTab.id},
                func: () => Object.keys(localStorage)
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    addKeysToSelect(results[0].result);
                } else {
                    addKeysToSelect([]);
                }
            });
        } else if (storageType === 'session') {
            // Get keys from session storage
            chrome.scripting.executeScript({
                target: {tabId: currentTab.id},
                func: () => Object.keys(sessionStorage)
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    addKeysToSelect(results[0].result);
                } else {
                    addKeysToSelect([]);
                }
            });
        } else if (storageType === 'cookie') {
            // Get keys from cookies
            chrome.scripting.executeScript({
                target: {tabId: currentTab.id},
                func: () => {
                    const cookies = document.cookie.split(';');
                    return cookies.map(cookie => cookie.split('=')[0].trim());
                }
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    addKeysToSelect(results[0].result);
                } else {
                    addKeysToSelect([]);
                }
            });
        }
    });
}

// Function to setup remove buttons
function setupRemoveButtons() {
    const removeButtons = document.querySelectorAll('.remove-key-pair');
    removeButtons.forEach(button => {
        // Remove existing event listeners to prevent duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', function() {
            const storageTypeWrapper = this.parentNode;
            const formGroup = storageTypeWrapper.parentNode;
            const keyPairContent = formGroup.parentNode;
            const keyPair = keyPairContent.parentNode;
            const container = keyPair.parentNode;
            container.removeChild(keyPair);

            // If only one key pair remains, hide its remove button
            const remainingKeyPairs = container.querySelectorAll('.key-pair');
            if (remainingKeyPairs.length === 1) {
                const lastRemoveButton = remainingKeyPairs[0].querySelector('.remove-key-pair');
                lastRemoveButton.style.display = 'none';
            }
        });
    });
}

// Function to save the edited account
function saveAccount(event) {
    // Prevent form submission
    event.preventDefault();

    // Get account ID from hidden field
    const accountId = document.getElementById('account-id').value;

    // Get site name and domain
    const siteName = document.getElementById('site-name').value;

    // Get all key-value pairs
    const keyPairs = document.querySelectorAll('.key-pair');
    const accountData = [];

    // Validate input
    if (!siteName) {
        alert('Please enter a site name');
        return;
    }

    // Collect all key-value pairs
    let isValid = true;
    keyPairs.forEach((keyPair, index) => {
        const storageType = keyPair.querySelector('.storage-type').value;
        const keyName = keyPair.querySelector('.key-value').value;

        if (!storageType || !keyName) {
            alert('Please fill in all fields for key pair #' + (index + 1));
            isValid = false;
            return;
        }

        accountData.push({
            storageType: storageType,
            key: keyName
        });
    });

    if (!isValid) return;

    // Get existing accounts from storage
    chrome.storage.local.get(['accounts'], function(result) {
        const accounts = result.accounts || [];

        // Find the account to update
        const accountIndex = accounts.findIndex(acc => acc.id === accountId);

        if (accountIndex === -1) {
            alert('Account not found');
            return;
        }

        // Update the account
        accounts[accountIndex] = {
            ...accounts[accountIndex],
            siteName,
            accounts: accountData,
            timestamp: Date.now()
        };

        // Save updated accounts to storage
        chrome.storage.local.set({ accounts }, function() {
            alert('Account updated successfully!');
            navigateToArchive(); // Go back to the accounts list
        });
    });
}
