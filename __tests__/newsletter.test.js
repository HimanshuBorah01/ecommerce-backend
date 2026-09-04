import { jest } from "@jest/globals";
import request from "supertest";

import app from "../src/app.js";
import emailService from "../src/services/email.service.js";
import subscriptionModel from "../src/models/subscription.model.js";

// newsletter.test.js - Integration tests for the newsletter subscribe endpoint.
// The email service is stubbed so tests never make a real Gmail API call.

describe("Newsletter API", () => {
  let sendWelcomeEmailSpy;

  beforeEach(() => {
    sendWelcomeEmailSpy = jest
      .spyOn(emailService, "sendNewsletterWelcomeEmail")
      .mockResolvedValue({ messageId: "mock-message-id" });
  });

  afterEach(() => {
    sendWelcomeEmailSpy?.mockRestore();
  });

  test("should subscribe a new email, persist it, and send a welcome email", async () => {
    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "subscriber@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/thank you for subscribing/i);

    // A welcome email is sent to the subscriber.
    expect(sendWelcomeEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendWelcomeEmailSpy).toHaveBeenCalledWith("subscriber@example.com");

    // The subscription is persisted in the database (email normalized to lowercase).
    const saved = await subscriptionModel.findOne({
      email: "subscriber@example.com",
    });
    expect(saved).not.toBeNull();
    expect(saved.email).toBe("subscriber@example.com");
  });

  test("should normalize the email to lowercase before saving", async () => {
    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "MixedCase@Example.COM" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const saved = await subscriptionModel.findOne({
      email: "mixedcase@example.com",
    });
    expect(saved).not.toBeNull();
    expect(sendWelcomeEmailSpy).toHaveBeenCalledWith("mixedcase@example.com");
  });

  test("should not subscribe with an invalid email", async () => {
    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "not-an-email" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    // No subscription should have been created.
    const saved = await subscriptionModel.findOne({ email: "not-an-email" });
    expect(saved).toBeNull();
  });

  test("should not subscribe when email is missing", async () => {
    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("should treat an already-subscribed email as a success without re-sending", async () => {
    await subscriptionModel.create({ email: "existing@example.com" });

    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "Existing@Example.COM" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/already subscribed/i);

    // No duplicate welcome email is sent.
    expect(sendWelcomeEmailSpy).not.toHaveBeenCalled();

    // Only one record exists for that email.
    const count = await subscriptionModel.countDocuments({
      email: "existing@example.com",
    });
    expect(count).toBe(1);
  });

  test("should handle a temporary email service failure without rejecting the subscription", async () => {
    sendWelcomeEmailSpy.mockRejectedValueOnce(new Error("SMTP down"));

    const response = await request(app)
      .post("/api/v1/newsletter/subscribe")
      .send({ email: "graceful@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Subscription is still persisted even though the email failed.
    const saved = await subscriptionModel.findOne({
      email: "graceful@example.com",
    });
    expect(saved).not.toBeNull();
  });
});
