/**
 * Test Card Component for Battery Testing Application
 * components/test-card.js
 */

import { TestAPI } from '../api.js';
import { formatStatus } from './status-badge.js';
import { calculateTestProgress } from './progress-bar.js';

/**
 * Creates a test card element for a given test
 * @param {Object} test - Test object from API
 * @param {Function} onDelete - Callback function when test is deleted
 * @returns {HTMLElement} Test card element
 */
export function createTestCard(test, onDelete) {
    // Clone template
    const template = document.getElementById('testCardTemplate');
    const card = template.content.cloneNode(true);
    
    // Fill in test details
    card.querySelector('[data-field="job_number"]').textContent = test.job_number;
    card.querySelector('[data-field="customer_name"]').textContent = test.customer_name;
    
    // Format and set date
    const startDate = new Date(test.start_date);
    card.querySelector('[data-field="start_date"]').textContent = startDate.toLocaleDateString();
    
    // Set other fields
    card.querySelector('[data-field="number_of_cycles"]').textContent = test.number_of_cycles;
    card.querySelector('[data-field="banks_count"]').textContent = test.banks.length;
    
    // Set status badge
    const statusBadge = card.querySelector('[data-field="status-badge"]');
    statusBadge.textContent = formatStatus(test.status);
    statusBadge.className = `status-badge status-badge-${test.status}`;
    
    // Calculate and set progress
    const progress = calculateTestProgress(test);
    
    if (test.status === 'completed') {
        // Set to 100% for completed tests
        card.querySelector('[data-field="progress-bar"]').style.width = '100%';
        card.querySelector('[data-field="progress-label"]').textContent = '100% Complete';
    } else if (test.status === 'scheduled') {
        // Hide progress for scheduled tests
        card.querySelector('[data-field="progress-container"]').classList.add('hidden');
        card.querySelector('[data-field="progress-label"]').classList.add('hidden');
    } else {
        // Set progress for in-progress tests
        card.querySelector('[data-field="progress-bar"]').style.width = `${progress}%`;
        card.querySelector('[data-field="progress-label"]').textContent = `${progress}% Complete`;
    }
    
    // Set up view details link
    card.querySelector('[data-field="view-details-btn"]').href = `bank-view.html?testId=${test.id}&bankId=${test.banks[0].id}`;
    
    // Set up take readings button
    const takeReadingsBtn = card.querySelector('[data-field="take-readings-btn"]');
    if (takeReadingsBtn) {
        // Only enable button if test is not completed
        if (test.status === 'completed') {
            takeReadingsBtn.classList.add('btn-disabled');
            takeReadingsBtn.disabled = true;
        } else {
            takeReadingsBtn.addEventListener('click', (event) => {
                event.preventDefault();
                navigateToNextReading(test);
            });
        }
    }
    
    // Setup export button
    const exportBtn = card.querySelector('[data-field="export-btn"]');
    exportBtn.addEventListener('click', (event) => {
        event.preventDefault();
        exportTestData(test);
    });
    
    // Setup delete button
    const deleteBtn = card.querySelector('[data-field="delete-btn"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (confirm(`Are you sure you want to delete test "${test.job_number}"? This action cannot be undone.`)) {
                deleteTest(test.id, onDelete);
            }
        });
    }
    
    return card.firstElementChild; // Return the card div itself
}

/**
 * Navigate to the next reading that needs to be taken
 * @param {Object} test - Test object
 */
async function navigateToNextReading(test) {
    try {
        // Show loading over the button
        const takeReadingsBtn = document.querySelector(`[data-test-id="${test.id}"]`)?.querySelector('[data-field="take-readings-btn"]');
        if (takeReadingsBtn) {
            const originalText = takeReadingsBtn.textContent;
            takeReadingsBtn.textContent = 'Loading...';
            takeReadingsBtn.disabled = true;
        }
        
        // Get the next unfinished cycle
        const response = await TestAPI.getNextUnfinishedCycle(test.id);
        
        // Redirect to the cycle view page
        window.location.href = `cycle-view.html?testId=${test.id}&bankId=${response.bank_id}&cycleId=${response.id}`;
    } catch (error) {
        console.error('Error navigating to readings:', error);
        alert(`Error: ${error.message}`);
        
        // Reset button
        const takeReadingsBtn = document.querySelector(`[data-test-id="${test.id}"]`)?.querySelector('[data-field="take-readings-btn"]');
        if (takeReadingsBtn) {
            takeReadingsBtn.textContent = 'Take Readings';
            takeReadingsBtn.disabled = false;
        }
    }
}

/**
 * Export test data
 * @param {Object} test - Test object
 */
function exportTestData(test) {
    try {
        // Get the export URL for the test
        const exportUrl = `http://localhost:8000/api/v1/export/test/${test.id}`;
        
        // Create a temporary link and trigger download
        const a = document.createElement('a');
        a.href = exportUrl;
        a.download = `test_${test.job_number}.csv`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log(`Exporting data for test ${test.job_number} (Test ID: ${test.id})`);
    } catch (error) {
        console.error('Error exporting test data:', error);
        alert(`Error exporting test data: ${error.message}`);
    }
}

/**
 * Delete a test
 * @param {string} testId - Test ID
 * @param {Function} onDelete - Callback function when deletion is complete
 */
async function deleteTest(testId, onDelete) {
    try {
        // Delete the test via API
        await TestAPI.deleteTest(testId);
        
        // Call the callback function if provided
        if (typeof onDelete === 'function') {
            onDelete(testId);
        }
    } catch (error) {
        console.error('Error deleting test:', error);
        alert(`Error deleting test: ${error.message}`);
    }
}