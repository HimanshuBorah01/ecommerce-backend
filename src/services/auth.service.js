import userModel from "../models/user.model.js";
import passwordService from "./password.service.js";
import tokenService from "./token.service.js";
import ApiError from "../utils/ApiError.js";

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
  async login({ email, password }) {
    // Find user by email
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await passwordService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate access token
    const accessToken = tokenService.generateAccessToken(user);

    return {
      user,
      accessToken,
    };
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
