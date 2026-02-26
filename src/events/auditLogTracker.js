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

import { Events, AuditLogEvent } from 'discord.js';
import Staff from '../models/Staff.js';
import SettingsCache from '../utils/settingsCache.js';
import { checkLevelAndTasks } from '../utils/taskSystem.js';

export default async (client) => {
    client.on(Events.GuildAuditLogEntryCreate, async (auditLogEntry, guild) => {
        const { action, executorId, targetId, changes } = auditLogEntry;

        if (executorId === client.user.id) return;

        const settings = SettingsCache.get(guild.id);
        if (!settings || settings.staffRoles.length === 0) return;

        try {
            const executorData = await Staff.findOne({ guildId: guild.id, userId: executorId });
            if (!executorData) return;

            let earnedPoints = 0;

            if (action === AuditLogEvent.MemberBanAdd) {
                earnedPoints = settings.modWeights.ban || 5;
            } else if (action === AuditLogEvent.MemberKick) {
                earnedPoints = settings.modWeights.kick || 3;
            } else if (action === AuditLogEvent.MemberUpdate) {
                const timeoutChange = changes.find(c => c.key === 'communication_disabled_until');
                if (timeoutChange && timeoutChange.new) {
                    earnedPoints = settings.modWeights.timeout || 2;
                }
            }

            // Puan kazanıldıysa kaydet ve SEVİYE KONTROLÜ yap
            if (earnedPoints > 0) {
                const updatedStaff = await Staff.findByIdAndUpdate(executorData._id, {
                    $inc: { 
                        totalModeration: 1, 
                        performanceScore: earnedPoints 
                    }
                }, { new: true });

                // Yetkili ban attığında level atlayabiliyorsa atlat
                const member = await guild.members.fetch(executorId).catch(() => null);
                if (updatedStaff && member) {
                    await checkLevelAndTasks(updatedStaff, member);
                }
            }

        } catch (error) {
            console.error('Audit Log (Moderasyon) Takip Hatası:', error);
        }
    });
};