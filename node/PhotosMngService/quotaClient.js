/**
 * HTTP client for a per-user byte counter kept by another service:
 * the Storage service (total bytes stored) or the Usage service (bytes uploaded today).
 */
import axios from 'axios';

/**
 * @param {string} baseUrl service root, e.g. http://storagemngservice-srv:8002
 * @param {'storage'|'usage'} resource path segment of the service's API
 * @param {'totalStorage'|'totalUsage'} field name of the counter in the service's records
 */
export function createQuotaClient(baseUrl, resource, field) {
  const userUrl = (userId) => `${baseUrl}/api/${resource}/user/${userId}`;

  return {
    /** The user's current total in bytes, or 0 if the user has no record yet. */
    async get(userId) {
      try {
        const res = await axios.get(userUrl(userId));
        return res.data.data[field];
      } catch (error) {
        if (error.response?.status === 404) {
          await axios.post(`${baseUrl}/api/${resource}/`, { user: userId, [field]: 0 });
          return 0;
        }
        throw error;
      }
    },

    /** Replace the user's total. */
    async set(userId, total) {
      await axios.put(userUrl(userId), { [field]: total });
    },
  };
}
