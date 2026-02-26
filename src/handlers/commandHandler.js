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