-- CreateTable
CREATE TABLE "Helper" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Helper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelperPayout" (
    "id" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "jobId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelperPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Helper_active_idx" ON "Helper"("active");

-- CreateIndex
CREATE INDEX "Helper_name_idx" ON "Helper"("name");

-- CreateIndex
CREATE INDEX "HelperPayout_helperId_idx" ON "HelperPayout"("helperId");

-- CreateIndex
CREATE INDEX "HelperPayout_jobId_idx" ON "HelperPayout"("jobId");

-- CreateIndex
CREATE INDEX "HelperPayout_paidAt_idx" ON "HelperPayout"("paidAt");

-- AddForeignKey
ALTER TABLE "HelperPayout" ADD CONSTRAINT "HelperPayout_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelperPayout" ADD CONSTRAINT "HelperPayout_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
