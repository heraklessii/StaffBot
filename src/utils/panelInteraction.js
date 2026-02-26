import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Staff from '../models/Staff.js';
import SettingsCache from './settingsCache.js';
import { calculatePerformance } from './staffCalculator.js';
import { formatVoiceTime } from './timeFormatter.js'; // YENİ

export const handlePanelButton = async (interaction) => {
    await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    const [action, type, pageStr] = interaction.customId.split('_'); 
    let page = parseInt(pageStr) || 0;
    const itemsPerPage = 10;

    try {
        if (type === 'main') {
            const cmd = interaction.client.commands.get('staff-panel');
            if (cmd) return cmd.execute(interaction, true);
            return;
        }

        const settings = SettingsCache.get(guildId) || { weights: { message: 1, voice: 0.1, invite: 15 } };
        const allStaff = await Staff.find({ guildId }).lean(); 

        if (allStaff.length === 0) {
            return interaction.followUp({ content: 'Henüz sisteme kayıtlı bir yetkili bulunmuyor.', ephemeral: true });
        }

        let sortedStaff = [];
        let title = '📊 Liderlik Tablosu'; 
        let color = '#2b2d31'; 

        if (type === 'daily') {
            title = '📊 Günlük Liderlik Tablosu'; color = '#3498db';
            sortedStaff = allStaff.sort((a, b) => b.dailyMessages - a.dailyMessages || b.dailyVoice - a.dailyVoice);
        } else if (type === 'weekly') {
            title = '📈 Haftalık Liderlik Tablosu'; color = '#2ecc71';
            sortedStaff = allStaff.sort((a, b) => b.weeklyMessages - a.weeklyMessages || b.weeklyVoice - a.weeklyVoice);
        } else if (type === 'total') {
            title = '🌍 Genel Performans Liderleri'; color = '#9b59b6';
            sortedStaff = allStaff.map(s => { s.calculatedScore = calculatePerformance(s, settings.weights) + (s.performanceScore || 0); return s; })
                                  .sort((a, b) => b.calculatedScore - a.calculatedScore);
        }

        const maxPages = Math.ceil(sortedStaff.length / itemsPerPage) || 1;
        if (page < 0) page = 0;
        if (page >= maxPages) page = maxPages - 1;

        const currentSlice = sortedStaff.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

        let desc = currentSlice.map((s, i) => {
            const rank = (page * itemsPerPage) + i + 1;
            if (type === 'total') return `**${rank}.** <@${s.userId}> - 🏆 **${Math.floor(s.calculatedScore)} Puan** (Lvl: ${s.level || 1})`;
            const msgs = type === 'daily' ? s.dailyMessages : s.weeklyMessages;
            const voice = type === 'daily' ? s.dailyVoice : s.weeklyVoice;
            
            // YENİ: Ses formatı değiştirildi
            return `**${rank}.** <@${s.userId}> - 💬 ${msgs} Msj | 🎙️ ${formatVoiceTime(voice)}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .setDescription(desc || 'Veri yok.')
            .setFooter({ text: `Sayfa ${page + 1} / ${maxPages} | Toplam Yetkili: ${sortedStaff.length}` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`panel_${type}_${page - 1}`).setLabel('◀ Geri').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId(`panel_${type}_${page + 1}`).setLabel('İleri ▶').setStyle(ButtonStyle.Secondary).setDisabled(page === maxPages - 1),
            new ButtonBuilder().setCustomId(`panel_main_0`).setLabel('Ana Menü').setStyle(ButtonStyle.Danger) 
        );

        await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
        console.error('Panel Sayfalama Hatası:', error);
    }
};