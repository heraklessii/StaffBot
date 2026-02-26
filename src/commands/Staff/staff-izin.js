import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import StaffSettings from '../../models/StaffSettings.js';
import SettingsCache from '../../utils/settingsCache.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-izin')
        .setDescription('Pasiflik cezasından muaf olmak için izin talebi oluşturur.')
        .addNumberOption(option => option.setName('sure_gun').setDescription('Kaç gün izin istiyorsunuz?').setRequired(true).setMinValue(1).setMaxValue(30))
        .addStringOption(option => option.setName('sebep').setDescription('İzin isteme sebebiniz nedir?').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const days = interaction.options.getNumber('sure_gun');
        const reason = interaction.options.getString('sebep');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        try {
            const settings = SettingsCache.get(guildId) || await StaffSettings.findOne({ guildId });
            
            // Eğer log kanalı ayarlanmamışsa izin sistemini kullanamazlar
            if (!settings || !settings.logChannel) {
                return interaction.editReply({ content: '⚠️ Sunucuda bir log kanalı ayarlanmadığı için izin talepleri şu an kapalıdır. Lütfen yöneticinize başvurun.' });
            }

            const logChannel = interaction.guild.channels.cache.get(settings.logChannel);
            if (!logChannel) return interaction.editReply({ content: '⚠️ Log kanalı bulunamadı.' });

            // Onay mekanizması için Embed
            const embed = new EmbedBuilder()
                .setTitle('🏖️ Yeni İzin Talebi')
                .setColor('#F1C40F')
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    { name: 'Yetkili', value: `<@${userId}>`, inline: true },
                    { name: 'Talep Edilen Süre', value: `**${days} Gün**`, inline: true },
                    { name: 'Sebep', value: reason, inline: false }
                )
                .setFooter({ text: 'Sadece yöneticiler onaylayabilir.' });

            const row = new ActionRowBuilder().addComponents(
                // Buton Custom ID formatı: leave_approve_USERID_DAYS
                new ButtonBuilder().setCustomId(`leave_approve_${userId}_${days}`).setLabel('Onayla').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId(`leave_reject_${userId}`).setLabel('Reddet').setStyle(ButtonStyle.Danger).setEmoji('❌')
            );

            await logChannel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: '✅ İzin talebiniz yöneticilere iletildi. Onaylandığında haberdar edileceksiniz.' });

        } catch (error) {
            console.error('İzin Talep Hatası:', error);
            await interaction.editReply({ content: 'Talebiniz oluşturulurken bir hata meydana geldi.' });
        }
    }
};