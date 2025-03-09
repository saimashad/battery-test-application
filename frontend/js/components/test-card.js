/**
 * Test Card Component for Battery Testing Application
 * components/test-card.js
 */

import { formatStatus } from './status-badge.js';
import { calculateTestProgress } from './progress-bar.js';

/**
 * Creates a test card element for a given test
 * @param {Object} test - Test object from API
 * @returns {HTMLElement} Test card element
 */
export function createTestCard(test) {
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
    card.querySelector('[data-field="time_interval"]').textContent = test.time_interval;
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
    
    return card.firstElementChild; // Return the card div itself
}

/**
 * Navigate to the next reading that needs to be taken
 * @param {Object} test - Test object
 */
async function navigateToNextReading(test) {
    try {
        // In a real implementation, we would call an API to determine the next reading
        // For this implementation, we'll use a mock approach
        
        // For demo, we'll assume we need to go to cycle 1 for the first bank
        const bankId = test.banks[0].id;
        
        // Get cycles for this bank
        // In a real app, this would be an API call
        // const cycles = await CycleAPI.getCyclesByBankId(bankId);
        
        // For demo, create a mock cycle ID
        const cycleId = `cycle-1-${bankId}`;
        
        // Redirect to the cycle view page
        window.location.href = `cycle-view.html?testId=${test.id}&bankId=${bankId}&cycleId=${cycleId}`;
    } catch (error) {
        console.error('Error navigating to readings:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Export test data
 * @param {Object} test - Test object
 */
function exportTestData(test) {
    try {
        // In a real implementation, we would call the export API endpoint
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