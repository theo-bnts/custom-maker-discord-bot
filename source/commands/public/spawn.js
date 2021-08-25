const Discord = require('discord.js')
const util = require('util')
const mysql = require('mysql')
const fs = require('fs')
const needle = require('needle')
const Canvas = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['ATTACH_FILES'])) return
    
    message.channel.startTyping()

    const translations = await getTranslations(message.guild, false, ['1009'])

    const pois = (await needle('get', `https://fortniteapi.io/v2/game/poi?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body.list
    const map = await Canvas.loadImage('https://media.fortniteapi.io/images/map.png')
    const rCity = pois[Math.round(Math.random()*pois.length)-1]

    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })

    const canvas = await Canvas.createCanvas(map.width, map.height)
    const ctx = canvas.getContext('2d')

    with (ctx) {
        drawImage(map, 0, 0, map.width, map.height)

        strokeStyle = '#111'
        lineWidth = 1
        fillStyle = '#fff'
        font = '55px burbank'
        fillText(bot.user.username.toUpperCase(), 100, canvas.width - 100)
        for (const poi of pois) {
            fillText(poi.name.toUpperCase(), poi.x-measureText(poi.name.toUpperCase()).width/2, poi.y+20)
            strokeText(poi.name.toUpperCase(), poi.x-measureText(poi.name.toUpperCase()).width/2, poi.y+20)
        }

        strokeStyle = '#fff'
        lineWidth = 25
        setLineDash([20, 10])
        beginPath()
        arc(rCity.x, rCity.y, 225, 0, 2 * Math.PI)
        stroke()
    }

    const fileName = Date.now()
    await fs.writeFileSync(`assets/temp/${fileName}.png`, canvas.toBuffer())
    const attachment = await new Discord.MessageAttachment(`assets/temp/${fileName}.png`)

    const poi = []
    for (const word of rCity.name.split(' ')) poi.push(`${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    const embed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setTitle(translations['1009'].replace('{poi}', poi.join(' ')))
        .setImage(`attachment://${fileName}.png`)
        .setThumbnail(rCity.images[rCity.images.length-1].url)

    await message.channel.send({ files: [attachment], embed: embed })
    message.channel.stopTyping(true)

    fs.unlinkSync(`assets/temp/${fileName}.png`)
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Carte actuelle avec ville aléatoire selectionée',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
