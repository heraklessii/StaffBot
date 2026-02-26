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

// Milisaniye (ms) cinsinden gelen süreyi okunabilir "Saat, Dakika, Saniye" formatına çevirir.
export const formatVoiceTime = (ms) => {
    if (!ms || ms < 1000) return '0 Sn';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return minutes > 0 ? `${hours} Sa ${minutes} Dk` : `${hours} Saat`;
    } else if (minutes > 0) {
        return seconds > 0 ? `${minutes} Dk ${seconds} Sn` : `${minutes} Dk`;
    } else {
        return `${seconds} Sn`;
    }
};