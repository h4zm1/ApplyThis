import crypto from "crypto";
import bcrypt from "bcryptjs";
import { TokenPayload } from "../types/auth";
import jwt from "jsonwebtoken";
import prisma from "../config/database";
import logger from "../config/logger";
import { log } from "node:console";
import { sendVerificationEmail } from "./emailService";

// hash password before storing
// like passswordEncoder.encode() in spring
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// compare password with hash
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// generate both tokens (jwt + refresh)
export function generateTokens(userId: string, email: string) {
  const payload: TokenPayload = { userId, email };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRETE!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES as any, // apparently casting is needed here cause expireIn requires StringValue and not string
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRETE!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES as any,
  });

  return { accessToken, refreshToken };
}

// verify access token
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRETE!) as TokenPayload;
}

// verify refresh token
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRETE!) as TokenPayload;
}

// register new user
export async function registerUser(email: string, password: string) {
  // check if email already exist
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("email already registered");
  }

  // hash password
  const hashedPassword = await hashPassword(password);

  // generate random verification token
  const verifyToken = crypto.randomBytes(32).toString("hex");
  // token expire in 24 hours
  const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // create user
  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      isVerified: false,
      verifyToken,
      verifyTokenExp,
    },
  });

  logger.info({ userId: user.id }, "user registered, awaiting verification");
  sendVerificationEmail(email, verifyToken).catch((err) => {
    // console.log("EMAIL ERROR", err.message);
    // console.log("FULL ERROR", err);
    logger.error(
      { message: err.message, userId: user.id },
      "failed to send verification mail",
    );
  });

  // no login till verified
  return { message: "reg success, check mail" };
}

// login user
export async function loginUser(email: string, password: string) {
  // find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("invalid credentials");
  }
  if (!user.isVerified) {
    throw new Error("email not verified");
  }
  // check password
  const validPassword = await comparePassword(password, user.password);
  if (!validPassword) {
    throw new Error("invalid credentials");
  }

  logger.info({ userId: user.id }, "user logged in");

  //return token
  return generateTokens(user.id, user.email);
}

// refresh token
export async function refreshTokens(refreshToken: string) {
  // verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // check DB if the use exist
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  if (!user) {
    throw new Error("User no longer exists");
  }

  // generate new token
  return generateTokens(user.id, user.email);
}

// verify from the token in link
export async function verifyEmail(token: string) {
  // find user with this token
  const user = await prisma.user.findFirst({
    where: {
      verifyToken: token,
      isVerified: false,
    },
  });

  if (!user) throw new Error("invalid token");

  // check token didn't expire
  if (!user.verifyTokenExp || user.verifyTokenExp < new Date())
    throw new Error("token expired");

  // mark as verified and clear token (so it can't be reused)
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyToken: null,
      verifyTokenExp: null,
      isVerified: true,
    },
  });
  logger.info({ userId: user.id }, "email verified");
  return updatedUser;
}

// generate a code after mail verification (single use and expire in 2min)
export async function generateAuthCode(userId: string): Promise<string> {
  const authCode = crypto.randomBytes(32).toString("hex");
  const authCodeExp = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  await prisma.user.update({
    where: { id: userId },
    data: { authCode, authCodeExp },
  });

  return authCode;
}

// this will get called from the temp page in the front to exchange the code for jwt tokens
export async function exchangeAuthCode(code: string) {
  // find user with this code
  const user = await prisma.user.findFirst({
    where: { authCode: code },
  });

  if (!user) {
    throw new Error("invalid code");
  }

  // too late
  if (!user.authCodeExp || user.authCodeExp < new Date()) {
    throw new Error("code expired");
  }

  // clear the code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      authCode: null,
      authCodeExp: null,
    },
  });

  logger.info({ userId: user.id }, "auth code exchanged for tokens");

  // return jwt tokens (for auto login after mail verificatiin)
  return generateTokens(user.id, user.email);
}
