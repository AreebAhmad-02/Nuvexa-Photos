/** Client for the Logging service. Shared pattern used by every Nuvexa service. */
import axios from 'axios';

/**
 * Create a function that sends an event to the Logging service.
 * A logging failure is printed but never breaks the request being handled.
 * @param {string} url full URL of the Logging service's POST /log endpoint
 * @returns {(event: string, message: string) => Promise<void>}
 */
export function createLogger(url) {
  return async (event, message) => {
    try {
      await axios.post(url, { event, message });
    } catch (error) {
      console.error(`Could not send log event "${event}": ${error.message}`);
    }
  };
}
