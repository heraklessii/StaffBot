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

import { SlashCommandBuilder, AttachmentBuilder, Collection } from 'discord.js';
import Staff from '../../models/Staff.js';
import StaffSettings from '../../models/StaffSettings.js';
import { calculatePerformance, Cache } from '../../utils/staffCalculator.js';
import { generateStatsCard } from '../../utils/imageGenerator.js';

// 🚨 YENİ: Cooldown (Bekleme Süresi) Belleği
const cooldowns = new Collection();

export default {
    data: new SlashCommandBuilder()
        .setName('staff-stats')
        .setDescription('Yetkili istatistiklerini gelişmiş grafik olarak görüntüler.')
        .addUserOption(option => option.setName('yetkili').setDescription('İstatistiklerine bakılacak yetkili')),
        
    async execute(interaction) {
        // Cooldown Kontrolü (Sadece staff-stats için)
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 15000; // 15 saniye
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `⏱️ Bu komutu çok hızlı kullanıyorsunuz. Lütfen **${timeLeft.toFixed(1)} saniye** bekleyin.`, ephemeral: true });
            }
        }
        
        // Komut kullanıldı, zamanlayıcıyı başlat
        cooldowns.set(interaction.user.id, Date.now());
        setTimeout(() => cooldowns.delete(interaction.user.id), 15000);

        await interaction.deferReply();
        const targetUser = interaction.options.getUser('yetkili') || interaction.user;
        const guildId = interaction.guild.id;

        try {
            let staffData = await Staff.findOne({ guildId, userId: targetUser.id }).lean();
            const settings = await StaffSettings.findOne({ guildId }) || { weights: { message: 1, voice: 0.1, invite: 15 } };

            if (!staffData) {
                staffData = {
                    level: 1, totalMessages: 0, totalVoice: 0, totalInvites: 0, 
                    tasksCompleted: 0, penaltyPoints: 0, performanceScore: 0
                };
            }

            let activeVoiceTime = 0;
            if (Cache.voiceJoins.has(targetUser.id)) {
                activeVoiceTime = Date.now() - Cache.voiceJoins.get(targetUser.id).joinTime;
            }

            const displayData = { ...staffData };
            displayData.totalVoice += activeVoiceTime;
            displayData.dailyVoice += activeVoiceTime;
            displayData.weeklyVoice += activeVoiceTime;

            const baseScore = calculatePerformance(displayData, settings.weights) + (displayData.performanceScore || 0);
            
            const buffer = await generateStatsCard(targetUser, displayData, baseScore);
            const attachment = new AttachmentBuilder(buffer, { name: 'stats-card.png' });

            await interaction.editReply({ 
                content: `İşte <@${targetUser.id}> isimli yetkilinin gerçek zamanlı performans kartı:`, 
                files: [attachment] 
            });

        } catch (error) {
            console.error('Stats Grafik Hatası:', error);
            await interaction.editReply({ content: 'Görsel istatistikler oluşturulurken bir hata meydana geldi.' });
        }
    }
};