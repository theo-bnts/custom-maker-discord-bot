const Discord = require('discord.js')
const Canvas = require('canvas')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const translations = await getTranslations(message.guild, false, ['1043', '3079', '3080'])

    const startEmbed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setImage('https://cdn.discordapp.com/attachments/747601010846859405/822509756752068668/1.png')
        .setFooter(translations['1043'])

    const m = await message.channel.send(startEmbed)

    setTimeout(() => { m.edit(startEmbed.setImage('https://cdn.discordapp.com/attachments/747601010846859405/822509758694555678/2.png')) }, 500)

    setTimeout(() => { m.edit(startEmbed.setImage('https://cdn.discordapp.com/attachments/747601010846859405/822509760011436122/3.png')) }, 1000)
    
    const margin = 50

    const canvas = await Canvas.createCanvas(margin+(256+margin) * 3, 150+256+1.5*margin)
    const ctx = canvas.getContext('2d')

    await Canvas.registerFont('./assets/fonts/font.otf', { family: 'burbank' })

    const cosmetics = (await needle('get', 'https://fortniteapi.io/v1/items/list', { headers: {'Authorization': config.fortniteApiIo} })).body.items.loadingscreen

    const items = []
    for (var i=0; i<3; i++)
        items.push(cosmetics[Math.floor(Math.random() * 10)+10])

    const logChannel = await bot.channels.cache.find(c => c.id == config.logChannel)

    with (ctx) {
        const gradient = createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#0093fb')
        gradient.addColorStop(1, '#014cbc')
        fillStyle = gradient
        fillRect(0, 0, canvas.width, canvas.height)

        fillStyle = '#fff'
        font = '35px burbank'
        fillText(bot.user.username.toUpperCase(), (canvas.width-measureText(bot.user.username.toUpperCase()).width)/2, canvas.height-25)

        const y=150; var x=margin
        for (const item of items) {
            const gradient = createLinearGradient(0, y, 0, y+256)
            gradient.addColorStop(0, '#fce157')
            gradient.addColorStop(1, '#b58225')
            fillStyle = gradient
            fillRect(x, y, 256, 256)

            x+=256+margin
        }

        x=margin
        for (const item of items) {
            const image = await Canvas.loadImage(item.images.icon)
            drawImage(image, x, y, 256, 256)

            if (item.id == items[items.length-1].id) {
                var text = translations['3080'].toUpperCase()
                if ((items[0] == items[1] && items[1] == items[2])) text = translations['3079'].toUpperCase()

                fillStyle = '#fff'
                font = '100px burbank'
                fillText(text, (canvas.width-measureText(text).width)/2, y - margin/1.5)

                await sleep(2000)
            }

            const url = (await logChannel.send({files: [canvas.toBuffer()]})).attachments.first().url
            m.edit(startEmbed.setImage(url))

            x+=256+margin
        }
    }
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Mini jeu de casino',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
