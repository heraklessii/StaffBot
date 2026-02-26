import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    totalMessages: { type: Number, default: 0 },
    totalVoice: { type: Number, default: 0 }, 
    totalInvites: { type: Number, default: 0 },
    dailyMessages: { type: Number, default: 0 },
    weeklyMessages: { type: Number, default: 0 },
    dailyVoice: { type: Number, default: 0 },
    weeklyVoice: { type: Number, default: 0 },
    penaltyPoints: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 }, 
    level: { type: Number, default: 1 },
    dailyMessageBonusClaimed: { type: Boolean, default: false },
    dailyVoiceBonusClaimed: { type: Boolean, default: false },
    isOnLeave: { type: Boolean, default: false },
    leaveEndDate: { type: Date, default: null },
    totalModeration: { type: Number, default: 0 },
    lastWeekMessages: { type: Number, default: 0 },
    lastWeekVoice: { type: Number, default: 0 },
    highestLevelReached: { type: Number, default: 1 },
    
    // Bakiyesi = (Toplam Puan) - (Harcanan Jetonlar) olarak hesaplanacak
    spentCoins: { type: Number, default: 0 }
    
}, { timestamps: true });

staffSchema.index({ guildId: 1, userId: 1 }, { unique: true });
staffSchema.index({ guildId: 1, performanceScore: -1 });

export default mongoose.model('Staff', staffSchema);