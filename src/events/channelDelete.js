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

import { Events } from 'discord.js';
import Staff from '../models/Staff.js';
import { Cache } from '../utils/staffCalculator.js';

// Bir ses kanalı içindekilerle beraber silinirse, 
// o kanalda olanların süresini kaybetmemek için kurtarma eventi
export default async (client) => {
    client.on(Events.ChannelDelete, async (channel) => {
        if (!channel.isVoiceBased()) return;
        
        const now = Date.now();
        
        for (const [userId, data] of Cache.voiceJoins.entries()) {
            // Silinen kanal, bizim önbellekteki yetkilinin bulunduğu kanalsa
            if (data.channelId === channel.id) {
                const duration = now - data.joinTime;
                
                // Kaydı bellekten temizle
                Cache.voiceJoins.delete(userId);
                
                // Süreyi veritabanına yaz
                if (duration >= 5000) {
                    try {
                        await Staff.findOneAndUpdate(
                            { guildId: channel.guild.id, userId },
                            { $inc: { totalVoice: duration, dailyVoice: duration, weeklyVoice: duration, monthlyVoice: duration } }
                        );
                        console.log(`[CHANNEL RECOVERY] Silinen ${channel.name} kanalındaki ${userId} ID'li yetkilinin süresi kurtarıldı.`);
                    } catch (error) {
                        console.error('Silinen kanal kurtarma hatası:', error);
                    }
                }
            }
        }
    });
};