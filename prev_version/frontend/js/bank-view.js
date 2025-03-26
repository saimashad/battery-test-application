/**
 * Bank View JavaScript for Battery Testing Application
 * bank-view.js
 */

import { TestAPI, BankAPI, CycleAPI, ExportAPI } from './api.js';

// DOM Elements
const bankNumber = document.getElementById('bankNumber');
const jobNumber = document.getElementById('jobNumber');
const customerName = document.getElementById('customerName');
const testStatus = document.getElementById('testStatus');
const cellType = document.getElementById('cellType');
const cellRate = document.getElementById('cellRate');
const percentageCapacity = document.getElementById('percentageCapacity');
const dischargeCurrent = document.getElementById('dischargeCurrent');
const numberOfCells = document.getElementById('numberOfCells');
const startDate = document.getElementById('startDate');
const progressBar = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');
const exportBtn = document.getElementById('exportBtn');
const cyclesList = document.getElementById('cyclesList');
const loaderContainer = document.getElementById('loaderContainer');
const emptyState = document.getElementById('emptyState');
const alertContainer = document.getElementById('alertContainer');
const testBreadcrumb = document.getElementById('testBreadcrumb');
const bankBreadcrumb = document.getElementById('bankBreadcrumb');

// State
let currentTest = null;
let currentBank = null;
let currentCycles = [];
let refreshInterval = null;

/**
 * Initialize the bank view
 */
async function initBankView() {
    try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const testId = urlParams.get('testId');
        const bankId = urlParams.get('bankId');
        
        if (!testId || !bankId) {
            showAlert('Missing test or bank ID', 'danger');
            return;
        }
        
        // Load test data
        await loadTestData(testId, bankId);
        
        // Setup event listeners
        setupEventListeners();
        
        // Set up auto-refresh every 30 seconds
        refreshInterval = setInterval(() => {
            loadTestData(testId, bankId, true);
        }, 30000);
    } catch (error) {
        showAlert(`Error loading bank data: ${error.message}`, 'danger');
    }
}

/**
 * Clean up on page unload
 */
function cleanUp() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

/**
 * Load test and bank data
 * @param {string} testId - Test ID
 * @param {string} bankId - Bank ID
 * @param {boolean} isRefresh - Whether this is a refresh (prevents showing loader)
 */
async function loadTestData(testId, bankId, isRefresh = false) {
    try {
        // Show loader (only for initial load)
        if (!isRefresh) {
            loaderContainer.classList.remove('hidden');
            emptyState.classList.add('hidden');
        }
        
        // Fetch test data
        currentTest = await TestAPI.getTestById(testId);
        
        // Find the current bank
        currentBank = currentTest.banks.find(bank => bank.id === bankId);
        
        if (!currentBank) {
            throw new Error('Bank not found');
        }
        
        // Update breadcrumbs
        testBreadcrumb.textContent = `Test: Job #${currentTest.job_number}`;
        bankBreadcrumb.textContent = `Bank ${currentBank.bank_number}`;
        
        // Update UI with test data
        updateBankDetails();
        
        // Load cycles for this bank
        await loadCycles(currentBank.id);
    } catch (error) {
        console.error("Error loading test data:", error);
        if (!isRefresh) {
            throw error;
        }
    } finally {
        if (!isRefresh) {
            loaderContainer.classList.add('hidden');
        }
    }
}

/**
 * Update bank details in the UI
 */
function updateBankDetails() {
    // Test details
    bankNumber.textContent = currentBank.bank_number;
    jobNumber.textContent = currentTest.job_number;
    customerName.textContent = currentTest.customer_name;
    
    // Status badge
    testStatus.textContent = formatStatus(currentTest.status);
    testStatus.className = `status-badge status-badge-${currentTest.status}`;
    
    // Bank details
    cellType.textContent = currentBank.cell_type;
    cellRate.textContent = currentBank.cell_rate;
    percentageCapacity.textContent = currentBank.percentage_capacity;
    dischargeCurrent.textContent = currentBank.discharge_current || 
        ((currentBank.percentage_capacity * currentBank.cell_rate) / 100).toFixed(2);
    numberOfCells.textContent = currentBank.number_of_cells;
    
    // Date formatting
    const date = new Date(currentTest.start_date);
    startDate.textContent = date.toLocaleString();
    
    // Progress bar
    updateProgressBar();
}

/**
 * Update progress bar based on current cycles
 */
function updateProgressBar() {
    let progress = 0;
    
    if (currentTest.status === 'completed') {
        progress = 100;
    } else if (currentTest.status === 'in_progress') {
        // Calculate based on cycle completion
        if (currentCycles.length > 0) {
            const completedCycles = currentCycles.filter(cycle => cycle.end_time).length;
            progress = Math.floor((completedCycles / currentCycles.length) * 100);
        }
    }
    
    progressBar.style.width = `${progress}%`;
    progressLabel.textContent = `${progress}% Complete`;
}

/**
 * Load cycles for the current bank
 * @param {string} bankId - Bank ID
 */
async function loadCycles(bankId) {
    try {
        // Fetch cycles from API
        const cycles = await BankAPI.getBankCycles(bankId);
        
        // Update state
        currentCycles = cycles;
        
        // Render cycles
        renderCycles();
        
        // Update progress bar
        updateProgressBar();
    } catch (error) {
        console.error("Error loading cycles:", error);
        showAlert(`Error loading cycles: ${error.message}`, 'danger');
    }
}

/**
 * Render cycles list
 */
function renderCycles() {
    // Clear existing content except loader and empty state
    const children = Array.from(cyclesList.children);
    children.forEach(child => {
        if (child !== loaderContainer && child !== emptyState) {
            cyclesList.removeChild(child);
        }
    });
    
    // Show empty state if no cycles
    if (currentCycles.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    // Hide empty state
    emptyState.classList.add('hidden');
    
    // Create cycle items
    currentCycles.forEach(cycle => {
        const cycleElement = createCycleElement(cycle);
        cyclesList.appendChild(cycleElement);
    });
}

/**
 * Create cycle element
 * @param {Object} cycle - Cycle data
 * @returns {HTMLElement} Cycle element
 */
function createCycleElement(cycle) {
    // Clone template
    const template = document.getElementById('cycleItemTemplate');
    const element = template.content.cloneNode(true);
    
    // Fill in cycle details
    element.querySelector('[data-field="cycle_number"]').textContent = cycle.cycle_number;
    
    // Set status
    const status = cycle.end_time ? 'completed' : 'in_progress';
    element.querySelector('[data-field="status"]').textContent = formatStatus(status);
    element.querySelector('[data-field="status"]').className = `cycle-status status-badge-${status}`;
    
    // Format dates
    if (cycle.start_time) {
        const startTime = new Date(cycle.start_time);
        element.querySelector('[data-field="start_time"]').textContent = startTime.toLocaleString();
    } else {
        element.querySelector('[data-field="start_time"]').textContent = 'Not started';
    }
    
    if (cycle.end_time) {
        const endTime = new Date(cycle.end_time);
        element.querySelector('[data-field="end_time"]').textContent = endTime.toLocaleString();
    } else {
        element.querySelector('[data-field="end_time"]').textContent = 'Not completed';
    }
    
    if (cycle.duration) {
        element.querySelector('[data-field="duration"]').textContent = `${cycle.duration} minutes`;
    } else {
        element.querySelector('[data-field="duration"]').textContent = 'N/A';
    }
    
    // Setup view button
    const viewBtn = element.querySelector('[data-field="view-cycle-btn"]');
    viewBtn.href = `cycle-view.html?testId=${currentTest.id}&bankId=${currentBank.id}&cycleId=${cycle.id}`;
    
    return element.firstElementChild;
}

/**
 * Format status for display
 * @param {string} status - Status string
 * @returns {string} Formatted status
 */
function formatStatus(status) {
    switch (status) {
        case 'scheduled':
            return 'Scheduled';
        case 'in_progress':
            return 'In Progress';
        case 'completed':
            return 'Completed';
        default:
            return status;
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Export button
    exportBtn.addEventListener('click', handleExport);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanUp);
}

/**
 * Handle export button click
 */
async function handleExport() {
    try {
        // Show loading state
        exportBtn.textContent = 'Exporting...';
        exportBtn.disabled = true;
        
        // Call the export API
        const blob = await ExportAPI.exportBankData(currentBank.id);
        
        // Download the file
        ExportAPI.downloadData(blob, `bank_${currentBank.bank_number}_test_${currentTest.job_number}.csv`);
        
        // Show success message
        showAlert('Export successful', 'success');
    } catch (error) {
        showAlert(`Export failed: ${error.message}`, 'danger');
    } finally {
        // Reset button
        exportBtn.textContent = 'Export Data';
        exportBtn.disabled = false;
    }
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

// Initialize the bank view when DOM is loaded
document.addEventListener('DOMContentLoaded', initBankView);