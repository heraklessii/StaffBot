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

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { generateAdminPanel } from '../../utils/adminInteraction.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-admin')
        .setDescription('Bir yetkilinin istatistiklerini, puanlarını, seviyesini ve rollerini yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('yetkili').setDescription('Yönetilecek yetkiliyi seçin.').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // Sadece admin görebilir
        
        const targetUser = interaction.options.getUser('yetkili');
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.editReply({ content: '⚠️ Bu kullanıcı sunucuda bulunamadı.' });
        }

        try {
            // Paneli oluştur ve gönder (Fonksiyon utils/adminInteraction.js içinde)
            const panelData = await generateAdminPanel(interaction.guild.id, member);
            await interaction.editReply(panelData);
        } catch (error) {
            console.error('Staff Admin Komut Hatası:', error);
            await interaction.editReply({ content: 'Yönetim paneli oluşturulurken bir hata meydana geldi.' });
        }
    }
};