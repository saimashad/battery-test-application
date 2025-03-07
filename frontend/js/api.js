/**
 * API Functions for Battery Testing Application
 * api.js
 */

// Base URL for API
const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Generic fetch wrapper with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiFetch(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set default headers if not provided
    if (!options.headers) {
      options.headers = {
        'Content-Type': 'application/json'
      };
    }
    
    const response = await fetch(url, options);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
    
    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Test Management API Functions
 */
const TestAPI = {
  /**
   * Create a new test
   * @param {Object} testData - Test data object
   * @returns {Promise<Object>} Created test
   */
  createTest: async (testData) => {
    return apiFetch('/tests', {
      method: 'POST',
      body: JSON.stringify(testData)
    });
  },
  
  /**
   * Get all tests with optional pagination
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} List of tests
   */
  getAllTests: async (skip = 0, limit = 100) => {
    return apiFetch(`/tests?skip=${skip}&limit=${limit}`);
  },
  
  /**
   * Get a single test by ID
   * @param {string} testId - Test UUID
   * @returns {Promise<Object>} Test details
   */
  getTestById: async (testId) => {
    return apiFetch(`/tests/${testId}`);
  },
  
  /**
   * Update test status
   * @param {string} testId - Test UUID
   * @param {string} status - New status (scheduled|in_progress|completed)
   * @returns {Promise<Object>} Updated test
   */
  updateTestStatus: async (testId, status) => {
    return apiFetch(`/tests/${testId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
};

/**
 * Bank Management API Functions
 */
const BankAPI = {
  /**
   * Get bank details by ID
   * @param {string} bankId - Bank UUID
   * @returns {Promise<Object>} Bank details
   */
  getBankById: async (bankId) => {
    return apiFetch(`/banks/${bankId}`);
  },
  
  /**
   * Get all cycles for a bank
   * @param {string} bankId - Bank UUID
   * @returns {Promise<Array>} List of cycles
   */
  getBankCycles: async (bankId) => {
    return apiFetch(`/banks/${bankId}/cycles`);
  },
  
  /**
   * Export bank data as CSV
   * @param {string} bankId - Bank UUID
   * @returns {Promise<Blob>} CSV file as blob
   */
  exportBankData: async (bankId) => {
    const response = await fetch(`${API_BASE_URL}/export/bank/${bankId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
    return response.blob();
  }
};

/**
 * Cycle Management API Functions
 */
const CycleAPI = {
  /**
   * Get cycle details
   * @param {string} cycleId - Cycle UUID
   * @returns {Promise<Object>} Cycle details
   */
  getCycleById: async (cycleId) => {
    return apiFetch(`/cycles/${cycleId}`);
  },
  
  /**
   * Complete a cycle
   * @param {string} cycleId - Cycle UUID
   * @returns {Promise<Object>} Completed cycle
   */
  completeCycle: async (cycleId) => {
    return apiFetch(`/cycles/${cycleId}/complete`, {
      method: 'PUT'
    });
  },
  
  /**
   * Get all readings for a cycle
   * @param {string} cycleId - Cycle UUID
   * @returns {Promise<Array>} List of readings
   */
  getCycleReadings: async (cycleId) => {
    return apiFetch(`/cycles/${cycleId}/readings`);
  },
  
  /**
   * Create a new cycle for a bank
   * @param {string} bankId - Bank UUID
   * @param {Object} cycleData - Cycle data
   * @returns {Promise<Object>} Created cycle
   */
  createCycle: async (bankId, cycleData) => {
    return apiFetch(`/banks/${bankId}/cycles`, {
      method: 'POST',
      body: JSON.stringify(cycleData)
    });
  }
};

/**
 * Reading Management API Functions
 */
const ReadingAPI = {
  /**
   * Create a new reading
   * @param {string} cycleId - Cycle UUID
   * @param {Object} readingData - Reading data object
   * @returns {Promise<Object>} Created reading
   */
  createReading: async (cycleId, readingData) => {
    return apiFetch(`/cycles/${cycleId}/readings`, {
      method: 'POST',
      body: JSON.stringify(readingData)
    });
  },
  
  /**
   * Get a single reading by ID
   * @param {string} readingId - Reading UUID
   * @returns {Promise<Object>} Reading details
   */
  getReadingById: async (readingId) => {
    return apiFetch(`/readings/${readingId}`);
  },
  
  /**
   * Get all cell values for a reading
   * @param {string} readingId - Reading UUID
   * @returns {Promise<Array>} List of cell values
   */
  getReadingCellValues: async (readingId) => {
    return apiFetch(`/readings/${readingId}/cell-values`);
  }
};

/**
 * Export Management API Functions
 */
const ExportAPI = {
  /**
   * Export test data as CSV
   * @param {string} testId - Test UUID
   * @returns {Promise<Blob>} CSV file as blob
   */
  exportTestData: async (testId) => {
    const response = await fetch(`${API_BASE_URL}/export/test/${testId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
    return response.blob();
  },
  
  /**
   * Export cycle data as CSV
   * @param {string} cycleId - Cycle UUID
   * @returns {Promise<Blob>} CSV file as blob
   */
  exportCycleData: async (cycleId) => {
    const response = await fetch(`${API_BASE_URL}/export/cycle/${cycleId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
    return response.blob();
  },
  
  /**
   * Download exported data
   * @param {Blob} blob - Data blob
   * @param {string} filename - Download filename
   */
  downloadData: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

// Export all API functions
export { TestAPI, BankAPI, CycleAPI, ReadingAPI, ExportAPI };