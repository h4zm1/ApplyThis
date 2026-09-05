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
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyToken: null,
      verifyTokenExp: null,
      isVerified: true,
    },
  });
  logger.info({ userId: user.id }, "email verified");
}
