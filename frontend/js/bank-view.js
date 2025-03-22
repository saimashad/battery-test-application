/**
 * Bank View JavaScript for Battery Testing Application
 * bank-view.js
 */

import { TestAPI } from './api.js';

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
    } catch (error) {
        showAlert(`Error loading bank data: ${error.message}`, 'danger');
    }
}

/**
 * Load test and bank data
 * @param {string} testId - Test ID
 * @param {string} bankId - Bank ID
 */
async function loadTestData(testId, bankId) {
    try {
        // Show loader
        loaderContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
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
        // Note: In a real implementation, you would call an API to get cycles
        // For this demo, we'll create mock cycle data
        loadCycles(currentBank.id);
    } catch (error) {
        throw error;
    } finally {
        loaderContainer.classList.add('hidden');
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
    testStatus.className = `status-badge status-${currentTest.status}`;
    
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
    
    // Progress bar (mock calculation for demo)
    updateProgressBar();
}

/**
 * Update progress bar based on current test status
 */
function updateProgressBar() {
    let progress = 0;
    
    if (currentTest.status === 'completed') {
        progress = 100;
    } else if (currentTest.status === 'in_progress') {
        // Mock progress calculation
        progress = Math.floor(Math.random() * 70) + 10; // 10-80% for in-progress
    }
    
    progressBar.style.width = `${progress}%`;
    progressLabel.textContent = `${progress}% Complete`;
}

/**
 * Load cycles for the current bank
 * @param {string} bankId - Bank ID
 */
function loadCycles(bankId) {
    // In a real application, you would call an API endpoint:
    // const cycles = await CycleAPI.getCyclesByBankId(bankId);
    
    // For demo purposes, we'll create mock cycle data
    const mockCycles = [];
    
    const numCycles = currentTest.number_of_cycles;
    for (let i = 1; i <= numCycles; i++) {
        // Create start time as current date minus i days
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - i);
        
        // Create end time (if cycle is completed)
        let endTime = null;
        let duration = null;
        let status = 'in_progress';
        
        if (i < numCycles || currentTest.status === 'completed') {
            // This cycle is completed
            endTime = new Date(startTime);
            endTime.setHours(endTime.getHours() + currentTest.time_interval);
            duration = currentTest.time_interval * 60; // minutes
            status = 'completed';
        }
        
        mockCycles.push({
            id: `cycle-${i}-${bankId}`,
            bank_id: bankId,
            cycle_number: i,
            reading_type: i % 2 === 0 ? 'discharge' : 'charge',
            start_time: startTime.toISOString(),
            end_time: endTime ? endTime.toISOString() : null,
            duration: duration,
            status: status
        });
    }
    
    // Update state
    currentCycles = mockCycles;
    
    // Render cycles
    renderCycles();
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
    element.querySelector('[data-field="status"]').textContent = cycle.status;
    
    // Format dates
    const startTime = new Date(cycle.start_time);
    element.querySelector('[data-field="start_time"]').textContent = startTime.toLocaleString();
    
    if (cycle.end_time) {
        const endTime = new Date(cycle.end_time);
        element.querySelector('[data-field="end_time"]').textContent = endTime.toLocaleString();
    } else {
        element.querySelector('[data-field="end_time"]').textContent = 'N/A';
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
}

/**
 * Handle export button click
 */
function handleExport() {
    // Show alert that export is not implemented
    alert(`Exporting data for Bank ${currentBank.bank_number} (Bank ID: ${currentBank.id}).\nThis functionality would connect to the export API endpoint.`);
    
    // In a real implementation, you would:
    // 1. Call the export API endpoint
    // 2. Receive a file or data in response
    // 3. Create a download link and trigger it
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