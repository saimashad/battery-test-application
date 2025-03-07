/**
 * Test Card Component for Battery Testing Application
 * components/test-card.js
 */

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
    
    // Add event listeners
    card.querySelector('[data-field="view-details-btn"]').href = `bank-view.html?testId=${test.id}&bankId=${test.banks[0].id}`;
    
    // Setup export button
    const exportBtn = card.querySelector('[data-field="export-btn"]');
    exportBtn.addEventListener('click', (event) => {
        event.preventDefault();
        exportTestData(test);
    });
    
    return card.firstElementChild; // Return the card div itself
}

/**
 * Format status for display
 * @param {string} status - Status string from API
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
 * Calculate test progress percentage
 * @param {Object} test - Test object
 * @returns {number} Progress percentage (0-100)
 */
function calculateTestProgress(test) {
    // If test is not in progress, return 0
    if (test.status !== 'in_progress') {
        return 0;
    }
    
    // Calculate total possible readings based on cycles and time interval
    const readingsPerCycle = test.time_interval === 1 ? 1 : 2;
    const totalPossibleReadings = test.number_of_cycles * readingsPerCycle * test.banks.length;
    
    // Count completed readings (this is a simplified calculation)
    // In a real app, you'd need actual reading data from the server
    let completedReadings = 0;
    // This is pseudocode - in reality you'd need to get this data from the API
    // completedReadings = countCompletedReadings(test);
    
    // For demo purposes, generate a random progress
    completedReadings = Math.floor(Math.random() * totalPossibleReadings);
    
    // Calculate percentage
    return Math.round((completedReadings / totalPossibleReadings) * 100);
}

/**
 * Export test data
 * @param {Object} test - Test object
 */
function exportTestData(test) {
    // Show alert that export is not implemented
    alert(`Exporting data for test ${test.job_number} (Test ID: ${test.id}).\nThis functionality would connect to the export API endpoint.`);
    
    // In a real implementation, you would:
    // 1. Call the export API endpoint
    // 2. Receive a file or data in response
    // 3. Create a download link and trigger it
    
    // Example pseudocode:
    // fetch(`${API_BASE_URL}/export/test/${test.id}`)
    //     .then(response => response.blob())
    //     .then(blob => {
    //         const url = window.URL.createObjectURL(blob);
    //         const a = document.createElement('a');
    //         a.href = url;
    //         a.download = `test-${test.job_number}.csv`;
    //         document.body.appendChild(a);
    //         a.click();
    //         window.URL.revokeObjectURL(url);
    //     });
}