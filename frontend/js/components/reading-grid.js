/**
 * Reading Grid Component for Battery Testing Application
 * components/reading-grid.js
 */

/**
 * Create a reading grid for cell inputs
 * @param {string} containerId - ID of the container element
 * @param {number} numberOfCells - Number of cells to create inputs for
 * @param {Array} initialValues - Initial values for cells (optional)
 * @param {boolean} readOnly - Whether the inputs should be read-only
 * @returns {HTMLElement} The created grid element
 */
export function createReadingGrid(containerId, numberOfCells, initialValues = [], readOnly = false) {
    console.log(`Creating reading grid for ${containerId} with ${numberOfCells} cells`);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return null;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Determine number of columns based on cell count
    let columns = 5; // Default for small numbers
    if (numberOfCells > 30) {
        columns = 10;
    } else if (numberOfCells > 15) {
        columns = 8;
    }
    
    // Set grid columns
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // For each cell, create a cell div with input
    for (let i = 0; i < numberOfCells; i++) {
        const cellNumber = i + 1;
        
        // Create cell container
        const cellDiv = document.createElement('div');
        cellDiv.className = 'reading-cell';
        
        // Create cell number label
        const cellLabel = document.createElement('span');
        cellLabel.className = 'reading-cell-number';
        cellLabel.textContent = cellNumber;
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'reading-value-input';
        input.id = `cell-${containerId}-${cellNumber}`;
        input.name = `cell-${cellNumber}`;
        input.dataset.cellNumber = cellNumber;
        input.step = '0.1';
        input.min = '0';
        input.required = true;
        
        // Set initial value if provided
        if (initialValues && initialValues[i] !== undefined) {
            input.value = initialValues[i];
        }
        
        // Set readonly if needed
        if (readOnly) {
            input.readOnly = true;
            input.classList.add('calculated-field');
        }
        
        // Add input validation events
        input.addEventListener('input', validateCellInput);
        
        // Add elements to cell
        cellDiv.appendChild(cellLabel);
        cellDiv.appendChild(input);
        
        // Add cell to container
        container.appendChild(cellDiv);
    }
    
    console.log(`Created ${numberOfCells} cells in grid ${containerId}`);
    return container;
}

/**
 * Validate cell input value
 * @param {Event} event - Input event
 */
function validateCellInput(event) {
    const input = event.target;
    const value = parseFloat(input.value);
    
    // Basic validation - should be a number
    if (isNaN(value)) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return;
    }
    
    // Voltage range validation (typical battery cell range: 2.5V - 4.5V)
    // These ranges could be adjusted based on the specific battery types
    if (value < 2.0 || value > 5.0) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
    } else {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }
}

/**
 * Get cell values from a reading grid
 * @param {string} containerId - ID of the container element
 * @returns {Array} Array of cell values
 */
export function getReadingGridValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return [];
    }
    
    const inputs = container.querySelectorAll('input');
    const values = Array.from(inputs).map(input => parseFloat(input.value));
    
    return values;
}

/**
 * Check if all inputs in a reading grid are valid
 * @param {string} containerId - ID of the container element
 * @returns {boolean} True if all inputs are valid
 */
export function validateReadingGrid(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return false;
    }
    
    const inputs = container.querySelectorAll('input');
    
    // Check if all inputs have valid values
    return Array.from(inputs).every(input => {
        const value = parseFloat(input.value);
        return !isNaN(value) && value >= 2.0 && value <= 5.0;
    });
}