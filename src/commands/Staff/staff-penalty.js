import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../../models/Staff.js';

export default {
    data: new SlashCommandBuilder()
        .setName('staff-penalty')
        .setDescription('Bir yetkiliye ceza puanı ekler veya siler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('kullanici').setDescription('İşlem yapılacak yetkili.').setRequired(true))
        .addStringOption(option => 
            option.setName('islem')
            .setDescription('Yapılacak işlem')
            .setRequired(true)
            .addChoices(
                { name: '➕ Ceza Puanı Ekle', value: 'add' },
                { name: '➖ Ceza Puanı Sil', value: 'remove' }
            ))
        .addNumberOption(option => option.setName('miktar').setDescription('Eklenecek/Silinecek puan miktarı.').setRequired(true).setMinValue(1))
        .addStringOption(option => option.setName('sebep').setDescription('Ceza sebebi (İsteğe bağlı).')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const targetUser = interaction.options.getUser('kullanici');
        const action = interaction.options.getString('islem');
        const amount = interaction.options.getNumber('miktar');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        const guildId = interaction.guild.id;

        try {
            const incrementValue = action === 'add' ? amount : -amount;

            // Veritabanında güncelle
            const updatedStaff = await Staff.findOneAndUpdate(
                { guildId, userId: targetUser.id },
                { $inc: { penaltyPoints: incrementValue } },
                { new: true, upsert: true } // Eğer yoksa oluşturur
            );

            // Ceza puanının 0'ın altına düşmesini engelle
            if (updatedStaff.penaltyPoints < 0) {
                updatedStaff.penaltyPoints = 0;
                await updatedStaff.save();
            }

            const embed = new EmbedBuilder()
                .setTitle(action === 'add' ? '⚠️ Ceza Puanı Eklendi' : '✅ Ceza Puanı Silindi')
                .setColor(action === 'add' ? 'Red' : 'Green')
                .addFields(
                    { name: 'Yetkili', value: `<@${targetUser.id}>`, inline: true },
                    { name: 'İşlem Miktarı', value: `${amount} Puan`, inline: true },
                    { name: 'Güncel Ceza Puanı', value: `${updatedStaff.penaltyPoints} Puan`, inline: true },
                    { name: 'Sebep', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Ceza Sistemi Hatası:', error);
            await interaction.editReply({ content: 'Ceza işlemi uygulanırken bir hata oluştu.' });
        }
    }
};