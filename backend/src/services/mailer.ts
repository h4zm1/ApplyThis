import nodemailer from "nodemailer/lib/nodemailer";
import logger from "../config/logger";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // false = port 587, true = port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify connection
transporter.verify((error) => {
  if (error) {
    logger.error({ message: error.message }, "email connection failed");
  } else {
    logger.info("email ready");
  }
});

export default transporter;
