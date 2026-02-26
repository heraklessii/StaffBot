import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import StaffSettings from '../../models/StaffSettings.js';
import SettingsCache from '../../utils/settingsCache.js';

export const generateAdminMarketPanel = async (guildId) => {
    let settings = await StaffSettings.findOne({ guildId });
    if (!settings) settings = await StaffSettings.create({ guildId });

    const embed = new EmbedBuilder()
        .setTitle('🛒 Market Yönetim Paneli')
        .setDescription('Yetkililerin jetonlarıyla satın alabileceği ürünleri buradan ekleyebilir veya silebilirsiniz.')
        .setColor('#E67E22');

    if (settings.marketItems && settings.marketItems.length > 0) {
        settings.marketItems.forEach(item => {
            const roleText = item.roleId ? `\n🎁 **Oto-Rol:** <@&${item.roleId}>` : '';
            embed.addFields({
                name: `${item.name} — 💰 ${item.price} Jeton`,
                value: `> ${item.description}${roleText}\n🔑 ID: \`${item.id}\``,
                inline: false
            });
        });
    } else {
        embed.addFields({ name: 'Mevcut Ürünler', value: 'Şu an markette hiçbir ürün bulunmuyor.' });
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('market_admin_add').setLabel('Ürün Ekle').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId('market_admin_remove').setLabel('Ürün Sil').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
    );

    return { embeds: [embed], components: [row] };
};

export default {
    data: new SlashCommandBuilder()
        .setName('staff-admin-market')
        .setDescription('Yetkili marketini interaktif panel üzerinden yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const panelData = await generateAdminMarketPanel(interaction.guild.id);
        await interaction.reply({ ...panelData, ephemeral: true });
    }
};