/*
 * StaffBot - Gelişmiş Discord Yetkili Takip Botu
 * Copyright (C) 2026 heraklessii
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import cron from 'node-cron';
import { executeDailyReset, executeWeeklyReset, executeMonthlyReset } from './resetManager.js';

export const startCronJobs = (client) => {
    // Her gece 00:00'da Günlük işlemleri tetikle
    cron.schedule('0 0 * * *', async () => {
        await executeDailyReset(client);
    }, { timezone: "Europe/Istanbul" });

    // Her Pazartesi 00:00'da Haftalık işlemleri tetikle
    cron.schedule('0 0 * * 1', async () => {
        await executeWeeklyReset(client);
    }, { timezone: "Europe/Istanbul" });

    // 🚨 YENİ: Her Ayın 1'inde saat 00:00'da Aylık işlemleri tetikle
    cron.schedule('0 0 1 * *', async () => {
        await executeMonthlyReset(client);
    }, { timezone: "Europe/Istanbul" });
};