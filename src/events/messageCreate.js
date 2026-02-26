import Staff from '../models/Staff.js';
import SettingsCache from '../utils/settingsCache.js';
import { checkLevelAndTasks } from '../utils/taskSystem.js';

export default async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;

        const userId = message.author.id;
        const guildId = message.guild.id;

        // DÜZELTME: Cache.spamGuard tamamen kaldırıldı. Yetkililerin her mesajı sayılacak.

        try {
            const settings = SettingsCache.get(guildId);
            if (!settings || settings.staffRoles.length === 0) return;

            // Eğer XP kazanılacak kanallar seçilmişse, başka kanaldaki mesajları sayma
            if (settings.allowedMessageChannels && settings.allowedMessageChannels.length > 0) {
                if (!settings.allowedMessageChannels.includes(message.channel.id)) return;
            }

            const hasRole = message.member.roles.cache.some(r => settings.staffRoles.includes(r.id));
            if (!hasRole) return;

            if (message.content.length < settings.minMessageLength) return;

            const updatedStaff = await Staff.findOneAndUpdate(
                { guildId, userId },
                { $inc: { totalMessages: 1, dailyMessages: 1, weeklyMessages: 1 } },
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