-- CreateTable
CREATE TABLE "LessonFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LessonFile" ADD CONSTRAINT "LessonFile_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
