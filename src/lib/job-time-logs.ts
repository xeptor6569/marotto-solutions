import { isDatabaseConfigured, prisma } from '@/lib/prisma';

export interface JobTimeLogRecord {
    id: string;
    jobId: string;
    hours: number;
    note: string | null;
    loggedAt: Date;
    createdAt: Date;
}

export async function listJobTimeLogs(jobId: string): Promise<JobTimeLogRecord[]> {
    if (!isDatabaseConfigured()) return [];
    try {
        return await prisma.jobTimeLog.findMany({
            where: { jobId },
            orderBy: [{ loggedAt: 'desc' }, { createdAt: 'desc' }],
        });
    } catch (error) {
        console.error(`Failed to load time logs for job ${jobId}`, error);
        return [];
    }
}

export async function createJobTimeLog(input: {
    jobId: string;
    hours: number;
    note?: string;
    loggedAt?: Date;
}): Promise<JobTimeLogRecord> {
    if (!Number.isFinite(input.hours) || input.hours <= 0) {
        throw new Error('Hours must be greater than zero.');
    }
    return prisma.jobTimeLog.create({
        data: {
            jobId: input.jobId,
            hours: Math.round(input.hours * 100) / 100,
            note: input.note?.trim() || null,
            loggedAt: input.loggedAt ?? new Date(),
        },
    });
}

export async function deleteJobTimeLog(id: string): Promise<void> {
    await prisma.jobTimeLog.delete({ where: { id } });
}

export function sumLoggedHours(logs: Array<{ hours: number }>): number {
    return Math.round(logs.reduce((sum, log) => sum + (Number(log.hours) || 0), 0) * 100) / 100;
}
