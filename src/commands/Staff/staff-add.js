import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../models/Staff.js';
import SettingsCache from '../../utils/settingsCache.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-add')
        .setDescription('Bir kullanıcıyı yetkili sistemine manuel olarak dahil eder ve yetki rolü verir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('kullanici').setDescription('Sisteme eklenecek kullanıcı.').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('kullanici');
        const guildId = interaction.guild.id;

        try {
            const existing = await Staff.findOne({ guildId, userId: targetUser.id });
            if (existing) {
                return interaction.editReply({ content: `⚠️ <@${targetUser.id}> zaten sistemde kayıtlı bir yetkili.` });
            }

            // 1. Veritabanına Ekle
            await Staff.create({ guildId, userId: targetUser.id });

            // 2. YENİ: Discord üzerinden Yetkili Rollerini Ver
            const settings = SettingsCache.get(guildId);
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            let rolesGiven = false;

            if (member && settings && settings.staffRoles.length > 0) {
                // Ayarlı olan tüm yetkili rollerini kullanıcıya ver
                await member.roles.add(settings.staffRoles).catch(err => {
                    console.error('Staff Add Rol Verme Hatası:', err);
                });
                rolesGiven = true;
            }

            const roleMsg = rolesGiven ? 've **yetkili rolleri** başarıyla verildi' : '(Ancak yetkili rolü ayarlanamadı)';

            const embed = new EmbedBuilder()
                .setTitle('✅ Yetkili Sisteme Eklendi')
                .setColor('#2ECC71')
                .setDescription(`<@${targetUser.id}> isimli kullanıcı sisteme kaydedildi ${roleMsg}. Artık istatistikleri takip edilecek.`);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Staff Add Hatası:', error);
            await interaction.editReply({ content: 'Yetkili eklenirken bir hata oluştu.' });
        }
    }
};