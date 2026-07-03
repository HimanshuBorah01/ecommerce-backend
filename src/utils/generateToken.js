import jwt from "jsonwebtoken";
import config from "../config/config.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.JWT_SECRET,
    {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  );
};

export default generateToken;
