-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authCode" TEXT,
ADD COLUMN     "authCodeExp" TIMESTAMP(3);
