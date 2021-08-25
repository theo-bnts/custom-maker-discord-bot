const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const needle = require('needle')
const Canvas = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['ATTACH_FILES'])) return

    const translations = await getTranslations(message.guild, false, ['3052', '3053', '1033', '1034', '1035'])

    var columnSize = 10, embed = new Discord.MessageEmbed().setColor(config.embedsColor)

    var fishs
    if (args[0] == 'collection') {
        const connection = mysql.createConnection(config.mysql)
        const query = util.promisify(connection.query).bind(connection)
        const results = await query(`SELECT * FROM users WHERE id_discord='${message.author.id}' AND verification_date > '2010-01-01'`)
        if (!results[0]?.id_epic)
            return message.channel.send(embed.setDescription(translations['1033'])).then(m => m.react('📘').catch(() => {}))
        fishs = (await needle('get', `https://fortniteapi.io/v1/stats/fish?accountId=${results[0].id_epic}&lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body.stats.reverse()[0].fish
        if (fishs.length == 0)
            return message.channel.send(embed.setDescription(translations['1034']))
        columnSize = 5
    } else fishs = (await needle('get', `https://fortniteapi.io/v1/loot/fish?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body.fish

    message.channel.startTyping()

    const xDefault = 50, yDefault = 175, yInterval = 100, imageSize = 100, imageMarginRight = 30, fontSizeDefault = 40
    var x = xDefault, y = yDefault, fontSize, xInterval = 500

    var fishsLength = fishs.length
    if (args[0] == 'collection') {
        xInterval = 350
        if (fishs.length <= columnSize*2) fishsLength = columnSize*3
    }


    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
    const canvas = await Canvas.createCanvas(Math.ceil(fishsLength/columnSize)*xInterval+2*xDefault, 200 + columnSize*100)
    const ctx = canvas.getContext('2d')

    with (ctx) {
        const gradient = createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#0093fb')
        gradient.addColorStop(1, '#014cbc')
        fillStyle = gradient
        fillRect(0, 0, canvas.width, canvas.height)

        font = '70px burbank'
        fillStyle = '#75c4f1'
        fillText(bot.user.username.toUpperCase(), canvas.width-measureText(bot.user.username.toUpperCase()).width-50, 130)

        fillStyle = '#fff'
        var text = translations['3052']
        if (args[0] == 'collection') text = translations['3053']
        fillText(text.toUpperCase(), 50, 130)
    
        for (const fish of fishs) {
            fontSize = fontSizeDefault; font = `${fontSize}px burbank`
            do font = `${fontSize--}px burbank`
            while (args[0] != 'collection' && measureText(fish.name.toUpperCase()).width > xInterval-imageSize-2*imageMarginRight)

            if (fishs.indexOf(fish) % columnSize == 0 && y != yDefault) {
                x += xInterval
                y = yDefault
            }

            const fishImage = await Canvas.loadImage(fish.image)
            drawImage(fishImage, x, y, imageSize, imageSize)

            text = fish.name.toUpperCase()
            if (args[0] == 'collection') text = `${fish.length} CM`

            fillText(text, x+imageSize+imageMarginRight, y+imageSize/1.5)
            y += yInterval
        }
    }

    await message.channel.send({ files: [ await canvas.toBuffer() ] })
    message.channel.stopTyping(true)
    if (args[0] != 'collection') message.channel.send(embed.setDescription(translations['1035'].replace('{prefix}', message.content.charAt(0))))
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Liste des poissons',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
