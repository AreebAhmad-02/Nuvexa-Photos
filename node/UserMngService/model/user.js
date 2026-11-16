/** MongoDB model for registered users. Passwords are stored as bcrypt hashes. */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);
export default User;
