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

import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import Staff from '../../models/Staff.js';
import SettingsCache from '../../utils/settingsCache.js';
import { calculatePerformance } from '../../utils/staffCalculator.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-market')
        .setDescription('Kazandığınız yetkili jetonlarıyla (kredilerle) marketten ödül satın alın!'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        try {
            const settings = SettingsCache.get(guildId);
            if (!settings || !settings.marketItems || settings.marketItems.length === 0) {
                return interaction.editReply({ content: '⚠️ Sunucuda henüz açık bir yetkili marketi bulunmuyor.' });
            }

            const staffData = await Staff.findOne({ guildId, userId });
            if (!staffData) {
                return interaction.editReply({ content: '⚠️ Sisteme kayıtlı bir yetkili veriniz bulunmuyor.' });
            }

            // Toplam XP aynı zamanda kazanılan Toplam Jeton'dur
            const totalScore = calculatePerformance(staffData, settings.weights) + (staffData.performanceScore || 0);
            
            // Harcanabilir bakiye = Toplam Kazanılan - Harcananlar
            const balance = Math.max(0, totalScore - (staffData.spentCoins || 0));

            const embed = new EmbedBuilder()
                .setTitle('🛒 Yetkili Ödül Marketi')
                .setColor('#F1C40F')
                .setDescription('Performansınızla kazandığınız jetonları harcayarak özel ödüller alabilirsiniz!\n*Not: Marketten alışveriş yapmak **Seviyenizi Düşürmez**, sadece jeton bakiyenizden eksilir.*')
                .addFields({ name: '💰 Bakiyeniz', value: `**${balance.toLocaleString('tr-TR')} Jeton**`, inline: false });

            const options = settings.marketItems.map(item => ({
                label: `${item.name} (${item.price} Jeton)`,
                description: item.description.length > 50 ? item.description.substring(0, 47) + '...' : item.description,
                value: item.id,
                emoji: '🎁'
            }));

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('market_buy')
                    .setPlaceholder('Satın almak istediğiniz ürünü seçin')
                    .addOptions(options)
            );

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Market Görüntüleme Hatası:', error);
            await interaction.editReply({ content: 'Market yüklenirken bir hata oluştu.' });
        }
    }
};