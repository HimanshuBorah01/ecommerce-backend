import userModel from "../models/user.model.js";
import passwordService from "./password.service.js";
import tokenService from "./token.service.js";

/**
 * Authentication Service
 *
 * Handles authentication business logic.
 */
class AuthService {
  /**
   * Register a new user.
   */
  async register(userData) {
    const { name, email, phone, password } = userData;

    // Check if user already exists
    const existingUser = await userModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(password);

    // Create user
    const user = await userModel.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    return user;
  }

  /**
   * Login user.
   */
  async login() {
    throw new Error("Not implemented");
  }

  /**
   * Logout user.
   */
  async logout() {
    throw new Error("Not implemented");
  }

  /**
   * Refresh token.
   */
  async refreshToken() {
    throw new Error("Not implemented");
  }
}

const authService = new AuthService();

export default authService;
