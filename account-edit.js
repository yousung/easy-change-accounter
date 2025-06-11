document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to menu items
    document.getElementById('archive-menu').addEventListener('click', navigateToArchive);
    document.getElementById('register-menu').addEventListener('click', navigateToRegistration);
    document.getElementById('settings-menu').addEventListener('click', showSettings);

    // Add event listeners to form buttons
    document.getElementById('cancel-btn').addEventListener('click', navigateToArchive);
    document.getElementById('refresh-btn').addEventListener('click', refreshAccount);
    document.getElementById('save-btn').addEventListener('click', saveAccount);

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

// Function to show settings
function showSettings() {
    window.location.href = 'settings.html';
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
    chrome.storage.local.get(['userAccounts'], function(result) {
        const userAccounts = result.userAccounts || [];
        const account = userAccounts.find(acc => acc.id === accountId);

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
        document.getElementById('account-name').value = account.accountName;


        // Get site configuration for this domain to know what storage fields to display
        chrome.storage.local.get(['accounts'], function(result) {
            const sites = result.accounts || [];
            const site = sites.find(site => site.domain === currentDomain);

            if (!site || !site.accounts || site.accounts.length === 0) {
                alert('No site configuration found for this domain');
                navigateToArchive();
                return;
            }
        });
    });
}

// Function to refresh the account with current storage values
function refreshAccount(event) {
    // Prevent form submission
    event.preventDefault();

    // Get account ID from hidden field
    const accountId = document.getElementById('account-id').value;
    const currentDomain = window.currentDomain;

    if (!accountId) {
        alert('No account ID provided');
        return;
    }

    // Get existing user accounts from storage
    chrome.storage.local.get(['userAccounts', 'accounts'], function(result) {
        const userAccounts = result.userAccounts || [];
        const accountIndex = userAccounts.findIndex(acc => acc.id === accountId);
        const sites = result.accounts || [];
        const site = sites.find(site => site.domain === currentDomain);

        if (accountIndex === -1) {
            alert('Account not found');
            return;
        }

        if (!site || !site.accounts || site.accounts.length === 0) {
            alert('No site configuration found for this domain');
            return;
        }

        // Create a copy of the account to update
        const updatedAccount = { ...userAccounts[accountIndex] };

        // Get the current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];

            // Create an array to store promises for each storage value retrieval
            const storagePromises = site.accounts.map(storageInfo => {
                return new Promise((resolve) => {
                    // Initialize storage type object if it doesn't exist
                    if (!updatedAccount[storageInfo.storageType]) {
                        updatedAccount[storageInfo.storageType] = {};
                    }

                    // Get value from appropriate storage type
                    if (storageInfo.storageType === 'local') {
                        chrome.scripting.executeScript({
                            target: {tabId: currentTab.id},
                            func: (key) => localStorage.getItem(key),
                            args: [storageInfo.key]
                        }, (results) => {
                            const value = results && results[0] && results[0].result !== null ? results[0].result : null;
                            updatedAccount[storageInfo.storageType][storageInfo.key] = value;
                            resolve({key: storageInfo.key, type: storageInfo.storageType, value: value});
                        });
                    } else if (storageInfo.storageType === 'session') {
                        chrome.scripting.executeScript({
                            target: {tabId: currentTab.id},
                            func: (key) => sessionStorage.getItem(key),
                            args: [storageInfo.key]
                        }, (results) => {
                            const value = results && results[0] && results[0].result !== null ? results[0].result : null;
                            updatedAccount[storageInfo.storageType][storageInfo.key] = value;
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
                            updatedAccount[storageInfo.storageType][storageInfo.key] = value;
                            resolve({key: storageInfo.key, type: storageInfo.storageType, value: value});
                        });
                    } else {
                        // Unknown storage type
                        updatedAccount[storageInfo.storageType][storageInfo.key] = null;
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
                    alert(`Warning: The following values are null or not found: ${nullValuesList}. Account will not be refreshed.`);
                    return;
                }

                // Update the account in the array
                updatedAccount.timestamp = Date.now();
                userAccounts[accountIndex] = updatedAccount;

                // Save updated user accounts to storage
                chrome.storage.local.set({ userAccounts }, function() {
                    alert('Account refreshed successfully!');
                    navigateToArchive(); // Go back to the accounts list
                });
            });
        });
    });
}

// Function to save the edited account
function saveAccount(event) {
    // Prevent form submission
    event.preventDefault();

    // Get original account ID from hidden field
    const accountId = document.getElementById('account-id').value;

    // Get new account name from input field
    const accountName = document.getElementById('account-name').value;

    // Validate input
    if (!accountName) {
        alert('Please enter an account ID');
        return;
    }

    // Get existing user accounts from storage
    chrome.storage.local.get(['userAccounts'], function(result) {
        const userAccounts = result.userAccounts || [];
        const accountIndex = userAccounts.findIndex(acc => acc.id === accountId);

        if (accountIndex === -1) {
            alert('Account not found');
            return;
        }

        // Create a copy of the account to update
        const updatedAccount = { ...userAccounts[accountIndex] };
        updatedAccount.accountName = accountName;
        updatedAccount.timestamp = Date.now();

        // We only update the accountName, not the storage fields

        // Update the account in the array
        userAccounts[accountIndex] = updatedAccount;

        // Save updated user accounts to storage
        chrome.storage.local.set({ userAccounts }, function() {
            alert('Account updated successfully!');
            navigateToArchive(); // Go back to the accounts list
        });
    });
}
