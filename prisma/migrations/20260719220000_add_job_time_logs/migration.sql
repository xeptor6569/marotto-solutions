-- CreateTable
CREATE TABLE "JobTimeLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobTimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobTimeLog_jobId_idx" ON "JobTimeLog"("jobId");

-- CreateIndex
CREATE INDEX "JobTimeLog_loggedAt_idx" ON "JobTimeLog"("loggedAt");

-- AddForeignKey
ALTER TABLE "JobTimeLog" ADD CONSTRAINT "JobTimeLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
