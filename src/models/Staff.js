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

import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    totalMessages: { type: Number, default: 0 },
    totalVoice: { type: Number, default: 0 }, 
    totalInvites: { type: Number, default: 0 },
    dailyMessages: { type: Number, default: 0 },
    weeklyMessages: { type: Number, default: 0 },
    monthlyMessages: { type: Number, default: 0 }, // YENİ: Aylık Mesaj
    dailyVoice: { type: Number, default: 0 },
    weeklyVoice: { type: Number, default: 0 },
    monthlyVoice: { type: Number, default: 0 }, // YENİ: Aylık Ses
    penaltyPoints: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 }, 
    level: { type: Number, default: 1 },
    dailyMessageBonusClaimed: { type: Boolean, default: false },
    dailyVoiceBonusClaimed: { type: Boolean, default: false },
    isOnLeave: { type: Boolean, default: false },
    leaveEndDate: { type: Date, default: null },
    totalModeration: { type: Number, default: 0 },
    lastWeekMessages: { type: Number, default: 0 },
    lastWeekVoice: { type: Number, default: 0 },
    lastMonthMessages: { type: Number, default: 0 }, // YENİ: Arşiv
    lastMonthVoice: { type: Number, default: 0 }, // YENİ: Arşiv
    highestLevelReached: { type: Number, default: 1 },
    spentCoins: { type: Number, default: 0 }
}, { timestamps: true });

staffSchema.index({ guildId: 1, userId: 1 }, { unique: true });
staffSchema.index({ guildId: 1, performanceScore: -1 });

export default mongoose.model('Staff', staffSchema);