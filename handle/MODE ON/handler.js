const fs = require("fs");
const path = require("path");
const { findGroup }             = require("@lib/group");
const { containsBadword }       = require("@lib/badword");
const { downloadMediaMessage } = require('@lib/download');
const mess                      = require('@mess');
const spamDetection             = require('@lib/spamDetection');
const badwordDetection             = require('@lib/badwordDetection');
const config                    = require('@config');
const { updateUser,findUser,addUser }            = require("@lib/users");
const autoAi                    = require('@lib/autoai');
const autohaikal                 = require('@lib/autohaikal');
const autoRusuh                 = require('@lib/autorusuh');
const { getGroupMetadata, findParticipantLatest }      = require("@lib/cache");
const { logWithTime, isUrlInText, toText, sendMessageWithMention }    = require('@lib/utils');
const { findMessageById, editMessageById }  = require("@lib/chatManager");
const { sendImageAsSticker } = require('@lib/exif');;
const notifiedUsers = new Set();
const rateLimit_blacklist = {};
const notifiedBlacklistUsers = new Set();
const linkWarnings = {}; // ⬅️ tambahkan ini

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


async function process(sock, messageInfo) {
    const { m, id, sender, isBot, pushName, message, isGroup, prefix, command, fullText, type, isQuoted, isTagSw, isTagMeta, isForwarded, isTagComunity } = messageInfo;
    let { remoteJid } = messageInfo;
    
    // ✅ Simpan atau update nama pengguna dari pushName agar bisa dipakai oleh .getname
if (pushName) {
    if (!findUser(sender)) {
        addUser(sender, { name: pushName });
    } else {
        updateUser(sender, { name: pushName });
    }
}

    const result = findParticipantLatest(sender);
    if (result && isTagSw) {
        remoteJid = result.groupId;
        // await sock.sendMessage(result.groupId, { text : 'TES' }, { quoted: message });
    }

    const messagesDefault = toText(message);
    if (isTagSw || isGroup) {
        // lanjut
    } else {
        return true; // Abaikan jika bukan grup
    }
    

    const now = Date.now();

    try {
        // Ambil data grup dari database
        const dataGroupSettings = await findGroup(remoteJid);
        if (!dataGroupSettings) {
            logWithTime('System', `Data grup tidak ditemukan atau fitur belum diaktifkan.`);
            return true;
        }
        
        const { fitur } = dataGroupSettings;
         // Mencari pengguna
         const user = await findUser(sender);

        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);

        // Fungsi untuk menghapus pesan
        const deleteMessage = async () => {
            const result = await sock.sendMessage(remoteJid, {
                delete: { remoteJid, id, participant: sender }
            });
        };

        // Fungsi untuk memproses kick anggota
        const kickParticipant = async () => {
            await sock.groupParticipantsUpdate(remoteJid, [sender], 'remove');
        };

        // Kirim pesan
        const sendText = async (text, isquoted = false) => {
            if(isquoted) {
                await sendMessageWithMention(sock, remoteJid, text, message);
            }else {
                await sock.sendMessage(remoteJid, { text }, { quoted: message });
            }
        };


        async function handleAction(action, sender) {
            if (action === 'block') {
                await updateUser(sender, { status: "block" });
            } else if (action === 'kick') {
                await kickParticipant();
            } else if (action === 'both') {
                await updateUser(sender, { status: "block" });
                await kickParticipant();
            } else {
                console.warn("Tindakan badword tidak valid:", action);
            }
        }
    
        const isWhatsappLink = fullText.toLowerCase().trim().includes('chat.whatsapp.com');
        const isWhatsappSaluran = fullText.toLowerCase().trim().includes('whatsapp.com/channel/');
        // messagesDefault.toLowerCase().trim().includes('chat.whatsapp.com')
        // Anti-link wav2 : Hapus pesan dan kick jika URL whatsapp terdeteksi
        if (!isAdmin && fitur.antilinkwav2 && isWhatsappLink) {
            logWithTime('SYSTEM',`Deteksi fitur Anti-link wav2 : ${fullText}`);
            await deleteMessage();
            await kickParticipant();
            return false;
        }

          // Anti-link ch : Hapus pesan jika URL whatsapp terdeteksi
        if (!isAdmin && fitur.antilinkchv2 && isWhatsappSaluran) {
            logWithTime('SYSTEM',`Deteksi fitur Anti-linkch V2`);
            await deleteMessage();
            await kickParticipant();
            return false;
        }

        if (!isAdmin && fitur.antilinkch && isWhatsappSaluran) {
    logWithTime('SYSTEM', `Deteksi fitur antilinkch : ${fullText}`);

    const userId = sender.split('@')[0];
    const key = `antilinkch-${remoteJid}-${sender}`;
    const now = new Date();
    const today = now.toDateString();

    if (!linkWarnings[key]) {
        linkWarnings[key] = { count: 0, lastDate: today };
    }

    if (linkWarnings[key].lastDate !== today) {
        linkWarnings[key].count = 0;
        linkWarnings[key].lastDate = today;
    }

    linkWarnings[key].count++;
    await deleteMessage();

    if (linkWarnings[key].count < 3) {
        await sendText(`⚠️ peringatan ${linkWarnings[key].count}! tidak boleh kirim link channel wa, @${userId}`, true);
    } else {
        await sendText(`⛔️ peringatan ke-3! @${userId} dikick karena terus kirim link channel.`, true);
        await kickParticipant();
        delete linkWarnings[key];
    }
    return false;
}


        // Anti-link wa : Hapus pesan jika URL whatsapp terdeteksi
        if (!isAdmin && fitur.antilinkwa && isWhatsappLink) {
    logWithTime('SYSTEM', `Deteksi fitur antilinkwa : ${fullText}`);

    const userId = sender.split('@')[0];
    const key = `antilinkwa-${remoteJid}-${sender}`;
    const now = new Date();
    const today = now.toDateString();

    if (!linkWarnings[key]) {
        linkWarnings[key] = { count: 0, lastDate: today };
    }

    if (linkWarnings[key].lastDate !== today) {
        linkWarnings[key].count = 0;
        linkWarnings[key].lastDate = today;
    }

    linkWarnings[key].count++;
    await deleteMessage();

    if (linkWarnings[key].count < 3) {
        await sendText(`⚠️ peringatan ${linkWarnings[key].count}! tidak boleh kirim link grup wa, @${userId}`, true);
    } else {
        await sendText(`⛔️ peringatan ke-3! @${userId} dikick karena terus kirim link grup wa.`, true);
        await kickParticipant();
        delete linkWarnings[key];
    }
    return false;
}
        
        // Anti-link V2: Hapus pesan + kick pengguna
        if (!isAdmin && fitur.antilinkv2 && isUrlInText(fullText)) {
            logWithTime('SYSTEM',`Deteksi fitur Anti-link V2`);
            await deleteMessage();
            await kickParticipant();
            return false;
        }

         // Anti-link: Hapus pesan jika URL terdeteksi
        if (!isAdmin && fitur.antilink && isUrlInText(fullText)) {
    logWithTime('SYSTEM', `Deteksi fitur antilink`);

    const userId = sender.split('@')[0];
    const key = `antilink-${remoteJid}-${sender}`;
    const now = new Date();
    const today = now.toDateString(); // format: "Mon Jul 18 2025"

    if (!linkWarnings[key]) {
        linkWarnings[key] = { count: 0, lastDate: today };
    }

    // Reset jika beda hari
    if (linkWarnings[key].lastDate !== today) {
        linkWarnings[key].count = 0;
        linkWarnings[key].lastDate = today;
    }

    linkWarnings[key].count++;
    await deleteMessage();

    if (linkWarnings[key].count < 3) {
        await sendText(`⚠️ peringatan ${linkWarnings[key].count}! dilarang kirim link di grup ini, @${userId}`, true);
    } else {
        await sendText(`⛔️ peringatan ke-3! @${userId} dikick karena kirim link terus.`, true);
        await kickParticipant();
        delete linkWarnings[key];
    }
    return false;
}

         // Detectblacklist2
        if (fitur.detectblacklist2 && user) {
            logWithTime('SYSTEM',`Deteksi fitur Detect Blacklist`);

            const status = user.status;
            if(status === 'blacklist') { // user di blacklist
                await kickParticipant();
            }
        }

       // Detect blacklist
        if (fitur.detectblacklist && user) {
            logWithTime('SYSTEM', `Deteksi fitur Detect Blacklist`);

            const status = user.status;
            const userId = sender.split('@')[0]; // Mengambil ID pengguna

            if (status === 'blacklist') {
                if (!notifiedBlacklistUsers.has(userId)) {
                    const warningMessage = `⚠️ _Peringatan Blacklist_ \n\n@${userId} Telah di blacklist`;
                    await sendText(warningMessage, true);
                    logWithTime(pushName, `User sedang di blacklist`);
                    notifiedBlacklistUsers.add(userId); // Tandai sebagai sudah diberi notifikasi
                } else {
                    logWithTime(pushName, `User blacklist sudah diberi notifikasi sebelumnya`);
                }
                return false;
            }
        }

        if(fitur.detectblacklist && fitur.detectblacklist2) {
            const status = user.status;
            if(status === 'blacklist') {
                return false;
            }
            
        }

     // Deteksi badword: 
     if (!isAdmin && fitur.badwordv3 && command !== 'delbadword') {
        const hasBadwordGroup = await containsBadword(remoteJid, fullText);
        const hasBadwordGlobal = await containsBadword('global-badword', fullText);

  
        if (hasBadwordGroup.status || hasBadwordGlobal.status) { // Cek salah satu terdeteksi badword
            logWithTime('SYSTEM', `Deteksi fitur badwordv3`);
            await deleteMessage();

            const detectWords = hasBadwordGroup.words || hasBadwordGlobal.words;
    
            const result = badwordDetection(sender);
            if (result.status === 'warning') {
                if (mess.handler.badword_warning) {
                    let warningMessage = mess.handler.badword_warning
                        .replace('@sender', `@${sender.split('@')[0]}`)
                        .replace('@warning', result.totalWarnings)
                        .replace('@detectword', detectWords)
                        .replace('@totalwarning', config.BADWORD.warning);
                    
                    await sendText(warningMessage, true);
                }
                return false;
            }
            
            if (result.status === 'blocked') {
                if (mess.handler.badword_block) {
                    let warningMessage = mess.handler.badword_block
                        .replace('@sender', `@${sender.split('@')[0]}`)
                        .replace('@warning', result.totalWarnings)
                        .replace('@detectword', detectWords)
                        .replace('@totalwarning', config.BADWORD.warning);
                    
                    await sendText(warningMessage, true);
                    await kickParticipant();
                }
            }
        }
    }

        // Deteksi badword: Hapus pesan jika ada kata kasar
        if (!isAdmin && fitur.badword && command !== 'delbadword') {
            const hasBadwordGroup = await containsBadword(remoteJid, fullText);
            const hasBadwordGlobal = await containsBadword('global-badword', fullText);
           
        
            
            if (hasBadwordGroup.status || hasBadwordGlobal.status) { // Cek salah satu terdeteksi badword

                const detectWords = hasBadwordGroup.words || hasBadwordGlobal.words;

                logWithTime('SYSTEM', `Deteksi fitur badword`);
                await deleteMessage();
        
                const result = badwordDetection(sender);
                if (result.status === 'warning') {
                    if (mess.handler.badword_warning) {
                        let warningMessage = mess.handler.badword_warning
                            .replace('@sender', `@${sender.split('@')[0]}`)
                            .replace('@warning', result.totalWarnings)
                            .replace('@detectword', detectWords)
                            .replace('@totalwarning', config.BADWORD.warning);
                        
                        await sendText(warningMessage, true);
                    }
                    return false;
                }
                
                if (result.status === 'blocked') {
                    if (mess.handler.badword_block) {
                        let warningMessage = mess.handler.badword_block
                            .replace('@sender', `@${sender.split('@')[0]}`)
                            .replace('@warning', result.totalWarnings)
                            .replace('@detectword', detectWords)
                            .replace('@totalwarning', config.BADWORD.warning);
                        
                        await sendText(warningMessage, true);
                    }
        
                    // Ambil tindakan berdasarkan konfigurasi
                    const badwordAction = config.BADWORD.action.toLowerCase().trim();
        
                    try {
                        await handleAction(badwordAction, sender);
                    } catch (error) {
                        console.error("Terjadi kesalahan saat memproses tindakan badword:", error);
                        await sendText("❗ _Terjadi kesalahan, tindakan badword gagal._");
                    }
                }
                return false;
            }
        }

           // Deteksi badwordv2: Hapus pesan jika ada kata kasar
        if (!isAdmin && fitur.badwordv2 && command !== 'delbadword') {
            const hasBadwordGroup = await containsBadword(remoteJid, fullText);
            const hasBadwordGlobal = await containsBadword('global-badword', fullText);
            
            if (hasBadwordGroup.status || hasBadwordGlobal.status) { // Cek salah satu terdeteksi badword
                logWithTime('SYSTEM', `Deteksi fitur badwordv2`);
                await deleteMessage();

                const detectWords = hasBadwordGroup.words || hasBadwordGlobal.words;

                const result = badwordDetection(sender);
        
                if (mess.handler.badword_block) {
                    let warningMessage = mess.handler.badword_block
                        .replace('@sender', `@${sender.split('@')[0]}`)
                        .replace('@warning', result.totalWarnings)
                        .replace('@detectword', detectWords)
                        .replace('@totalwarning', config.BADWORD.warning);
                    
                    await sendText(warningMessage, true);
                }
    
                // Ambil tindakan berdasarkan konfigurasi
                const badwordAction = config.BADWORD.action.toLowerCase().trim();
    
                try {
                    await handleAction(badwordAction, sender);
                } catch (error) {
                    console.error("Terjadi kesalahan saat memproses tindakan badword:", error);
                    await sendText("❗ _Terjadi kesalahan, tindakan badword gagal._");
                }
            
                return false;
            }
        }
        
        
if (!isAdmin && fitur?.antifoto && type === 'image') {
    logWithTime('SYSTEM', 'Deteksi antifoto aktif');

    try {
        const mtype = Object.keys(message.message)[0];
        const isViewOnce = mtype === 'viewOnceMessage';

        const mediaMessage = isViewOnce
            ? message.message.viewOnceMessage.message
            : message.message;

        const buffer = await downloadMediaMessage({ message: mediaMessage });
        if (!buffer) throw new Error("buffer kosong");

        // Ambil caption jika ada
        const caption = mediaMessage?.imageMessage?.caption ||
                        mediaMessage?.extendedTextMessage?.text || 
                        "*「 ANTI FOTO 」*";

        await sock.sendMessage(remoteJid, {
            image: buffer,
            caption: caption,
            viewOnce: true
        }, { quoted: message });

        await deleteMessage();
    } catch (err) {
        console.error('Gagal download media:', err);
    }

    return false;
}



if (!isAdmin && fitur?.antivideo && type === 'video') {
    logWithTime('SYSTEM', 'Deteksi antivideo aktif');

    try {
        const mtype = Object.keys(message.message)[0];
        const isViewOnce = mtype === 'viewOnceMessage';

        const mediaMessage = isViewOnce
            ? message.message.viewOnceMessage.message
            : message.message;

        const buffer = await downloadMediaMessage({ message: mediaMessage });
        if (!buffer) throw new Error("buffer kosong");

        const caption = mediaMessage?.videoMessage?.caption ||
                        mediaMessage?.extendedTextMessage?.text || 
                        "*「 ANTI VIDEO 」*";

        await sock.sendMessage(remoteJid, {
            video: buffer,
            caption: caption,
            viewOnce: true
        }, { quoted: message });

        await deleteMessage();
    } catch (err) {
        console.error('Gagal download media video:', err);
    }

    return false;
}
        
        
        
        // Deteksi antigame
        if (fitur.antigame && command) {
            const Games = ['bj','blackjack','caklontong', 'kodam', 'cekkodam','snakes', 'dare','family100','kuismath','math','suit','tebakangka', 'tebakbendera','tebakbom', 'tebakgambar', 'tebakhewan', 'tebakkalimat','tebakkata','tebaklagu','tebak','tebaklirik','tictactoe','truth','ttc','ttt'];
            if (Games.some(game => command.includes(game))) {
                const notifKey = `antigame-${remoteJid}-${sender}`;
                if (!notifiedUsers.has(notifKey)) {
                    notifiedUsers.add(notifKey);
                    await sendText(mess.game.isStop);
                }
                return false;
            }
        }

        // Anti-anti
        const antiFeatures = {
            image: fitur.antifoto,
            video: fitur.antivideo,
            audio: fitur.antiaudio,
            document: fitur.antidocument,
            contact: fitur.anticontact,
            sticker: fitur.antisticker,
            poll: fitur.antipolling
        };
        
        if (!isAdmin && antiFeatures[type]) {
            logWithTime('SYSTEM',`Deteksi fitur - ${type}`);
            await deleteMessage();
            return false;
        }


        // Deteksi anti-edit
        if (fitur.antiedit && m.isEdited.status) {
            const fullText = m.isEdited.text;
            const idChatEdited = m.isEdited.id;
            if (idChatEdited) {
                const oldMessage = findMessageById(sender, idChatEdited);
                if (oldMessage) {


                    // Kirim pesan deteksi anti-edit
                    if (mess.handler.antiedit) {
                        let warningMessage = mess.handler.antiedit
                            .replace('@oldMessage', `${oldMessage.text || ""}`);
                        
                        await sendText(warningMessage, true);
                    }

                    if(fullText){ // Perharui chat edit
                        editMessageById(
                            sender, 
                            idChatEdited, 
                            fullText
                        );
                        return false;
                    }
                }
            }
        }

        // Deteksi anti-delete
        if (fitur.antidelete && m.isDeleted) {
            const idChatDeleted = m.message.message?.protocolMessage?.key?.id;
            if(idChatDeleted) {
                const oldMessage = findMessageById(sender, idChatDeleted);
                if (oldMessage) {
                    if(oldMessage.type && oldMessage.type == 'sticker'){
                        try {
                            // Ambil direktori kerja saat ini
                            const outputPath    = path.resolve('./', oldMessage.text); // Resolusi path absolut
                            const stickerBuffer = fs.readFileSync(outputPath); // Membaca file dari path
                        
                            // Kirim file sebagai stiker
                            const options = {
                                packname: config.sticker_packname,
                                author: config.sticker_author,
                            };
                            await sendImageAsSticker(sock, remoteJid, stickerBuffer, options, message);

                            if (mess.handler.antidelete) {
                                let warningMessage = mess.handler.antidelete
                                    .replace('@sender', `@${sender.split('@')[0]}`)
                                    .replace('@text', 'sticker');
                                
                                await sendText(warningMessage, true);
                            }

                        } catch (error) {
                            console.error('Error:', error);
                        }
                        return;
                    }

                    // Kirim pesan deteksi anti-delete
                    if (mess.handler.antidelete) {
                        let warningMessage = mess.handler.antidelete
                            .replace('@sender', `@${sender.split('@')[0]}`)
                            .replace('@text', `${oldMessage.text || ""}`);
                        await sendText(warningMessage, true);
                    }

                }
            }
        }

         // Deteksi anti-spam
        if (!isAdmin && typeof fitur.antispamchat === "boolean" && fitur.antispamchat) {
         
            const result = spamDetection(sender);
            if (result.status === 'warning') {
                if (mess.handler.antispamchat) {
                    let warningMessage = mess.handler.antispamchat
                        .replace('@sender', `@${sender.split('@')[0]}`)
                        .replace('@warning', result.totalWarnings)
                        .replace('@totalwarning', config.SPAM.warning);
                    try {
                        await sendText(warningMessage, true);
                    } catch (err) {
                        console.error('Gagal kirim pesan warning:', err)
                    }
                }
                return false;
            } 
            
            if (result.status === 'blocked') {
                if (mess.handler.antispamchat2) {
                    let warningMessage = mess.handler.antispamchat2
                        .replace('@sender', `@${sender.split('@')[0]}`);
                    await sendText(warningMessage, true);
                }

                // Ambil tindakan berdasarkan konfigurasi
                const spamAction = config.SPAM.action.toLowerCase().trim();
        
                try {
                    await handleAction(spamAction, sender);
                } catch (error) {
                    console.error("Terjadi kesalahan saat memproses tindakan spam:", error);
                    await sendText("❗ _Terjadi kesalahan, tindakan spam gagal._");
                }
                
                return false;
            }
        }

        // Deteksi anti-virtex (membatasi teks panjang)
        if (!isAdmin && fitur?.antivirtex === true) {
            const isTextMessage = type !== 'video' && type !== 'image';
            const isTextTooLong = messagesDefault.length > 10000;

            if (isTextMessage && isTextTooLong) {
                if (mess.handler.antivirtex) {
                    let warningMessage = mess.handler.antivirtex
                        .replace('@sender', `@${sender.split('@')[0]}`);
                    await sendText(warningMessage, true);
                }
                await deleteMessage();
                return false; // Hentikan eksekusi jika terdeteksi virtex
            }
        }

        // Deteksi auto-ai aktif
        if (fitur?.autoai && command !== 'on' && command !== 'off' && !prefix) {
            const containsAI = fullText.toLowerCase().trim().includes('ai');
            const isQuotedMessageFromBot = isQuoted?.sender === `${config.phone_number_bot}@s.whatsapp.net`;

            // Ambil isi pesan dari kutipan jika pesan berasal dari bot
            const content_old = isQuotedMessageFromBot ? isQuoted.text || isQuoted.content || '' : undefined;

            // Cek apakah tipe pesan adalah 'text' atau 'image'
            if (type === 'text' || type === 'image' || containsAI) {
                await autoAi(sock, messageInfo, content_old);
                return false;
            }
        }

        // Deteksi auto-haikal aktif
        if (fitur?.autohaikal && !command) {
    const isMentioninghaikal = fullText.toLowerCase().includes('haikal');
    const isQuotedFromBot = isQuoted?.sender === `${config.phone_number_bot}@s.whatsapp.net`;
    const content_old = isQuotedFromBot ? isQuoted.text || isQuoted.content || '' : undefined;

    // Hanya respon jika menyebut "haikal" DAN membalas pesan dari bot
    if (isQuotedFromBot && (type === 'text')) {
        await autohaikal(sock, messageInfo, content_old);
        return false; // hanya stop kalau memang dijalankan
    }
}
                
        // Deteksi auto-rusuh aktif
        if (fitur?.autorusuh && command !== 'on' && command !== 'off') {
            const isQuotedMessageFromBot = isQuoted?.sender === `${config.phone_number_bot}@s.whatsapp.net`;
            await autoRusuh(sock, messageInfo, isQuotedMessageFromBot);
            return false;
        }

        if (!isAdmin && fitur?.antibot && isBot && isGroup) {
            if (mess.handler.antibot) {
                let warningMessage = mess.handler.antibot
                    .replace('@sender', `@${sender.split('@')[0]}`);
                await sendText(warningMessage, true);
            }
            await deleteMessage();
            await kickParticipant();
            return false;
        }

        // Deteksi onlyadmin
        if (fitur?.onlyadmin) {
            if (command === 'debug') {
                console.log(`Status Only Admin: ${fitur.onlyadmin ? 'Aktif' : 'Nonaktif'}`);
                return false; // Stop setelah menampilkan status debug
            }
            if(!isAdmin) return false; // Hentikan jika bukan admin
        }

        // Deteksi antitag sw
        if (!isAdmin && fitur?.antitagsw && isTagSw) {
            if (mess.handler.antitagsw) {
                let warningMessage = mess.handler.antitagsw
                    .replace('@sender', `@${sender.split('@')[0]}`);
                await sendText(warningMessage, true);
            }
                await deleteMessage();
                return false;
        }

        // Deteksi antitag sw2
        if (!isAdmin && fitur?.antitagsw2 && isTagSw) {
         
            if (mess.handler.antitagsw) {
                let warningMessage = mess.handler.antitagsw
                    .replace('@sender', `@${sender.split('@')[0]}`);
                await sendText(warningMessage, true);
            }
            await deleteMessage();
            await kickParticipant();
            return false;
        }
       
        if (fitur?.antitagmeta && isGroup && isTagMeta) {
            let warningMessage = '⚠️ @sender _Terdeteksi Tag Meta Ai di grub ini_'
            if (warningMessage) {
                warningMessage = warningMessage
                    .replace('@sender', `@${sender.split('@')[0]}`);
                await sendText(warningMessage, true);
            }
            await deleteMessage();
            return false;
        }

        if (fitur?.antitagmeta2 && isGroup && isTagMeta) {
            let warningMessage = '⚠️ @sender _Terdeteksi Tag Meta Ai di grub ini_'
            if (warningMessage) {
                warningMessage = warningMessage
                    .replace('@sender', `@${sender.split('@')[0]}`);
                await sendText(warningMessage, true);
            }
            await deleteMessage();
            await kickParticipant();
            return false;
        }

        
        if (!isAdmin && fitur?.antiforward && isGroup && isForwarded) {
            let warningMessage = '⚠️ @sender _Terdeteksi Mengirim Pesan Terusan_'
            if (warningMessage) {
                warningMessage = warningMessage
                    .replace('@sender', `@${sender.split('@')[0]}`);
                await sendText(warningMessage, true);
            }
            await deleteMessage();
            return false;
        }

        if (!isAdmin && fitur?.antiforward2 && isGroup && isForwarded) {
            let warningMessage = '⚠️ @sender _Terdeteksi Mengirim Pesan Terusan_'
            if (warningMessage) {
                warningMessage = warningMessage
                    .replace('@sender', `@${sender.split('@')[0]}`);
                await sendText(warningMessage, true);
            }
            await deleteMessage();
            await kickParticipant();
            return false;
        }



        if (rateLimit_blacklist[sender] && now - rateLimit_blacklist[sender] < 5000) {
            return true;
        }else {
            rateLimit_blacklist[sender] = now; 
        }

    } catch (error) {
        console.error("Terjadi kesalahan pada proses Handler.js:", error.message);
    }
    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name    : "Mode On Handler :",
    priority: 2,
    process
};
