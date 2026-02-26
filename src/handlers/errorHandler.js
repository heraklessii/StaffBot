import { EmbedBuilder } from 'discord.js';

export const loadErrorHandler = (client) => {
    // Tüm hataları konsola (ve istenirse bir kanala) şık bir şekilde yazdıran merkez
    const handleAndLog = (error, type) => {
        console.log('\n================================================');
        console.log(`[ANTI-CRASH] 🛡️ Bir Hata Yakalandı! | Tip: ${type}`);
        console.log('================================================');
        console.error(error);
        console.log('================================================\n');

        // Opsiyonel: Eğer bot çökmek üzereyken sahibine veya bir log kanalına DM atmak isterseniz
        // const devChannel = client.channels.cache.get('GIZLI_DEV_KANAL_ID');
        // if (devChannel) devChannel.send(`**[Anti-Crash]** Yakalanan Hata: \`${type}\`\n\`\`\`js\n${error.stack || error}\n\`\`\``).catch(() => null);
    };

    // 1. Yakalanmayan Promise Hataları (En sık karşılaşılan çökme sebebi)
    process.on('unhandledRejection', (reason, promise) => {
        handleAndLog(reason, 'Unhandled Rejection');
    });

    // 2. Beklenmeyen İstisnalar (Kod mantığı hataları)
    process.on('uncaughtException', (err, origin) => {
        handleAndLog(err, 'Uncaught Exception');
    });

    // 3. Beklenmeyen İstisna Monitörü
    process.on('uncaughtExceptionMonitor', (err, origin) => {
        handleAndLog(err, 'Uncaught Exception Monitor');
    });

    // 4. Node.js Uyarıları
    process.on('warning', (warning) => {
        console.warn(`[NODE UYARISI] ⚠️ İsim: ${warning.name}\nMesaj: ${warning.message}`);
    });

    // 5. Discord.js İstemci (Client) Hataları (Örn: WebSocket kopmaları)
    client.on('error', (err) => {
        handleAndLog(err, 'Discord Client Error');
    });

    // 6. Discord.js Uyarıları (Örn: Rate limit yaklaşımı)
    client.on('warn', (info) => {
        console.log(`[DISCORD UYARISI] ⚠️ ${info}`);
    });

    console.log('[HANDLER] Anti-Crash (Error Handler) kalkanı aktif edildi.');
};