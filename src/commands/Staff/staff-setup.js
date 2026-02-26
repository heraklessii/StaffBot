import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import StaffSettings from '../../models/StaffSettings.js';
import SettingsCache from '../../utils/settingsCache.js';

export const generateSetupPanel = async (guildId) => {
    let settings = await StaffSettings.findOne({ guildId });
    if (!settings) {
        settings = await StaffSettings.create({ guildId });
        SettingsCache.update(guildId, settings);
    }

    const staffRolesText = settings.staffRoles.length > 0 ? settings.staffRoles.map(id => `<@&${id}>`).join(', ') : 'Ayarlanmadı';
    const logChannelText = settings.logChannel ? `<#${settings.logChannel}>` : 'Ayarlanmadı';
    const msgChannelsText = settings.allowedMessageChannels.length > 0 ? settings.allowedMessageChannels.map(id => `<#${id}>`).join(', ') : 'Tüm Kanallar Açık';

    const embed = new EmbedBuilder()
        .setTitle('⚙️ Yetkili Sistemi Kontrol Merkezi')
        .setDescription('Aşağıdaki menüleri ve butonları kullanarak sistemin tüm ayarlarını yapılandırabilirsiniz. Yaptığınız değişiklikler anında kaydedilir.')
        .setColor('#2b2d31')
        .addFields(
            { name: '📌 Temel Ayarlar', value: `**Yetkili Rolleri:** ${staffRolesText}\n**Log Kanalı:** ${logChannelText}\n**Sohbet (XP) Kanalları:** ${msgChannelsText}`, inline: false },
            { name: '⚖️ Puan Ağırlıkları', value: `💬 Mesaj: **${settings.weights.message} Puan**\n🎙️ Ses (Dk): **${settings.weights.voice} Puan**\n🔗 Davet: **${settings.weights.invite} Puan**`, inline: true },
            { name: '🎯 Görev Limitleri', value: `💬 Mesaj Hedefi: **${settings.tasks.messageTarget}** (+${settings.tasks.messageBonus} Puan)\n🎙️ Ses Hedefi: **${settings.tasks.voiceTarget} Dk** (+${settings.tasks.voiceBonus} Puan)`, inline: true },
            { name: '🛡️ Moderasyon (İcraat)', value: `🔨 Ban: **+${settings.modWeights.ban} Puan**\n👢 Kick: **+${settings.modWeights.kick} Puan**\n🔇 Susturma: **+${settings.modWeights.timeout} Puan**`, inline: true },
            { name: '⚠️ Ceza ve Toplantı', value: `📅 Pasiflik Cezası: **-${settings.inactivityPenalty} Puan**\n✅ Toplantı Bonusu: **+${settings.meetingBonus} Puan**\n❌ Toplantı Cezası: **-${settings.meetingPenalty} Puan**`, inline: true }
        );

    const roleRow = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder().setCustomId('setup_roles').setPlaceholder('Yetkili Rollerini Seçin (Çoklu)').setMinValues(1).setMaxValues(10)
    );

    const logChannelRow = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder().setCustomId('setup_log').setPlaceholder('Haftalık Rapor ve Log Kanalını Seçin').setChannelTypes([ChannelType.GuildText]).setMaxValues(1)
    );

    // YENİ: XP Kazanılacak Kanalları Seçme Menüsü
    const msgChannelRow = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder().setCustomId('setup_msg_channels').setPlaceholder('Sadece XP Kazanılacak Kanalları Seçin (Boş=Hepsi)').setChannelTypes([ChannelType.GuildText]).setMinValues(0).setMaxValues(10)
    );

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('setup_btn_points').setLabel('Puanları Ayarla').setStyle(ButtonStyle.Primary).setEmoji('⚖️'),
        new ButtonBuilder().setCustomId('setup_btn_tasks').setLabel('Görevleri Ayarla').setStyle(ButtonStyle.Success).setEmoji('🎯'),
        new ButtonBuilder().setCustomId('setup_btn_mod').setLabel('Mod/Ceza Ayarla').setStyle(ButtonStyle.Danger).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('setup_btn_extra').setLabel('Ekstralar').setStyle(ButtonStyle.Secondary).setEmoji('⚙️')
    );

    return { embeds: [embed], components: [roleRow, logChannelRow, msgChannelRow, buttonRow] };
};

export default {
    data: new SlashCommandBuilder()
        .setName('staff-setup')
        .setDescription('Sistemin tüm ayarlarını interaktif bir kontrol paneli üzerinden yapılandırır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const panelData = await generateSetupPanel(interaction.guild.id);
        await interaction.reply({ ...panelData, ephemeral: true });
    }
};