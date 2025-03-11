/**
 * Test Setup JavaScript for Battery Testing Application
 * setup.js
 */

import { TestAPI } from './api.js';

// DOM Elements
const testSetupForm = document.getElementById('testSetupForm');
const alertContainer = document.getElementById('alertContainer');
const testPreviewSection = document.getElementById('testPreviewSection');
const testPreviewContent = document.getElementById('testPreviewContent');

// Form Fields
const cellRate = document.getElementById('cellRate');
const percentageCapacity = document.getElementById('percentageCapacity');
const dischargeCurrent = document.getElementById('dischargeCurrent');
const numberOfCells = document.getElementById('numberOfCells');

/**
 * Initialize the setup form
 */
function initSetupForm() {
    // Set default date to today
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    document.getElementById('startDate').value = today.toISOString().slice(0, 16);
    
    // Setup event listeners
    setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Discharge current calculation
    cellRate.addEventListener('input', calculateDischargeCurrent);
    percentageCapacity.addEventListener('input', calculateDischargeCurrent);
    
    // Form submission
    testSetupForm.addEventListener('submit', handleFormSubmit);
    
    // Form input validation
    testSetupForm.addEventListener('input', validateForm);
}

/**
 * Calculate discharge current
 */
function calculateDischargeCurrent() {
    const cellRateValue = parseFloat(cellRate.value) || 0;
    const percentageValue = parseFloat(percentageCapacity.value) || 0;
    
    const dischargeValue = (percentageValue * cellRateValue) / 100;
    dischargeCurrent.value = dischargeValue.toFixed(2);
    
    // Update form preview
    updateFormPreview();
}

/**
 * Update form preview section
 */
function updateFormPreview() {
    // Get form data
    const formData = new FormData(testSetupForm);
    const testData = {
        job_number: formData.get('job_number'),
        customer_name: formData.get('customer_name'),
        number_of_cycles: parseInt(formData.get('number_of_cycles')),
        start_date: formData.get('start_date'),
        banks: []
    };
    
    // Add Bank
    if (cellRate.value && percentageCapacity.value && numberOfCells.value) {
        const bankNumber = parseInt(formData.get('banks[0].bank_number')) || 1;
        testData.banks.push({
            bank_number: bankNumber,
            cell_type: formData.get('banks[0].cell_type'),
            cell_rate: parseFloat(formData.get('banks[0].cell_rate')),
            percentage_capacity: parseFloat(formData.get('banks[0].percentage_capacity')),
            discharge_current: parseFloat(dischargeCurrent.value),
            number_of_cells: parseInt(formData.get('banks[0].number_of_cells'))
        });
    }
    
    // Only show preview if we have enough data
    if (testData.job_number && testData.customer_name && testData.banks.length > 0) {
        // Create preview HTML
        const previewHTML = `
            <h4>Job: ${testData.job_number}</h4>
            <h5>Customer: ${testData.customer_name}</h5>
            <p>Start Date: ${formatDate(testData.start_date)}</p>
            <p>Number of Cycles: ${testData.number_of_cycles}</p>
            
            <h4 class="mt-4">Bank Configuration</h4>
            <div class="grid grid-cols-1 gap-4 mt-2">
                ${testData.banks.map(bank => `
                    <div class="card">
                        <div class="card-header">
                            <h5>Bank ${bank.bank_number}</h5>
                        </div>
                        <div class="card-body">
                            <p>Cell Type: ${bank.cell_type}</p>
                            <p>Cell Rate: ${bank.cell_rate}</p>
                            <p>Percentage Capacity: ${bank.percentage_capacity}%</p>
                            <p>Discharge Current: ${bank.discharge_current}</p>
                            <p>Number of Cells: ${bank.number_of_cells}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Update preview section
        testPreviewContent.innerHTML = previewHTML;
        testPreviewSection.classList.remove('hidden');
    } else {
        testPreviewSection.classList.add('hidden');
    }
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
}

/**
 * Validate form inputs
 */
function validateForm() {
    const isValid = testSetupForm.checkValidity();
    
    // Update visuals based on validity
    const inputs = testSetupForm.querySelectorAll('input:not([type="hidden"]), select');
    inputs.forEach(input => {
        if (input.checkValidity()) {
            input.classList.remove('is-invalid');
            if (input.value) {
                input.classList.add('is-valid');
            } else {
                input.classList.remove('is-valid');
            }
        } else {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
        }
    });
    
    return isValid;
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        showAlert('Please fix the errors in the form', 'danger');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = testSetupForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Creating...';
        submitButton.disabled = true;
        
        // Get form data
        const formData = new FormData(testSetupForm);
        
        // Build request payload
        const testData = {
            job_number: formData.get('job_number'),
            customer_name: formData.get('customer_name'),
            number_of_cycles: parseInt(formData.get('number_of_cycles')),
            start_date: formData.get('start_date'),
            banks: []
        };
        
        // Add Bank details
        const bankNumber = parseInt(formData.get('banks[0].bank_number')) || 1;
        testData.banks.push({
            bank_number: bankNumber,
            cell_type: formData.get('banks[0].cell_type'),
            cell_rate: parseFloat(formData.get('banks[0].cell_rate')),
            percentage_capacity: parseFloat(formData.get('banks[0].percentage_capacity')),
            number_of_cells: parseInt(formData.get('banks[0].number_of_cells'))
        });
        
        // Submit to API
        const response = await TestAPI.createTest(testData);
        
        // Redirect to dashboard with success message
        window.location.href = `index.html?message=Test created successfully: Job #${response.job_number}`;
    } catch (error) {
        showAlert(`Error creating test: ${error.message}`, 'danger');
        
        // Reset button
        const submitButton = testSetupForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Create Test';
        submitButton.disabled = false;
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
    
    // Scroll to alert
    alertContainer.scrollIntoView({ behavior: 'smooth' });
}

// Initialize the setup form when DOM is loaded
document.addEventListener('DOMContentLoaded', initSetupForm);