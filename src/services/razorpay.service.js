import Razorpay from "razorpay";

import config from "../config/config.js";

// payment services
const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

export default razorpay;
