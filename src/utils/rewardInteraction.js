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

import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder } from 'discord.js';
import StaffSettings from '../models/StaffSettings.js';
import SettingsCache from './settingsCache.js';
import { generateRewardsPanel } from '../commands/staff/staff-rewards.js';

export const handleRewardInteraction = async (interaction) => {
    const customId = interaction.customId;
    const guildId = interaction.guild.id;

    // 1. Ödül Ekleme Butonu -> Modal Açar
    if (interaction.isButton() && customId === 'reward_add') {
        const modal = new ModalBuilder().setCustomId('modal_reward_add').setTitle('🎁 Yeni Ödül Ekle');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('level').setLabel('Hangi Seviye İçin? (Sayı Girin)').setStyle(TextInputStyle.Short).setRequired(true)));
        await interaction.showModal(modal);
    }
    
    // 2. Ödül Silme Butonu -> Seçim Menüsü Açar
    else if (interaction.isButton() && customId === 'reward_remove') {
        const settings = SettingsCache.get(guildId);
        if (!settings || !settings.levelRoles || settings.levelRoles.size === 0) {
            return interaction.reply({ content: '⚠️ Silinecek bir ödül bulunmuyor.', ephemeral: true });
        }

        const options = Array.from(settings.levelRoles.keys()).map(level => ({
            label: `Seviye ${level} Ödülü`,
            value: level.toString(),
            emoji: '🗑️'
        }));

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('reward_del_select')
                .setPlaceholder('Silmek istediğiniz seviye ödülünü seçin')
                .addOptions(options)
        );

        await interaction.reply({ content: 'Lütfen silmek istediğiniz ödülü aşağıdan seçin:', components: [row], ephemeral: true });
    }

    // 3. Modal Gönderimi (Seviye Girildi) -> Rol Seçim Menüsü Açar
    else if (interaction.isModalSubmit() && customId === 'modal_reward_add') {
        const level = parseInt(interaction.fields.getTextInputValue('level'));
        if (isNaN(level) || level < 1) return interaction.reply({ content: '⚠️ Geçersiz bir seviye girdiniz.', ephemeral: true });

        const row = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId(`reward_role_select_${level}`)
                .setPlaceholder(`Seviye ${level} için verilecek rolü seçin`)
                .setMaxValues(1)
        );

        await interaction.reply({ content: `**Seviye ${level}** için verilecek rolü aşağıdan seçin:`, components: [row], ephemeral: true });
    }

    // 4. Rol Seçimi Yapıldı -> Veritabanına Kaydet ve Paneli Yenile
    else if (interaction.isRoleSelectMenu() && customId.startsWith('reward_role_select_')) {
        await interaction.deferUpdate();
        const level = customId.split('_')[3];
        const roleId = interaction.values[0];

        let settings = await StaffSettings.findOne({ guildId });
        settings.levelRoles.set(level, roleId);
        await settings.save();
        SettingsCache.update(guildId, settings);

        const panelData = await generateRewardsPanel(guildId);
        // Önceki rol seçme mesajını sil ve ana paneli güncelle
        await interaction.deleteReply().catch(() => null); 
        await interaction.message.reference ? null : await interaction.channel.send({ ...panelData, ephemeral: true }); // Eğer ana mesaj referansı kaybolursa diye fallback
    }

    // 5. Ödül Silme Menüsünden Seçim Yapıldı
    else if (interaction.isStringSelectMenu() && customId === 'reward_del_select') {
        await interaction.deferUpdate();
        const level = interaction.values[0];

        let settings = await StaffSettings.findOne({ guildId });
        settings.levelRoles.delete(level);
        await settings.save();
        SettingsCache.update(guildId, settings);

        await interaction.deleteReply().catch(() => null);
    }
};