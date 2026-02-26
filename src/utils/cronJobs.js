import cron from 'node-cron';
import { executeDailyReset, executeWeeklyReset } from './resetManager.js';

export const startCronJobs = (client) => {
    // Tüm yük resetManager.js'e devredildiği için cron'lar artık sadece tetikleyicidir.
    
    // Her gece 00:00'da Günlük işlemleri tetikle
    cron.schedule('0 0 * * *', async () => {
        await executeDailyReset(client);
    }, { timezone: "Europe/Istanbul" });

    // Her Pazartesi 00:00'da Haftalık işlemleri tetikle
    cron.schedule('0 0 * * 1', async () => {
        await executeWeeklyReset(client);
    }, { timezone: "Europe/Istanbul" });
};