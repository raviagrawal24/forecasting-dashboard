// Global Variables
let currentUser = null;
let currentRole = null;
let stockData = [];
let activityLog = [];
let orderChart = null;
let stockChart = null;
let currentStockView = 'list';
let sessionStartTime = null;
let sessionTimer = null;
let securityCode = null;
let loginAttempts = 0;
let maxLoginAttempts = 3;
let sessionTimeout = 30 * 60 * 1000; // 30 minutes
let userActivity = [];
let isPasswordVisible = false;
let currentTheme = 'light';

// Sample Data
const sampleStockData = [
    { id: 1, name: "Laptop Computers", category: "electronics", quantity: 45, threshold: 10, status: "in-stock" },
    { id: 2, name: "Office Chairs", category: "furniture", quantity: 8, threshold: 15, status: "low-stock" },
    { id: 3, name: "Smartphones", category: "electronics", quantity: 120, threshold: 20, status: "in-stock" },
    { id: 4, name: "Desk Lamps", category: "furniture", quantity: 0, threshold: 5, status: "out-of-stock" },
    { id: 5, name: "Notebooks", category: "office", quantity: 200, threshold: 50, status: "in-stock" },
    { id: 6, name: "Coffee Machines", category: "appliances", quantity: 12, threshold: 8, status: "in-stock" },
    { id: 7, name: "Printers", category: "electronics", quantity: 3, threshold: 10, status: "low-stock" },
    { id: 8, name: "Paper Clips", category: "office", quantity: 500, threshold: 100, status: "in-stock" }
];

const sampleActivityLog = [
    { id: 1, type: "stock_add", message: "Added 50 units of Notebooks", timestamp: new Date(Date.now() - 1000 * 60 * 30), icon: "fas fa-plus" },
    { id: 2, type: "stock_remove", message: "Removed 12 units of Office Chairs", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), icon: "fas fa-minus" },
    { id: 3, type: "order_placed", message: "New order placed for Laptop Computers", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), icon: "fas fa-shopping-cart" },
    { id: 4, type: "low_stock", message: "Office Chairs running low on stock", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), icon: "fas fa-exclamation-triangle" },
    { id: 5, type: "stock_add", message: "Added 25 units of Smartphones", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), icon: "fas fa-plus" }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    stockData = [...sampleStockData];
    activityLog = [...sampleActivityLog];
    loadActivityLog();
    generateSecurityCode();
    initializeSessionTimeout();
    initializeTheme();
    
    // Check for existing session
    const savedSession = localStorage.getItem('inventorySession');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session.expires > Date.now()) {
            currentUser = session.user;
            currentRole = session.role;
            sessionStartTime = session.startTime;
            showDashboard();
            startSessionTimer();
        } else {
            localStorage.removeItem('inventorySession');
        }
    }
});

// Enhanced Login Functions
function selectRole(role) {
    currentRole = role;
    document.getElementById('roleSelection').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    
    // Update form based on role
    const title = document.getElementById('loginTitle');
    const subtitle = document.getElementById('loginSubtitle');
    
    if (role === 'manager') {
        title.textContent = 'Manager Login';
        subtitle.textContent = 'Enter your manager credentials to access the system';
    } else if (role === 'warehouse') {
        title.textContent = 'Warehouse Login';
        subtitle.textContent = 'Enter your warehouse credentials to access the system';
    }
    
    // Generate new security code
    generateSecurityCode();
}

function goBackToRoles() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('roleSelection').style.display = 'grid';
    currentRole = null;
    clearLoginForm();
}

function clearLoginForm() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('securityCode').value = '';
    document.getElementById('rememberMe').checked = false;
    isPasswordVisible = false;
    updatePasswordToggle();
}

function togglePassword() {
    const passwordField = document.getElementById('password');
    const toggleIcon = document.querySelector('.password-toggle i');
    
    isPasswordVisible = !isPasswordVisible;
    passwordField.type = isPasswordVisible ? 'text' : 'password';
    toggleIcon.className = isPasswordVisible ? 'fas fa-eye-slash' : 'fas fa-eye';
}

function updatePasswordToggle() {
    const toggleIcon = document.querySelector('.password-toggle i');
    toggleIcon.className = isPasswordVisible ? 'fas fa-eye-slash' : 'fas fa-eye';
}

function generateSecurityCode() {
    securityCode = Math.floor(1000 + Math.random() * 9000).toString();
    document.getElementById('securityCodeDisplay').textContent = securityCode;
}

function initializeSessionTimeout() {
    // Reset session timeout on user activity
    document.addEventListener('click', resetSessionTimeout);
    document.addEventListener('keypress', resetSessionTimeout);
    document.addEventListener('mousemove', resetSessionTimeout);
}

function resetSessionTimeout() {
    if (currentUser) {
        clearTimeout(sessionTimer);
        sessionTimer = setTimeout(logout, sessionTimeout);
    }
}

// Enhanced Authentication
document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();
    authenticateUser();
});

function authenticateUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const securityCodeInput = document.getElementById('securityCode').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate security code
    if (securityCodeInput !== securityCode) {
        showNotification('Invalid security code. Please try again.', 'error');
        generateSecurityCode();
        return;
    }
    
    // Check login attempts
    if (loginAttempts >= maxLoginAttempts) {
        showNotification('Too many failed attempts. Please try again later.', 'error');
        return;
    }
    
    // Simulate authentication delay
    const loginBtn = document.querySelector('.login-btn');
    const spinner = document.querySelector('.loading-spinner');
    const btnText = loginBtn.querySelector('span');
    
    loginBtn.disabled = true;
    spinner.style.display = 'block';
    btnText.textContent = 'Authenticating...';
    
    setTimeout(() => {
        // Enhanced authentication with user data
        const userDatabase = {
            'manager': { 
                password: 'manager123', 
                role: 'Manager', 
                permissions: ['all'],
                fullName: 'John Manager',
                department: 'Management',
                lastLogin: null
            },
            'warehouse': { 
                password: 'warehouse123', 
                role: 'Warehouse Staff', 
                permissions: ['inventory', 'orders'],
                fullName: 'Jane Warehouse',
                department: 'Operations',
                lastLogin: null
            }
        };
        
        const user = userDatabase[username];
        
        if (user && user.password === password) {
            // Successful login
            currentUser = {
                username,
                role: user.role,
                fullName: user.fullName,
                department: user.department,
                permissions: user.permissions,
                loginTime: new Date(),
                sessionId: generateSessionId()
            };
            
            // Update last login
            user.lastLogin = new Date();
            
            // Save session
            if (rememberMe) {
                const session = {
                    user: currentUser,
                    role: currentRole,
                    startTime: Date.now(),
                    expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
                };
                localStorage.setItem('inventorySession', JSON.stringify(session));
            }
            
            loginAttempts = 0;
            showDashboard();
            logUserActivity('login', `User ${username} logged in successfully`);
            
        } else {
            // Failed login
            loginAttempts++;
            showNotification(`Invalid credentials. ${maxLoginAttempts - loginAttempts} attempts remaining.`, 'error');
            generateSecurityCode();
            clearLoginForm();
        }
        
        // Reset button
        loginBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Secure Login';
    }, 1500);
}

function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function logout() {
    if (currentUser) {
        logUserActivity('logout', `User ${currentUser.username} logged out`);
    }
    
    // Clear session
    currentUser = null;
    currentRole = null;
    sessionStartTime = null;
    clearTimeout(sessionTimer);
    localStorage.removeItem('inventorySession');
    
    // Reset UI
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('roleSelection').style.display = 'grid';
    document.getElementById('loginForm').style.display = 'none';
    
    // Clear form
    clearLoginForm();
    
    showNotification('You have been logged out successfully', 'info');
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.fullName;
    document.getElementById('userRole').textContent = currentUser.role;
    
    // Initialize session timer
    sessionStartTime = new Date();
    startSessionTimer();
    
    // Initialize dashboard components
    loadStockStatus();
    loadInventoryTable();
    initializeChart();
    updateStats();
    
    // Add login activity
    addActivity(`Logged in as ${currentUser.role}`, 'fas fa-sign-in-alt');
    
    showNotification(`Welcome back, ${currentUser.fullName}!`, 'success');
}

function startSessionTimer() {
    if (sessionTimer) clearInterval(sessionTimer);
    
    sessionTimer = setInterval(() => {
        if (sessionStartTime) {
            const elapsed = Math.floor((new Date() - sessionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('sessionTime').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// User Activity Tracking
function logUserActivity(action, description) {
    const activity = {
        id: Date.now(),
        userId: currentUser ? currentUser.username : 'anonymous',
        userRole: currentUser ? currentUser.role : 'unknown',
        action: action,
        description: description,
        timestamp: new Date(),
        sessionId: currentUser ? currentUser.sessionId : null,
        ipAddress: '127.0.0.1', // In real app, get from server
        userAgent: navigator.userAgent
    };
    
    userActivity.push(activity);
    
    // Keep only last 100 activities
    if (userActivity.length > 100) {
        userActivity = userActivity.slice(-100);
    }
    
    // Save to localStorage
    localStorage.setItem('userActivity', JSON.stringify(userActivity));
}

// User Menu Functions
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

function viewProfile() {
    showModal('User Profile', `
        <div class="profile-info">
            <div class="profile-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="profile-details">
                <h3>${currentUser.fullName}</h3>
                <p><strong>Role:</strong> ${currentUser.role}</p>
                <p><strong>Department:</strong> ${currentUser.department}</p>
                <p><strong>Username:</strong> ${currentUser.username}</p>
                <p><strong>Session ID:</strong> ${currentUser.sessionId}</p>
                <p><strong>Login Time:</strong> ${currentUser.loginTime.toLocaleString()}</p>
                <p><strong>Permissions:</strong> ${currentUser.permissions.join(', ')}</p>
            </div>
        </div>
    `);
    toggleUserMenu();
}

function viewActivity() {
    const userActivities = userActivity.filter(activity => 
        activity.userId === currentUser.username
    );
    
    const activityHtml = userActivities.length > 0 ? 
        userActivities.slice(-10).reverse().map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${getActivityIcon(activity.action)}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.description}</h4>
                    <p>${activity.action.toUpperCase()}</p>
                </div>
                <div class="activity-time">
                    ${formatTime(activity.timestamp)}
                </div>
            </div>
        `).join('') : 
        '<p>No activity recorded yet.</p>';
    
    showModal('My Activity', `<div class="activity-list">${activityHtml}</div>`);
    toggleUserMenu();
}

function changePassword() {
    showModal('Change Password', `
        <form id="changePasswordForm">
            <div class="form-group">
                <label>Current Password</label>
                <input type="password" id="currentPassword" required>
            </div>
            <div class="form-group">
                <label>New Password</label>
                <input type="password" id="newPassword" required>
            </div>
            <div class="form-group">
                <label>Confirm New Password</label>
                <input type="password" id="confirmPassword" required>
            </div>
            <button type="submit" class="submit-btn">Change Password</button>
        </form>
    `);
    
    document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const currentPass = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;
        
        if (newPass !== confirmPass) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        if (newPass.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        // In real app, this would be sent to server
        showNotification('Password changed successfully!', 'success');
        closeModal();
        logUserActivity('password_change', 'User changed their password');
    });
    
    toggleUserMenu();
}

function getActivityIcon(action) {
    const icons = {
        'login': 'sign-in-alt',
        'logout': 'sign-out-alt',
        'stock_add': 'plus',
        'stock_remove': 'minus',
        'stock_edit': 'edit',
        'password_change': 'key',
        'report_generate': 'file-alt',
        'data_export': 'download'
    };
    return icons[action] || 'circle';
}

// Theme Management Functions
function initializeTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('inventoryTheme');
    if (savedTheme) {
        currentTheme = savedTheme;
        applyTheme(currentTheme);
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentTheme = prefersDark ? 'dark' : 'light';
        applyTheme(currentTheme);
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('inventoryTheme')) {
            currentTheme = e.matches ? 'dark' : 'light';
            applyTheme(currentTheme);
        }
    });
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    
    // Save theme preference
    localStorage.setItem('inventoryTheme', currentTheme);
    
    // Log user activity
    if (currentUser) {
        logUserActivity('theme_change', `Switched to ${currentTheme} theme`);
    }
    
    // Show notification
    showNotification(`Switched to ${currentTheme} theme`, 'info');
}

function applyTheme(theme) {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    // Remove existing theme classes
    body.removeAttribute('data-theme');
    
    // Apply new theme
    body.setAttribute('data-theme', theme);
    
    // Update theme icon
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // Update theme button styling
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        if (theme === 'dark') {
            themeBtn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            themeBtn.style.boxShadow = '0 4px 15px rgba(240, 147, 251, 0.3)';
        } else {
            themeBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            themeBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        }
    }
    
    // Update chart colors if chart exists
    if (orderChart) {
        updateChartTheme(orderChart, theme);
    }
    
    // Update stock chart theme if it exists
    if (stockChart) {
        updateStockChartTheme(stockChart, theme);
    }
}

function updateChartTheme(chart, theme) {
    const isDark = theme === 'dark';
    
    // Update chart colors
    chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    chart.options.scales.x.grid.display = false;
    
    // Update dataset colors
    chart.data.datasets.forEach((dataset, index) => {
        if (index === 0) {
            dataset.borderColor = isDark ? '#667eea' : '#667eea';
            dataset.backgroundColor = isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.1)';
        } else {
            dataset.borderColor = isDark ? '#48bb78' : '#48bb78';
            dataset.backgroundColor = isDark ? 'rgba(72, 187, 120, 0.1)' : 'rgba(72, 187, 120, 0.1)';
        }
    });
    
    chart.update();
}

function updateStockChartTheme(chart, theme) {
    const isDark = theme === 'dark';
    
    // Update legend colors
    if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = isDark ? '#ffffff' : '#333333';
    }
    
    // Update border colors for datasets
    chart.data.datasets.forEach(dataset => {
        dataset.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)';
    });
    
    // Update scales if they exist (for bar chart)
    if (chart.options.scales) {
        if (chart.options.scales.y) {
            chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            chart.options.scales.y.ticks.color = isDark ? '#b0b0b0' : '#666666';
        }
        if (chart.options.scales.x) {
            chart.options.scales.x.ticks.color = isDark ? '#b0b0b0' : '#666666';
        }
    }
    
    chart.update();
}

// Enhanced chart initialization with theme support
function initializeChart() {
    const ctx = document.getElementById('orderChart').getContext('2d');
    
    // Generate sample data for the last 30 days
    const labels = [];
    const ordersData = [];
    const supplyData = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Generate random data
        ordersData.push(Math.floor(Math.random() * 20) + 5);
        supplyData.push(Math.floor(Math.random() * 15) + 3);
    }
    
    const isDark = currentTheme === 'dark';
    
    orderChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Orders',
                    data: ordersData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Supply',
                    data: supplyData,
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isDark ? '#ffffff' : '#333333'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: isDark ? '#b0b0b0' : '#666666'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: isDark ? '#b0b0b0' : '#666666'
                    }
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });
}

// Stock Management Functions
function loadStockStatus() {
    const stockItemsContainer = document.getElementById('stockItems');
    stockItemsContainer.innerHTML = '';
    
    stockData.forEach(item => {
        const stockItem = document.createElement('div');
        stockItem.className = `stock-item ${item.status}`;
        
        let statusClass = 'high';
        if (item.quantity <= item.threshold) {
            statusClass = 'low';
        } else if (item.quantity <= item.threshold * 1.5) {
            statusClass = 'medium';
        }
        
        stockItem.innerHTML = `
            <div class="stock-info">
                <h4>${item.name}</h4>
                <p>Category: ${item.category}</p>
            </div>
            <div class="stock-quantity ${statusClass}">
                ${item.quantity}
                <small>units</small>
            </div>
        `;
        
        stockItemsContainer.appendChild(stockItem);
    });
    
    // Update chart if it exists
    if (currentStockView !== 'list' && stockChart) {
        updateStockChart(currentStockView);
    }
}

// Stock Chart Functions
function switchStockView(view) {
    currentStockView = view;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide views
    const stockItems = document.getElementById('stockItems');
    const stockChartContainer = document.getElementById('stockChartContainer');
    
    if (view === 'list') {
        stockItems.style.display = 'flex';
        stockChartContainer.style.display = 'none';
    } else {
        stockItems.style.display = 'none';
        stockChartContainer.style.display = 'block';
        
        // Create or update chart
        if (stockChart) {
            updateStockChart(view);
        } else {
            createStockChart(view);
        }
    }
}

function createStockChart(view) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    const isDark = currentTheme === 'dark';
    
    const data = stockData.map(item => item.quantity);
    const labels = stockData.map(item => item.name);
    const backgroundColors = [
        'rgba(102, 126, 234, 0.8)',
        'rgba(237, 137, 54, 0.8)',
        'rgba(72, 187, 120, 0.8)',
        'rgba(245, 101, 101, 0.8)',
        'rgba(66, 153, 225, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)'
    ];
    
    const chartType = view === 'pie' ? 'pie' : 'bar';
    
    stockChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Stock Quantity',
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#ffffff' : '#333333',
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed + ' units';
                            return label;
                        }
                    }
                }
            },
            ...(view === 'bar' && {
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: isDark ? '#b0b0b0' : '#666666'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: isDark ? '#b0b0b0' : '#666666'
                        }
                    }
                }
            })
        }
    });
}

function updateStockChart(view) {
    if (!stockChart) {
        createStockChart(view);
        return;
    }
    
    const data = stockData.map(item => item.quantity);
    const labels = stockData.map(item => item.name);
    const backgroundColors = [
        'rgba(102, 126, 234, 0.8)',
        'rgba(237, 137, 54, 0.8)',
        'rgba(72, 187, 120, 0.8)',
        'rgba(245, 101, 101, 0.8)',
        'rgba(66, 153, 225, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)'
    ];
    
    stockChart.data.labels = labels;
    stockChart.data.datasets[0].data = data;
    stockChart.data.datasets[0].backgroundColor = backgroundColors.slice(0, labels.length);
    
    // Change chart type if needed
    const chartType = view === 'pie' ? 'pie' : 'bar';
    stockChart.config.type = chartType;
    
    // Update scales configuration for bar chart
    if (chartType === 'bar') {
        const isDark = currentTheme === 'dark';
        stockChart.options.scales = {
            y: {
                beginAtZero: true,
                grid: {
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    color: isDark ? '#b0b0b0' : '#666666'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: isDark ? '#b0b0b0' : '#666666'
                }
            }
        };
    } else {
        delete stockChart.options.scales;
    }
    
    stockChart.update();
}

function loadInventoryTable() {
    const tableBody = document.getElementById('inventoryTableBody');
    tableBody.innerHTML = '';
    
    stockData.forEach(item => {
        const row = document.createElement('tr');
        
        let statusBadge = '';
        let statusText = '';
        
        if (item.quantity === 0) {
            statusBadge = 'status-badge out-of-stock';
            statusText = 'Out of Stock';
        } else if (item.quantity <= item.threshold) {
            statusBadge = 'status-badge low-stock';
            statusText = 'Low Stock';
        } else {
            statusBadge = 'status-badge in-stock';
            statusText = 'In Stock';
        }
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td><span class="${statusBadge}">${statusText}</span></td>
            <td>
                <button class="action-btn-small" onclick="editStock(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn-small" onclick="deleteStock(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// AI Demand Forecasting Placeholder
function showAIPrediction() {
    const aiPredictionResult = document.getElementById('aiPredictionResult');
    aiPredictionResult.innerHTML = `
        <span style='font-size: 1.1em; color: #4b72fa;'>Predicted demand for the next 30 days: <b>${Math.floor(Math.random()*1000 + 100)} units</b></span><br/>
        <small style='color:#888;'>* This is a demo AI prediction. Integrate your ML backend for real data.</small>
    `;
}

// Activity Log Functions
function loadActivityLog() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    activityLog.sort((a, b) => b.timestamp - a.timestamp);
    
    activityLog.slice(0, 10).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.message}</h4>
                <p>${activity.type.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div class="activity-time">
                ${formatTime(activity.timestamp)}
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

function addActivity(message, icon) {
    const activity = {
        id: Date.now(),
        type: 'user_action',
        message: message,
        timestamp: new Date(),
        icon: icon
    };
    
    activityLog.unshift(activity);
    loadActivityLog();
}

function clearActivityLog() {
    activityLog = [];
    loadActivityLog();
    showNotification('Activity log cleared', 'info');
}

// Chart Functions (Enhanced version is above)

function updateChart() {
    const period = document.getElementById('chartPeriod').value;
    // In a real application, this would fetch new data based on the period
    showNotification(`Chart updated for ${period} days`, 'info');
}

// Stats Functions
function updateStats() {
    const totalStock = stockData.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = stockData.filter(item => item.quantity <= item.threshold).length;
    const totalValue = stockData.reduce((sum, item) => sum + (item.quantity * Math.floor(Math.random() * 100) + 50), 0);
    const ordersToday = Math.floor(Math.random() * 30) + 10;
    
    document.getElementById('totalStock').textContent = totalStock.toLocaleString();
    document.getElementById('lowStock').textContent = lowStockItems;
    document.getElementById('totalValue').textContent = `$${totalValue.toLocaleString()}`;
    document.getElementById('ordersToday').textContent = ordersToday;
}

// Quick Actions
function quickAddStock() {
    showModal('Quick Add Stock', `
        <form id="quickAddForm">
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" id="quickProductName" required>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" id="quickQuantity" required>
            </div>
            <button type="submit" class="submit-btn">Add Quickly</button>
        </form>
    `);
    
    document.getElementById('quickAddForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('quickProductName').value;
        const quantity = parseInt(document.getElementById('quickQuantity').value);
        
        const newItem = {
            id: stockData.length + 1,
            name: name,
            category: 'general',
            quantity: quantity,
            threshold: Math.ceil(quantity * 0.2),
            status: 'in-stock'
        };
        
        stockData.push(newItem);
        loadStockStatus();
        loadInventoryTable();
        updateStats();
        addActivity(`Quick added ${quantity} units of ${name}`, 'fas fa-bolt');
        closeModal();
        showNotification('Stock added quickly!', 'success');
    });
}

function generateReport() {
    showNotification('Generating report...', 'info');
    
    // Log user activity
    logUserActivity('report_generate', 'Generated inventory report');
    
    setTimeout(() => {
        const report = `
            Inventory Report - ${new Date().toLocaleDateString()}
            Generated by: ${currentUser.fullName} (${currentUser.role})
            
            Total Items: ${stockData.length}
            Total Stock: ${stockData.reduce((sum, item) => sum + item.quantity, 0)}
            Low Stock Items: ${stockData.filter(item => item.quantity <= item.threshold).length}
            Out of Stock Items: ${stockData.filter(item => item.quantity === 0).length}
            
            Categories:
            ${[...new Set(stockData.map(item => item.category))].map(cat => 
                `- ${cat}: ${stockData.filter(item => item.category === cat).length} items`
            ).join('\n')}
            
            Recent Activity:
            ${userActivity.slice(-5).map(activity => 
                `- ${activity.description} (${formatTime(activity.timestamp)})`
            ).join('\n')}
        `;
        
        showModal('Inventory Report', `<pre>${report}</pre>`);
    }, 1000);
}

function exportData() {
    const data = {
        stockData: stockData,
        activityLog: activityLog,
        userActivity: userActivity,
        generatedAt: new Date().toISOString(),
        generatedBy: currentUser.username,
        userRole: currentUser.role
    };
    
    // Log user activity
    logUserActivity('data_export', 'Exported inventory data');
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

function viewAlerts() {
    const alerts = stockData.filter(item => item.quantity <= item.threshold);
    
    if (alerts.length === 0) {
        showModal('Alerts', '<p>No alerts at this time. All items are well stocked!</p>');
    } else {
        const alertHtml = alerts.map(item => `
            <div class="alert-item">
                <h4>${item.name}</h4>
                <p>Current: ${item.quantity} | Threshold: ${item.threshold}</p>
                <span class="alert-level ${item.quantity === 0 ? 'critical' : 'warning'}">
                    ${item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                </span>
            </div>
        `).join('');
        
        showModal('Stock Alerts', alertHtml);
    }
}

// Utility Functions
function refreshStockStatus() {
    showNotification('Refreshing stock status...', 'info');
    
    // Simulate refresh delay
    setTimeout(() => {
        loadStockStatus();
        updateStats();
        showNotification('Stock status refreshed!', 'success');
    }, 1000);
}

function editStock(id) {
    const item = stockData.find(item => item.id === id);
    if (!item) return;
    
    showModal('Edit Stock', `
        <form id="editStockForm">
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" id="editProductName" value="${item.name}" required>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" id="editQuantity" value="${item.quantity}" required>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="editCategory" required>
                    <option value="electronics" ${item.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                    <option value="furniture" ${item.category === 'furniture' ? 'selected' : ''}>Furniture</option>
                    <option value="office" ${item.category === 'office' ? 'selected' : ''}>Office</option>
                    <option value="appliances" ${item.category === 'appliances' ? 'selected' : ''}>Appliances</option>
                </select>
            </div>
            <button type="submit" class="submit-btn">Update Stock</button>
        </form>
    `);
    
    document.getElementById('editStockForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('editProductName').value;
        const quantity = parseInt(document.getElementById('editQuantity').value);
        const category = document.getElementById('editCategory').value;
        
        const oldQuantity = item.quantity;
        const oldName = item.name;
        
        item.name = name;
        item.quantity = quantity;
        item.category = category;
        item.status = quantity > item.threshold ? 'in-stock' : (quantity === 0 ? 'out-of-stock' : 'low-stock');
        item.lastModifiedBy = currentUser.username;
        item.lastModifiedAt = new Date();
        
        loadStockStatus();
        loadInventoryTable();
        updateStats();
        addActivity(`Updated ${name} to ${quantity} units`, 'fas fa-edit');
        
        // Log user activity
        logUserActivity('stock_edit', `Updated ${oldName} (${oldQuantity} → ${quantity} units)`);
        
        closeModal();
        showNotification('Stock updated successfully!', 'success');
    });
}

function deleteStock(id) {
    if (confirm('Are you sure you want to delete this stock item?')) {
        const item = stockData.find(item => item.id === id);
        stockData = stockData.filter(item => item.id !== id);
        
        loadStockStatus();
        loadInventoryTable();
        updateStats();
        addActivity(`Deleted ${item.name}`, 'fas fa-trash');
        
        // Log user activity
        logUserActivity('stock_delete', `Deleted ${item.name} (${item.quantity} units)`);
        
        showNotification('Stock item deleted!', 'success');
    }
}

function showModal(title, content) {
    document.getElementById('modalBody').innerHTML = `<h2>${title}</h2>${content}`;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function formatTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .alert-item {
        padding: 15px;
        background: #f7fafc;
        border-radius: 10px;
        margin-bottom: 10px;
        border-left: 4px solid #f56565;
    }
    
    .alert-level {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
        float: right;
    }
    
    .alert-level.critical {
        background: #fed7d7;
        color: #742a2a;
    }
    
    .alert-level.warning {
        background: #fef5e7;
        color: #744210;
    }
    
    .action-btn-small {
        padding: 5px 8px;
        margin: 0 2px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: background 0.3s ease;
    }
    
    .action-btn-small:hover {
        background: #5a67d8;
    }
`;
document.head.appendChild(style);