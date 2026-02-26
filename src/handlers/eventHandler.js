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

export const loadEvents = async (client) => {
    const eventsPath = path.join(__dirname, '../events');
    const files = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    let eventCount = 0;
    
    for (const file of files) {
        const filePath = path.join(eventsPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        const { default: eventFunc } = await import(fileUrl);

        if (typeof eventFunc === 'function') {
            await eventFunc(client);
            eventCount++;
        } else {
            console.log(`[UYARI] ${file} geçerli bir olay (event) fonksiyonu dışa aktarmıyor.`);
        }
    }
    
    console.log(`[HANDLER] ${eventCount} adet Event (Olay) başarıyla yüklendi.`);
};