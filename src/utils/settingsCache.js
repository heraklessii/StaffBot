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

import StaffSettings from '../models/StaffSettings.js';

// Veritabanı sorgularını sıfıra indirmek için ayarları RAM'de tutuyoruz.
class SettingsCache {
    constructor() {
        this.cache = new Map();
    }

    // Sunucu ayarlarını önbelleğe yükler
    async loadSettings(guildId) {
        let settings = await StaffSettings.findOne({ guildId });
        if (!settings) {
            // Eğer ayar yoksa varsayılan boş bir ayar oluştur
            settings = await StaffSettings.create({ guildId });
        }
        this.cache.set(guildId, settings);
        return settings;
    }

    // Önbellekten ayarları getirir (Veritabanını yormaz)
    get(guildId) {
        return this.cache.get(guildId);
    }

    // Ayarlar güncellendiğinde önbelleği de günceller
    update(guildId, newSettings) {
        this.cache.set(guildId, newSettings);
    }
}

export default new SettingsCache();