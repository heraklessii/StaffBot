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
import { generateAdminMarketPanel } from '../commands/staff/staff-admin-market.js';
import crypto from 'crypto';

export const handleMarketAdminInteraction = async (interaction) => {
    const customId = interaction.customId;
    const guildId = interaction.guild.id;

    // 1. Ürün Ekleme Butonu -> Modal
    if (interaction.isButton() && customId === 'market_admin_add') {
        const modal = new ModalBuilder().setCustomId('modal_market_add').setTitle('🛒 Yeni Ürün Ekle');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Ürün Adı').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('price').setLabel('Fiyatı (Jeton)').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('Açıklama').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        await interaction.showModal(modal);
    }
    
    // 2. Ürün Silme Butonu -> Seçim Menüsü
    else if (interaction.isButton() && customId === 'market_admin_remove') {
        const settings = SettingsCache.get(guildId);
        if (!settings || !settings.marketItems || settings.marketItems.length === 0) {
            return interaction.reply({ content: '⚠️ Silinecek bir ürün bulunmuyor.', ephemeral: true });
        }

        const options = settings.marketItems.map(item => ({
            label: `${item.name} (${item.price} Jeton)`,
            value: item.id,
            emoji: '🗑️'
        }));

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('market_admin_del_select').setPlaceholder('Silinecek ürünü seçin').addOptions(options)
        );

        await interaction.reply({ content: 'Lütfen silmek istediğiniz ürünü aşağıdan seçin:', components: [row], ephemeral: true });
    }

    // 3. Modal Gönderildi (Ürün Yaratıldı) -> Rol Seçimi Öner
    else if (interaction.isModalSubmit() && customId === 'modal_market_add') {
        const name = interaction.fields.getTextInputValue('name');
        const price = parseInt(interaction.fields.getTextInputValue('price'));
        const desc = interaction.fields.getTextInputValue('desc');

        if (isNaN(price)) return interaction.reply({ content: '⚠️ Fiyat geçerli bir sayı olmalıdır.', ephemeral: true });

        const itemId = crypto.randomUUID().split('-')[0];
        let settings = await StaffSettings.findOne({ guildId });
        
        settings.marketItems.push({ id: itemId, name, price, description: desc, roleId: null });
        await settings.save();
        SettingsCache.update(guildId, settings);

        // Ürün eklendi, opsiyonel otomatik rol atama sorusu:
        const row = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder().setCustomId(`market_admin_role_${itemId}`).setPlaceholder('Ürüne otomatik verilecek rolü seçin (Opsiyonel)').setMaxValues(1)
        );

        await interaction.reply({ content: `✅ **${name}** başarıyla markete eklendi.\nİsterseniz bu ürün satın alındığında kullanıcıya **otomatik olarak** verilecek bir Discord rolü bağlayabilirsiniz. İstemiyorsanız bu mesajı yoksayabilirsiniz.`, components: [row], ephemeral: true });
    }

    // 4. Otomatik Rol Seçildi
    else if (interaction.isRoleSelectMenu() && customId.startsWith('market_admin_role_')) {
        await interaction.deferUpdate();
        const itemId = customId.split('_')[3];
        const roleId = interaction.values[0];

        let settings = await StaffSettings.findOne({ guildId });
        const itemIndex = settings.marketItems.findIndex(i => i.id === itemId);
        
        if (itemIndex !== -1) {
            settings.marketItems[itemIndex].roleId = roleId;
            await settings.save();
            SettingsCache.update(guildId, settings);
        }

        await interaction.deleteReply().catch(() => null);
    }

    // 5. Ürün Silindi
    else if (interaction.isStringSelectMenu() && customId === 'market_admin_del_select') {
        await interaction.deferUpdate();
        const itemId = interaction.values[0];

        let settings = await StaffSettings.findOne({ guildId });
        settings.marketItems = settings.marketItems.filter(i => i.id !== itemId);
        await settings.save();
        SettingsCache.update(guildId, settings);

        await interaction.deleteReply().catch(() => null);
    }
};