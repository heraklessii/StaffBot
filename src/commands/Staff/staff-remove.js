import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../models/Staff.js';
import SettingsCache from '../../utils/settingsCache.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-remove')
        .setDescription('Bir kullanıcının tüm yetkili verilerini siler ve yetkili rollerini üzerinden alır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('kullanici').setDescription('Sistemden çıkarılacak kullanıcı.').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('kullanici');
        const guildId = interaction.guild.id;

        try {
            const result = await Staff.findOneAndDelete({ guildId, userId: targetUser.id });

            const settings = SettingsCache.get(guildId);
            let rolesRemoved = false;
            
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (member && settings && settings.staffRoles.length > 0) {
                const rolesToRemove = settings.staffRoles.filter(rId => member.roles.cache.has(rId));
                if (rolesToRemove.length > 0) {
                    await member.roles.remove(rolesToRemove).catch(() => null);
                    rolesRemoved = true;
                }
            }

            if (!result && !rolesRemoved) {
                return interaction.editReply({ content: `⚠️ <@${targetUser.id}> isimli kullanıcının sistemde kaydı veya yetkili rolü bulunamadı.` });
            }

            // Başarı Embed'i
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Yetkili Uzaklaştırıldı')
                .setColor('#E74C3C') // Kırmızı
                .setDescription(`<@${targetUser.id}> isimli kullanıcının **tüm istatistikleri** silindi ve **yetkili rolleri** üzerinden alındı.`);

            await interaction.editReply({ embeds: [embed] });

            // Log Kanalına Silme Bildirimi
            if (settings && settings.logChannel) {
                const logCh = interaction.guild.channels.cache.get(settings.logChannel);
                if (logCh) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🚨 Bir Yetkili Kadrodan Çıkarıldı')
                        .setColor('#E74C3C')
                        .setDescription(`**İşlemi Yapan:** <@${interaction.user.id}>\n**Kovulan Yetkili:** <@${targetUser.id}>`)
                        .setTimestamp();
                    logCh.send({ embeds: [logEmbed] }).catch(() => null);
                }
            }

        } catch (error) {
            console.error('Staff Remove Hatası:', error);
            await interaction.editReply({ content: 'Yetkili silinirken bir hata oluştu.' });
        }
    }
};