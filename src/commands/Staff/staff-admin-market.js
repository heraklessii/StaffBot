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

export const generateAdminMarketPanel = async (guildId) => {
    let settings = await StaffSettings.findOne({ guildId });
    if (!settings) settings = await StaffSettings.create({ guildId });

    const embed = new EmbedBuilder()
        .setTitle('🛒 Market Yönetim Paneli')
        .setDescription('Yetkililerin jetonlarıyla satın alabileceği ürünleri buradan ekleyebilir veya silebilirsiniz.')
        .setColor('#E67E22');

    if (settings.marketItems && settings.marketItems.length > 0) {
        settings.marketItems.forEach(item => {
            const roleText = item.roleId ? `\n🎁 **Oto-Rol:** <@&${item.roleId}>` : '';
            embed.addFields({
                name: `${item.name} — 💰 ${item.price} Jeton`,
                value: `> ${item.description}${roleText}\n🔑 ID: \`${item.id}\``,
                inline: false
            });
        });
    } else {
        embed.addFields({ name: 'Mevcut Ürünler', value: 'Şu an markette hiçbir ürün bulunmuyor.' });
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('market_admin_add').setLabel('Ürün Ekle').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId('market_admin_remove').setLabel('Ürün Sil').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
    );

    return { embeds: [embed], components: [row] };
};

export default {
    data: new SlashCommandBuilder()
        .setName('staff-admin-market')
        .setDescription('Yetkili marketini interaktif panel üzerinden yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const panelData = await generateAdminMarketPanel(interaction.guild.id);
        await interaction.reply({ ...panelData, ephemeral: true });
    }
};