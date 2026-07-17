import Razorpay from "razorpay";
import config from "../config/config.js";

// payment services
const razorpay =
  config.NODE_ENV === "test"
    ? {
        orders: {
          create: async ({ amount, currency, receipt }) => ({
            id: `order_test_${receipt || Date.now()}`,
            amount,
            currency,
            receipt,
            status: "created",
          }),
        },
      }
    : new Razorpay({
        key_id: config.RAZORPAY_KEY_ID,
        key_secret: config.RAZORPAY_KEY_SECRET,
      });

export default razorpay;
