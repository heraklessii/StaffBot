import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadCommands = async (client) => {
    // Komutların bulunduğu ana klasör
    const commandsPath = path.join(__dirname, '../commands');
    client.commandArray = [];

    // Klasörleri ve alt klasörleri iç içe okuyan (Recursive) fonksiyon
    const readCommands = async (dir) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                await readCommands(filePath); // Alt klasörse içine gir
            } else if (file.endsWith('.js')) {
                // Windows dosya yollarında ESM import hatası almamak için URL'ye çeviriyoruz
                const fileUrl = pathToFileURL(filePath).href;
                const { default: command } = await import(fileUrl);
                
                if (command && 'data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    client.commandArray.push(command.data.toJSON());
                } else {
                    console.log(`[UYARI] ${file} dosyasında 'data' veya 'execute' eksik.`);
                }
            }
        }
    };

    await readCommands(commandsPath);
    console.log(`[HANDLER] ${client.commands.size} adet Slash Komutu başarıyla yüklendi.`);
};