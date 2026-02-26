import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { generateAdminPanel } from '../../utils/adminInteraction.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-admin')
        .setDescription('Bir yetkilinin istatistiklerini, puanlarını, seviyesini ve rollerini yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('yetkili').setDescription('Yönetilecek yetkiliyi seçin.').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // Sadece admin görebilir
        
        const targetUser = interaction.options.getUser('yetkili');
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.editReply({ content: '⚠️ Bu kullanıcı sunucuda bulunamadı.' });
        }

        try {
            // Paneli oluştur ve gönder (Fonksiyon utils/adminInteraction.js içinde)
            const panelData = await generateAdminPanel(interaction.guild.id, member);
            await interaction.editReply(panelData);
        } catch (error) {
            console.error('Staff Admin Komut Hatası:', error);
            await interaction.editReply({ content: 'Yönetim paneli oluşturulurken bir hata meydana geldi.' });
        }
    }
};