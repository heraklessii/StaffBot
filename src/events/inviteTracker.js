import { Events } from 'discord.js';
import Staff from '../models/Staff.js';
import StaffSettings from '../models/StaffSettings.js';
import MemberJoin from '../models/MemberJoin.js';

const invitesCache = new Map();

export default async (client) => {
    // YARDIMCI FONKSİYON: Bir sunucunun tüm davetlerini RAM'e (Cache) kaydeder
    const cacheGuildInvites = async (guild) => {
        try {
            const invites = await guild.invites.fetch();
            invitesCache.set(guild.id, new Map(invites.map((inv) => [inv.code, inv.uses])));
        } catch (err) {}
    };

    // 1. Bot açıldığında tüm sunucuların davetlerini senkronize et
    client.on(Events.ClientReady, async () => {
        // Promise.all ile tüm sunucuların verilerinin eksiksiz çekilmesini bekliyoruz
        await Promise.all(client.guilds.cache.map(guild => cacheGuildInvites(guild)));
        console.log('[SİSTEM] Davet takip önbelleği (Invite Cache) başarıyla yüklendi.');
    });

    // 2. Bot açıkken yeni bir sunucuya eklenirse onun da davetlerini hemen kaydet
    client.on(Events.GuildCreate, async (guild) => {
        await cacheGuildInvites(guild);
    });

    // 3. Yeni bir davet linki oluşturulduğunda
    client.on(Events.InviteCreate, invite => {
        if (!invitesCache.has(invite.guild.id)) invitesCache.set(invite.guild.id, new Map());
        invitesCache.get(invite.guild.id).set(invite.code, invite.uses);
    });

    // 4. Bir davet linki silindiğinde
    client.on(Events.InviteDelete, invite => {
        if (invitesCache.has(invite.guild.id)) invitesCache.get(invite.guild.id).delete(invite.code);
    });

    // 5. SUNUCUYA BİRİSİ KATILDIĞINDA
    client.on(Events.GuildMemberAdd, async (member) => {
        const guildId = member.guild.id;
        
        // Fake hesap koruması: 7 günden yeni hesapları sayma
        const accountAge = Date.now() - member.user.createdTimestamp;
        if (accountAge < 1000 * 60 * 60 * 24 * 7) return;

        try {
            // Davetleri çekemezse (Yetki alınmışsa vs) çökmeyi engellemek için catch eklendi
            const newInvites = await member.guild.invites.fetch().catch(() => null);
            if (!newInvites) return; 

            const oldInvites = invitesCache.get(guildId);
            
            // Eğer cache henüz oluşmadıysa (Bot yeni açılırken biri girdiyse),
            // yanlış kişiye puan vermemek için işlemi iptal edip cache'i doldururuz.
            if (!oldInvites) {
                invitesCache.set(guildId, new Map(newInvites.map((inv) => [inv.code, inv.uses])));
                return;
            }

            // Hangi davetin kullanım sayısı artmış onu buluyoruz
            const usedInvite = newInvites.find(inv => {
                const oldCount = oldInvites.get(inv.code) || 0;
                return oldCount < inv.uses;
            });
            
            if (usedInvite && usedInvite.inviter) {
                const inviterId = usedInvite.inviter.id;
                
                const settings = await StaffSettings.findOne({ guildId });
                if (!settings) return;

                // Gir-Çık hilesini engellemek için kimin davet ettiğini kaydet
                await MemberJoin.create({ guildId, userId: member.id, inviterId });

                // Yetkiliye puanını ver
                await Staff.findOneAndUpdate(
                    { guildId, userId: inviterId },
                    { $inc: { totalInvites: 1 } },
                    { upsert: true }
                );
            }
            
            // Gelecek katılımlar için RAM'i güncelle
            invitesCache.set(guildId, new Map(newInvites.map((inv) => [inv.code, inv.uses])));
            
        } catch (error) {
            console.error('Davet takip hatası:', error);
        }
    });

    // 6. SUNUCUDAN BİRİSİ ÇIKINCA (GİR-ÇIK HİLESİNİ ENGELLER)
    client.on(Events.GuildMemberRemove, async (member) => {
        const guildId = member.guild.id;

        try {
            // Çıkan kişinin verisini bul ve sil
            const joinData = await MemberJoin.findOneAndDelete({ guildId, userId: member.id });
            
            if (joinData) {
                // Eğer bu kişiyi bir yetkili davet ettiyse, yetkiliden 1 davet puanını geri al
                await Staff.findOneAndUpdate(
                    { guildId, userId: joinData.inviterId, totalInvites: { $gt: 0 } }, // Puanı 0'ın altına düşmesin diye kısıtlama
                    { $inc: { totalInvites: -1 } }
                );
            }
        } catch (error) {
            console.error('Davet silme (Leave) hatası:', error);
        }
    });
};