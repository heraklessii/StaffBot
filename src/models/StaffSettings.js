import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    staffRoles: { type: [String], default: [] },
    logChannel: { type: String, default: null },
    allowedMessageChannels: { type: [String], default: [] },
    minMessageLength: { type: Number, default: 5 },
    voiceChannelBlacklist: { type: [String], default: [] },
    weights: {
        message: { type: Number, default: 1 },    
        voice: { type: Number, default: 0.1 },    
        invite: { type: Number, default: 15 }     
    },
    tasks: {
        messageTarget: { type: Number, default: 100 },
        messageBonus: { type: Number, default: 20 },
        voiceTarget: { type: Number, default: 60 }, 
        voiceBonus: { type: Number, default: 30 }
    },
    levelRoles: { type: Map, of: String, default: {} },
    inactivityPenalty: { type: Number, default: 0 },
    modWeights: {
        ban: { type: Number, default: 5 },
        kick: { type: Number, default: 3 },
        timeout: { type: Number, default: 2 }
    },
    meetingBonus: { type: Number, default: 100 },
    meetingPenalty: { type: Number, default: 50 },
    
    marketItems: {
        type: [{
            id: String,
            name: String,
            price: Number,
            description: String,
            roleId: { type: String, default: null }
        }],
        default: []
    }
});

export default mongoose.model('StaffSettings', settingsSchema);