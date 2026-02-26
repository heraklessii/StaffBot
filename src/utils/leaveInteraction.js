import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../models/Staff.js';

export const handleLeaveButton = async (interaction) => {
    // Sadece adminler izin onaylayabilir
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '⚠️ İzin taleplerini sadece yöneticiler yönetebilir.', ephemeral: true });
    }

    const [action, type, targetUserId, daysStr] = interaction.customId.split('_'); // Örn: leave_approve_123456_7
    
    try {
        const staffData = await Staff.findOne({ guildId: interaction.guild.id, userId: targetUserId });
        
        if (!staffData) {
            return interaction.reply({ content: '⚠️ Bu yetkilinin sistemde kaydı bulunmuyor.', ephemeral: true });
        }

        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        
        if (type === 'approve') {
            const days = parseInt(daysStr);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days); // Şu anki tarihe gün ekle

            staffData.isOnLeave = true;
            staffData.leaveEndDate = endDate;
            await staffData.save();

            embed.setColor('Green')
                 .setTitle('🏖️ İzin Talebi Onaylandı')
                 .addFields({ name: 'İşlemi Yapan Yönetici', value: `<@${interaction.user.id}>`, inline: false })
                 .setFooter({ text: `İzin bitiş tarihi: ${endDate.toLocaleDateString('tr-TR')}` });

            await interaction.update({ embeds: [embed], components: [] }); // Butonları sil

            // Yetkiliye DM veya kanaldan bildirim at (Opsiyonel ama hoş olur)
            const user = await interaction.client.users.fetch(targetUserId).catch(() => null);
            if (user) user.send(`✅ **${interaction.guild.name}** sunucusundaki **${days} günlük** izin talebiniz onaylandı! İyi dinlenmeler.`).catch(() => null);

        } else if (type === 'reject') {
            embed.setColor('Red')
                 .setTitle('❌ İzin Talebi Reddedildi')
                 .addFields({ name: 'İşlemi Yapan Yönetici', value: `<@${interaction.user.id}>`, inline: false });

            await interaction.update({ embeds: [embed], components: [] });

            const user = await interaction.client.users.fetch(targetUserId).catch(() => null);
            if (user) user.send(`❌ **${interaction.guild.name}** sunucusundaki izin talebiniz yönetici tarafından reddedildi.`).catch(() => null);
        }

    } catch (error) {
        console.error('İzin Onay Hatası:', error);
        interaction.reply({ content: 'İşlem sırasında bir hata oluştu.', ephemeral: true });
    }
};