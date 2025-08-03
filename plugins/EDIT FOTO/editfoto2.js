const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils')
const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const FormData = require('form-data')

const API_KEYS = [
  'sk-fg-v1-2a4633969ff968ac21e09a83b4bf61e25ae9b73506dc4d93ec235802b2f82fc1'
]

async function editImage(imageBuffer, prompt) {
  const form = new FormData()
  form.append('image', imageBuffer, {
    filename: 'image.png',
    contentType: 'image/png'
  })
  form.append('prompt', prompt)
  form.append('model', 'gpt-image-1')
  form.append('n', '1')
  form.append('size', '1024x1024')
  form.append('quality', 'medium')

  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/edits',
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${API_KEYS[i]}`
          }
        }
      )

      const base64 = response.data?.data?.[0]?.b64_json
      if (!base64) throw new Error('OpenAI tidak mengembalikan hasil gambar')
      return Buffer.from(base64, 'base64')
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message
      if (msg.includes('quota') || err.response?.status === 429) {
        console.log(`🔁 API key ke-${i + 1} limit, mencoba key berikutnya...`)
        continue
      }
      if (msg.includes('invalid') || err.response?.status === 401) {
        console.log(`❌ API key ke-${i + 1} tidak valid`)
        continue
      }
      throw err
    }
  }

  throw new Error('Semua API key tidak valid atau limit')
}

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, prefix, command, type, isQuoted, content } = messageInfo

  try {
    const prompt = content?.trim()
    if (!prompt) return await reply(m, `📌 kirim atau balas gambar dengan caption *${prefix + command} ubah jadi anime*`)

    const mediaType = isQuoted ? isQuoted.type : type
    if (mediaType !== 'image') return await reply(m, `⚠️ kirim atau balas gambar dengan caption *${prefix + command}*`)

    await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } })

    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message)

    const mediaPath = path.join('tmp', media)
    if (!fs.existsSync(mediaPath)) throw new Error('Gagal mengunduh gambar')

    const imageBuffer = await fs.readFile(mediaPath)
    const resultBuffer = await editImage(imageBuffer, prompt)

    await sock.sendMessage(remoteJid, {
      image: resultBuffer,
      caption: '*✅ selesai diedit*'
    }, { quoted: message })

  } catch (error) {
    console.error('OPENAI EDIT ERROR:', error)
    if (error.message.includes('tidak valid') || error.message.includes('limit')) {
      return await reply(m, `_⚠️ semua API key tidak valid atau limit. silakan ganti key atau tunggu reset._`)
    }
    return await reply(m, `_terjadi kesalahan saat mengedit gambar: ${error.message}_`)
  }
}

module.exports = {
  handle,
  Commands: ['editfoto2'],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1
}