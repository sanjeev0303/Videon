import cron from 'node-cron';
import { prisma, redisClient } from '../utils';
import { LAST_USED_HASH } from '../config';

export const startApiKeyUsageCron = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const map = await redisClient.hgetall(LAST_USED_HASH);
            if (!map || Object.keys(map).length === 0) return;

            // Delete the hash so new incoming requests start accumulating afresh
            await redisClient.del(LAST_USED_HASH);

            const entries = Object.entries(map).map(([keyId, ts]) => ({
                keyId,
                ts: new Date(Number(ts)),
            })).filter(x => x.keyId && x.ts instanceof Date && !Number.isNaN(x.ts.getTime()));

            if (entries.length === 0) return;

            // Use a Prisma transaction to execute concurrent updates efficiently.
            // This is safer and cleaner than raw SQL string concatenation for VALUES.
            await prisma.$transaction(
                entries.map(entry => 
                    prisma.apiKey.updateMany({
                        where: { id: entry.keyId },
                        data: { last_used_at: entry.ts }
                    })
                )
            );
            
            console.log(`[Cron] Flushed ${entries.length} api-key usage metrics to database.`);
        } catch (error) {
            console.error('[Cron] Error flushing api-key usage metrics:', error);
        }
    });
};
