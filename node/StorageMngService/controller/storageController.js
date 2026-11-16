/**
 * Request handlers for each user's storage total.
 * The data-access functions are passed in, so the handlers can be tested without a database.
 */

/**
 * @param {object} deps
 * @param {object} deps.store data-access functions from the model (getByUser, updateByUser, add)
 * @param {(event: string, message: string) => Promise<void>} deps.log
 */
export function createStorageController({ store, log }) {
  /** GET /user/:userId -> { data: { totalStorage, user } }, or 404 if the user has no record yet. */
  const getByUser = async (req, res) => {
    const { userId } = req.params;
    try {
      const record = await store.getByUser(userId);
      if (!record) {
        return res.status(404).json({ status: false, msg: 'No storage record found' });
      }
      await log('Storage retrieved', `Storage retrieved for user ID ${userId}`);
      return res
        .status(200)
        .json({ status: true, msg: 'Storage retrieved successfully', data: record });
    } catch (error) {
      console.error(error);
      await log('Storage retrieval failed', `Failed to retrieve storage for user ID ${userId}`);
      return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
  };

  /** PUT /user/:userId  body: { totalStorage } */
  const updateByUser = async (req, res) => {
    const { userId } = req.params;
    const { totalStorage } = req.body ?? {};
    if (typeof totalStorage !== 'number' || totalStorage < 0) {
      return res
        .status(400)
        .json({ status: false, msg: 'totalStorage must be a non-negative number' });
    }

    try {
      const updated = await store.updateByUser(userId, { totalStorage });
      if (!updated) {
        return res.status(404).json({ status: false, msg: 'No storage record found' });
      }
      await log('Storage updated', `Storage updated for user ID ${userId}`);
      return res
        .status(200)
        .json({ status: true, msg: 'Storage updated successfully', data: updated });
    } catch (error) {
      console.error(error);
      await log('Storage update failed', `Failed to update storage for user ID ${userId}`);
      return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
  };

  /** POST /  body: { user, totalStorage } creates the user's record. */
  const create = async (req, res) => {
    const { totalStorage = 0, user } = req.body ?? {};
    if (!user) {
      return res.status(400).json({ status: false, msg: 'user is required' });
    }

    try {
      const record = await store.add({ totalStorage, user });
      await log('Storage created', `Storage record created for user ID ${user}`);
      return res
        .status(201)
        .json({ status: true, msg: 'Storage added successfully', data: record });
    } catch (error) {
      console.error(error);
      await log('Storage creation failed', `Failed to create storage record for user ID ${user}`);
      return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
  };

  return { getByUser, updateByUser, create };
}
