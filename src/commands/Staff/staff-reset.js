import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import Staff from '../../models/Staff.js';
import SettingsCache from '../../utils/settingsCache.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-reset')
        .setDescription('Bir yetkilinin veya TÜM SUNUCUNUN verilerini sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // Kullanıcı seçimi opsiyonel yapıldı (Boş bırakılırsa tüm sunucu sıfırlanır)
        .addUserOption(option => option.setName('kullanici').setDescription('Sıfırlanacak yetkili (Tüm sunucu için boş bırakın).').setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        const guildId = interaction.guild.id;
        const isServerWide = !targetUser;

        const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ Kritik İşlem Onayı')
            .setColor('#E74C3C')
            .setDescription(isServerWide 
                ? `**DİKKAT:** Sunucudaki **TÜM YETKİLİLERİN** istatistiklerini, puanlarını ve seviyelerini tamamen sıfırlamak üzeresiniz! Bu işlem geri alınamaz.\n\nEmin misiniz?`
                : `**DİKKAT:** <@${targetUser.id}> isimli kullanıcının tüm istatistiklerini, puanını ve seviyesini sıfırlamak üzeresiniz!\n\nEmin misiniz?`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_reset').setLabel('Evet, Sıfırla').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel_reset').setLabel('İptal Et').setStyle(ButtonStyle.Secondary)
        );

        const response = await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

        // Komutun kendi içindeki buton dinleyicisi (Sadece bu işlem için 30 saniye bekler)
        const collector = response.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 30000 });

        collector.on('collect', async i => {
            if (i.customId === 'cancel_reset') {
                await i.update({ content: '✅ Sıfırlama işlemi iptal edildi.', embeds: [], components: [] });
                return;
            }

            if (i.customId === 'confirm_reset') {
                await i.deferUpdate();
                try {
                    const resetData = {
                        totalMessages: 0, totalVoice: 0, totalInvites: 0,
                        dailyMessages: 0, weeklyMessages: 0, dailyVoice: 0, weeklyVoice: 0,
                        penaltyPoints: 0, tasksCompleted: 0, performanceScore: 0, level: 1,
                        lastWeekMessages: 0, lastWeekVoice: 0, spentCoins: 0, totalModeration: 0
                    };

                    if (isServerWide) {
                        await Staff.updateMany({ guildId }, { $set: resetData });
                    } else {
                        await Staff.findOneAndUpdate({ guildId, userId: targetUser.id }, { $set: resetData });
                    }

                    // Log Kanalına Bildir
                    const settings = SettingsCache.get(guildId);
                    if (settings && settings.logChannel) {
                        const logCh = interaction.guild.channels.cache.get(settings.logChannel);
                        if (logCh) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('🔄 Veri Sıfırlaması Gerçekleşti')
                                .setColor('#E67E22')
                                .setDescription(`**İşlemi Yapan Yönetici:** <@${interaction.user.id}>\n**Sıfırlanan Hedef:** ${isServerWide ? '**TÜM SUNUCU**' : `<@${targetUser.id}>`}`)
                                .setTimestamp();
                            logCh.send({ embeds: [logEmbed] }).catch(() => null);
                        }
                    }

                    await interaction.editReply({ content: `✅ Sıfırlama işlemi başarıyla tamamlandı. (${isServerWide ? 'Tüm Sunucu' : 'Tek Kullanıcı'})`, embeds: [], components: [] });

                } catch (error) {
                    console.error('Reset Hatası:', error);
                    await interaction.editReply({ content: 'Sıfırlama sırasında bir hata oluştu.', embeds: [], components: [] });
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: '⏳ İşlem zaman aşımına uğradı.', embeds: [], components: [] }).catch(() => null);
            }
        });
    }
};