import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import prisma from "../config/database";
import { cleanupExpiredDemoUsers } from "../services/demoCleaningService";
import { createTestUser } from "./helpers";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

// replace the real storage client with a fake one
// this will intercept any import of "/s3" and replace the s3 client with fake object whose .send() is sendMock
vi.mock("../config/s3", () => ({
  default: { send: sendMock },
}));

describe("cleanupExpiredDemoUsers", () => {
  let bucket: string[]; // file keys currently "stored"
  let storageFails: boolean;

  beforeEach(async () => {
    // every test starts with empty db and empty bucket
    await prisma.user.deleteMany(); // cascades to resumes, jobs and history
    bucket = [];
    storageFails = false;

    sendMock.mockReset();
    sendMock.mockImplementation(async (command: any) => {
      if (storageFails) throw new Error("storage is down");

      const name = command.constructor.name;

      if (name === "ListObjectsV2Command") {
        const prefix: string = command.input.Prefix;
        const keys = bucket.filter((key) => key.startsWith(prefix));
        return { Contents: keys.map((Key) => ({ Key })), IsTruncated: false };
      }

      if (name === "DeleteObjectsCommand") {
        const deleted: string[] = command.input.Delete.Objects.map(
          (o: any) => o.Key,
        );
        bucket = bucket.filter((key) => !deleted.includes(key));
        return {};
      }

      throw new Error("unexpected storage command: " + name);
    });
  });

  // cleanup (run once after all test in this file are done)
  afterAll(async () => {
    // close database cnx pool
    await prisma.$disconnect();
  });

  // check that cascade remove resumes, jobs and status history
  it("deletes expired demo users and everything they own", async () => {
    await createTestUser({ isDemo: true, ageInHours: 30 });

    await cleanupExpiredDemoUsers();

    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.resume.count()).toBe(0);
    expect(await prisma.job.count()).toBe(0);
    expect(await prisma.jobStatusHistory.count()).toBe(0);
  });

  // make sure that demo user inside their time limit are still there
  it("keeps demo users that didn't expired yet", async () => {
    await createTestUser({ isDemo: true, ageInHours: 2 });

    await cleanupExpiredDemoUsers();

    expect(await prisma.user.count()).toBe(1);
  });

  // make sure any issue with isDemo check hit the test first
  it("never deletes real users, no matter how old they are", async () => {
    await createTestUser({ isDemo: false, ageInHours: 24 * 400 });

    await cleanupExpiredDemoUsers();

    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.resume.count()).toBe(1);
    expect(await prisma.job.count()).toBe(1);
  });

  it("deletes the stored files of expired demo users only", async () => {
    const expired = await createTestUser({ isDemo: true, ageInHours: 30 });
    const fresh = await createTestUser({ isDemo: true, ageInHours: 2 });

    bucket = [
      "resume/demo-" + expired.id + "-aaa.pdf",
      "thumbnail/demo-" + expired.id + "-aaa.png",
      "resume/demo-" + fresh.id + "-bbb.pdf",
      "resume/some-real-user-file.pdf",
    ];

    await cleanupExpiredDemoUsers();

    // only the expired user files are gone
    expect(bucket).toEqual([
      "resume/demo-" + fresh.id + "-bbb.pdf",
      "resume/some-real-user-file.pdf",
    ]);
  });

  it("keeps the user when storage fails, so the next run can retry", async () => {
    await createTestUser({ isDemo: true, ageInHours: 30 });
    // simulate s3 being offline => cleanup shouldn't crash and user musn't be deteted
    storageFails = true;
    await cleanupExpiredDemoUsers();
    expect(await prisma.user.count()).toBe(1);
    // simulate s3 coming back online =>  run retries and delete user
    storageFails = false;
    await cleanupExpiredDemoUsers();
    expect(await prisma.user.count()).toBe(0);
  });
});
