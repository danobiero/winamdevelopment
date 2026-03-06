/**
 * @typedef {Object} AdminError
 * @property {string} type
 * @property {string} title
 * @property {string} [userMessage]
 * @property {string} [message]
 * @property {'warning'|'error'} [severity]
 * @property {Object} [conflictKey]
 * @property {string} [conflictKey.session_key]
 * @property {string} [conflictKey.start_time]
 * @property {string} [conflictKey.end_time]
 */

// This file intentionally exports nothing.
// It exists to document and standardize the error shape.
