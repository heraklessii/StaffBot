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
import StaffSettings from '../../models/StaffSettings.js';
import SettingsCache from '../../utils/settingsCache.js';

export const generateRewardsPanel = async (guildId) => {
    let settings = await StaffSettings.findOne({ guildId });
    if (!settings) settings = await StaffSettings.create({ guildId });

    const embed = new EmbedBuilder()
        .setTitle('🎁 Seviye Ödülleri Yönetim Paneli')
        .setDescription('Yetkililer belirli bir seviyeye ulaştıklarında sistemin onlara otomatik olarak vereceği rolleri buradan ayarlayabilirsiniz.')
        .setColor('#9B59B6');

    if (settings.levelRoles && settings.levelRoles.size > 0) {
        let desc = '';
        for (const [level, roleId] of settings.levelRoles.entries()) {
            desc += `**Seviye ${level}** ➔ <@&${roleId}>\n`;
        }
        embed.addFields({ name: 'Mevcut Ödüller', value: desc });
    } else {
        embed.addFields({ name: 'Mevcut Ödüller', value: 'Şu an ayarlanmış hiçbir seviye ödülü bulunmuyor.' });
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('reward_add').setLabel('Yeni Ödül Ekle').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId('reward_remove').setLabel('Ödül Sil').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
    );

    return { embeds: [embed], components: [row] };
};

export default {
    data: new SlashCommandBuilder()
        .setName('staff-rewards')
        .setDescription('Seviye ödüllerini (otomatik rol) interaktif bir panel üzerinden yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const panelData = await generateRewardsPanel(interaction.guild.id);
        await interaction.reply({ ...panelData, ephemeral: true });
    }
};