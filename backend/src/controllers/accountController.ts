import { Response } from "express";
import { AuthRequest } from "../types/auth";
import { changePassword, deleteAccount } from "../services/accountService";
import logger from "../config/logger";

// POST /api/account/password
// this's for the settings menu password change
export async function updatePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "current and new password required" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "password must be at least 6 characters" });
    }

    const tokens = await changePassword(
      req.user!.userId,
      currentPassword,
      newPassword,
    );
    return res.json(tokens);
  } catch (error) {
    if (error instanceof Error && error.message === "wrong password") {
      return res.status(400).json({ error: "current password is incorrect" });
    }
    logger.error({ err: error }, "change password failed");
    return res.status(500).json({ error: "failed to change password" });
  }
}

// DELETE /api/account
export async function removeAccount(req: AuthRequest, res: Response) {
  try {
    const { password } = req.body;
    if (typeof password !== "string") {
      return res.status(400).json({ error: "password required" });
    }

    await deleteAccount(req.user!.userId, password);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "wrong password") {
      return res.status(400).json({ error: "password is incorrect" });
    }
    logger.error({ err: error }, "delete account failed");
    return res.status(500).json({ error: "failed to delete account" });
  }
}
