import { Events } from 'discord.js';
import Staff from '../models/Staff.js';
import { Cache } from '../utils/staffCalculator.js';

// YENİ: Bir ses kanalı içindekilerle beraber silinirse, 
// o kanalda olanların süresini kaybetmemek için kurtarma eventi
export default async (client) => {
    client.on(Events.ChannelDelete, async (channel) => {
        if (!channel.isVoiceBased()) return;
        
        const now = Date.now();
        
        for (const [userId, data] of Cache.voiceJoins.entries()) {
            // Silinen kanal, bizim önbellekteki yetkilinin bulunduğu kanalsa
            if (data.channelId === channel.id) {
                const duration = now - data.joinTime;
                
                // Kaydı bellekten temizle
                Cache.voiceJoins.delete(userId);
                
                // Süreyi veritabanına yaz
                if (duration >= 5000) {
                    try {
                        await Staff.findOneAndUpdate(
                            { guildId: channel.guild.id, userId },
                            { $inc: { totalVoice: duration, dailyVoice: duration, weeklyVoice: duration } }
                        );
                        console.log(`[CHANNEL RECOVERY] Silinen ${channel.name} kanalındaki ${userId} ID'li yetkilinin süresi kurtarıldı.`);
                    } catch (error) {
                        console.error('Silinen kanal kurtarma hatası:', error);
                    }
                }
            }
        }
    });
};