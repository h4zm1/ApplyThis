import bcrypt from "bcryptjs";
import { TokenPayload } from "../types/auth";
import jwt from "jsonwebtoken";
import prisma from "../config/database";
import logger from "../config/logger";
import { log } from "node:console";

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

  // create user
  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
    },
  });

  logger.info({ userId: user.id }, "user registered");

  // return token
  return generateTokens(user.id, user.email);
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

  // check password
  const validPassword = comparePassword(password, user.password);

  if (!validPassword) {
    throw new Error("invalid crednetials");
  }

  logger.info({ userId: user.id }, "user logged in");

  //return token
  return generateTokens(user.id, user.email);
}

// refresh toekn
export function refreshTokens(refreshToken: string) {
  // verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // generate new token
  return generateTokens(payload.userId, payload.email);
}
