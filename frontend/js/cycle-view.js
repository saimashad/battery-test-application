/**
 * Cycle View JavaScript for Battery Testing Application
 * cycle-view.js
 */

import { TestAPI, CycleAPI, ReadingAPI } from './api.js';
import { createReadingGrid, getReadingGridValues, validateReadingGrid } from './components/reading-grid.js';

// State variables
let currentTest = null;
let currentBank = null;
let currentCycle = null;
let currentReadings = [];
let ocvSubmitted = false;
let currentCCVReadingNumber = 1;
let ccvIntervals = []; // Store time intervals between CCV readings
let firstCCVTimestamp = null; // Store the timestamp of the first CCV reading

/**
 * Initialize the cycle view
 */
async function initCycleView() {
    try {
        console.log("Initializing cycle view...");
        
        // Get DOM elements after page has loaded
        const domElements = getDOMElements();
        if (!domElements) {
            console.error("Failed to get DOM elements");
            return;
        }
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const testId = urlParams.get('testId');
        const bankId = urlParams.get('bankId');
        const cycleId = urlParams.get('cycleId');
        
        console.log(`URL Parameters: testId=${testId}, bankId=${bankId}, cycleId=${cycleId}`);
        
        if (!testId || !bankId || !cycleId) {
            showAlert('Missing test, bank, or cycle ID', 'danger');
            return;
        }
        
        // Load test and cycle data
        await loadTestData(testId, bankId, cycleId);
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup reading grids
        setupReadingGrids();
        
        // Load readings history
        loadReadingsHistory();
        
        // Set initial view state based on readings
        updateViewState();
        
        console.log("Cycle view initialized successfully");
    } catch (error) {
        console.error("Error initializing cycle view:", error);
        showAlert(`Error loading cycle data: ${error.message}`, 'danger');
    }
}

/**
 * Get all required DOM elements
 * @returns {Object} Object containing DOM elements
 */
function getDOMElements() {
    try {
        return {
            cycleNumber: document.getElementById('cycleNumber'),
            bankNumber: document.getElementById('bankNumber'),
            jobNumber: document.getElementById('jobNumber'),
            cycleStatus: document.getElementById('cycleStatus'),
            startTime: document.getElementById('startTime'),
            endTime: document.getElementById('endTime'),
            duration: document.getElementById('duration'),
            readingType: document.getElementById('readingType'),
            readingTypeDisplay: document.getElementById('readingTypeDisplay'),
            progress: document.getElementById('progress'),
            progressBar: document.getElementById('progressBar'),
            numberOfCells: document.getElementById('numberOfCells'),
            completeCycleBtn: document.getElementById('completeCycleBtn'),
            ocvReadingContainer: document.getElementById('ocvReadingContainer'),
            ocvReadingForm: document.getElementById('ocvReadingForm'),
            ocvReadingGrid: document.getElementById('ocvReadingGrid'),
            ocvTimestamp: document.getElementById('ocvTimestamp'),
            ccvReadingContainer: document.getElementById('ccvReadingContainer'),
            ccvReadingForm: document.getElementById('ccvReadingForm'),
            ccvReadingGrid: document.getElementById('ccvReadingGrid'),
            ccvReadingNumber: document.getElementById('ccvReadingNumber'),
            ccvTimestamp: document.getElementById('ccvTimestamp'),
            ccvTimeInterval: document.getElementById('ccvTimeInterval'),
            endCcvReadingsBtn: document.getElementById('endCcvReadingsBtn'),
            readingsHistoryContainer: document.getElementById('readingsHistoryContainer'),
            readingsHistory: document.getElementById('readingsHistory'),
            historyLoaderContainer: document.getElementById('historyLoaderContainer'),
            historyEmptyState: document.getElementById('historyEmptyState'),
            alertContainer: document.getElementById('alertContainer'),
            testBreadcrumb: document.getElementById('testBreadcrumb'),
            testLink: document.getElementById('testLink'),
            bankBreadcrumb: document.getElementById('bankBreadcrumb'),
            bankLink: document.getElementById('bankLink'),
            cycleBreadcrumb: document.getElementById('cycleBreadcrumb')
        };
    } catch (error) {
        console.error("Error getting DOM elements:", error);
        return null;
    }
}

/**
 * Load test, bank, and cycle data
 * @param {string} testId - Test ID
 * @param {string} bankId - Bank ID
 * @param {string} cycleId - Cycle ID
 */
async function loadTestData(testId, bankId, cycleId) {
    try {
        console.log("Loading test data...");
        const elements = getDOMElements();
        
        // Show loader
        elements.historyLoaderContainer.classList.remove('hidden');
        elements.historyEmptyState.classList.add('hidden');
        
        // Fetch test data
        currentTest = await TestAPI.getTestById(testId);
        console.log("Test data loaded:", currentTest);
        
        // Find the current bank
        currentBank = currentTest.banks.find(bank => bank.id === bankId);
        
        if (!currentBank) {
            throw new Error('Bank not found');
        }
        console.log("Bank found:", currentBank);
        
        // Fetch cycle data
        // In a real implementation, we would call an API endpoint
        // currentCycle = await CycleAPI.getCycleById(cycleId);
        
        // For demo purposes, create a mock cycle
        currentCycle = createMockCycle(cycleId, bankId);
        console.log("Cycle created:", currentCycle);
        
        // Update breadcrumbs and links
        elements.testBreadcrumb.textContent = `Test: Job #${currentTest.job_number}`;
        elements.testLink.href = `bank-view.html?testId=${testId}`;
        elements.bankBreadcrumb.textContent = `Bank ${currentBank.bank_number}`;
        elements.bankLink.href = `bank-view.html?testId=${testId}&bankId=${bankId}`;
        elements.cycleBreadcrumb.textContent = `Cycle ${currentCycle.cycle_number}`;
        
        // Set reading type display
        elements.readingTypeDisplay.textContent = currentCycle.reading_type.charAt(0).toUpperCase() + currentCycle.reading_type.slice(1);
        
        // Fetch readings for this cycle
        // In a real implementation, we would call an API endpoint
        // currentReadings = await CycleAPI.getCycleReadings(cycleId);
        
        // For demo purposes, create mock readings if needed
        currentReadings = createMockReadings(cycleId);
        console.log("Readings created:", currentReadings);
        
        // Update UI with loaded data
        updateCycleDetails();
    } catch (error) {
        console.error("Error loading test data:", error);
        throw error;
    } finally {
        const elements = getDOMElements();
        elements.historyLoaderContainer.classList.add('hidden');
    }
}

/**
 * Create a mock cycle for demo purposes
 * @param {string} cycleId - Cycle ID
 * @param {string} bankId - Bank ID
 * @returns {Object} Mock cycle object
 */
function createMockCycle(cycleId, bankId) {
    // Extract cycle number from ID (format: cycle-{number}-{bankId})
    const cycleNumberMatch = cycleId.match(/cycle-(\d+)-/);
    const cycleNumber = cycleNumberMatch ? parseInt(cycleNumberMatch[1]) : 1;
    
    // Determine reading type based on cycle number (even=discharge, odd=charge)
    const readingType = cycleId.includes('discharge') ? 'discharge' : 'charge';
    
    // Create start time (current time minus 1 day)
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 1);
    
    // Create a mock cycle object
    return {
        id: cycleId,
        bank_id: bankId,
        cycle_number: cycleNumber,
        reading_type: readingType,
        start_time: startTime.toISOString(),
        end_time: null, // Not completed yet
        duration: null, // Not completed yet
        status: 'in_progress'
    };
}

/**
 * Create mock readings for demo purposes
 * @param {string} cycleId - Cycle ID
 * @returns {Array} Array of mock readings
 */
function createMockReadings(cycleId) {
    const readings = [];
    
    // For demo purposes, don't create any mock readings
    // This will force the user to enter their own readings
    
    return readings;
}

/**
 * Update cycle details in the UI
 */
function updateCycleDetails() {
    const elements = getDOMElements();
    
    // Basic cycle info
    elements.cycleNumber.textContent = currentCycle.cycle_number;
    elements.bankNumber.textContent = currentBank.bank_number;
    elements.jobNumber.textContent = currentTest.job_number;
    
    // Format dates and times
    const cycleStartTime = new Date(currentCycle.start_time);
    elements.startTime.textContent = cycleStartTime.toLocaleString();
    
    if (currentCycle.end_time) {
        const cycleEndTime = new Date(currentCycle.end_time);
        elements.endTime.textContent = cycleEndTime.toLocaleString();
        elements.duration.textContent = `${currentCycle.duration} minutes`;
    } else {
        elements.endTime.textContent = 'Not completed';
        elements.duration.textContent = 'N/A';
    }
    
    // Cycle details
    elements.readingType.textContent = currentCycle.reading_type;
    elements.numberOfCells.textContent = currentBank.number_of_cells;
    
    // Set status and color
    elements.cycleStatus.textContent = currentCycle.status === 'completed' ? 'Completed' : 'In Progress';
    elements.cycleStatus.className = `status-badge status-badge-${currentCycle.status === 'completed' ? 'completed' : 'in-progress'}`;
    
    // Update progress
    updateCycleProgress();
}

/**
 * Update cycle progress in the UI
 */
function updateCycleProgress() {
    const elements = getDOMElements();
    
    // Calculate progress based on readings
    const ocvReading = currentReadings.find(reading => reading.is_ocv);
    const ccvReadings = currentReadings.filter(reading => !reading.is_ocv);
    
    // Calculate completion percentage
    let progressPercentage = 0;
    
    // OCV reading is 25% of progress
    if (ocvReading) {
        progressPercentage += 25;
    }
    
    // CCV readings are the remaining 75% of progress
    if (ccvReadings.length > 0) {
        // If cycle is completed or CCV readings ended, show 100%
        if (currentCycle.status === 'completed' || ccvReadings.some(r => r.is_final)) {
            progressPercentage = 100;
        } else {
            // Otherwise show partial progress (at least one CCV reading = 75%)
            progressPercentage += 50;
        }
    }
    
    // Update UI
    progressPercentage = Math.round(progressPercentage);
    elements.progress.textContent = `${progressPercentage}%`;
    elements.progressBar.style.width = `${progressPercentage}%`;
    
    // Update complete button state
    if (progressPercentage >= 100) {
        elements.completeCycleBtn.disabled = false;
    } else {
        elements.completeCycleBtn.disabled = true;
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const elements = getDOMElements();
    
    // OCV reading form submission
    elements.ocvReadingForm.addEventListener('submit', handleOCVSubmit);
    
    // CCV reading form submission
    elements.ccvReadingForm.addEventListener('submit', handleCCVSubmit);
    
    // End CCV readings button
    elements.endCcvReadingsBtn.addEventListener('click', handleEndCCVReadings);
    
    // Complete cycle button
    elements.completeCycleBtn.addEventListener('click', handleCompleteCycle);
    
    console.log("Event listeners set up");
}

/**
 * Setup reading grids for OCV and CCV
 */
function setupReadingGrids() {
    console.log("Setting up reading grids...");
    const elements = getDOMElements();
    const cellCount = currentBank.number_of_cells;
    console.log(`Cell count: ${cellCount}`);
    
    // Find existing readings
    const ocvReading = currentReadings.find(reading => reading.is_ocv);
    const ccvReadings = currentReadings.filter(reading => !reading.is_ocv);
    
    // Setup OCV reading grid
    if (ocvReading) {
        // OCV already exists, show it as read-only
        console.log("Creating OCV grid with existing values");
        createReadingGrid('ocvReadingGrid', cellCount, ocvReading.cell_values, true);
        elements.ocvReadingForm.querySelector('button[type="submit"]').disabled = true;
        elements.ocvTimestamp.textContent = new Date(ocvReading.timestamp).toLocaleString();
        ocvSubmitted = true;
    } else {
        // Create empty OCV grid
        console.log("Creating empty OCV grid");
        createReadingGrid('ocvReadingGrid', cellCount);
        elements.ocvTimestamp.textContent = new Date().toLocaleString();
    }
    
    // Setup CCV reading grid
    if (ccvReadings.length > 0) {
        // Get the last CCV reading
        const lastCCVReading = ccvReadings[ccvReadings.length - 1];
        
        // Set the next reading number
        currentCCVReadingNumber = lastCCVReading.reading_number + 1;
        
        // Check if there's a final CCV reading (user has ended CCV readings)
        const hasFinalCCVReading = ccvReadings.some(r => r.is_final);
        
        if (hasFinalCCVReading) {
            // All CCV readings completed
            elements.ccvReadingContainer.classList.add('hidden');
        } else {
            // Create empty CCV grid for next reading
            console.log("Creating CCV grid for reading #" + currentCCVReadingNumber);
            createReadingGrid('ccvReadingGrid', cellCount);
            elements.ccvReadingNumber.textContent = `Reading #${currentCCVReadingNumber}`;
            elements.ccvTimestamp.textContent = new Date().toLocaleString();
            
            // Set previous time interval if available
            if (lastCCVReading.time_interval) {
                elements.ccvTimeInterval.value = lastCCVReading.time_interval;
            }
            
            // Store first CCV timestamp if not already stored
            if (!firstCCVTimestamp && ccvReadings.length > 0) {
                firstCCVTimestamp = new Date(ccvReadings[0].timestamp);
            }
        }
    } else {
        // No CCV readings yet
        if (ocvSubmitted) {
            // OCV is submitted, show CCV form
            console.log("Creating CCV grid after OCV submission");
            createReadingGrid('ccvReadingGrid', cellCount);
            elements.ccvReadingNumber.textContent = `Reading #${currentCCVReadingNumber}`;
            elements.ccvTimestamp.textContent = new Date().toLocaleString();
        } else {
            // OCV not submitted yet, hide CCV form
            console.log("Hiding CCV form until OCV is submitted");
            elements.ccvReadingContainer.classList.add('hidden');
        }
    }
    
    console.log("Reading grids setup complete");
}

/**
 * Update the view state based on readings
 */
function updateViewState() {
    const elements = getDOMElements();
    
    const ocvReading = currentReadings.find(reading => reading.is_ocv);
    const ccvReadings = currentReadings.filter(reading => !reading.is_ocv);
    
    // Check if OCV is submitted
    if (ocvReading) {
        ocvSubmitted = true;
        
        // Disable OCV form
        elements.ocvReadingForm.querySelector('button[type="submit"]').disabled = true;
        
        // Check if there's a final CCV reading (user has ended CCV readings)
        const hasFinalCCVReading = ccvReadings.some(r => r.is_final);
        
        // Show CCV form if not all readings are completed
        if (!hasFinalCCVReading) {
            elements.ccvReadingContainer.classList.remove('hidden');
        } else {
            elements.ccvReadingContainer.classList.add('hidden');
        }
    } else {
        // Hide CCV form until OCV is submitted
        elements.ccvReadingContainer.classList.add('hidden');
    }
    
    // Check if cycle is completed
    if (currentCycle.status === 'completed') {
        elements.completeCycleBtn.disabled = true;
        elements.ocvReadingForm.querySelector('button[type="submit"]').disabled = true;
        
        if (elements.ccvReadingContainer.querySelector('button[type="submit"]')) {
            elements.ccvReadingForm.querySelector('button[type="submit"]').disabled = true;
        }
        
        if (elements.endCcvReadingsBtn) {
            elements.endCcvReadingsBtn.disabled = true;
        }
    }
    
    console.log("View state updated");
}

/**
 * Handle OCV form submission
 * @param {Event} event - Form submit event
 */
async function handleOCVSubmit(event) {
    event.preventDefault();
    const elements = getDOMElements();
    
    if (!validateReadingGrid('ocvReadingGrid')) {
        showAlert('Please enter valid values for all cells', 'danger');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = elements.ocvReadingForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;
        
        // Get cell values
        const cellValues = getReadingGridValues('ocvReadingGrid');
        
        // Prepare reading data
        const readingData = {
            cell_values: cellValues,
            timestamp: new Date().toISOString(),
            is_ocv: true,
            reading_number: 0,
            time_interval: null // OCV doesn't have time interval
        };
        
        // In a real implementation, we would call the API:
        // const response = await ReadingAPI.createReading(currentCycle.id, readingData);
        
        // For demo, create a mock reading response
        const mockResponse = {
            id: `reading-ocv-${currentCycle.id}-${Date.now()}`,
            cycle_id: currentCycle.id,
            reading_number: 0,
            timestamp: readingData.timestamp,
            is_ocv: true,
            cell_values: cellValues,
            time_interval: null
        };
        
        // Add to readings
        currentReadings.push(mockResponse);
        
        // Update OCV form state
        ocvSubmitted = true;
        submitButton.textContent = 'Saved';
        
        // Show CCV form
        elements.ccvReadingContainer.classList.remove('hidden');
        createReadingGrid('ccvReadingGrid', currentBank.number_of_cells);
        elements.ccvReadingNumber.textContent = `Reading #${currentCCVReadingNumber}`;
        elements.ccvTimestamp.textContent = new Date().toLocaleString();
        
        // Update progress
        updateCycleProgress();
        
        // Show success message
        showAlert('OCV readings saved successfully', 'success');
        
        // Update readings history
        loadReadingsHistory();
    } catch (error) {
        showAlert(`Error saving OCV readings: ${error.message}`, 'danger');
        
        // Reset button
        const submitButton = elements.ocvReadingForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Save OCV Readings';
        submitButton.disabled = false;
    }
}

/**
 * Handle CCV form submission
 * @param {Event} event - Form submit event
 */
async function handleCCVSubmit(event) {
    event.preventDefault();
    const elements = getDOMElements();
    
    if (!validateReadingGrid('ccvReadingGrid')) {
        showAlert('Please enter valid values for all cells', 'danger');
        return;
    }
    
    // Validate time interval
    const timeInterval = parseInt(elements.ccvTimeInterval.value);
    if (isNaN(timeInterval) || timeInterval < 1 || timeInterval > 120) {
        showAlert('Please enter a valid time interval between 1 and 120 minutes', 'danger');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = elements.ccvReadingForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;
        
        // Get cell values
        const cellValues = getReadingGridValues('ccvReadingGrid');
        
        // Get current timestamp
        const now = new Date();
        
        // Store first CCV timestamp if this is the first reading
        if (!firstCCVTimestamp) {
            firstCCVTimestamp = now;
        }
        
        // Prepare reading data
        const readingData = {
            cell_values: cellValues,
            timestamp: now.toISOString(),
            is_ocv: false,
            reading_number: currentCCVReadingNumber,
            time_interval: timeInterval,
            is_final: false
        };
        
        // In a real implementation, we would call the API:
        // const response = await ReadingAPI.createReading(currentCycle.id, readingData);
        
        // For demo, create a mock reading response
        const mockResponse = {
            id: `reading-ccv-${currentCCVReadingNumber}-${currentCycle.id}-${Date.now()}`,
            cycle_id: currentCycle.id,
            reading_number: currentCCVReadingNumber,
            timestamp: readingData.timestamp,
            is_ocv: false,
            cell_values: cellValues,
            time_interval: timeInterval,
            is_final: false
        };
        
        // Add to readings
        currentReadings.push(mockResponse);
        
        // Store the time interval
        ccvIntervals.push(timeInterval);
        
        // Increment reading number
        currentCCVReadingNumber++;
        
        // Reset form for next reading
        submitButton.textContent = 'Save CCV Readings';
        submitButton.disabled = false;
        
        // Create new empty grid
        createReadingGrid('ccvReadingGrid', currentBank.number_of_cells);
        
        // Update reading number
        elements.ccvReadingNumber.textContent = `Reading #${currentCCVReadingNumber}`;
        elements.ccvTimestamp.textContent = new Date().toLocaleString();
        
        // Update progress
        updateCycleProgress();
        
        // Show success message
        showAlert('CCV readings saved successfully', 'success');
        
        // Update readings history
        loadReadingsHistory();
    } catch (error) {
        showAlert(`Error saving CCV readings: ${error.message}`, 'danger');
        
        // Reset button
        const submitButton = elements.ccvReadingForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Save CCV Readings';
        submitButton.disabled = false;
    }
}

/**
 * Handle end CCV readings button click
 */
async function handleEndCCVReadings() {
    const elements = getDOMElements();
    
    if (confirm("Are you sure you want to end CCV readings for this cycle? This action cannot be undone.")) {
        try {
            // Disable the button to prevent multiple clicks
            elements.endCcvReadingsBtn.disabled = true;
            
            // Get current timestamp for the final reading
            const endTime = new Date();
            
            // Calculate duration if we have a firstCCVTimestamp
            let duration = null;
            if (firstCCVTimestamp) {
                duration = Math.round((endTime - firstCCVTimestamp) / (1000 * 60)); // Duration in minutes
            }
            
            // Create a final CCV reading to mark the end
            const finalReading = {
                id: `reading-ccv-final-${currentCycle.id}-${Date.now()}`,
                cycle_id: currentCycle.id,
                reading_number: currentCCVReadingNumber,
                timestamp: endTime.toISOString(),
                is_ocv: false,
                cell_values: [], // No actual cell values for this marker reading
                time_interval: null,
                is_final: true
            };
            
            // Add to readings
            currentReadings.push(finalReading);
            
            // Update cycle with end time and duration
            if (duration !== null) {
                currentCycle.end_time = endTime.toISOString();
                currentCycle.duration = duration;
            }
            
            // Hide CCV form
            elements.ccvReadingContainer.classList.add('hidden');
            
            // Enable complete cycle button
            elements.completeCycleBtn.disabled = false;
            
            // Update cycle details
            updateCycleDetails();
            
            // Update the view state
            updateViewState();
            
            // Show success message
            showAlert('CCV readings completed successfully', 'success');
            
            // Update readings history
            loadReadingsHistory();
        } catch (error) {
            showAlert(`Error ending CCV readings: ${error.message}`, 'danger');
            
            // Re-enable the button
            elements.endCcvReadingsBtn.disabled = false;
        }
    }
}

/**
 * Handle complete cycle button click
 */
async function handleCompleteCycle() {
    const elements = getDOMElements();
    
    try {
        // Show loading state
        elements.completeCycleBtn.textContent = 'Completing...';
        elements.completeCycleBtn.disabled = true;
        
        // In a real implementation, we would call the API:
        // const response = await CycleAPI.completeCycle(currentCycle.id);
        
        // For demo, update the mock cycle
        currentCycle.status = 'completed';
        
        // Ensure end_time is set (if not already set by end CCV readings)
        if (!currentCycle.end_time) {
            currentCycle.end_time = new Date().toISOString();
            
            // Calculate duration if not already set
            if (!currentCycle.duration && firstCCVTimestamp) {
                const startTime = firstCCVTimestamp;
                const endTime = new Date(currentCycle.end_time);
                const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
                currentCycle.duration = durationMinutes;
            }
        }
        
        // Update UI
        updateCycleDetails();
        updateViewState();
        
        // Show success message
        showAlert('Cycle completed successfully', 'success');
        
        // Check if there is a next cycle to navigate to
        const nextCycleNumber = currentCycle.cycle_number;
        const nextReadingType = currentCycle.reading_type === 'charge' ? 'discharge' : 'charge';
        
        // If we're at discharge, move to the next cycle number for charge
        const nextActualCycleNumber = nextReadingType === 'charge' ? nextCycleNumber + 1 : nextCycleNumber;
        
        // Only proceed if we haven't reached the max number of cycles
        if (nextActualCycleNumber <= currentTest.number_of_cycles) {
            setTimeout(() => {
                // Ask if user wants to go to next cycle
                if (confirm(`Would you like to proceed to Cycle ${nextActualCycleNumber} - ${nextReadingType.charAt(0).toUpperCase() + nextReadingType.slice(1)}?`)) {
                    navigateToNextCycle(nextActualCycleNumber, nextReadingType);
                } else {
                    // If user doesn't want to proceed, go back to dashboard
                    window.location.href = 'index.html?message=Cycle completed successfully';
                }
            }, 1000);
        } else {
            // All cycles completed, go back to dashboard
            setTimeout(() => {
                window.location.href = 'index.html?message=All cycles completed successfully';
            }, 1000);
        }
    } catch (error) {
        showAlert(`Error completing cycle: ${error.message}`, 'danger');
        
        // Reset button
        elements.completeCycleBtn.textContent = 'Complete Cycle';
        elements.completeCycleBtn.disabled = false;
    }
}

/**
 * Navigate to the next cycle
 * @param {number} cycleNumber - Next cycle number to navigate to
 * @param {string} readingType - Reading type (charge or discharge)
 */
function navigateToNextCycle(cycleNumber, readingType) {
    // Create next cycle ID
    const nextCycleId = `cycle-${cycleNumber}-${readingType}-${currentBank.id}`;
    
    // Redirect to the next cycle
    window.location.href = `cycle-view.html?testId=${currentTest.id}&bankId=${currentBank.id}&cycleId=${nextCycleId}`;
}

/**
 * Load and render readings history
 */
function loadReadingsHistory() {
    const elements = getDOMElements();
    
    // Clear existing content except loader
    const historyChildren = Array.from(elements.readingsHistory.children);
    historyChildren.forEach(child => {
        if (child !== elements.historyLoaderContainer && child !== elements.historyEmptyState) {
            elements.readingsHistory.removeChild(child);
        }
    });
    
    // Show empty state if no readings
    if (currentReadings.length === 0) {
        elements.historyEmptyState.classList.remove('hidden');
        return;
    }
    
    // Hide empty state
    elements.historyEmptyState.classList.add('hidden');
    
    // Sort readings by timestamp
    const sortedReadings = [...currentReadings].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Filter out final CCV marker readings for display (they don't have cell values)
    const displayReadings = sortedReadings.filter(r => !r.is_final || r.cell_values.length > 0);
    
    // Create history items
    displayReadings.forEach(reading => {
        const historyItem = createReadingHistoryItem(reading);
        elements.readingsHistory.appendChild(historyItem);
    });
}

/**
 * Create reading history item
 * @param {Object} reading - Reading data
 * @returns {HTMLElement} Reading history element
 */
function createReadingHistoryItem(reading) {
    // Clone template
    const template = document.getElementById('readingHistoryItemTemplate');
    if (!template) {
        console.error('Reading history item template not found');
        return document.createElement('div');
    }
    
    const element = template.content.cloneNode(true);
    
// Set reading type
const readingType = reading.is_ocv ? 'OCV Reading' : `CCV Reading #${reading.reading_number}`;
element.querySelector('[data-field="reading-type"]').textContent = readingType;

// Format timestamp
const timestamp = new Date(reading.timestamp).toLocaleString();
element.querySelector('[data-field="timestamp"]').textContent = timestamp;

// Add time interval if it's a CCV reading
if (!reading.is_ocv && reading.time_interval) {
const timeIntervalElement = document.createElement('span');
timeIntervalElement.className = 'reading-interval';
timeIntervalElement.textContent = ` (${reading.time_interval} min interval)`;
element.querySelector('[data-field="timestamp"]').appendChild(timeIntervalElement);
}

// Create values container
const valuesContainer = element.querySelector('[data-field="values-container"]');

// Add cell values if there are any
if (reading.cell_values && reading.cell_values.length > 0) {
reading.cell_values.forEach((value, index) => {
    const cellNumber = index + 1;
    const cellElement = document.createElement('div');
    cellElement.className = 'reading-value';
    cellElement.innerHTML = `<span class="cell-number">Cell ${cellNumber}:</span> <span class="cell-value">${value}V</span>`;
    valuesContainer.appendChild(cellElement);
});
}

return element.firstElementChild;
}

/**
* Show alert message
* @param {string} message - Alert message
* @param {string} type - Alert type (success, danger, warning, info)
*/
function showAlert(message, type) {
// Get alert template
const alertTemplate = document.getElementById('alertTemplate');
if (!alertTemplate) {
console.error('Alert template not found');
alert(message);
return;
}

const elements = getDOMElements();
const alertElement = alertTemplate.content.cloneNode(true);

// Set message and type
alertElement.querySelector('[data-field="message"]').textContent = message;
alertElement.querySelector('.alert').classList.add(`alert-${type}`);

// Add to container
elements.alertContainer.innerHTML = '';
elements.alertContainer.appendChild(alertElement);

// Auto-hide after 5 seconds
setTimeout(() => {
elements.alertContainer.innerHTML = '';
}, 5000);
}

// Initialize the cycle view when DOM is loaded
document.addEventListener('DOMContentLoaded', initCycleView);