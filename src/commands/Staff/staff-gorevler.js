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

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Staff from '../../models/Staff.js';
import StaffSettings from '../../models/StaffSettings.js';
import { Cache } from '../../utils/staffCalculator.js';
import { formatVoiceTime } from '../../utils/timeFormatter.js';

// İlerleme çubuğu (Progress Bar) oluşturan yardımcı fonksiyon
const createProgressBar = (current, max, length = 15) => {
    const progress = Math.min(1, Math.max(0, current / max));
    const filledCount = Math.round(progress * length);
    const emptyCount = length - filledCount;
    
    const filled = '█'.repeat(filledCount);
    const empty = '░'.repeat(emptyCount);
    
    return `\`${filled}${empty}\``;
};

export default {
    data: new SlashCommandBuilder()
        .setName('staff-gorevler')
        .setDescription('Günlük görevlerinizin ilerleme durumunu ve ödüllerini gösterir.'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // Sadece kendisi görebilir

        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        try {
            const settings = await StaffSettings.findOne({ guildId });
            if (!settings) {
                return interaction.editReply({ content: '⚠️ Sunucuda yetkili sistemi ayarlanmamış.' });
            }

            let staffData = await Staff.findOne({ guildId, userId }).lean();
            if (!staffData) {
                // Eğer hiç veri üretmemişse, varsayılan 0 değerleriyle göster
                staffData = { dailyMessages: 0, dailyVoice: 0, dailyMessageBonusClaimed: false, dailyVoiceBonusClaimed: false };
            }

            // --- GERÇEK ZAMANLI SES SÜRESİ HESAPLAMA ---
            let activeVoiceTime = 0;
            if (Cache.voiceJoins.has(userId)) {
                activeVoiceTime = Date.now() - Cache.voiceJoins.get(userId).joinTime;
            }
            const currentVoiceMs = staffData.dailyVoice + activeVoiceTime;
            const targetVoiceMs = (settings.tasks.voiceTarget || 60) * 60 * 1000;

            const currentMsgs = staffData.dailyMessages;
            const targetMsgs = settings.tasks.messageTarget || 100;

            // --- İLERLEME YÜZDELERİ ---
            const msgPercent = Math.min(100, Math.floor((currentMsgs / targetMsgs) * 100));
            const voicePercent = Math.min(100, Math.floor((currentVoiceMs / targetVoiceMs) * 100));

            const embed = new EmbedBuilder()
                .setTitle('🎯 Günlük Yetkili Görevleri')
                .setColor('#3498DB')
                .setDescription('Günlük görevlerinizi tamamlayarak ekstra performans puanı kazanabilirsiniz. Görevler her gece 00:00\'da sıfırlanır.')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                
                // Mesaj Görevi Alanı
                .addFields({
                    name: '💬 Mesaj Görevi',
                    value: staffData.dailyMessageBonusClaimed 
                        ? `✅ **Tamamlandı!** (+${settings.tasks.messageBonus} Puan Alındı)\n${createProgressBar(1, 1)} %100` 
                        : `⏳ **Devam Ediyor** (Ödül: +${settings.tasks.messageBonus} Puan)\n${createProgressBar(currentMsgs, targetMsgs)} %${msgPercent}\n> İlerleme: **${currentMsgs} / ${targetMsgs}** Mesaj`,
                    inline: false
                })
                
                // Ses Görevi Alanı
                .addFields({
                    name: '🎙️ Ses Görevi',
                    value: staffData.dailyVoiceBonusClaimed 
                        ? `✅ **Tamamlandı!** (+${settings.tasks.voiceBonus} Puan Alındı)\n${createProgressBar(1, 1)} %100` 
                        : `⏳ **Devam Ediyor** (Ödül: +${settings.tasks.voiceBonus} Puan)\n${createProgressBar(currentVoiceMs, targetVoiceMs)} %${voicePercent}\n> İlerleme: **${formatVoiceTime(currentVoiceMs)} / ${formatVoiceTime(targetVoiceMs)}**`,
                    inline: false
                })
                .setFooter({ text: 'Seste aktif oldukça çubuk gerçek zamanlı dolar.' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Görevler Komutu Hatası:', error);
            await interaction.editReply({ content: 'Görevleriniz yüklenirken bir hata oluştu.' });
        }
    }
};