import prisma from "../config/database";
import logger from "../config/logger";
import { comparePassword, generateTokens, hashPassword } from "./authService";
import { deleteStoredFiles } from "./storageService";

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("user not found");

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) throw new Error("wrong password");

  const hashedPassword = await hashPassword(newPassword);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, passwordChangedAt: new Date() },
  });

  logger.info({ userId }, "password changed");

  // return fresh tokens so their session survie the check in refreshTokens
  return generateTokens(updated.id, updated.email, updated.isDemo);
}

export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("user not found");

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new Error("wrong password");

  // get the stored files before deleting the db so we can delete them too
  const resumes = await prisma.resume.findMany({
    where: { userId },
    select: { pdfUrl: true, thumbnailUrl: true },
  });

  // this will (should) cascade remove resumes, jobs and status history
  await prisma.user.delete({ where: { id: userId } });

  // clean storage
  for (const resume of resumes) {
    await deleteStoredFiles(resume.pdfUrl, resume.thumbnailUrl);
  }

  logger.info({ userId }, "account deleted");
}
