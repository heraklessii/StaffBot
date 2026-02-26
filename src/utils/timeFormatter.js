// Milisaniye (ms) cinsinden gelen süreyi okunabilir "Saat, Dakika, Saniye" formatına çevirir.
export const formatVoiceTime = (ms) => {
    if (!ms || ms < 1000) return '0 Sn';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return minutes > 0 ? `${hours} Sa ${minutes} Dk` : `${hours} Saat`;
    } else if (minutes > 0) {
        return seconds > 0 ? `${minutes} Dk ${seconds} Sn` : `${minutes} Dk`;
    } else {
        return `${seconds} Sn`;
    }
};