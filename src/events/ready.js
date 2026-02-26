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