import { EmbedBuilder } from 'discord.js';
import Staff from '../models/Staff.js';
import SettingsCache from './settingsCache.js';
import { calculatePerformance } from './staffCalculator.js';

export const handleMarketInteraction = async (interaction) => {
    // StringSelectMenu üzerinden geldiği için value kontrol edilir
    const itemId = interaction.values[0];
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    await interaction.deferUpdate();

    try {
        const settings = SettingsCache.get(guildId);
        if (!settings || !settings.marketItems) return;

        const item = settings.marketItems.find(i => i.id === itemId);
        if (!item) {
            return interaction.followUp({ content: '⚠️ Bu ürün artık markette bulunmuyor.', ephemeral: true });
        }

        const staffData = await Staff.findOne({ guildId, userId });
        if (!staffData) return;

        const totalScore = calculatePerformance(staffData, settings.weights) + (staffData.performanceScore || 0);
        const balance = Math.max(0, totalScore - (staffData.spentCoins || 0));

        // 1. Bakiye Kontrolü
        if (balance < item.price) {
            return interaction.followUp({ content: `❌ Yetersiz Bakiye! Bu ürün **${item.price.toLocaleString('tr-TR')} Jeton**. Sizin bakiyeniz: **${balance.toLocaleString('tr-TR')} Jeton**.`, ephemeral: true });
        }

        // 2. Bakiyeden Düş (XP/Level'i etkilemez, harcanan miktarı artırır)
        staffData.spentCoins += item.price;
        await staffData.save();

        let extraMessage = '';

        // 3. Otomatik Rol Teslimatı (Eğer üründe rol ayarlanmışsa)
        if (item.roleId) {
            const role = interaction.guild.roles.cache.get(item.roleId);
            if (role) {
                await interaction.member.roles.add(role).catch(() => null);
                extraMessage = `\n✅ **<@&${item.roleId}>** rolü hesabınıza tanımlandı!`;
            }
        }

        // 4. Log Kanalına (Adminlere) Bildirim At
        if (settings.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(settings.logChannel);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🛍️ Market Satın Alımı')
                    .setColor('#2ECC71')
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .addFields(
                        { name: 'Yetkili', value: `<@${userId}>`, inline: true },
                        { name: 'Satın Alınan Ürün', value: `**${item.name}**`, inline: true },
                        { name: 'Ödenen Miktar', value: `${item.price.toLocaleString('tr-TR')} Jeton`, inline: true }
                    )
                    .setFooter({ text: 'Manuel teslimat gerektiren bir ürünse lütfen yetkili ile iletişime geçin.' });
                
                await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
            }
        }

        // 5. Başarılı İşlem Bildirimi
        const successEmbed = new EmbedBuilder()
            .setTitle('🎉 Satın Alma Başarılı!')
            .setColor('Green')
            .setDescription(`**${item.name}** ürününü başarıyla satın aldınız.${extraMessage}\n\nKalan Bakiyeniz: **${(balance - item.price).toLocaleString('tr-TR')} Jeton**`);

        await interaction.editReply({ embeds: [successEmbed], components: [] });

    } catch (error) {
        console.error('Market Satın Alma Hatası:', error);
        await interaction.followUp({ content: 'Satın alma işlemi sırasında sistemsel bir hata oluştu.', ephemeral: true });
    }
};