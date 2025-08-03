const ws = require('ws');
const { logCustom } = require('@lib/logger');

async function searchai(query) {
    if (!query) throw new Error('Query is required');

    const socket = new ws('wss://searc.ai/ws');
    const result = {
        query,
        subqueries: [],
        report: '',
        source_url: [],
        selected_images: [],
        files: {},
        metadata: {
            total_cost: null,
            agent_type: null,
            scraped_pages: 0,
            scraped_images: 0
        }
    };

    return new Promise((resolve, reject) => {
        socket.on('open', () => {
            socket.send('start ' + JSON.stringify({
                task: query,
                report_type: 'research_report',
                report_source: 'web',
                tone: 'Objective',
                query_domains: []
            }));
        });

        socket.on('message', (data) => {
            const d = JSON.parse(data);

            if (d.type === 'logs') {
                if (d.content === 'subqueries' && d.metadata) {
                    result.subqueries.push(...d.metadata);
                } else if (d.content === 'added_source_url' && d.metadata) {
                    result.source_url.push(d.metadata);
                } else if (d.content === 'agent_generated' && d.output) {
                    result.metadata.agent_type = d.output;
                } else if (d.content === 'research_step_finalized' && d.output.includes('Total Research Costs:')) {
                    const costMatch = d.output.match(/\$([0-9.]+)/);
                    if (costMatch) {
                        result.metadata.total_cost = parseFloat(costMatch[1]);
                    }
                } else if (d.content === 'scraping_content' && d.output.includes('Scraped')) {
                    const pagesMatch = d.output.match(/(\d+) pages/);
                    if (pagesMatch) {
                        result.metadata.scraped_pages += parseInt(pagesMatch[1]);
                    }
                } else if (d.content === 'scraping_images' && d.output.includes('Selected')) {
                    const imagesMatch = d.output.match(/(\d+) new images/);
                    if (imagesMatch) {
                        result.metadata.scraped_images += parseInt(imagesMatch[1]);
                    }
                }
            } else if (d.type === 'images') {
                if (d.content === 'selected_images' && d.metadata) {
                    result.selected_images.push(...d.metadata);
                }
            } else if (d.type === 'report') {
                result.report += d.output || '';
            } else if (d.type === 'path') {
                const baseUrl = 'https://searc.ai/';
                const filesWithUrls = {};
                for (const [key, value] of Object.entries(d.output)) {
                    filesWithUrls[key] = baseUrl + value;
                }
                result.files = filesWithUrls;

                socket.close();
                resolve(result);
            }
        });

        socket.on('error', reject);
        socket.on('close', () => {
            if (!result.report) reject(new Error('Connection closed before report generated.'));
        });
    });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        if (!content.trim()) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ format penggunaan:_ \n\n_💬 contoh:_ _*${prefix + command} apa itu internet?_`
            }, { quoted: message });
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const res = await searchai(content);

        const teks = `✅ *Hasil Riset AI:*\n\n` +
                     `🧠 *Query:* ${res.query}\n` +
                     `🔍 *Subqueries:* ${res.subqueries.join(', ') || '-'}\n` +
                     `📝 *Report:*\n${res.report.slice(0, 3000)}\n\n` + // potong kalau terlalu panjang
                     `🌐 *Sumber:* ${res.source_url.slice(0, 3).map((x, i) => `\n${i+1}. ${x}`).join('') || '-'}\n` +
                     `📊 *Agent:* ${res.metadata.agent_type}\n💸 *Cost:* $${res.metadata.total_cost || 0}`;

        await sock.sendMessage(remoteJid, { text: teks }, { quoted: message });

        // Kirim file jika ada
        if (res.files && Object.keys(res.files).length > 0) {
            const fileList = Object.entries(res.files).map(([key, url]) => `📁 *${key}*: ${url}`).join('\n');
            await sock.sendMessage(remoteJid, { text: fileList }, { quoted: message });
        }

    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, {
            text: `❌ terjadi kesalahan: ${error.message || 'unknown error'}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['ai4'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};