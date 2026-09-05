/*
  Warnings:

  - You are about to drop the column `isVerified` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `verifyToken` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `verifyTokenExp` on the `Resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "isVerified",
DROP COLUMN "verifyToken",
DROP COLUMN "verifyTokenExp";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifyToken" TEXT,
ADD COLUMN     "verifyTokenExp" TIMESTAMP(3);
