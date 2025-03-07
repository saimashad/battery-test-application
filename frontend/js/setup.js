/**
 * Test Setup JavaScript for Battery Testing Application
 * setup.js
 */

import { TestAPI } from './api.js';

// DOM Elements
const testSetupForm = document.getElementById('testSetupForm');
const bank1Config = document.getElementById('bank1Config');
const bank2Config = document.getElementById('bank2Config');
const bankSelection = document.querySelectorAll('input[name="bank_selection"]');
const alertContainer = document.getElementById('alertContainer');
const testPreviewSection = document.getElementById('testPreviewSection');
const testPreviewContent = document.getElementById('testPreviewContent');

// Form Fields - Bank 1
const cellRate1 = document.getElementById('cellRate1');
const percentageCapacity1 = document.getElementById('percentageCapacity1');
const dischargeCurrent1 = document.getElementById('dischargeCurrent1');
const numberOfCells1 = document.getElementById('numberOfCells1');

// Form Fields - Bank 2
const cellRate2 = document.getElementById('cellRate2');
const percentageCapacity2 = document.getElementById('percentageCapacity2');
const dischargeCurrent2 = document.getElementById('dischargeCurrent2');
const numberOfCells2 = document.getElementById('numberOfCells2');

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
    // Bank selection radio buttons
    bankSelection.forEach(radio => {
        radio.addEventListener('change', toggleBankConfig);
    });
    
    // Discharge current calculation - Bank 1
    cellRate1.addEventListener('input', calculateDischargeCurrent1);
    percentageCapacity1.addEventListener('input', calculateDischargeCurrent1);
    
    // Discharge current calculation - Bank 2
    cellRate2.addEventListener('input', calculateDischargeCurrent2);
    percentageCapacity2.addEventListener('input', calculateDischargeCurrent2);
    
    // Form submission
    testSetupForm.addEventListener('submit', handleFormSubmit);
    
    // Form input validation
    testSetupForm.addEventListener('input', validateForm);
}

/**
 * Toggle bank configuration based on selection
 */
function toggleBankConfig() {
    const selectedBank = document.querySelector('input[name="bank_selection"]:checked').value;
    
    if (selectedBank === '1') {
        bank1Config.classList.remove('hidden');
        bank2Config.classList.add('hidden');
        
        // Make Bank 2 fields not required
        toggleRequiredFields(bank2Config, false);
    } else {
        bank1Config.classList.remove('hidden');
        bank2Config.classList.remove('hidden');
        
        // Make Bank 2 fields required
        toggleRequiredFields(bank2Config, true);
    }
    
    // Update form preview
    updateFormPreview();
}

/**
 * Toggle required attribute on form fields
 * @param {HTMLElement} container - Form container
 * @param {boolean} required - Whether fields should be required
 */
function toggleRequiredFields(container, required) {
    const inputs = container.querySelectorAll('input:not([type="hidden"]), select');
    inputs.forEach(input => {
        if (required) {
            input.setAttribute('required', '');
        } else {
            input.removeAttribute('required');
        }
    });
}

/**
 * Calculate discharge current for Bank 1
 */
function calculateDischargeCurrent1() {
    const cellRateValue = parseFloat(cellRate1.value) || 0;
    const percentageValue = parseFloat(percentageCapacity1.value) || 0;
    
    const dischargeValue = (percentageValue * cellRateValue) / 100;
    dischargeCurrent1.value = dischargeValue.toFixed(2);
    
    // Update form preview
    updateFormPreview();
}

/**
 * Calculate discharge current for Bank 2
 */
function calculateDischargeCurrent2() {
    const cellRateValue = parseFloat(cellRate2.value) || 0;
    const percentageValue = parseFloat(percentageCapacity2.value) || 0;
    
    const dischargeValue = (percentageValue * cellRateValue) / 100;
    dischargeCurrent2.value = dischargeValue.toFixed(2);
    
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
        time_interval: parseInt(formData.get('time_interval')),
        start_date: formData.get('start_date'),
        banks: []
    };
    
    // Add Bank 1
    if (cellRate1.value && percentageCapacity1.value && numberOfCells1.value) {
        testData.banks.push({
            bank_number: 1,
            cell_type: formData.get('banks[0].cell_type'),
            cell_rate: parseFloat(formData.get('banks[0].cell_rate')),
            percentage_capacity: parseFloat(formData.get('banks[0].percentage_capacity')),
            discharge_current: parseFloat(dischargeCurrent1.value),
            number_of_cells: parseInt(formData.get('banks[0].number_of_cells'))
        });
    }
    
    // Add Bank 2 if selected and filled
    const selectedBank = document.querySelector('input[name="bank_selection"]:checked').value;
    if (selectedBank === '2' && cellRate2.value && percentageCapacity2.value && numberOfCells2.value) {
        testData.banks.push({
            bank_number: 2,
            cell_type: formData.get('banks[1].cell_type'),
            cell_rate: parseFloat(formData.get('banks[1].cell_rate')),
            percentage_capacity: parseFloat(formData.get('banks[1].percentage_capacity')),
            discharge_current: parseFloat(dischargeCurrent2.value),
            number_of_cells: parseInt(formData.get('banks[1].number_of_cells'))
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
            <p>Time Interval: ${testData.time_interval} hour(s)</p>
            
            <h4 class="mt-4">Banks Configuration</h4>
            <div class="grid grid-cols-2 gap-4 mt-2">
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
            time_interval: parseInt(formData.get('time_interval')),
            start_date: formData.get('start_date'),
            banks: []
        };
        
        // Always add Bank 1
        testData.banks.push({
            bank_number: 1,
            cell_type: formData.get('banks[0].cell_type'),
            cell_rate: parseFloat(formData.get('banks[0].cell_rate')),
            percentage_capacity: parseFloat(formData.get('banks[0].percentage_capacity')),
            number_of_cells: parseInt(formData.get('banks[0].number_of_cells'))
        });
        
        // Add Bank 2 if selected
        const selectedBank = document.querySelector('input[name="bank_selection"]:checked').value;
        if (selectedBank === '2') {
            testData.banks.push({
                bank_number: 2,
                cell_type: formData.get('banks[1].cell_type'),
                cell_rate: parseFloat(formData.get('banks[1].cell_rate')),
                percentage_capacity: parseFloat(formData.get('banks[1].percentage_capacity')),
                number_of_cells: parseInt(formData.get('banks[1].number_of_cells'))
            });
        }
        
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