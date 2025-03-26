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
 * Calculate test progress percentage based on actual reading data
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
    
    // For in-progress tests, calculate based on cycles and their status
    let totalSteps = 0;
    let completedSteps = 0;
    
    // Each bank adds steps
    for (const bank of test.banks) {
        // We'd expect 1 OCV + some CCV readings per cycle
        // For each bank × number of cycles × 2 (for charge and discharge)
        const cyclesPerBank = test.number_of_cycles * 2; // Charge and discharge
        totalSteps += cyclesPerBank;
        
        // Count completed cycles based on end_time being set
        if (bank.cycles) {
            for (const cycle of bank.cycles) {
                if (cycle.end_time) {
                    completedSteps += 1;
                } else if (cycle.readings && cycle.readings.length > 0) {
                    // Partial credit for cycles with readings but not completed
                    const readingCount = cycle.readings.length;
                    const expectedReadings = 5; // Assume 5 readings expected on average
                    const partialProgress = Math.min(readingCount / expectedReadings, 0.9); // Max 90%
                    completedSteps += partialProgress;
                }
            }
        }
    }
    
    // Prevent division by zero
    if (totalSteps === 0) {
        return 0;
    }
    
    return Math.floor((completedSteps / totalSteps) * 100);
}

/**
 * Calculate cycle progress percentage based on actual readings
 * @param {Object} cycle - Cycle object from API
 * @param {Array} readings - Readings for this cycle
 * @returns {number} Progress percentage (0-100)
 */
export function calculateCycleProgress(cycle, readings) {
    // If cycle is completed, return 100%
    if (cycle.end_time) {
        return 100;
    }
    
    // Check if we have OCV reading (worth 25% of progress)
    const ocvReading = readings.find(reading => reading.is_ocv);
    const ccvReadings = readings.filter(reading => !reading.is_ocv);
    
    let progress = 0;
    
    // OCV reading is 25% of progress
    if (ocvReading) {
        progress += 25;
    }
    
    // CCV readings - assume we need at least 3 CCV readings for a complete cycle
    const expectedCCVReadings = 3;
    if (ccvReadings.length > 0) {
        // Calculate progress based on number of CCV readings, with a max of 75%
        const ccvProgress = Math.min((ccvReadings.length / expectedCCVReadings) * 75, 75);
        progress += ccvProgress;
    }
    
    return Math.round(progress);
}