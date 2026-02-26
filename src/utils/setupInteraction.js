import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import StaffSettings from '../models/StaffSettings.js';
import SettingsCache from './settingsCache.js';
import { generateSetupPanel } from '../commands/staff/staff-setup.js';

export const handleSetupInteraction = async (interaction) => {
    const customId = interaction.customId;
    const guildId = interaction.guild.id;

    // ----- AÇILIR MENÜ (SELECT MENU) İŞLEMLERİ -----
    if (interaction.isAnySelectMenu()) {
        await interaction.deferUpdate();
        let settings = await StaffSettings.findOne({ guildId });

        if (customId === 'setup_roles') {
            settings.staffRoles = interaction.values; // Seçilen rol ID'leri
        } else if (customId === 'setup_log') {
            settings.logChannel = interaction.values[0]; // Seçilen kanal ID'si
        }
        else if (customId === 'setup_msg_channels') {
            // YENİ: Seçilen mesaj kanallarını kaydet
            settings.allowedMessageChannels = interaction.values;
        }

        await settings.save();
        SettingsCache.update(guildId, settings);

        // Paneli Güncelle
        const panelData = await generateSetupPanel(guildId);
        await interaction.editReply(panelData);
    }

    // ----- BUTON (MODAL AÇMA) İŞLEMLERİ -----
    else if (interaction.isButton()) {
        let settings = await StaffSettings.findOne({ guildId });

        if (customId === 'setup_btn_points') {
            const modal = new ModalBuilder().setCustomId('modal_points').setTitle('⚖️ Puan Ağırlıkları');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('msg').setLabel('1 Mesaj Kaç Puan?').setStyle(TextInputStyle.Short).setValue(settings.weights.message.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('voice').setLabel('1 Dakika Ses Kaç Puan?').setStyle(TextInputStyle.Short).setValue(settings.weights.voice.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('inv').setLabel('1 Davet Kaç Puan?').setStyle(TextInputStyle.Short).setValue(settings.weights.invite.toString()))
            );
            await interaction.showModal(modal);
        }
        else if (customId === 'setup_btn_tasks') {
            const modal = new ModalBuilder().setCustomId('modal_tasks').setTitle('🎯 Görev Ayarları');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('msg_target').setLabel('Günlük Mesaj Hedefi').setStyle(TextInputStyle.Short).setValue(settings.tasks.messageTarget.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('msg_bonus').setLabel('Mesaj Görevi Ödülü').setStyle(TextInputStyle.Short).setValue(settings.tasks.messageBonus.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('voice_target').setLabel('Günlük Ses Hedefi (Dk)').setStyle(TextInputStyle.Short).setValue(settings.tasks.voiceTarget.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('voice_bonus').setLabel('Ses Görevi Ödülü').setStyle(TextInputStyle.Short).setValue(settings.tasks.voiceBonus.toString()))
            );
            await interaction.showModal(modal);
        }
        else if (customId === 'setup_btn_mod') {
            const modal = new ModalBuilder().setCustomId('modal_mod').setTitle('🛡️ Moderasyon ve Ceza');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ban').setLabel('Ban İşlemi Puanı').setStyle(TextInputStyle.Short).setValue(settings.modWeights.ban.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kick').setLabel('Kick İşlemi Puanı').setStyle(TextInputStyle.Short).setValue(settings.modWeights.kick.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('timeout').setLabel('Susturma İşlemi Puanı').setStyle(TextInputStyle.Short).setValue(settings.modWeights.timeout.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('penalty').setLabel('Haftalık Pasiflik Cezası (0 = Kapalı)').setStyle(TextInputStyle.Short).setValue(settings.inactivityPenalty.toString()))
            );
            await interaction.showModal(modal);
        }
        else if (customId === 'setup_btn_extra') {
            const modal = new ModalBuilder().setCustomId('modal_extra').setTitle('⚙️ Ekstra Ayarlar');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('min_msg').setLabel('Minimum Mesaj Uzunluğu (Karakter)').setStyle(TextInputStyle.Short).setValue(settings.minMessageLength.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meet_bonus').setLabel('Toplantı Katılım Bonusu').setStyle(TextInputStyle.Short).setValue(settings.meetingBonus.toString())),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('meet_penalty').setLabel('Toplantıya Katılmama Cezası').setStyle(TextInputStyle.Short).setValue(settings.meetingPenalty.toString()))
            );
            await interaction.showModal(modal);
        }
    }

    // ----- MODAL GÖNDERME (KAYDETME) İŞLEMLERİ -----
    else if (interaction.isModalSubmit()) {
        await interaction.deferUpdate(); // Modalı kapat ve bekle
        let settings = await StaffSettings.findOne({ guildId });

        // Değerlerin doğru (Sayı) girildiğinden emin olmak için yardımcı fonksiyon
        const getNum = (id, fallback) => {
            const val = parseFloat(interaction.fields.getTextInputValue(id));
            return isNaN(val) ? fallback : val;
        };

        if (customId === 'modal_points') {
            settings.weights.message = getNum('msg', settings.weights.message);
            settings.weights.voice = getNum('voice', settings.weights.voice);
            settings.weights.invite = getNum('inv', settings.weights.invite);
        }
        else if (customId === 'modal_tasks') {
            settings.tasks.messageTarget = getNum('msg_target', settings.tasks.messageTarget);
            settings.tasks.messageBonus = getNum('msg_bonus', settings.tasks.messageBonus);
            settings.tasks.voiceTarget = getNum('voice_target', settings.tasks.voiceTarget);
            settings.tasks.voiceBonus = getNum('voice_bonus', settings.tasks.voiceBonus);
        }
        else if (customId === 'modal_mod') {
            settings.modWeights.ban = getNum('ban', settings.modWeights.ban);
            settings.modWeights.kick = getNum('kick', settings.modWeights.kick);
            settings.modWeights.timeout = getNum('timeout', settings.modWeights.timeout);
            settings.inactivityPenalty = getNum('penalty', settings.inactivityPenalty);
        }
        else if (customId === 'modal_extra') {
            settings.minMessageLength = getNum('min_msg', settings.minMessageLength);
            settings.meetingBonus = getNum('meet_bonus', settings.meetingBonus);
            settings.meetingPenalty = getNum('meet_penalty', settings.meetingPenalty);
        }

        await settings.save();
        SettingsCache.update(guildId, settings);

        // Paneli Güncelle
        const panelData = await generateSetupPanel(guildId);
        await interaction.editReply(panelData);
    }
};