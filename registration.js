document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to menu items
    document.getElementById('archive-menu').addEventListener('click', navigateToArchive);
    document.getElementById('register-menu').addEventListener('click', function() {
    });
    document.getElementById('settings-menu').addEventListener('click', showSettings);

    // Add event listeners to form buttons
    document.getElementById('cancel-btn').addEventListener('click', navigateToArchive);
    document.getElementById('account-cancel-btn').addEventListener('click', navigateToArchive);
    document.getElementById('site-registration-form').addEventListener('submit', saveSite);
    document.getElementById('account-registration-form').addEventListener('submit', saveAccount);
    document.getElementById('add-key-pair').addEventListener('click', addKeyPair);

    // Add event listener for initial remove buttons
    setupRemoveButtons();

    // Add event listener to initial storage type select to update key options
    const initialStorageTypeSelect = document.getElementById('storage-type-0');
    initialStorageTypeSelect.addEventListener('change', function() {
        updateKeyOptions(this.value, 0);
    });

    // Initial load of key options
    updateKeyOptions(initialStorageTypeSelect.value, 0);

    // Get current tab's domain and check if site exists
    getCurrentTabDomain();
});

// Function to navigate to archive page
function navigateToArchive() {
    // Check if current domain is registered
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const url = new URL(currentTab.url);
        const domain = url.hostname;

        chrome.storage.local.get(['accounts'], function(result) {
            const accounts = result.accounts || [];
            const siteExists = accounts.some(account => account.domain === domain);

            if (siteExists) {
                // If site exists, go to archive page
                window.location.href = 'index.html';
            } else {
                // If site doesn't exist, go to settings page
                window.location.href = 'settings.html';
            }
        });
    });
}

// Function to show settings
function showSettings() {
    window.location.href = 'settings.html';
}

// Function to get current tab's domain and check if site exists
function getCurrentTabDomain() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const url = new URL(currentTab.url);
        const domain = url.hostname;

        // Display the domain in both forms
        document.getElementById('domain-display').style.display = 'block';
        document.getElementById('domain-value').textContent = domain;
        document.getElementById('domain-value').setAttribute('data-domain', domain);

        document.getElementById('account-domain-display').style.display = 'block';
        document.getElementById('account-domain-value').textContent = domain;
        document.getElementById('account-domain-value').setAttribute('data-domain', domain);

        // Check if a site is already registered for this domain
        chrome.storage.local.get(['accounts'], function(result) {
            const accounts = result.accounts || [];
            const siteExists = accounts.some(account => account.domain === domain);

            // Update the registration menu text based on whether a site exists
            const registerMenuText = siteExists ? '계정 등록' : '사이트 등록';
            document.getElementById('register-menu').querySelector('span').textContent = registerMenuText;

            // Show the appropriate form
            if (siteExists) {
                document.getElementById('site-registration-form-section').style.display = 'none';
                document.getElementById('account-registration-form-section').style.display = 'block';
            } else {
                document.getElementById('site-registration-form-section').style.display = 'block';
                document.getElementById('account-registration-form-section').style.display = 'none';
            }
        });
    });
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

// Function to save a new site
function saveSite(event) {
    // Prevent form submission
    event.preventDefault();

    // Get site name
    const siteName = document.getElementById('site-name').value;

    // Get domain from the data attribute
    const domain = document.getElementById('domain-value').getAttribute('data-domain');

    // Get all key-value pairs
    const keyPairs = document.querySelectorAll('.key-pair');
    const accountData = [];

    // Validate input
    if (!siteName) {
        alert('Please enter a site name');
        return;
    }

    if (!domain) {
        alert('Unable to detect domain. Please try again.');
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

    // Create site object with new structure
    const site = {
        id: Date.now().toString(), // Use timestamp as ID
        siteName,
        domain,
        accounts: accountData,
        timestamp: Date.now()
    };

    // Get existing accounts from storage
    chrome.storage.local.get(['accounts'], function(result) {
        const accounts = result.accounts || [];
        accounts.push(site);

        // Save updated accounts to storage
        chrome.storage.local.set({ accounts }, function() {
            alert('Site saved successfully!');
            navigateToArchive(); // Go back to the accounts list
        });
    });
}

// Function to save a new account
function saveAccount(event) {
    // Prevent form submission
    event.preventDefault();

    // Get account name
    const accountName = document.getElementById('account-name').value;

    // Get domain from the data attribute
    const domain = document.getElementById('account-domain-value').getAttribute('data-domain');

    // Validate input
    if (!accountName) {
        alert('Please enter an account ID');
        return;
    }

    if (!domain) {
        alert('Unable to detect domain. Please try again.');
        return;
    }

    // Get site information for this domain
    chrome.storage.local.get(['accounts'], function(result) {
        const accounts = result.accounts || [];
        const site = accounts.find(account => account.domain === domain);

        if (!site) {
            alert('No site information found for this domain. Please register the site first.');
            return;
        }

        // Create account object
        const accountObj = {
            id: Date.now().toString(),
            accountName,
            domain,
            timestamp: Date.now()
        };

        // Get the current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];

            // Prepare storage information based on site configuration
            if (site.accounts && site.accounts.length > 0) {
                // Create an array to store promises for each storage value retrieval
                const storagePromises = site.accounts.map(storageInfo => {
                    return new Promise((resolve) => {
                        // Initialize storage type object if it doesn't exist
                        if (!accountObj[storageInfo.storageType]) {
                            accountObj[storageInfo.storageType] = {};
                        }

                        // Get value from appropriate storage type
                        if (storageInfo.storageType === 'local') {
                            chrome.scripting.executeScript({
                                target: {tabId: currentTab.id},
                                func: (key) => localStorage.getItem(key),
                                args: [storageInfo.key]
                            }, (results) => {
                                const value = results && results[0] && results[0].result !== null ? results[0].result : null;
                                accountObj[storageInfo.storageType][storageInfo.key] = value;
                                resolve({key: storageInfo.key, type: storageInfo.storageType, value: value});
                            });
                        } else if (storageInfo.storageType === 'session') {
                            chrome.scripting.executeScript({
                                target: {tabId: currentTab.id},
                                func: (key) => sessionStorage.getItem(key),
                                args: [storageInfo.key]
                            }, (results) => {
                                const value = results && results[0] && results[0].result !== null ? results[0].result : null;
                                accountObj[storageInfo.storageType][storageInfo.key] = value;
                                resolve({key: storageInfo.key, type: storageInfo.storageType, value: value});
                            });
                        } else if (storageInfo.storageType === 'cookie') {
                            chrome.scripting.executeScript({
                                target: {tabId: currentTab.id},
                                func: (key) => {
                                    const cookies = document.cookie.split(';');
                                    for (let i = 0; i < cookies.length; i++) {
                                        const cookie = cookies[i].trim();
                                        if (cookie.startsWith(key + '=')) {
                                            return cookie.substring(key.length + 1);
                                        }
                                    }
                                    return null;
                                },
                                args: [storageInfo.key]
                            }, (results) => {
                                const value = results && results[0] && results[0].result !== null ? results[0].result : null;
                                accountObj[storageInfo.storageType][storageInfo.key] = value;
                                resolve({key: storageInfo.key, type: storageInfo.storageType, value: value});
                            });
                        } else {
                            // Unknown storage type
                            accountObj[storageInfo.storageType][storageInfo.key] = null;
                            resolve({key: storageInfo.key, type: storageInfo.storageType, value: null});
                        }
                    });
                });

                // Wait for all storage values to be retrieved
                Promise.all(storagePromises).then(results => {
                    // Check if any values are null
                    const nullValues = results.filter(result => result.value === null);
                    if (nullValues.length > 0) {
                        // Show warning for null values
                        const nullValuesList = nullValues.map(item => `${item.type}:${item.key}`).join(', ');
                        alert(`Warning: The following values are null or not found: ${nullValuesList}. Account will not be saved.`);
                        return;
                    }

                    // Get existing user accounts
                    chrome.storage.local.get(['userAccounts'], function(result) {
                        const userAccounts = result.userAccounts || [];
                        userAccounts.push(accountObj);

                        // Save updated user accounts to storage
                        chrome.storage.local.set({ userAccounts }, function() {
                            alert('Account saved successfully!');
                            navigateToArchive(); // Go back to the accounts list
                        });
                    });
                });
            } else {
                // No storage information defined for this site
                alert('No storage information defined for this site. Please update the site configuration.');
            }
        });
    });
}
