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

export const Cache = {
    voiceJoins: new Map(), // Ses giriş sürelerini tutar
    spamGuard: new Map(),  // Mesaj spam kontrolü
    invites: new Map(),    // Davet cache
    leaderboard: new Map() // Pano cache
};

// Her 1 saatte bir SpamGuard önbelleğini temizler
setInterval(() => {
    Cache.spamGuard.clear();
    console.log('[SYSTEM] SpamGuard belleği temizlendi (Garbage Collection).');
}, 1000 * 60 * 60);

export const calculatePerformance = (staff, weights) => {
    const msgScore = staff.totalMessages * weights.message;
    const voiceMinutes = staff.totalVoice / (1000 * 60);
    const voiceScore = voiceMinutes * weights.voice;
    const inviteScore = staff.totalInvites * weights.invite;
    const penalty = staff.penaltyPoints;

    return Math.floor(msgScore + voiceScore + inviteScore - penalty);
};

export const createProgressBar = (current, max, length = 10) => {
    const progress = Math.min(Math.round((current / max) * length), length);
    const empty = length - progress;
    return '█'.repeat(progress) + '░'.repeat(empty);
};