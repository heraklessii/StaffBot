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

// Bot kapalıyken kaçırılan sıfırlamaları tespit etmek için 
// sistemin zaman hafızasını tutan global şema
const systemStatusSchema = new mongoose.Schema({
    identifier: { type: String, default: 'main', unique: true },
    lastDailyResetStr: { type: String, default: '' },
    lastWeeklyResetStr: { type: String, default: '' }
});

export default mongoose.model('SystemStatus', systemStatusSchema);