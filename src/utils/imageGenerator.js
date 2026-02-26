import { createCanvas, loadImage } from '@napi-rs/canvas';
import { formatVoiceTime } from './timeFormatter.js'; // YENİ: Zaman biçimlendirici import edildi

const width = 850;
const height = 320;

const getLevelTheme = (level) => {
    if (level === 1) return { primary: '#FFFFFF', gradStart: '#CCCCCC', gradEnd: '#FFFFFF' };
    if (level === 2) return { primary: '#00FFFF', gradStart: '#0080FF', gradEnd: '#00FFFF' };
    if (level === 3) return { primary: '#00FF99', gradStart: '#00C9FF', gradEnd: '#92FE9D' };
    if (level === 4) return { primary: '#FFD700', gradStart: '#FFA500', gradEnd: '#FFD700' };
    if (level === 5) return { primary: '#FF5E00', gradStart: '#FF0000', gradEnd: '#FF5E00' };
    if (level === 6) return { primary: '#FF003C', gradStart: '#8B0000', gradEnd: '#FF003C' };
    return { primary: '#9D00FF', gradStart: '#4B0082', gradEnd: '#9D00FF' };
};

export const generateStatsCard = async (user = {}, staffData = {}, score = 0) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const level = staffData.level ?? 1;
    const totalMsg = staffData.totalMessages ?? 0;
    const totalVoice = staffData.totalVoice ?? 0;
    const totalInv = staffData.totalInvites ?? 0;
    const tasks = staffData.tasksCompleted ?? 0;
    const penalty = staffData.penaltyPoints ?? 0;
    const totalMod = staffData.totalModeration ?? 0;
    const isOnLeave = staffData.isOnLeave ?? false;

    const username = (user.username ?? "YETKİLİ").toUpperCase();
    const theme = getLevelTheme(level);

    // Arka Plan
    ctx.fillStyle = '#16171A';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, [20, 20, 20, 20]);
    ctx.fill();

    ctx.fillStyle = theme.primary;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, 8, [20, 20, 0, 0]);
    ctx.fill();

    // Avatar
    const avatarSize = 130;
    const avatarX = 40;
    const avatarY = 40;

    try {
        if (user.displayAvatarURL) {
            const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
            const response = await fetch(avatarUrl);
            if (!response.ok) throw new Error("Avatar fetch failed");
            const buffer = Buffer.from(await response.arrayBuffer());
            const avatar = await loadImage(buffer);

            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
        }
    } catch {
        ctx.fillStyle = '#2B2D31';
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(username.charAt(0) || '?', avatarX + avatarSize / 2, avatarY + avatarSize / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Kullanıcı Adı
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    const nameWidth = ctx.measureText(username).width; 
    ctx.fillText(username, 200, 80);

    if (isOnLeave) {
        ctx.fillStyle = '#F1C40F';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('[İZİNDE]', 200 + nameWidth + 15, 78);
    }

    ctx.fillStyle = theme.primary;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`YETKİLİ SEVİYESİ ${level}`, 200, 115);

    // Progress Bar
    const barX = 200;
    const barY = 145;
    const barWidth = 380;
    const barHeight = 20;

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, [10, 10, 10, 10]);
    ctx.fill();

    const requiredScore = 500;
    const baseScore = (level - 1) * requiredScore;
    let currentProgress = score - baseScore;
    currentProgress = Math.max(0, Math.min(currentProgress, requiredScore));
    const progressRatio = requiredScore > 0 ? currentProgress / requiredScore : 0;
    const fillWidth = progressRatio * barWidth;

    if (fillWidth > 0) {
        const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
        gradient.addColorStop(0, theme.gradStart);
        gradient.addColorStop(1, theme.gradEnd);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillWidth, barHeight, [10, 10, 10, 10]);
        ctx.fill();
    }

    ctx.fillStyle = '#AAAAAA';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(currentProgress)} / ${requiredScore} XP`, barX + barWidth, barY - 8);

    // Sağ Üst Bilgiler
    ctx.textAlign = 'right';
    ctx.fillStyle = '#3498DB';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Mod İşlemi: ${totalMod}`, width - 40, 50);
    ctx.fillStyle = '#2ECC71';
    ctx.fillText(`Görev: ${tasks}`, width - 40, 80);
    if (penalty > 0) {
        ctx.fillStyle = '#E74C3C';
        ctx.fillText(`Ceza: -${penalty}`, width - 40, 110);
    }
    ctx.textAlign = 'left';

    // Alt Kutular
    const drawBox = (x, y, w, h, title, value, color) => {
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = '#212328';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, [12, 12, 12, 12]);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = '#8B929A';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(title, x + 20, y + 35);

        ctx.fillStyle = color;
        // Metin uzunsa kutudan taşmaması için fontu dinamik küçült
        const fontSize = ctx.measureText(value).width > 200 ? 24 : 30;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(value, x + 20, y + 72);
    };

    const boxY = 200;
    const boxW = 240;
    const gap = 25;

    // YENİ: formatVoiceTime kullanıldı ("0.1 Saat" yazmak yerine "6 Dk")
    drawBox(40, boxY, boxW, 90, 'TOPLAM MESAJ', totalMsg.toLocaleString('tr-TR'), '#3498DB');
    drawBox(40 + boxW + gap, boxY, boxW, 90, 'SES SÜRESİ', formatVoiceTime(totalVoice), '#E67E22');
    drawBox(40 + (boxW + gap) * 2, boxY, boxW, 90, 'DAVET SAYISI', totalInv.toLocaleString('tr-TR'), '#9B59B6');

    return canvas.toBuffer('image/png');
};