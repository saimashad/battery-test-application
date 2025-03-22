/**
 * Status Badge Component for Battery Testing Application
 * components/status-badge.js
 */

/**
 * Creates a status badge for a test or cycle status
 * @param {string} status - Status string (scheduled|in_progress|completed)
 * @returns {HTMLElement} Status badge element
 */
export function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = `status-badge status-badge-${status}`;
    badge.textContent = formatStatus(status);
    
    return badge;
}

/**
 * Format status for display
 * @param {string} status - Status string from API
 * @returns {string} Formatted status
 */
export function formatStatus(status) {
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
 * Updates an existing status badge element
 * @param {HTMLElement} element - Status badge element to update
 * @param {string} status - New status value
 */
export function updateStatusBadge(element, status) {
    if (!element) return;
    
    // Update class
    element.className = `status-badge status-badge-${status}`;
    
    // Update text
    element.textContent = formatStatus(status);
}