/**
 * List of JS files need to be loaded at the time of initial page load.
 * Eg. For server_privileges.php, server_privileges.js is required
 */

/**
 * @type {Object} files
 */
const files = {
    server_privileges: ['server_privileges'],
    server_databases: ['server_databases'],
    global: ['error_report', 'navigation'],
    server_status_advisor: ['server_status_advisor'],
    server_status_processes: ['server_status_processes'],
    server_status_variables: ['server_status_variables'],
    user_password: ['server_privileges']
};

export default files;
