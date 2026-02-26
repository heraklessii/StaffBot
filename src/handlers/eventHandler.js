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