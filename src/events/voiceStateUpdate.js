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
                            { $inc: { totalVoice: duration, dailyVoice: duration, weeklyVoice: duration } },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );

                        if (updatedStaff) await checkLevelAndTasks(updatedStaff, newState.member);
                    }
                }
            }

            if (isValid) {
                // YENİ: channelId bilgisini de Cache içine kaydediyoruz ki kanal silinirse bulabilelim
                Cache.voiceJoins.set(userId, { guildId, channelId: newState.channelId, joinTime: Date.now() });
            }

        } catch (error) {
            console.error('Ses takip hatası:', error);
        }
    });
};