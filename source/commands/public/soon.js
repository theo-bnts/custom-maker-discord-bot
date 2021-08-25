const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const fs = require('fs')
const needle = require('needle')
const Canvas = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['ATTACH_FILES'])) return

    var translations
    try {
        const connection = mysql.createConnection(config.mysql)
        const query = util.promisify(connection.query).bind(connection)
        const language = (await query(`SELECT language FROM guild_settings WHERE id='${message.guild.id}'`))[0].language
        if (fs.existsSync(`assets/translations/${language}.json`)) translations = await require(`../../assets/translations/${language}.json`)
        else translations = require('../../assets/translations/en.json')
    } catch (e) {}

    message.channel.startTyping()

    var items, imageSize = 256, interval = 20, titleY = 130, subTitleY = titleY+50, margin = 50, nbInlineItems = 5

    if (args[0] == 'current')
        items = (await needle('get', `https://fortniteapi.io/v2/items/list?added.version=current&lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body.items
            .filter(i => i.releaseDate === null)
    else {
        items = (await needle('get', `https://fortniteapi.io/v2/items/upcoming?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body.items
        subTitleY = titleY
    }
    

    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
    const canvas = await Canvas.createCanvas(nbInlineItems*(imageSize + interval)+2*margin-interval, Math.ceil(items.length / nbInlineItems)*(imageSize + interval)+subTitleY+2*margin-interval)
    const ctx = canvas.getContext('2d')

    with (ctx) {
        const gradient = createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#0093fb')
        gradient.addColorStop(1, '#014cbc')
        fillStyle = gradient
        fillRect(0, 0, canvas.width, canvas.height)

        font = '70px burbank'
        fillStyle = '#75c4f1'
        fillText(bot.user.username.toUpperCase(), canvas.width-measureText(bot.user.username.toUpperCase()).width-margin, titleY)

        fillStyle = '#fff'
        fillText(translations['3016'].toUpperCase(), margin, titleY)

        font = '50px burbank'
        fillStyle = '#75c4f1'
        if (subTitleY != titleY) fillText(translations['3017'].toUpperCase(), margin, subTitleY)

        var x = margin, y = subTitleY+margin
        for (var i=1; i<=items.length; i++) {
            try {
                const image = await Canvas.loadImage(items[i-1].images.full_background)
                drawImage(image, x, y, imageSize, imageSize)
            } catch (e) {
                console.log(items[i-1].images.full_background)
            }
            if (i%nbInlineItems == 0) {
                x=margin
                y+=imageSize+interval
            } else {
                x+=imageSize+interval
            }
        }
    }

    await message.channel.send({ files: [canvas.toBuffer()] })
    message.channel.stopTyping(true)
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Articles encore non dévoilés au public',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
