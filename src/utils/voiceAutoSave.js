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
                        { $inc: { totalVoice: duration, dailyVoice: duration, weeklyVoice: duration } },
                        { upsert: true }
                    );
                    
                    // 🚨 KRİTİK DÜZELTME (Race Condition Prevention)
                    // Veritabanı işlemi sürerken adam sesten çıkmış olabilir!
                    // Sadece adam HÂLÂ Cache'de duruyorsa ve giriş zamanı bizimkiyle aynıysa yenile.
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