-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "accessDurationDays" INTEGER;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "accessExpiresAt" TIMESTAMP(3);
