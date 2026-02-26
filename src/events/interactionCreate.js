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

import { Events } from 'discord.js';
import { handlePanelButton } from '../utils/panelInteraction.js';
import { handleLeaveButton } from '../utils/leaveInteraction.js'; 
import { handleSetupInteraction } from '../utils/setupInteraction.js'; 
import { handleAdminInteraction } from '../utils/adminInteraction.js'; 
import { handleMarketInteraction } from '../utils/marketInteraction.js';
import { handleRewardInteraction } from '../utils/rewardInteraction.js';
import { handleMarketAdminInteraction } from '../utils/marketAdminInteraction.js';

export default async (client) => {
    client.on(Events.InteractionCreate, async interaction => {
        try {
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;
                await command.execute(interaction);
            } 
            
            else if (interaction.isButton()) {
                if (interaction.customId.startsWith('panel_')) {
                    await handlePanelButton(interaction); 
                } else if (interaction.customId.startsWith('leave_')) {
                    await handleLeaveButton(interaction); 
                } else if (interaction.customId.startsWith('setup_btn_')) {
                    await handleSetupInteraction(interaction); 
                } else if (interaction.customId.startsWith('admin_')) {
                    await handleAdminInteraction(interaction); 
                } else if (interaction.customId.startsWith('reward_')) {
                    await handleRewardInteraction(interaction);
                } else if (interaction.customId.startsWith('market_admin_')) {
                    await handleMarketAdminInteraction(interaction);
                }
            } 
            
            else if (interaction.isStringSelectMenu()) { 
                if (interaction.customId.startsWith('setup_')) {
                    await handleSetupInteraction(interaction); 
                } else if (interaction.customId.startsWith('admin_roles_')) {
                    await handleAdminInteraction(interaction); 
                } else if (interaction.customId === 'market_buy') {
                    await handleMarketInteraction(interaction);
                } else if (interaction.customId === 'reward_del_select') {
                    await handleRewardInteraction(interaction);
                } else if (interaction.customId === 'market_admin_del_select') {
                    await handleMarketAdminInteraction(interaction);
                }
            }

            else if (interaction.isRoleSelectMenu() || interaction.isChannelSelectMenu()) {
                 if (interaction.customId.startsWith('setup_')) {
                    await handleSetupInteraction(interaction); 
                } else if (interaction.customId.startsWith('reward_role_select_')) {
                    await handleRewardInteraction(interaction);
                } else if (interaction.customId.startsWith('market_admin_role_')) {
                    await handleMarketAdminInteraction(interaction);
                }
            }
            
            else if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('modal_admin_') || interaction.customId.startsWith('modal_addpt_') || interaction.customId.startsWith('modal_rempt_') || interaction.customId.startsWith('modal_setlvl_')) {
                    await handleAdminInteraction(interaction); 
                } else if (interaction.customId.startsWith('modal_')) {
                    // setup, reward_add, market_add modallarını ayrıştır
                    if (interaction.customId === 'modal_reward_add') await handleRewardInteraction(interaction);
                    else if (interaction.customId === 'modal_market_add') await handleMarketAdminInteraction(interaction);
                    else await handleSetupInteraction(interaction); 
                }
            }
        } catch (error) {
            console.error('Genel Etkileşim Hatası:', error);
            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Bu işlemi gerçekleştirirken bir hata oluştu!', ephemeral: true }).catch(() => null);
            }
        }
    });
};