import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import StaffSettings from '../../models/StaffSettings.js';
import SettingsCache from '../../utils/settingsCache.js';

export const generateRewardsPanel = async (guildId) => {
    let settings = await StaffSettings.findOne({ guildId });
    if (!settings) settings = await StaffSettings.create({ guildId });

    const embed = new EmbedBuilder()
        .setTitle('🎁 Seviye Ödülleri Yönetim Paneli')
        .setDescription('Yetkililer belirli bir seviyeye ulaştıklarında sistemin onlara otomatik olarak vereceği rolleri buradan ayarlayabilirsiniz.')
        .setColor('#9B59B6');

    if (settings.levelRoles && settings.levelRoles.size > 0) {
        let desc = '';
        for (const [level, roleId] of settings.levelRoles.entries()) {
            desc += `**Seviye ${level}** ➔ <@&${roleId}>\n`;
        }
        embed.addFields({ name: 'Mevcut Ödüller', value: desc });
    } else {
        embed.addFields({ name: 'Mevcut Ödüller', value: 'Şu an ayarlanmış hiçbir seviye ödülü bulunmuyor.' });
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('reward_add').setLabel('Yeni Ödül Ekle').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId('reward_remove').setLabel('Ödül Sil').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
    );

    return { embeds: [embed], components: [row] };
};

export default {
    data: new SlashCommandBuilder()
        .setName('staff-rewards')
        .setDescription('Seviye ödüllerini (otomatik rol) interaktif bir panel üzerinden yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const panelData = await generateRewardsPanel(interaction.guild.id);
        await interaction.reply({ ...panelData, ephemeral: true });
    }
};