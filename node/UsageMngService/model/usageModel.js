/** MongoDB model holding each user's usage total, in bytes. */
import mongoose from 'mongoose';

const usageSchema = new mongoose.Schema({
  totalUsage: { type: Number, required: true, min: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

export const usageModel = mongoose.model('usage', usageSchema);

/** Data-access functions used by the controller. */
export const getUsageById = (id) => usageModel.findById(id);
export const addNewUsage = (values) => new usageModel(values).save().then((doc) => doc.toObject());
/** The user's most recent record, or null if there is none. */
export const getUsageByUserId = (userId) => usageModel.findOne({ user: userId }).sort({ _id: -1 });
export const updateUsageById = (id, values) =>
  usageModel.findByIdAndUpdate(id, values, { new: true });
export const updateUsageByUserId = (userId, values) =>
  usageModel.findOneAndUpdate({ user: userId }, values, { new: true });
