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

import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { loadErrorHandler } from './handlers/errorHandler.js';
import { startVoiceAutoSave } from './utils/voiceAutoSave.js'; 

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration, 
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.GuildMember]
});

client.commands = new Collection();

const init = async () => {
    console.log('[SİSTEM] Modüller yükleniyor...');
    
    // 1. Anti-Crash Başlat
    loadErrorHandler(client);

    // 2. Dinamik Yükleyicileri Çalıştır
    await loadCommands(client);
    await loadEvents(client);

    // 3. Ses Yedekleme Döngüsünü Başlat
    startVoiceAutoSave();

    // 4. Veritabanı Olaylarını Dinle
    mongoose.connection.on('disconnected', () => {
        console.warn('[MONGO] Veritabanı bağlantısı koptu! Yeniden bağlanılmaya çalışılıyor...');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('[MONGO] Veritabanına tekrar başarıyla bağlanıldı.');
    });

    // 5. Veritabanına Bağlan ve Botu Ayağa Kaldır
    mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000 
    }).then(() => {
        console.log('[MONGO] Veritabanı bağlantısı başarılı.');
        client.login(process.env.DISCORD_TOKEN);
    }).catch(err => {
        console.error('[MONGO] Kritik Bağlantı Hatası:', err);
    });
};

init();