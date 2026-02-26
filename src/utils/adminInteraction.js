import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import Staff from '../models/Staff.js';
import StaffSettings from '../models/StaffSettings.js';
import SettingsCache from './settingsCache.js';
import { calculatePerformance } from './staffCalculator.js';
import { checkLevelAndTasks } from './taskSystem.js';
import { formatVoiceTime } from './timeFormatter.js';

// YARDIMCI FONKSİYON: Adminlerin yaptığı işlemleri log kanalına yazar
const sendAdminActionLog = (guild, settings, adminId, targetId, actionText, color) => {
    if (settings && settings.logChannel) {
        const logCh = guild.channels.cache.get(settings.logChannel);
        if (logCh) {
            const embed = new EmbedBuilder()
                .setTitle('🛠️ Yönetici İşlemi')
                .setColor(color)
                .setDescription(`**Yönetici:** <@${adminId}>\n**İşlem Yapılan Yetkili:** <@${targetId}>\n**İşlem:** ${actionText}`)
                .setTimestamp();
            logCh.send({ embeds: [embed] }).catch(() => null);
        }
    }
};

export const generateAdminPanel = async (guildId, member) => {
    let staffData = await Staff.findOne({ guildId, userId: member.id });
    if (!staffData) staffData = await Staff.create({ guildId, userId: member.id });

    const settings = SettingsCache.get(guildId) || await StaffSettings.findOne({ guildId });
    const currentScore = calculatePerformance(staffData, settings.weights) + (staffData.performanceScore || 0);

    const embed = new EmbedBuilder()
        .setTitle(`🛡️ Yetkili Yönetim Paneli: ${member.user.username}`)
        .setColor(staffData.isOnLeave ? '#F1C40F' : '#E74C3C') 
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setDescription('Bu panelden yetkilinin tüm verilerine doğrudan müdahale edebilirsiniz.')
        .addFields(
            { name: '📈 Genel Durum', value: `Seviye: **${staffData.level || 1}**\nToplam Puan: **${currentScore}**\nCeza Puanı: **${staffData.penaltyPoints || 0}**`, inline: true },
            { name: '📊 İstatistikler', value: `Mesaj: **${staffData.totalMessages}**\nSes: **${formatVoiceTime(staffData.totalVoice)}**\nDavet: **${staffData.totalInvites}**`, inline: true },
            { name: '⚖️ Operasyon', value: `Mod İşlemi: **${staffData.totalModeration || 0}**\nGörev: **${staffData.tasksCompleted}**\nİzinde Mi?: **${staffData.isOnLeave ? 'Evet 🏖️' : 'Hayır'}**`, inline: true }
        )
        .setFooter({ text: 'Değişiklikler anında veritabanına işlenir.' });

    const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`admin_addpt_${member.id}`).setLabel('Puan').setStyle(ButtonStyle.Success).setEmoji('➕'),
        new ButtonBuilder().setCustomId(`admin_rempt_${member.id}`).setLabel('Puan').setStyle(ButtonStyle.Danger).setEmoji('➖'),
        new ButtonBuilder().setCustomId(`admin_setlvl_${member.id}`).setLabel('Seviye').setStyle(ButtonStyle.Primary).setEmoji('⬆️'),
        new ButtonBuilder()
            .setCustomId(`admin_leave_${member.id}`)
            .setLabel(staffData.isOnLeave ? 'İzni İptal Et' : 'İzne Çıkar')
            .setStyle(staffData.isOnLeave ? ButtonStyle.Danger : ButtonStyle.Secondary)
            .setEmoji('🏖️')
    );

    const components = [btnRow];

    if (settings && settings.staffRoles && settings.staffRoles.length > 0) {
        const roleOptions = settings.staffRoles.map(roleId => {
            const role = member.guild.roles.cache.get(roleId);
            return {
                label: role ? role.name : 'Bilinmeyen Rol',
                value: roleId,
                default: member.roles.cache.has(roleId) 
            };
        }).filter(opt => opt.label !== 'Bilinmeyen Rol');

        if (roleOptions.length > 0) {
            const roleMenuRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`admin_roles_${member.id}`)
                    .setPlaceholder('Kullanıcının Yetki Rollerini Aç / Kapat')
                    .setMinValues(0) 
                    .setMaxValues(roleOptions.length)
                    .addOptions(roleOptions)
            );
            components.push(roleMenuRow);
        }
    }

    return { embeds: [embed], components };
};

export const handleAdminInteraction = async (interaction) => {
    const customId = interaction.customId;
    const guildId = interaction.guild.id;

    if (interaction.isStringSelectMenu() && customId.startsWith('admin_roles_')) {
        await interaction.deferUpdate();
        const targetId = customId.split('_')[2];
        const member = await interaction.guild.members.fetch(targetId).catch(() => null);
        if (!member) return;

        const settings = SettingsCache.get(guildId);
        const selectedRoles = interaction.values; 

        for (const roleId of settings.staffRoles) {
            const hasRole = member.roles.cache.has(roleId);
            const shouldHaveRole = selectedRoles.includes(roleId);
            try {
                if (!hasRole && shouldHaveRole) await member.roles.add(roleId);
                if (hasRole && !shouldHaveRole) await member.roles.remove(roleId);
            } catch (err) {
                console.error('Rol düzenleme hatası (Bot yetkisiz):', err);
            }
        }

        sendAdminActionLog(interaction.guild, settings, interaction.user.id, targetId, 'Rolleri güncellendi.', '#3498DB');

        const panelData = await generateAdminPanel(guildId, member);
        await interaction.editReply(panelData);
    }

    else if (interaction.isButton() && customId.startsWith('admin_')) {
        const parts = customId.split('_');
        const action = parts[1]; 
        const targetId = parts[2];

        if (action === 'leave') {
            await interaction.deferUpdate();
            const staffData = await Staff.findOne({ guildId, userId: targetId });
            const member = await interaction.guild.members.fetch(targetId).catch(() => null);
            if (!staffData || !member) return;

            staffData.isOnLeave = !staffData.isOnLeave;
            staffData.leaveEndDate = staffData.isOnLeave ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null; 
            
            await staffData.save();

            const settings = SettingsCache.get(guildId);
            sendAdminActionLog(interaction.guild, settings, interaction.user.id, targetId, staffData.isOnLeave ? 'Süresiz İzne Çıkarıldı 🏖️' : 'İzni İptal Edildi 🏢', '#F1C40F');

            const panelData = await generateAdminPanel(guildId, member);
            return interaction.editReply(panelData);
        }

        if (action === 'addpt') {
            const modal = new ModalBuilder().setCustomId(`modal_addpt_${targetId}`).setTitle('➕ Puan Ekle');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('amount').setLabel('Eklenecek Puan Miktarı').setStyle(TextInputStyle.Short).setRequired(true)));
            await interaction.showModal(modal);
        } 
        else if (action === 'rempt') {
            const modal = new ModalBuilder().setCustomId(`modal_rempt_${targetId}`).setTitle('➖ Puan Çıkar');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('amount').setLabel('Çıkarılacak Puan Miktarı').setStyle(TextInputStyle.Short).setRequired(true)));
            await interaction.showModal(modal);
        } 
        else if (action === 'setlvl') {
            const modal = new ModalBuilder().setCustomId(`modal_setlvl_${targetId}`).setTitle('⬆️ Seviye Ayarla');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('level').setLabel('Yeni Seviyeyi Girin (Örn: 5)').setStyle(TextInputStyle.Short).setRequired(true)));
            await interaction.showModal(modal);
        }
    }

    else if (interaction.isModalSubmit() && customId.startsWith('modal_')) {
        await interaction.deferUpdate();
        const parts = customId.split('_');
        const action = parts[1];
        const targetId = parts[2];

        let staffData = await Staff.findOne({ guildId, userId: targetId });
        const member = await interaction.guild.members.fetch(targetId).catch(() => null);
        if (!staffData || !member) return;

        const settings = SettingsCache.get(guildId) || await StaffSettings.findOne({ guildId });
        const inputValue = parseFloat(interaction.fields.getTextInputValue(interaction.fields.components[0].components[0].customId));
        
        if (isNaN(inputValue)) return;

        let logAction = '';
        let logColor = '#3498DB';

        if (action === 'addpt') {
            staffData.performanceScore += inputValue;
            logAction = `**${inputValue}** Puan Eklendi.`;
            logColor = '#2ECC71'; // Yeşil
        } 
        else if (action === 'rempt') {
            staffData.performanceScore -= inputValue;
            logAction = `**${inputValue}** Puan Silindi.`;
            logColor = '#E74C3C'; // Kırmızı
        } 
        else if (action === 'setlvl') {
            const targetLevel = Math.max(1, Math.floor(inputValue));
            const requiredTotalScore = (targetLevel - 1) * 500;
            const baseCalcScore = calculatePerformance(staffData, settings.weights);
            staffData.performanceScore = requiredTotalScore - baseCalcScore;
            logAction = `Seviyesi **${targetLevel}** Olarak Ayarlandı.`;
            logColor = '#9B59B6'; // Mor
        }

        await staffData.save();
        await checkLevelAndTasks(staffData, member);

        sendAdminActionLog(interaction.guild, settings, interaction.user.id, targetId, logAction, logColor);

        const panelData = await generateAdminPanel(guildId, member);
        await interaction.editReply(panelData);
    }
};