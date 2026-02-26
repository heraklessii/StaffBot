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