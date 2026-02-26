import { Events, REST, Routes } from 'discord.js';
import SettingsCache from '../utils/settingsCache.js';
import { Cache } from '../utils/staffCalculator.js';
import { startCronJobs } from '../utils/cronJobs.js';
import { checkMissedResets } from '../utils/resetManager.js'; 

// commandsArray parametresi kaldırıldı, client içerisinden dinamik alınacak
export default async (client) => {
    client.once(Events.ClientReady, async () => {
        console.log(`[BOT] ${client.user.tag} olarak giriş yapıldı!`);

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        try {
            // Handler'dan gelen veriyi burada Discord API'ye itiyoruz
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: client.commandArray });
            console.log('[REST] Slash komutları Discord API\'ye başarıyla yüklendi.');
        } catch (error) { console.error('Komut yükleme hatası:', error); }

        await checkMissedResets(client);
        startCronJobs(client);

        console.log('[SİSTEM] Sunucu ayarları ve ses verileri kurtarılıyor...');
        
        for (const [guildId, guild] of client.guilds.cache) {
            const settings = await SettingsCache.loadSettings(guildId);
            
            if (settings && settings.staffRoles.length > 0) {
                let recoveredCount = 0;
                const voiceChannels = guild.channels.cache.filter(c => c.isVoiceBased());
                
                for (const [channelId, channel] of voiceChannels) {
                    if (settings.voiceChannelBlacklist.includes(channelId) || channelId === guild.afkChannelId) continue;

                    for (const [memberId, member] of channel.members) {
                        if (member.user.bot) continue;
                        if (member.voice.selfDeaf || member.voice.serverDeaf) continue; 
                        
                        const isStaff = member.roles.cache.some(r => settings.staffRoles.includes(r.id));
                        if (isStaff) {
                            Cache.voiceJoins.set(memberId, { guildId, channelId: channel.id, joinTime: Date.now() });
                            recoveredCount++;
                        }
                    }
                }
                if(recoveredCount > 0) {
                    console.log(`[RECOVERY] ${guild.name} sunucusunda ${recoveredCount} yetkilinin ses süresi kurtarıldı.`);
                }
            }
        }
        console.log('[SİSTEM] Tüm sistemler aktif ve hazır.');
    });
};