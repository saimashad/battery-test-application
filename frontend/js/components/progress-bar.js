/**
 * Progress Bar Component for Battery Testing Application
 * components/progress-bar.js
 */

/**
 * Creates a progress bar element
 * @param {string} containerId - ID of the container element
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} labelId - ID of the label element (optional)
 * @returns {HTMLElement} The container element
 */
export function createProgressBar(containerId, progress, labelId = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return null;
    }
    
    // Create progress bar if it doesn't exist
    if (!container.querySelector('.progress-bar')) {
        container.innerHTML = '<div class="progress-bar"></div>';
    }
    
    // Set progress
    const progressBar = container.querySelector('.progress-bar');
    progressBar.style.width = `${progress}%`;
    
    // Update label if provided
    if (labelId) {
        const label = document.getElementById(labelId);
        if (label) {
            label.textContent = `${progress}% Complete`;
        }
    }
    
    return container;
}

/**
 * Calculate test progress percentage
 * @param {Object} test - Test object from API
 * @returns {number} Progress percentage (0-100)
 */
export function calculateTestProgress(test) {
    // If test is completed, return 100%
    if (test.status === 'completed') {
        return 100;
    }
    
    // If test is scheduled, return 0%
    if (test.status === 'scheduled') {
        return 0;
    }
    
    // For in-progress tests, calculate based on cycles and readings
    let totalSteps = 0;
    let completedSteps = 0;
    
    // Each bank adds steps
    for (const bank of test.banks) {
        // For each cycle in the bank
        for (let i = 1; i <= test.number_of_cycles; i++) {
            // Each cycle has OCV reading (1 step) + CCV readings (based on time interval)
            const ccvReadingsPerCycle = test.time_interval === 1 ? 1 : 2;
            totalSteps += 1 + ccvReadingsPerCycle; // OCV + CCV readings
        }
    }
    
    // In a real application, we would query the database to count completed readings
    // For this implementation, we'll estimate based on test status and mock data
    if (test.status === 'in_progress') {
        // For simplicity, we'll assume 30-70% completion for in-progress tests
        completedSteps = Math.floor(totalSteps * (0.3 + Math.random() * 0.4));
    }
    
    return Math.floor((completedSteps / totalSteps) * 100);
}

/**
 * Calculate cycle progress percentage
 * @param {Object} cycle - Cycle object from API
 * @param {Array} readings - Readings for this cycle
 * @param {number} expectedReadingsCount - Expected number of readings
 * @returns {number} Progress percentage (0-100)
 */
export function calculateCycleProgress(cycle, readings, expectedReadingsCount) {
    // If cycle is completed, return 100%
    if (cycle.end_time) {
        return 100;
    }
    
    // Check if we have OCV reading (worth 20% of progress)
    const ocvReading = readings.find(reading => reading.is_ocv);
    const ccvReadings = readings.filter(reading => !reading.is_ocv);
    
    let progress = 0;
    
    // OCV reading is 20% of progress
    if (ocvReading) {
        progress += 20;
    }
    
    // CCV readings are the remaining 80% of progress
    if (expectedReadingsCount > 0) {
        progress += (ccvReadings.length / expectedReadingsCount) * 80;
    }
    
    return Math.round(progress);
}