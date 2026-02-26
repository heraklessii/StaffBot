import mongoose from 'mongoose';

// Gir-Çık (Fake Invite) hilesini engellemek için kimin kimi davet ettiğini tutan şema
const memberJoinSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    inviterId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
});

// Otomatik silinme (TTL Index) - 14 gün sonra kayıt otomatik silinir ki veritabanı şişmesin
memberJoinSchema.index({ joinedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 });

export default mongoose.model('MemberJoin', memberJoinSchema);