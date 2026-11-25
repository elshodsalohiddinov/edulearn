-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "shortDescription" VARCHAR(200) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "teacher_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "expertise" VARCHAR(100) NOT NULL,
    "experience" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "teacher_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_requests_status_idx" ON "teacher_requests"("status");

-- CreateIndex
CREATE INDEX "teacher_requests_userId_idx" ON "teacher_requests"("userId");

-- AddForeignKey
ALTER TABLE "teacher_requests" ADD CONSTRAINT "teacher_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
