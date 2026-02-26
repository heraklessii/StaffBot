import Staff from '../models/Staff.js';
import SettingsCache from './settingsCache.js';
import { calculatePerformance } from './staffCalculator.js';

// YARDIMCI FONKSİYON: Hiyerarşi hatalarını log kanalına bildirir
const sendRoleErrorLog = (member, settings, action) => {
    if (settings && settings.logChannel) {
        const logCh = member.guild.channels.cache.get(settings.logChannel);
        if (logCh) {
            logCh.send({ content: `⚠️ **Yetki Hiyerarşisi Hatası:** <@${member.id}> kullanıcısına seviye rolü **${action === 'add' ? 'verilemedi' : 'alınamadı'}**. Lütfen botun rolünün, işlem yapılmak istenen rolden daha YUKARIDA olduğundan emin olun!` }).catch(() => null);
        }
    }
};

export const checkLevelAndTasks = async (staffData, member) => {
    let requiresSave = false;
    const guildId = member.guild.id;
    
    const settings = SettingsCache.get(guildId) || { 
        weights: { message: 1, voice: 0.1, invite: 15 },
        tasks: { messageTarget: 100, messageBonus: 20, voiceTarget: 60, voiceBonus: 30 },
        levelRoles: new Map()
    };

    const voiceTargetMs = (settings.tasks.voiceTarget || 60) * 60 * 1000;

    // 1. DİNAMİK GÖREV KONTROLÜ
    if (!staffData.dailyMessageBonusClaimed && staffData.dailyMessages >= settings.tasks.messageTarget) {
        staffData.performanceScore += settings.tasks.messageBonus;
        staffData.tasksCompleted += 1;
        staffData.dailyMessageBonusClaimed = true;
        requiresSave = true;
    }

    if (!staffData.dailyVoiceBonusClaimed && staffData.dailyVoice >= voiceTargetMs) {
        staffData.performanceScore += settings.tasks.voiceBonus;
        staffData.tasksCompleted += 1;
        staffData.dailyVoiceBonusClaimed = true;
        requiresSave = true;
    }

    // 2. SEVİYE (LEVEL) KONTROLÜ
    const currentScore = calculatePerformance(staffData, settings.weights) + staffData.performanceScore;
    const oldLevel = staffData.level || 1;
    const calculatedLevel = Math.max(1, Math.floor(currentScore / 500) + 1);

    if (oldLevel !== calculatedLevel) {
        staffData.level = calculatedLevel;
        requiresSave = true;

        // RÜTBE DÜŞME (DEMOTION) KONTROLÜ
        if (calculatedLevel < oldLevel) {
            for (let l = calculatedLevel + 1; l <= oldLevel; l++) {
                if (settings.levelRoles && settings.levelRoles.has(l.toString())) {
                    const roleId = settings.levelRoles.get(l.toString());
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(roleId).catch((err) => {
                            console.error('Rol Alma Hatası:', err);
                            sendRoleErrorLog(member, settings, 'remove');
                        }); 
                    }
                }
            }
        } 
        // RÜTBE YÜKSELME (PROMOTION) KONTROLÜ
        else if (calculatedLevel > oldLevel) {
            if (settings.levelRoles && settings.levelRoles.has(calculatedLevel.toString())) {
                const roleId = settings.levelRoles.get(calculatedLevel.toString());
                if (!member.roles.cache.has(roleId)) {
                    await member.roles.add(roleId).catch((err) => {
                        console.error('Rol Verme Hatası:', err);
                        sendRoleErrorLog(member, settings, 'add');
                    });
                }
            }

            if (calculatedLevel > (staffData.highestLevelReached || 1)) {
                staffData.highestLevelReached = calculatedLevel;
                // Tebrik Logu
                if (settings.logChannel) {
                    const logCh = member.guild.channels.cache.get(settings.logChannel);
                    if (logCh) {
                        logCh.send({ content: `🎉 **Tebrikler!** <@${member.id}> üstün performansı sayesinde **Seviye ${calculatedLevel}** rütbesine ulaştı!` }).catch(() => null);
                    }
                }
            }
        }
    }

    if (requiresSave) {
        await Staff.updateOne({ _id: staffData._id }, {
            $set: { 
                tasksCompleted: staffData.tasksCompleted, 
                level: staffData.level,
                performanceScore: staffData.performanceScore,
                dailyMessageBonusClaimed: staffData.dailyMessageBonusClaimed,
                dailyVoiceBonusClaimed: staffData.dailyVoiceBonusClaimed,
                highestLevelReached: staffData.highestLevelReached
            }
        });
    }

    return staffData;
};