/**
 * Dashboard JavaScript for Battery Testing Application
 * dashboard.js
 */

import { TestAPI } from './api.js';
import { createTestCard } from './components/test-card.js';

// DOM Elements
const testsGrid = document.getElementById('testsGrid');
const loaderContainer = document.getElementById('loaderContainer');
const emptyState = document.getElementById('emptyState');
const alertContainer = document.getElementById('alertContainer');
const filterButtons = document.querySelectorAll('.filter-button');

// State
let allTests = [];
let currentFilter = 'all';

/**
 * Initialize the dashboard
 */
async function initDashboard() {
    try {
        await loadTests();
        setupEventListeners();
        
        // Check for success message in URL (e.g., after creating a test)
        const urlParams = new URLSearchParams(window.location.search);
        const message = urlParams.get('message');
        if (message) {
            showAlert(message, 'success');
            // Remove the message from URL to prevent showing it again on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (error) {
        showAlert(`Failed to load tests: ${error.message}`, 'danger');
    }
}

/**
 * Load tests from API
 */
async function loadTests() {
    try {
        loaderContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
        testsGrid.innerHTML = ''; // Clear existing content except loader
        testsGrid.appendChild(loaderContainer);
        testsGrid.appendChild(emptyState);
        
        // Fetch tests from API
        allTests = await TestAPI.getAllTests();
        
        // Apply current filter
        renderTests();
    } catch (error) {
        throw error;
    } finally {
        loaderContainer.classList.add('hidden');
    }
}

/**
 * Render tests based on current filter
 */
function renderTests() {
    // Clear grid except loader and empty state
    const children = Array.from(testsGrid.children);
    children.forEach(child => {
        if (child !== loaderContainer && child !== emptyState) {
            testsGrid.removeChild(child);
        }
    });
    
    // Filter tests based on current filter
    let filteredTests = allTests;
    if (currentFilter !== 'all') {
        filteredTests = allTests.filter(test => test.status === currentFilter);
    }
    
    // Show empty state if no tests
    if (filteredTests.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    // Create test cards for each test
    filteredTests.forEach(test => {
        const testCard = createTestCard(test);
        testsGrid.appendChild(testCard);
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update filter and render
            currentFilter = button.dataset.filter;
            renderTests();
        });
    });
    
    // Refresh button event listener if added later
}

/**
 * Show alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, danger, warning, info)
 */
function showAlert(message, type) {
    // Get alert template
    const alertTemplate = document.getElementById('alertTemplate');
    const alertElement = alertTemplate.content.cloneNode(true);
    
    // Set message and type
    alertElement.querySelector('[data-field="message"]').textContent = message;
    alertElement.querySelector('.alert').classList.add(`alert-${type}`);
    
    // Add to container
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertElement);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);