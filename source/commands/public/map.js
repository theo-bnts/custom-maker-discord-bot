const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const fs = require('fs')
const needle = require('needle')
const Canvas = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['ATTACH_FILES'])) return
    
    message.channel.startTyping()

    var language = 'en'
    try {
        const connection = mysql.createConnection(config.mysql)
        const query = util.promisify(connection.query).bind(connection)
        language = (await query(`SELECT language FROM guild_settings WHERE id='${message.guild.id}'`))[0].language
    } catch (e) {}

    const map = await Canvas.loadImage('https://media.fortniteapi.io/images/map.png')
    const pois = (await needle('get', `https://fortniteapi.io/v2/game/poi?lang=${language}`, { headers: {'Authorization': config.fortniteApiIo} })).body.list
    const landmarks = (await needle('get', `https://fortniteapi.io/v2/game/poi?lang=${language}&type=landmark`, { headers: {'Authorization': config.fortniteApiIo} })).body.list
    
    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })

    const canvas = await Canvas.createCanvas(map.width, map.height)
    const ctx = canvas.getContext('2d')
    with (ctx) {
        drawImage(map, 0, 0, map.width, map.height)

        strokeStyle = '#111'
        lineWidth = 1

        fillStyle = '#fcdf03'
        font = '30px burbank'
        for (const landmark of landmarks) {
            fillText(landmark.name.toUpperCase(), landmark.x-measureText(landmark.name.toUpperCase()).width/2, landmark.y+20)
            strokeText(landmark.name.toUpperCase(), landmark.x-measureText(landmark.name.toUpperCase()).width/2, landmark.y+20)
        }

        fillStyle = '#fff'
        font = '40px burbank'
        fillText(bot.user.username.toUpperCase(), 100, canvas.width - 100)
        for (const poi of pois) {
            fillText(poi.name.toUpperCase(), poi.x-measureText(poi.name.toUpperCase()).width/2, poi.y+20)
            strokeText(poi.name.toUpperCase(), poi.x-measureText(poi.name.toUpperCase()).width/2, poi.y+20)
        }
    }

    await message.channel.send({ files: [ await canvas.toBuffer() ] })
    message.channel.stopTyping(true)
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Carte actuelle avec les sous-lieux',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
