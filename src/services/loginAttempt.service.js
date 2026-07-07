import redisClient from "../config/redis.js";

class LoginAttemptService {
  constructor() {
    this.MAX_ATTEMPTS = 5;
    this.LOCK_TIME = 15 * 60; // seconds
  }

  getKey(email) {
    return `login_attempts:${email}`;
  }

  getLockKey(email) {
    return `login_lock:${email}`;
  }

  async isLocked(email) {
    const isLocked = await redisClient.exists(this.getLockKey(email));
    return isLocked === 1;
  }

  async recordFailure(email) {
    const attemptsKey = this.getKey(email);
    const lockKey = this.getLockKey(email);

    const attempts = await redisClient.incr(attemptsKey);

    if (attempts === 1) {
      await redisClient.expire(attemptsKey, this.LOCK_TIME);
    }

    if (attempts >= this.MAX_ATTEMPTS) {
      await redisClient.set(lockKey, "1", {
        EX: this.LOCK_TIME,
      });
    }
  }

  async clearAttempts(email) {
    await redisClient.del(
      this.getKey(email),
      this.getLockKey(email),
    );
  }
}

const loginAttemptService = new LoginAttemptService();

export default loginAttemptService;
