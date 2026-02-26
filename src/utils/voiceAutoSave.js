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

import Staff from '../models/Staff.js';
import { Cache } from './staffCalculator.js';

export const startVoiceAutoSave = () => {
    setInterval(async () => {
        const now = Date.now();
        let savedCount = 0;

        for (const [userId, data] of Cache.voiceJoins.entries()) {
            const { guildId, channelId, joinTime } = data;
            const duration = now - joinTime;

            if (duration >= 60000) { 
                try {
                    await Staff.findOneAndUpdate(
                        { guildId, userId },
                        { $inc: { totalVoice: duration, dailyVoice: duration, weeklyVoice: duration, monthlyVoice: duration } },
                        { upsert: true }
                    );
                    
                    // Sadece HÂLÂ Cache'de duruyorsa ve giriş zamanı bizimkiyle aynıysa yenile.
                    if (Cache.voiceJoins.has(userId)) {
                        const currentCache = Cache.voiceJoins.get(userId);
                        if (currentCache.joinTime === joinTime) {
                            Cache.voiceJoins.set(userId, { guildId, channelId, joinTime: now });
                            savedCount++;
                        }
                    }
                } catch (error) {
                    console.error('Auto-Save Hatası:', error);
                }
            }
        }

        if (savedCount > 0) {
            console.log(`[AUTO-SAVE] ${savedCount} yetkilinin ses süresi arka planda güvenle yedeklendi.`);
        }
    }, 5 * 60 * 1000); 
};