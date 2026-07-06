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
  async getSessionById(sessionId) {
    return sessionModel.findById(sessionId);
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
   * Update last activity of a session.
   */
  async updateLastUsed(sessionId) {
    return sessionModel.findByIdAndUpdate(sessionId, {
      lastUsedAt: new Date(),
    });
  }
}

const sessionService = new SessionService();

export default sessionService;
