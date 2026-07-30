import redisClient from "../config/redis.js";

class LoginAttemptService {
  constructor() {
    // User gets locked after this many failed login tries.
    this.MAX_ATTEMPTS = 5;
    // Lock time is stored in seconds for Redis.
    this.LOCK_TIME = 15 * 60; // 900 seconds
  }

  getKey(email) {
    return `login_attempts:${email}`;
  }

  getLockKey(email) {
    return `login_lock:${email}`;
  }

  async isLocked(email) {
    // Redis returns 1 when the lock key exists.
    const isLocked = await redisClient.exists(this.getLockKey(email));
    return isLocked === 1;
  }

  async recordFailure(email) {
    const attemptsKey = this.getKey(email);
    const lockKey = this.getLockKey(email);

    // Increase failed attempt count by one.
    const attempts = await redisClient.incr(attemptsKey);

    if (attempts === 1) {
      // Auto-remove the attempt counter after lock time.
      await redisClient.expire(attemptsKey, this.LOCK_TIME);
    }

    if (attempts >= this.MAX_ATTEMPTS) {
      // Too many failures, so lock login for this email.
      await redisClient.set(lockKey, "1", {
        EX: this.LOCK_TIME,
      });
      await redisClient.del(attemptsKey);
    }
  }

  async clearAttempts(email) {
    // Clear attempts and lock after successful login.
    await Promise.all([
      redisClient.del(this.getKey(email)),
      redisClient.del(this.getLockKey(email)),
    ]);
  }
}

const loginAttemptService = new LoginAttemptService();

export default loginAttemptService;
