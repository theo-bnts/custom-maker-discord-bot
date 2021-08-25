const Discord = require('discord.js')
const Canvas = require('canvas')
const needle = require('needle')
const canvasTxt = require('canvas-txt').default

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ATTACH_FILES'])) return

    const translations = await getTranslations(message.guild, false, ['0001', '3040', '3078'])

    if (args[0]) {
        const c = args.join('').replace(/\D/g,'')
        const island = (await needle('get', 'https://fortniteapi.io/v1/creative/island?code='+encodeURI(`${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`), { headers: {'Authorization': config.fortniteApiIo} })).body

        if (!island.result)
            return message.channel.send(
                new Discord.MessageEmbed()
                    .setColor(config.embedsColor)
                    .setDescription(translations['0001'])
                    .setFooter('ERROR CODE: MAP_NOT_FOUND')
            )

        message.channel.send(
            new Discord.MessageEmbed()
                .setColor(config.embedsColor)
                .setTitle(island.island.title)
                .setDescription(`${island.island.description}\n\n*${translations['3040'].charAt(0).toUpperCase()}${translations['3040'].slice(1)} ${island.island.creator}*`)
                .setThumbnail(island.island.islandPlotTemplate.image)
                .setImage(island.island.image)
                .setFooter(`CODE : ${island.island.code}`)
                .setTimestamp(new Date(island.island.publishedDate))
        )
    } else {
        message.channel.startTyping()

        const featuredIslands = (await needle('get', 'https://fortniteapi.io/v1/creative/featured', { headers: {'Authorization': config.fortniteApiIo} })).body.featured

        const margin = 50; var x = margin, y = 200

        const canvas = await Canvas.createCanvas(1500, 200+(225+margin)*featuredIslands.length+margin)
        const ctx = canvas.getContext('2d')

        await Canvas.registerFont('./assets/fonts/font.otf', { family: 'burbank' })

        with (ctx) {
            const gradient = createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, '#0093fb')
            gradient.addColorStop(1, '#014cbc')
            fillStyle = gradient
            fillRect(0, 0, canvas.width, canvas.height)

            fillStyle = '#fff'
            font = '200px burbank'
            fillText(translations['3078'].toUpperCase(), margin, y)

            y += margin

            font = '50px burbank'
            fillText(bot.user.username.toUpperCase(), canvas.width-measureText(bot.user.username.toUpperCase()).width-20, canvas.height-20)

            for (const island of featuredIslands) {
                const image = await Canvas.loadImage(island.image)
                drawImage(image, x, y, image.width/4, image.height/4)

                const borders = await Canvas.loadImage('assets/images/islands_borders.png')
                drawImage(borders, x, y, image.width/4, image.height/4)

                fillStyle = '#fff'
                font = '60px burbank'
                const titleH = measureText('I').actualBoundingBoxAscent
                fillText(island.title.toUpperCase(), x + image.width/4 + margin,  y + titleH)

                fillStyle = '#34f1ff'
                with (canvasTxt) {
                    font = 'burbank'
                    fontSize = 35
                    align = 'left'
                    vAlign = 'top'
                    drawText(ctx, island.description.toUpperCase(), x + image.width/4 + margin,  y + titleH + margin/4, canvas.width-3*margin-image.width/4, 500)
                }

                fillStyle = '#fff'
                font = '35px burbank'
                fillText('CODE: ' + island.code.toUpperCase(), x + image.width/4 + margin, y + image.height/4)

                y += image.height/4 + margin
            }
        }

        await message.channel.send({ files: [canvas.toBuffer()] })
        message.channel.stopTyping(true)

        const embedHow = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setDescription(`Pour rechercher une île, tapez \`${message.content.charAt(0)}islands [code de l'île]\`.`)
        return message.channel.send(embedHow)
    }
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Îles à la unes et recherche d\'îles',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
