import { randomUUID } from "crypto";
import prisma from "../config/database";

// build date in the past
export function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// creates a user that owns a resume and a job (with history)
// to check that deleting the user also remove their data
export async function createTestUser(options: {
  isDemo: boolean;
  ageInHours: number;
}) {
  return prisma.user.create({
    data: {
      email: "test_" + randomUUID() + "@test.local",
      password: "not-a-real-hash",
      isVerified: true,
      isDemo: options.isDemo,
      createdAt: hoursAgo(options.ageInHours), // lets us fake an old account
      resumes: {
        create: [{ name: "Test resume", source: "\\documentclass{article}" }],
      },
      jobs: {
        create: [
          {
            company: "Test Co",
            position: "Developer",
            statusHistory: { create: [{ toStatus: "APPLIED" }] },
          },
        ],
      },
    },
  });
}
