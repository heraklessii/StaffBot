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
import SettingsCache from '../utils/settingsCache.js';
import { checkLevelAndTasks } from '../utils/taskSystem.js';

// Geçmiş mesajları tutan ufak bir RAM belleği
const lastMessages = new Map();

export default async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;

        const userId = message.author.id;
        const guildId = message.guild.id;

        try {
            const settings = SettingsCache.get(guildId);
            if (!settings || settings.staffRoles.length === 0) return;

            if (settings.allowedMessageChannels && settings.allowedMessageChannels.length > 0) {
                if (!settings.allowedMessageChannels.includes(message.channel.id)) return;
            }

            const hasRole = message.member.roles.cache.some(r => settings.staffRoles.includes(r.id));
            if (!hasRole) return;

            if (message.content.length < settings.minMessageLength) return;

            // 🚨 YENİ: KALİTE FİLTRESİ (Anti-Spam)
            // Süre limiti yok ama aynı mesajı (Örn: "hoşgeldin") 5 saniye içinde peş peşe atarsa sayma
            const lastMsgData = lastMessages.get(userId);
            if (lastMsgData && lastMsgData.content === message.content.toLowerCase() && (Date.now() - lastMsgData.time) < 5000) {
                return; // Puan verme, filtreye takıldı.
            }

            lastMessages.set(userId, { content: message.content.toLowerCase(), time: Date.now() });

            // YENİ: monthlyMessages eklendi
            const updatedStaff = await Staff.findOneAndUpdate(
                { guildId, userId },
                { $inc: { totalMessages: 1, dailyMessages: 1, weeklyMessages: 1, monthlyMessages: 1 } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            if (updatedStaff) {
                await checkLevelAndTasks(updatedStaff, message.member);
            }

        } catch (error) {
            console.error('Mesaj takip hatası:', error);
        }
    });
};