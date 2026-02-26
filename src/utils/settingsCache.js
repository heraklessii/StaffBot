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