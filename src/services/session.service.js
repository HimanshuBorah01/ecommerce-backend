import sessionModel from "../models/session.model.js";

/**
 * Session Service
 *
 * Handles user session management.
 */
class SessionService {
  /**
   * Create a new session.
   */
  async createSession(sessionData) {
    return sessionModel.create(sessionData);
  }

  /**
   * Find a session by its id.
   */
  async findSessionById(sessionId) {
    return sessionModel.findById(sessionId);
  }

  /**
   * Find session by refresh token hash.
   */
  async findSessionByRefreshToken(refreshTokenHash) {
    return sessionModel.findOne({
      refreshTokenHash,
      revoked: false,
    });
  }

  /**
   * Revoke a session.
   */
  async revokeSession(sessionId) {
    return sessionModel.findByIdAndUpdate(
      sessionId,
      {
        revoked: true,
        revokedAt: new Date(),
      },
      {
        new: true,
      },
    );
  }

  /**
   * Revoke all sessions of a user.
   */
  async revokeAllSessions(userId) {
    return sessionModel.updateMany(
      {
        user: userId,
        revoked: false,
      },
      {
        revoked: true,
        revokedAt: new Date(),
      },
    );
  }

  /**
   * Update refresh token hash.
   */
  async updateRefreshToken(sessionId, refreshTokenHash, expiresAt) {
    return sessionModel.findByIdAndUpdate(
      sessionId,
      {
        refreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      },
      {
        new: true,
      },
    );
  }

  /**
   * Update last activity of a session.
   */
  async updateLastUsed(sessionId) {
    return sessionModel.findByIdAndUpdate(
      sessionId,
      {
        lastUsedAt: new Date(),
      },
      {
        new: true,
      },
    );
  }

  /**
   * Delete all expired sessions.
   */
  async deleteExpiredSessions() {
    return sessionModel.deleteMany({
      expiresAt: {
        $lt: new Date(),
      },
    });
  }
}

const sessionService = new SessionService();

export default sessionService;
