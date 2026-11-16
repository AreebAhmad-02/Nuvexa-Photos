/**
 * Request handlers for registration and login.
 * Dependencies are passed in, so the handlers can be tested without a database.
 */

const SALT_ROUNDS = 10;
const DUPLICATE_KEY_ERROR = 11000; // MongoDB error code for a unique-index violation

/** Return the fields that are safe to send to the client (never the password hash). */
export const toPublicUser = (user) => ({ _id: user._id, name: user.name, email: user.email });

/**
 * @param {object} deps
 * @param {import('mongoose').Model} deps.User user model
 * @param {(password: string, rounds: number) => Promise<string>} deps.hash
 * @param {(password: string, hashed: string) => Promise<boolean>} deps.compare
 * @param {(event: string, message: string) => Promise<void>} deps.log
 */
export function createUserController({ User, hash, compare, log }) {
  /** POST /register  body: { name, email, password } */
  const register = async (req, res) => {
    const { name, email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const hashedPassword = await hash(password, SALT_ROUNDS);
      await User.create({ name, email, password: hashedPassword });
      await log('User registered', `User ${email} registered successfully`);
      return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      if (error.code === DUPLICATE_KEY_ERROR) {
        return res.status(409).json({ message: 'Email is already registered' });
      }
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  /** POST /login  body: { email, password } -> { data: { _id, name, email } } */
  const login = async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        await log('Login failed', `Login attempt for ${email} failed: user not found`);
        return res.status(404).json({ message: 'User not found' });
      }

      if (!(await compare(password, user.password))) {
        await log('Login failed', `Login attempt for ${email} failed: invalid password`);
        return res.status(401).json({ message: 'Invalid password' });
      }

      await log('Login successful', `User ${email} logged in successfully`);
      return res.status(200).json({ data: toPublicUser(user) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  return { register, login };
}
