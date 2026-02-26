export const Cache = {
    voiceJoins: new Map(), // Ses giriş sürelerini tutar
    spamGuard: new Map(),  // Mesaj spam kontrolü
    invites: new Map(),    // Davet cache
    leaderboard: new Map() // Pano cache
};

// Her 1 saatte bir SpamGuard önbelleğini temizler
setInterval(() => {
    Cache.spamGuard.clear();
    console.log('[SYSTEM] SpamGuard belleği temizlendi (Garbage Collection).');
}, 1000 * 60 * 60);

export const calculatePerformance = (staff, weights) => {
    const msgScore = staff.totalMessages * weights.message;
    const voiceMinutes = staff.totalVoice / (1000 * 60);
    const voiceScore = voiceMinutes * weights.voice;
    const inviteScore = staff.totalInvites * weights.invite;
    const penalty = staff.penaltyPoints;

    return Math.floor(msgScore + voiceScore + inviteScore - penalty);
};

export const createProgressBar = (current, max, length = 10) => {
    const progress = Math.min(Math.round((current / max) * length), length);
    const empty = length - progress;
    return '█'.repeat(progress) + '░'.repeat(empty);
};