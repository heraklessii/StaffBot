/*
 * StaffBot - Gelişmiş Discord Yetkili Takip Botu
 * Copyright (C) 2026 heraklessii
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { EmbedBuilder } from 'discord.js';
import Staff from '../models/Staff.js';
import StaffSettings from '../models/StaffSettings.js';
import SystemStatus from '../models/SystemStatus.js';
import SettingsCache from './settingsCache.js';
import { formatVoiceTime } from './timeFormatter.js';

// Türkiye saatine göre "YYYY-MM-DD" formatında bugünün tarihini alır
export const getTRDateStr = () => {
    const now = new Date(Date.now() + 3 * 60 * 60 * 1000); // UTC+3
    return now.toISOString().split('T')[0];
};

// Türkiye saatine göre "YYYY-WXX" formatında haftanın numarasını alır (Pazartesi başlangıçlı)
export const getTRWeekStr = () => {
    const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const target = new Date(now.valueOf());
    const dayNr = (now.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
    return `${target.getUTCFullYear()}-W${weekNum}`;
};

// YENİ: Ayın numarasını alır (Örn: 2026-03)
export const getTRMonthStr = () => {
    const now = new Date(Date.now() + 3 * 60 * 60 * 1000);
    return `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}`;
};

// 1. GÜNLÜK SIFIRLAMA İŞLEMİ (Çekirdek Fonksiyon)
export const executeDailyReset = async (client) => {
    console.log('[RESET] Günlük sıfırlama, izin kontrolü ve temizlik başlatıldı...');
    try {
        await Staff.updateMany({}, {
            $set: { dailyMessages: 0, dailyVoice: 0, dailyMessageBonusClaimed: false, dailyVoiceBonusClaimed: false }
        });

        const now = new Date();
        for (const [guildId, guild] of client.guilds.cache) {
            const settings = SettingsCache.get(guildId);
            if (!settings || settings.staffRoles.length === 0) continue;

            const allStaffInDb = await Staff.find({ guildId });
            for (const staffData of allStaffInDb) {
                try {
                    if (staffData.isOnLeave && staffData.leaveEndDate && staffData.leaveEndDate < now) {
                        staffData.isOnLeave = false;
                        staffData.leaveEndDate = null;
                        await staffData.save();
                    }
                    const member = await guild.members.fetch(staffData.userId).catch(() => null);
                    if (!member || !member.roles.cache.some(r => settings.staffRoles.includes(r.id))) {
                        await Staff.findByIdAndDelete(staffData._id);
                    }
                } catch (err) { }
            }
        }

        // İşlem bittiğinde hafızaya tarihi yaz
        await SystemStatus.findOneAndUpdate({ identifier: 'main' }, { lastDailyResetStr: getTRDateStr() }, { upsert: true });
        console.log('[RESET] Günlük sıfırlama başarıyla tamamlandı.');
    } catch (err) { console.error('Günlük sıfırlama hatası:', err); }
};

// 2. HAFTALIK SIFIRLAMA İŞLEMİ (Çekirdek Fonksiyon)
export const executeWeeklyReset = async (client) => {
    console.log('[RESET] Haftalık istatistikler raporlanıyor, arşivleniyor ve sıfırlanıyor...');
    try {
        const allSettings = await StaffSettings.find({});

        for (const settings of allSettings) {
            const guildId = settings.guildId;

            // Pasiflik Cezası Uygula
            if (settings.inactivityPenalty > 0) {
                await Staff.updateMany(
                    { guildId, weeklyMessages: 0, weeklyVoice: 0, isOnLeave: false },
                    { $inc: { penaltyPoints: settings.inactivityPenalty } }
                );
            }

            // Haftalık Raporu Log Kanalına At
            if (settings.logChannel) {
                const channel = client.channels.cache.get(settings.logChannel);
                if (channel) {
                    const topStaff = await Staff.find({ guildId }).sort({ weeklyMessages: -1, weeklyVoice: -1 }).limit(3).lean();

                    if (topStaff.length > 0) {
                        let desc = '';
                        const medals = ['🥇', '🥈', '🥉'];
                        topStaff.forEach((s, i) => {
                            // YENİ UYGULAMA
                            desc += `${medals[i]} <@${s.userId}>\n💬 ${s.weeklyMessages.toLocaleString('tr-TR')} Mesaj | 🎙️ ${formatVoiceTime(s.weeklyVoice)}\n\n`;
                        });
                        const embed = new EmbedBuilder()
                            .setTitle('🏆 Haftanın En İyi Yetkilileri')
                            .setColor('#FFD700')
                            .setDescription('Geçtiğimiz haftanın en çok efor sarf eden yetkililerini tebrik ederiz!\n\n' + desc)
                            .setFooter({ text: 'Veriler sıfırlanmıştır, yeni haftada başarılar!' });
                        await channel.send({ embeds: [embed] }).catch(() => null);
                    }
                }
            }
        }

        // Sıfırlamadan önce verileri lastWeek kısmına kopyala
        await Staff.updateMany({}, [
            {
                $set: {
                    lastWeekMessages: "$weeklyMessages",
                    lastWeekVoice: "$weeklyVoice",
                    weeklyMessages: 0,
                    weeklyVoice: 0
                }
            }
        ]);

        // İşlem bittiğinde hafızaya haftayı yaz
        await SystemStatus.findOneAndUpdate({ identifier: 'main' }, { lastWeeklyResetStr: getTRWeekStr() }, { upsert: true });
        console.log('[RESET] Haftalık işlemler ve arşivleme başarıyla tamamlandı.');

    } catch (err) { console.error('Haftalık sıfırlama hatası:', err); }
};

// 3. 🚀 YENİ: AYLIK SIFIRLAMA (Ayın Elemanı)
export const executeMonthlyReset = async (client) => {
    console.log('[RESET] Aylık istatistikler raporlanıyor, arşivleniyor ve sıfırlanıyor...');
    try {
        const allSettings = await StaffSettings.find({});

        for (const settings of allSettings) {
            const guildId = settings.guildId;
            
            if (settings.logChannel) {
                const channel = client.channels.cache.get(settings.logChannel);
                if (channel) {
                    const topStaff = await Staff.find({ guildId }).sort({ monthlyMessages: -1, monthlyVoice: -1 }).limit(1).lean();

                    if (topStaff.length > 0) {
                        const s = topStaff[0];
                        const embed = new EmbedBuilder()
                            .setTitle('🌟 AYIN YETKİLİSİ 🌟')
                            .setColor('#FFD700')
                            .setDescription(`Koca bir ay boyunca gösterdiği üstün gayret ve azimden dolayı <@${s.userId}> isimli yetkilimizi tebrik ediyoruz!\n\n**Aylık Performansı:**\n💬 **${s.monthlyMessages.toLocaleString('tr-TR')}** Mesaj\n🎙️ **${formatVoiceTime(s.monthlyVoice)}** Ses\n\nEkibimizin bir parçası olduğun için teşekkürler!`)
                            .setImage('https://i.imgur.com/L4Z8d6h.gif') // Havalı bir kutlama gifi
                            .setFooter({ text: 'Aylık veriler sıfırlanmıştır ve arşive kaldırılmıştır.' });
                        await channel.send({ embeds: [embed] }).catch(() => null);
                    }
                }
            }
        }

        // Verileri lastMonth'a taşı ve sıfırla
        await Staff.updateMany({}, [
            { $set: { 
                lastMonthMessages: "$monthlyMessages", 
                lastMonthVoice: "$monthlyVoice",
                monthlyMessages: 0, 
                monthlyVoice: 0 
            }}
        ]);

        await SystemStatus.findOneAndUpdate({ identifier: 'main' }, { lastMonthlyResetStr: getTRMonthStr() }, { upsert: true });
        console.log('[RESET] Aylık işlemler başarıyla tamamlandı.');
        
    } catch (err) { console.error('Aylık sıfırlama hatası:', err); }
};

// 4. TELAFİ SİSTEMİ (Bot açılırken çağrılır, kaçanları yakalar)
export const checkMissedResets = async (client) => {
    const status = await SystemStatus.findOne({ identifier: 'main' });
    const currentDayStr = getTRDateStr();
    const currentWeekStr = getTRWeekStr();
    const currentMonthStr = getTRMonthStr(); // YENİ

    if (!status) {
        await SystemStatus.create({ identifier: 'main', lastDailyResetStr: currentDayStr, lastWeeklyResetStr: currentWeekStr, lastMonthlyResetStr: currentMonthStr });
        return;
    }

    if (status.lastDailyResetStr !== currentDayStr) {
        await executeDailyReset(client);
    }

    if (status.lastWeeklyResetStr !== currentWeekStr) {
        await executeWeeklyReset(client);
    }
    
    // YENİ: Aylık Telafi
    if (status.lastMonthlyResetStr && status.lastMonthlyResetStr !== currentMonthStr) {
        console.warn(`[CATCH-UP] Bot kapalıyken AYLIK sıfırlama kaçırılmış! Telafi ediliyor...`);
        await executeMonthlyReset(client);
    }
};