import bcrypt from "bcrypt";

/**
 * Password Service
 *
 * Handles password hashing and password comparison.
 */
class PasswordService {
  /**
   * Hash a plain text password.
   */
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compare plain text password with hashed password.
   */
  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

const passwordService = new PasswordService();

export default passwordService;
