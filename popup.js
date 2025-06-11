document.addEventListener('DOMContentLoaded', function() {
    // Get current tab's domain and then load accounts
    getCurrentTabDomain();

    // Add event listeners to menu items
    document.getElementById('archive-menu').addEventListener('click', showArchive);
    document.getElementById('register-menu').addEventListener('click', showRegistrationForm);
    document.getElementById('settings-menu').addEventListener('click', showSettings);
});

// Function to get current tab's domain and load accounts
function getCurrentTabDomain() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const url = new URL(currentTab.url);
        const currentDomain = url.hostname;

        // Store the current domain for later use
        window.currentDomain = currentDomain;

        // Load accounts with the current domain
        loadAccounts(currentDomain);
    });
}

// Function to load accounts
function loadAccounts(currentDomain) {
    // Get accounts and user accounts from storage
    chrome.storage.local.get(['accounts', 'userAccounts'], function(result) {
        const sites = result.accounts || [];
        const userAccounts = result.userAccounts || [];
        console.log('Loaded sites:', sites);
        console.log('Loaded user accounts:', userAccounts);

        // Check if this is first use (no sites)
        if (sites.length === 0) {
            // Navigate to settings page for first use
            window.location.href = 'settings.html';
            return;
        }

        // Check if any site matches the current domain
        const matchingSites = sites.filter(site => site.domain === currentDomain);

        // If no matching sites, show settings page
        if (matchingSites.length === 0) {
            // Navigate to settings page to register this domain
            window.location.href = 'settings.html';
            return;
        }

        // Get user accounts for the current domain
        const matchingUserAccounts = userAccounts.filter(account => account.domain === currentDomain);

        // Update UI based on matching user accounts
        updateAccountsList(matchingUserAccounts);

        // Update the registration menu text
        const registerMenuText = '계정 등록';
        document.getElementById('register-menu').querySelector('span').textContent = registerMenuText;

        // Enable the register button since we're on a registered domain
        document.getElementById('register-menu').style.display = 'flex';
    });
}

// Function to update the accounts list in the UI
function updateAccountsList(userAccounts) {
    const accountsContainer = document.getElementById('accounts-container');
    const noAccounts = document.getElementById('no-accounts');

    // Clear the container
    accountsContainer.innerHTML = '';

    if (userAccounts.length === 0) {
        // Show the "no accounts" message
        noAccounts.style.display = 'flex';
        accountsContainer.style.display = 'none';
    } else {
        // Hide the "no accounts" message and show the accounts
        noAccounts.style.display = 'none';
        accountsContainer.style.display = 'block';

        // Add each user account to the container
        userAccounts.forEach(account => {
            const accountItem = document.createElement('div');
            accountItem.className = 'account-item';

            accountItem.innerHTML = `
                <div class="account-name">
                    ${account.accountName}
                </div>
                <div class="account-actions">
                    <button class="action-button edit-button" data-id="${account.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-button delete-button" data-id="${account.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Add click event to account name to update storage values
            const accountNameDiv = accountItem.querySelector('.account-name');
            accountNameDiv.style.cursor = 'pointer';
            accountNameDiv.addEventListener('click', function() {
                console.log(JSON.stringify(account, null, 2));

                // Get the current tab
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    const currentTab = tabs[0];

                    // Update localStorage values
                    if (account.local) {
                        Object.keys(account.local).forEach(key => {
                            const value = account.local[key];
                            if (value !== null) {
                                chrome.scripting.executeScript({
                                    target: {tabId: currentTab.id},
                                    func: (key, value) => {
                                        localStorage.setItem(key, value);
                                    },
                                    args: [key, value]
                                });
                            }
                        });
                    }

                    // Update sessionStorage values
                    if (account.session) {
                        Object.keys(account.session).forEach(key => {
                            const value = account.session[key];
                            if (value !== null) {
                                chrome.scripting.executeScript({
                                    target: {tabId: currentTab.id},
                                    func: (key, value) => {
                                        sessionStorage.setItem(key, value);
                                    },
                                    args: [key, value]
                                });
                            }
                        });
                    }

                    // Update cookie values
                    if (account.cookie) {
                        Object.keys(account.cookie).forEach(key => {
                            const value = account.cookie[key];
                            if (value !== null) {
                                chrome.scripting.executeScript({
                                    target: {tabId: currentTab.id},
                                    func: (key, value) => {
                                        document.cookie = `${key}=${value}`;
                                    },
                                    args: [key, value]
                                });
                            }
                        });
                    }

                    alert(`Account "${account.accountName}" values have been applied to the page.`);
                });
            });
            accountsContainer.appendChild(accountItem);
        });

        // Add event listeners to delete buttons
        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const accountId = this.getAttribute('data-id');
                deleteAccount(accountId);
            });
        });

        // Add event listeners to edit buttons
        const editButtons = document.querySelectorAll('.edit-button');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const accountId = this.getAttribute('data-id');
                editAccount(accountId);
            });
        });
    }
}

// Function to show the archive (accounts list)
function showArchive() {
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

// Function to navigate to the registration form page
function showRegistrationForm() {
    // Check if current domain is registered
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const url = new URL(currentTab.url);
        const domain = url.hostname;

        chrome.storage.local.get(['accounts'], function(result) {
            const accounts = result.accounts || [];
            const siteExists = accounts.some(account => account.domain === domain);

            if (siteExists) {
                // If site exists, go to registration page for account registration
                window.location.href = 'registration.html';
            } else {
                // If site doesn't exist, go to settings page
                window.location.href = 'settings.html';
            }
        });
    });
}

// Function to show settings
function showSettings() {
    // Navigate to the settings page
    window.location.href = 'settings.html';
}

// Function to update the active state of menu items
function updateMenuActiveState(activeMenuId) {
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to the clicked menu item
    document.getElementById(activeMenuId).classList.add('active');
}


// Function to navigate to the edit page for an account
function editAccount(accountId) {
    window.location.href = `account-edit.html?id=${accountId}`;
}

// Function to delete an account
function deleteAccount(accountId) {
    if (confirm('Are you sure you want to delete this account?')) {
        chrome.storage.local.get(['userAccounts'], function(result) {
            const userAccounts = result.userAccounts || [];
            const updatedUserAccounts = userAccounts.filter(account => account.id !== accountId);

            chrome.storage.local.set({ userAccounts: updatedUserAccounts }, function() {
                // Get current domain to update only matching accounts
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    const currentTab = tabs[0];
                    const url = new URL(currentTab.url);
                    const currentDomain = url.hostname;

                    // Filter accounts for current domain
                    const matchingUserAccounts = updatedUserAccounts.filter(account => account.domain === currentDomain);

                    // Update the UI with matching accounts
                    updateAccountsList(matchingUserAccounts);
                });
            });
        });
    }
}
