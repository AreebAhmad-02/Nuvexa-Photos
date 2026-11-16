/** Scheduled job that resets every user's daily upload usage at midnight. */
import cron from 'node-cron';

/**
 * Schedule the reset.
 * @param {import('mongoose').Model} usageModel model whose totalUsage is reset to 0
 */
export function scheduleDailyReset(usageModel) {
  cron.schedule('0 0 * * *', async () => {
    try {
      await usageModel.updateMany({}, { $set: { totalUsage: 0 } });
      console.log('Daily usage reset completed.');
    } catch (error) {
      console.error('Daily usage reset failed:', error);
    }
  });
}
