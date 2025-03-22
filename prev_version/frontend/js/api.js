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
      // Try to parse the error
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      } catch (e) {
        throw new Error(`API Error: ${response.status}`);
      }
    }
    
    // For DELETE requests that return 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    // Check if response is a blob
    if (options.responseType === 'blob') {
      return response.blob();
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
   * Get all tests with optional pagination and filtering
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Number of records to return
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} List of tests
   */
  getAllTests: async (skip = 0, limit = 100, status = null) => {
    let url = `/tests?skip=${skip}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return apiFetch(url);
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
  },
  
  /**
   * Delete a test
   * @param {string} testId - Test UUID
   * @returns {Promise<void>}
   */
  deleteTest: async (testId) => {
    return apiFetch(`/tests/${testId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Get the next unfinished cycle for a test
   * @param {string} testId - Test UUID
   * @returns {Promise<Object>} Next unfinished cycle
   */
  getNextUnfinishedCycle: async (testId) => {
    return apiFetch(`/tests/${testId}/next-cycle`);
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
    return apiFetch(`/export/bank/${bankId}`, {
      responseType: 'blob'
    });
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
   * @param {Date} endTime - Optional end time
   * @returns {Promise<Object>} Completed cycle
   */
  completeCycle: async (cycleId, endTime = null) => {
    const body = endTime ? { end_time: endTime.toISOString() } : {};
    return apiFetch(`/cycles/${cycleId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(body)
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
 * Get the next cycle after the current one
 * @param {string} cycleId - Current cycle ID
 * @returns {Promise<Object>} Next cycle
 */
getNextCycle: async (cycleId) => {
  return apiFetch(`/cycles/${cycleId}/next`);
},

/**
 * Get a cycle by bank ID, cycle number, and reading type
 * @param {string} bankId - Bank ID
 * @param {number} cycleNumber - Cycle number
 * @param {string} readingType - Reading type (charge/discharge)
 * @param {boolean} createIfMissing - Create the cycle if it doesn't exist
 * @returns {Promise<Object>} Cycle
 */
getCycleByParameters: async (bankId, cycleNumber, readingType, createIfMissing = false) => {
  return apiFetch(`/cycles/by-bank-cycle-type?bank_id=${bankId}&cycle_number=${cycleNumber}&reading_type=${readingType}&create_if_missing=${createIfMissing}`);
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
    return apiFetch(`/export/test/${testId}`, {
      responseType: 'blob'
    });
  },
  
  /**
   * Export bank data as CSV
   * @param {string} bankId - Bank UUID
   * @returns {Promise<Blob>} CSV file as blob
   */
  exportBankData: async (bankId) => {
    return apiFetch(`/export/bank/${bankId}`, {
      responseType: 'blob'
    });
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