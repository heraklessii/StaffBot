import mongoose from 'mongoose';

// Bot kapalıyken kaçırılan sıfırlamaları tespit etmek için 
// sistemin zaman hafızasını tutan global şema
const systemStatusSchema = new mongoose.Schema({
    identifier: { type: String, default: 'main', unique: true },
    lastDailyResetStr: { type: String, default: '' },
    lastWeeklyResetStr: { type: String, default: '' }
});

export default mongoose.model('SystemStatus', systemStatusSchema);