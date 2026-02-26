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

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Staff from '../../models/Staff.js';
import StaffSettings from '../../models/StaffSettings.js';
import { calculatePerformance } from '../../utils/staffCalculator.js';
import { formatVoiceTime } from '../../utils/timeFormatter.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-panel')
        .setDescription('Sunucunun yetkili performans panelini detaylı ve modern bir şekilde oluşturur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, isUpdate = false) {
        if (!isUpdate) await interaction.deferReply();

        try {
            const guildId = interaction.guild.id;
            const settings = await StaffSettings.findOne({ guildId }) || { weights: { message: 1, voice: 0.1, invite: 15 } };
            
            const allStaff = await Staff.find({ guildId }).lean();
            
            if (allStaff.length === 0) {
                const replyMethod = isUpdate ? interaction.editReply.bind(interaction) : interaction.editReply.bind(interaction);
                return replyMethod({ content: '⚠️ Henüz sisteme kayıtlı veya veri üretmiş bir yetkili bulunmuyor.', embeds: [], components: [] });
            }

            const rankedStaff = allStaff.map(s => {
                s.calculatedScore = calculatePerformance(s, settings.weights) + (s.performanceScore || 0);
                return s;
            }).sort((a, b) => b.calculatedScore - a.calculatedScore);

            const topOverall = rankedStaff[0];
            const topMessage = [...allStaff].sort((a, b) => b.weeklyMessages - a.weeklyMessages)[0];
            const topVoice = [...allStaff].sort((a, b) => b.weeklyVoice - a.weeklyVoice)[0];
            const topInviter = [...allStaff].sort((a, b) => b.totalInvites - a.totalInvites)[0];

            const totalTasksCompleted = allStaff.reduce((acc, curr) => acc + (curr.tasksCompleted || 0), 0);
            const totalStaffCount = allStaff.length;

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Sunucu Yetkili Yönetim Paneli')
                .setDescription('Aşağıdaki istatistikler, yetkili kadrosunun performansını gerçek zamanlı olarak yansıtmaktadır. Detaylı sıralamalar için butonları kullanın.\n\n━━━━━━━━━━━━━━━━━━━━━━')
                .setColor('#2b2d31')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
                .addFields(
                    { 
                        name: '👑 Genel Performans Lideri', 
                        value: topOverall && topOverall.calculatedScore > 0 
                            ? `> <@${topOverall.userId}> — **${topOverall.calculatedScore} Puan** (Lvl: ${topOverall.level || 1})` 
                            : '> Veri Yok', 
                        inline: false 
                    },
                    { 
                        name: '💬 Haftanın Mesaj Lideri', 
                        value: topMessage && topMessage.weeklyMessages > 0 
                            ? `> <@${topMessage.userId}> — **${topMessage.weeklyMessages.toLocaleString('tr-TR')}** Mesaj` 
                            : '> Veri Yok', 
                        inline: true 
                    },
                    { 
                        name: '🎙️ Haftanın Ses Lideri', 
                        // Daha okunaklı format
                        value: topVoice && topVoice.weeklyVoice > 0 
                            ? `> <@${topVoice.userId}> — **${formatVoiceTime(topVoice.weeklyVoice)}**` 
                            : '> Veri Yok', 
                        inline: true 
                    },
                    { 
                        name: '🔗 En Çok Davet Eden', 
                        value: topInviter && topInviter.totalInvites > 0 
                            ? `> <@${topInviter.userId}> — **${topInviter.totalInvites}** Davet` 
                            : '> Veri Yok', 
                        inline: false 
                    },
                    { 
                        name: '📊 Kadro Özeti', 
                        value: `Kayıtlı Yetkili: **${totalStaffCount}**\nTamamlanan Toplam Görev: **${totalTasksCompleted}**`, 
                        inline: false 
                    }
                )
                .setFooter({ text: 'Son Güncelleme', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('panel_daily_0').setLabel('Günlük Liderler').setStyle(ButtonStyle.Primary).setEmoji('📊'),
                new ButtonBuilder().setCustomId('panel_weekly_0').setLabel('Haftalık Liderler').setStyle(ButtonStyle.Success).setEmoji('📈'),
                new ButtonBuilder().setCustomId('panel_total_0').setLabel('Genel Sıralama').setStyle(ButtonStyle.Secondary).setEmoji('🌍')
            );

            if (isUpdate) {
                await interaction.editReply({ content: null, embeds: [embed], components: [row] });
            } else {
                await interaction.editReply({ embeds: [embed], components: [row] });
            }

        } catch (error) {
            console.error('Staff Panel Hatası:', error);
            if (!isUpdate) {
                await interaction.editReply({ content: 'Panel yüklenirken bir hata oluştu.' });
            }
        }
    }
};