/**
 * Request handlers for each user's usage total.
 * The data-access functions are passed in, so the handlers can be tested without a database.
 */

/**
 * @param {object} deps
 * @param {object} deps.store data-access functions from the model (getByUser, updateByUser, add)
 * @param {(event: string, message: string) => Promise<void>} deps.log
 */
export function createUsageController({ store, log }) {
  /** GET /user/:userId -> { data: { totalUsage, user } }, or 404 if the user has no record yet. */
  const getByUser = async (req, res) => {
    const { userId } = req.params;
    try {
      const record = await store.getByUser(userId);
      if (!record) {
        return res.status(404).json({ status: false, msg: 'No usage record found' });
      }
      await log('Usage retrieved', `Usage retrieved for user ID ${userId}`);
      return res
        .status(200)
        .json({ status: true, msg: 'Usage retrieved successfully', data: record });
    } catch (error) {
      console.error(error);
      await log('Usage retrieval failed', `Failed to retrieve usage for user ID ${userId}`);
      return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
  };

  /** PUT /user/:userId  body: { totalUsage } */
  const updateByUser = async (req, res) => {
    const { userId } = req.params;
    const { totalUsage } = req.body ?? {};
    if (typeof totalUsage !== 'number' || totalUsage < 0) {
      return res
        .status(400)
        .json({ status: false, msg: 'totalUsage must be a non-negative number' });
    }

    try {
      const updated = await store.updateByUser(userId, { totalUsage });
      if (!updated) {
        return res.status(404).json({ status: false, msg: 'No usage record found' });
      }
      await log('Usage updated', `Usage updated for user ID ${userId}`);
      return res
        .status(200)
        .json({ status: true, msg: 'Usage updated successfully', data: updated });
    } catch (error) {
      console.error(error);
      await log('Usage update failed', `Failed to update usage for user ID ${userId}`);
      return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
  };

  /** POST /  body: { user, totalUsage } creates the user's record. */
  const create = async (req, res) => {
    const { totalUsage = 0, user } = req.body ?? {};
    if (!user) {
      return res.status(400).json({ status: false, msg: 'user is required' });
    }

    try {
      const record = await store.add({ totalUsage, user });
      await log('Usage created', `Usage record created for user ID ${user}`);
      return res.status(201).json({ status: true, msg: 'Usage added successfully', data: record });
    } catch (error) {
      console.error(error);
      await log('Usage creation failed', `Failed to create usage record for user ID ${user}`);
      return res.status(500).json({ status: false, msg: 'Something went wrong' });
    }
  };

  return { getByUser, updateByUser, create };
}
