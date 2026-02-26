import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import Staff from '../../models/Staff.js';
import SettingsCache from '../../utils/settingsCache.js';
import { calculatePerformance } from '../../utils/staffCalculator.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-export')
        .setDescription('Tüm yetkili verilerini Excel/CSV formatında indirir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guild.id;
        try {
            const allStaff = await Staff.find({ guildId }).lean();
            if (allStaff.length === 0) {
                return interaction.editReply({ content: 'Dışa aktarılacak veri bulunamadı.' });
            }

            const settings = SettingsCache.get(guildId) || { weights: { message: 1, voice: 0.1, invite: 15 } };
            
            // Başlıklara "Geçen Hafta" ve "Zirve Seviye" eklendi
            let csvContent = "Kullanici_ID,Kullanici_Adi,Seviye,Zirve_Seviye,Puan,Toplam_Mesaj,Gunluk_Mesaj,Haftalik_Mesaj,Gecen_Hafta_Mesaj,Toplam_Ses_Dk,Gunluk_Ses_Dk,Haftalik_Ses_Dk,Gecen_Hafta_Ses_Dk,Davet,Ceza_Puani,Tamamlanan_Gorev,Mod_Islemi,Izinde_Mi\n";

            const msToMin = (ms) => Math.floor(ms / (1000 * 60));

            for (const s of allStaff) {
                const user = await interaction.client.users.fetch(s.userId).catch(() => null);
                const username = user ? user.username : "Bilinmeyen";
                const score = calculatePerformance(s, settings.weights) + (s.performanceScore || 0);

                // Arşiv verilerini (s.lastWeekMessages vs) csv satırına dahil ettik
                csvContent += `${s.userId},${username},${s.level || 1},${s.highestLevelReached || 1},${score},${s.totalMessages},${s.dailyMessages},${s.weeklyMessages},${s.lastWeekMessages || 0},${msToMin(s.totalVoice)},${msToMin(s.dailyVoice)},${msToMin(s.weeklyVoice)},${msToMin(s.lastWeekVoice || 0)},${s.totalInvites},${s.penaltyPoints},${s.tasksCompleted},${s.totalModeration || 0},${s.isOnLeave ? 'Evet' : 'Hayir'}\n`;
            }

            const buffer = Buffer.from(csvContent, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: 'yetkili_raporu.csv' });

            await interaction.editReply({ content: '✅ Tüm yetkili verileri ve geçen hafta arşivleri dışa aktarıldı.', files: [attachment] });

        } catch (error) {
            console.error('Export Hatası:', error);
            await interaction.editReply({ content: 'Veriler dışa aktarılırken bir hata oluştu.' });
        }
    }
};