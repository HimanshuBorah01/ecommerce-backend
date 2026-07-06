import userModel from "../models/user.model.js";
import passwordService from "./password.service.js";
import tokenService from "./token.service.js";
import sessionService from "./session.service.js";
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
      throw new ApiError(409, "User with this email or phone already exists");
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

    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
    };
  }

  /**
   * Login user.
   */
  async login(loginData) {
    const { email, phone, password } = loginData;

    // Find user by email or phone
    const user = await userModel
      .findOne({
        $or: [{ email }, { phone }],
      })
      .select("+password");

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

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user);

    const userResponse = user.toObject();
    delete userResponse.password;

    // Hash refresh token before storing
    const refreshTokenHash = tokenService.hashRefreshToken(refreshToken);

    // Create session
    await sessionService.createSession({
      user: user._id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      user: userResponse,
      accessToken,
      refreshToken,
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
