import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../models/Staff.js';
import SettingsCache from '../../utils/settingsCache.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-toplanti')
        .setDescription('Belirtilen ses kanalında toplantı yoklaması alır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => option.setName('kanal').setDescription('Toplantının yapıldığı ses kanalı.').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        const channel = interaction.options.getChannel('kanal');

        if (!channel.isVoiceBased()) {
            return interaction.editReply({ content: '⚠️ Lütfen geçerli bir ses kanalı seçin.' });
        }

        try {
            const settings = SettingsCache.get(guildId) || { meetingBonus: 100, meetingPenalty: 50 };
            const allStaff = await Staff.find({ guildId });
            
            // Kanalda bulunan kişilerin ID listesi
            const attendees = new Set(channel.members.map(m => m.id));
            
            let attendedCount = 0;
            let missingCount = 0;
            let onLeaveCount = 0;

            for (const staff of allStaff) {
                if (attendees.has(staff.userId)) {
                    // Toplantıya Katıldı -> Bonus ver
                    await Staff.findByIdAndUpdate(staff._id, { $inc: { performanceScore: settings.meetingBonus } });
                    attendedCount++;
                } else {
                    // Toplantıya Katılmadı -> Eğer izinde DEĞİLSE ceza ver
                    if (staff.isOnLeave) {
                        onLeaveCount++;
                    } else {
                        await Staff.findByIdAndUpdate(staff._id, { $inc: { penaltyPoints: settings.meetingPenalty } });
                        missingCount++;
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('📅 Toplantı Yoklaması Tamamlandı!')
                .setColor('Blue')
                .setDescription(`**${channel.name}** kanalındaki yetkililer tarandı.`)
                .addFields(
                    { name: '✅ Katılanlar', value: `${attendedCount} Kişi (+${settings.meetingBonus} Puan)`, inline: true },
                    { name: '❌ Katılmayanlar', value: `${missingCount} Kişi (-${settings.meetingPenalty} Ceza Puanı)`, inline: true },
                    { name: '🏖️ İzinde Olanlar', value: `${onLeaveCount} Kişi (Muaf)`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Toplantı Yoklama Hatası:', error);
            await interaction.editReply({ content: 'Yoklama alınırken bir hata oluştu.' });
        }
    }
};