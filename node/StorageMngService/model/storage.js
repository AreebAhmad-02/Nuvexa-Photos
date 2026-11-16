/** MongoDB model holding each user's storage total, in bytes. */
import mongoose from 'mongoose';

const storageSchema = new mongoose.Schema({
  totalStorage: { type: Number, required: true, min: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

export const StorageModel = mongoose.model('Storage', storageSchema);

/** Data-access functions used by the controller. */
export const getStorageById = (id) => StorageModel.findById(id);
export const addNewStorage = (values) =>
  new StorageModel(values).save().then((doc) => doc.toObject());
/** The user's most recent record, or null if there is none. */
export const getStorageByUserId = (userId) =>
  StorageModel.findOne({ user: userId }).sort({ _id: -1 });
export const updateStorageById = (id, values) =>
  StorageModel.findByIdAndUpdate(id, values, { new: true });
export const updateStorageByUserId = (userId, values) =>
  StorageModel.findOneAndUpdate({ user: userId }, values, { new: true });
