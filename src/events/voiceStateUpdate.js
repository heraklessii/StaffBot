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
import { Cache } from '../utils/staffCalculator.js';
import { checkLevelAndTasks } from '../utils/taskSystem.js';

export default async (client) => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.member.user.bot) return;

        const userId = newState.member.user.id;
        const guildId = newState.guild.id;

        const settings = SettingsCache.get(guildId);
        if (!settings || settings.staffRoles.length === 0) return;

        const isStaff = newState.member.roles.cache.some(r => settings.staffRoles.includes(r.id));
        if (!isStaff) return;

        const isInvalid = (state) => {
            if (!state.channelId) return true; 
            // AFK Kanalı ve Kara Liste koruması aktif
            if (settings.voiceChannelBlacklist.includes(state.channelId) || state.channelId === state.guild.afkChannelId) return true; 
            if (state.selfDeaf || state.serverDeaf) return true; 
            return false;
        };

        const wasValid = !isInvalid(oldState);
        const isValid = !isInvalid(newState);

        try {
            if (wasValid) {
                if (Cache.voiceJoins.has(userId)) {
                    const { joinTime } = Cache.voiceJoins.get(userId);
                    const duration = Date.now() - joinTime;
                    Cache.voiceJoins.delete(userId);

                    if (duration >= 5000) { 
                        const updatedStaff = await Staff.findOneAndUpdate(
                            { guildId, userId },
                            { $inc: { totalVoice: duration, dailyVoice: duration, weeklyVoice: duration, monthlyVoice: duration } },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );

                        if (updatedStaff) await checkLevelAndTasks(updatedStaff, newState.member);
                    }
                }
            }

            if (isValid) {
                // channelId bilgisini de Cache içine kaydediyoruz ki kanal silinirse bulabilelim
                Cache.voiceJoins.set(userId, { guildId, channelId: newState.channelId, joinTime: Date.now() });
            }

        } catch (error) {
            console.error('Ses takip hatası:', error);
        }
    });
};