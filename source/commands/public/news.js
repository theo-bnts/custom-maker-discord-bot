const Discord = require('discord.js')
const util = require('util')
const mysql = require('mysql')
const needle = require('needle')
const fs = require('fs')
const Canvas = require('canvas')
const canvasTxt = require('canvas-txt').default
const GIFEncoder = require('gifencoder')

const cooldown = new Set()

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['ATTACH_FILES'])) return

    const translations = await getTranslations(message.guild, false, [])

    message.channel.startTyping()
    const res = (await needle('get', `https://fortniteapi.io/v1/news?lang=${translations.lang}&type=${args[0]}&live=true`, { headers: {'Authorization': config.fortniteApiIo} })).body

    const encoder = new GIFEncoder(1280, 720)
    encoder.createReadStream().pipe(fs.createWriteStream(`assets/news/${res.type}/${res.lang}.gif`))
    encoder.start()
    encoder.setRepeat(0)
    encoder.setDelay(5000)

    const canvas = Canvas.createCanvas(1280, 720)
    const c = canvas.getContext('2d')
    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })

    const tabTitleWidth = canvas.width/res.news.length

    for (const news of res.news) {
        with (c) {
            const image = await Canvas.loadImage(news.image)
            drawImage(image, 0, 0, canvas.width, canvas.height)
            
            fillStyle = '#014cbc70'
            fillRect(0, 0, canvas.width, 50)
            fillStyle = '#fff5'
            fillRect(tabTitleWidth*res.news.indexOf(news), 0, tabTitleWidth, 50)
            for (const n of res.news) {
                fillStyle = '#fff'
                var fontSize = 30
                do font = `${fontSize--}px burbank`
                while (measureText(n.tabTitle.toUpperCase()).width > (tabTitleWidth / 1.1))
                fillText(n.tabTitle.toUpperCase(), tabTitleWidth * res.news.indexOf(n) + tabTitleWidth / 2 - (measureText(n.tabTitle.toUpperCase()).width / 2), (50+measureText('I').actualBoundingBoxAscent) / 2)
            }

            with (canvasTxt) {
                font = 'burbank'
                fontSize = 30
                align = 'left'
                vAlign = 'top'
                text = drawText(c, news.body, 0, 2000, 950, 500)
                text = drawText(c, news.body, 30, canvas.height-text.height-40, 950, 500)
            }

            const gradient = createLinearGradient(0, canvas.height-text.height-250, 0, canvas.height)
            gradient.addColorStop(0, '#0000')
            gradient.addColorStop(1, '#014cbc')
            fillStyle = gradient
            fillRect(0, canvas.height-text.height-250, canvas.width, text.height+250)

            fillStyle = '#fff'
            font = '50px burbank'
            fillText(news.title.toUpperCase(), 30, canvas.height-text.height-45)

            fillStyle = '#34f1ff'
            with (canvasTxt) {
                font = 'burbank'
                fontSize = 30
                align = 'left'
                vAlign = 'top'
                text = drawText(c, news.body, 0, 2000, 950, 500)
                text = drawText(c, news.body, 30, canvas.height-text.height-40, 950, 500)
            }

            await encoder.addFrame(c)
        }
    }

    encoder.finish()
    await message.channel.send({files: [{attachment: `assets/news/${res.type}/${res.lang}.gif`, name: 'news.gif'}]})
    message.channel.stopTyping(true)
}


module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Actualités du jeu',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}