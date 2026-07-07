import userModel from "../models/user.model.js";
import passwordService from "./password.service.js";
import tokenService from "./token.service.js";
import sessionService from "./session.service.js";
import ApiError from "../utils/ApiError.js";
import { AUTH } from "../constants/auth.js";
import passwordResetTokenService from "./passwordResetToken.service.js";
import emailService from "./email.service.js";
import config from "../config/config.js";
import emailVerificationTokenService from "./emailVerificationToken.service.js";
import emailVerificationService from "./emailVerification.service.js";
import loginAttemptService from "./loginAttempt.service.js";

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

    const loginIdentifier = email || phone;

    // Check if account is temporarily locked
    const isLocked = await loginAttemptService.isLocked(loginIdentifier);

    if (isLocked) {
      throw new ApiError(
        429,
        "Too many failed login attempts. Please try again after 15 minutes.",
      );
    }

    // Find user by email or phone
    const user = await userModel
      .findOne({
        $or: [{ email }, { phone }],
      })
      .select("+password");

    if (!user) {
      await loginAttemptService.recordFailure(loginIdentifier);
      throw new ApiError(401, "Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await passwordService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      await loginAttemptService.recordFailure(loginIdentifier);
      throw new ApiError(401, "Invalid credentials");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Account is inactive");
    }

    // Clear failed login attempts after successful authentication
    await loginAttemptService.clearAttempts(loginIdentifier);

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
   * Logout current user.
   */
  async logout(cookies) {
    const refreshToken = cookies?.[AUTH.REFRESH_TOKEN_COOKIE_NAME];

    // If no refresh token exists, treat logout as successful.
    if (!refreshToken) {
      return;
    }

    const refreshTokenHash = tokenService.hashRefreshToken(refreshToken);

    const session =
      await sessionService.findSessionByRefreshToken(refreshTokenHash);

    // Session already removed or invalid.
    if (!session) {
      return;
    }

    // Revoke the current session.
    await sessionService.revokeSession(session._id);
  }

  /**
   * Refresh access token.
   */
  async refreshToken(cookies) {
    const refreshToken = cookies?.[AUTH.REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }

    // Verify refresh token
    const decoded = tokenService.verifyRefreshToken(refreshToken);

    // Hash refresh token
    const refreshTokenHash = tokenService.hashRefreshToken(refreshToken);

    // Find active session
    const session =
      await sessionService.findSessionByRefreshToken(refreshTokenHash);

    if (!session) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (session.revoked) {
      throw new ApiError(401, "Session has been revoked");
    }

    if (session.expiresAt < new Date()) {
      throw new ApiError(401, "Session has expired");
    }

    const user = await userModel.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, "User not found or account is inactive");
    }

    if (session.user.toString() !== user._id.toString()) {
      throw new ApiError(401, "Invalid session");
    }

    const accessToken = tokenService.generateAccessToken(user);
    const newRefreshToken = tokenService.generateRefreshToken(user);
    const newRefreshTokenHash = tokenService.hashRefreshToken(newRefreshToken);

    await sessionService.updateRefreshToken(
      session._id,
      newRefreshTokenHash,
      session.expiresAt,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Forgot password.
   */
  async forgotPassword(email) {
    const user = await userModel.findOne({ email });

    // Don't reveal whether the email exists
    if (!user) {
      return;
    }

    // Create reset token
    const resetToken = await passwordResetTokenService.createToken(user._id);

    // Create reset link
    const resetLink = `${config.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send email
    await emailService.sendPasswordResetEmail(user.email, resetLink);
  }

  /**
   * Reset user password.
   */
  async resetPassword(token, password) {
    // Find reset token
    const passwordResetToken = await passwordResetTokenService.findToken(token);

    if (!passwordResetToken) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    // Check expiration
    if (passwordResetToken.expiresAt < new Date()) {
      throw new ApiError(400, "Reset token has expired");
    }

    // Find user
    const user = await userModel.findById(passwordResetToken.user);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Hash new password
    user.password = await passwordService.hashPassword(password);
    await user.save();

    // Delete reset token
    await passwordResetTokenService.deleteToken(user._id);

    // Logout from all devices
    await sessionService.revokeAllSessions(user._id);
  }

  /**
   * Change password.
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Find user
    const user = await userModel.findById(userId).select("+password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Verify current password
    const isPasswordValid = await passwordService.comparePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ApiError(400, "Current password is incorrect");
    }

    // Prevent using the same password
    const isSamePassword = await passwordService.comparePassword(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new ApiError(
        400,
        "New password must be different from the current password",
      );
    }

    // Update password
    user.password = await passwordService.hashPassword(newPassword);
    await user.save();

    // Logout from all devices
    await sessionService.revokeAllSessions(user._id);
  }

  /**
   * Verify user email.
   */
  async verifyEmail(token) {
    // Find verification token
    const verificationToken =
      await emailVerificationTokenService.findToken(token);

    if (!verificationToken) {
      throw new ApiError(400, "Invalid or expired verification token");
    }

    // Check expiration
    if (verificationToken.expiresAt < new Date()) {
      throw new ApiError(400, "Verification token has expired");
    }

    // Find user
    const user = await userModel.findById(verificationToken.user);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Email already verified
    if (user.isEmailVerified) {
      await emailVerificationTokenService.deleteToken(user._id);
      return;
    }

    // Mark email as verified
    user.isEmailVerified = true;
    await user.save();

    // Delete verification token
    await emailVerificationTokenService.deleteToken(user._id);
  }

  /**
   * Resend email verification.
   */
  async resendVerificationEmail(email) {
    const user = await userModel.findOne({ email });

    // Don't reveal whether the email exists
    if (!user) {
      return;
    }

    // Already verified
    if (user.isEmailVerified) {
      return;
    }
    // Send a new verification email
    await emailVerificationService.sendVerificationEmail(user);
  }
}



const authService = new AuthService();

export default authService;
