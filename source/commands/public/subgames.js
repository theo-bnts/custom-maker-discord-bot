const Discord = require('discord.js')
const needle = require('needle')
const Canvas = require('canvas')
const canvasTxt = require('canvas-txt').default

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ATTACH_FILES'])) return

    const translations = await getTranslations(message.guild, false, ['1040', '1041'])
       
    const res = Object.values((await needle(
        'get',
        'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game',
        { headers: { 'Accept-Language': translations.lang } }
    )).body?.subgameinfo)

    const subgames = []
    for (const item of res)
        if (item.title)
            subgames.push(item)

    if (subgames?.length == 0) return message.channel.send(new Discord.MessageEmbed().setColor(config.embedsColor).setDescription(translations['0001']))
    else {
        message.channel.startTyping()

        const margin = 50, width = 512, height = 2*width, titleY = 160

        await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' });//
        const canvas = await Canvas.createCanvas((margin+width)*subgames.length+margin, titleY+2*margin+height)
        const ctx = canvas.getContext('2d')
        with (ctx) {
            const gradient = createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, '#0093fb')
            gradient.addColorStop(1, '#014cbc')
            fillStyle = gradient
            fillRect(0, 0, canvas.width, canvas.height)

            font = '150px burbank'
            fillStyle = '#fff'
            fillText(translations['3075'].toUpperCase(), margin, titleY)
            fillStyle = '#75c4f1'
            fillText(bot.user.username.toUpperCase(), canvas.width - margin - measureText(bot.user.username.toUpperCase()).width, titleY)

            const y = titleY + margin
            var x = margin

            for (const subgame of subgames) {
                lineWidth = 10
                strokeStyle = '#0093fb'
                rect(x, y, width, height)
                stroke()

                if (subgame.image) {
                    const image = await Canvas.loadImage(subgame.image)
                    drawImage(image, x, y, width, height)
                }

                fillStyle = '#fff'
                save()
                with (canvasTxt) {
                    font = 'burbank'
                    fontSize = 110
                    align = 'center'
                    vAlign = 'bottom'
                    text = drawText(ctx, subgame.title.toUpperCase(), x, y+height-300-150, width, 300)
                }
                restore()

                save()
                with (canvasTxt) {
                    font = 'burbank'
                    fontSize = 40
                    align = 'center'
                    vAlign = 'top'
                    text = drawText(ctx, subgame.description.toUpperCase(), x, y+height-115, width, 300)
                }
                restore()

                x += width + margin
            }
        }

        await message.channel.send({files: [canvas.toBuffer()]})
        message.channel.stopTyping(true)
    }
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Présentation des sous-jeux actuellement disponibles',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}