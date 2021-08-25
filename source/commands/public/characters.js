const needle = require('needle')
const Canvas = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['ATTACH_FILES']))
        return
    
    message.channel.startTyping()

    const map = await Canvas.loadImage('https://media.fortniteapi.io/images/map.png')
    const favicon = await Canvas.loadImage('assets/images/favicon.png')

    const characters = (
        await needle('https://fortniteapi.io/v2/game/npc/list?enabled=true&scale=2048',
            { headers: { Authorization: config.fortniteApiIo } }
        )
    ).body.npc
    
    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })

    const canvas = await Canvas.createCanvas(map.width, map.height)
    const ctx = canvas.getContext('2d')
    with (ctx) {
        drawImage(map, 0, 0, map.width, map.height)

        fillStyle = '#fff'
        font = '40px burbank'
        fillText(bot.user.username.toUpperCase(), 100, canvas.width - 100)

        for (const character of characters) {
            const image = await Canvas.loadImage(character.images.toast)

            for (const spawnLocation of character.spawnLocations)
                for (const location of spawnLocation.locations) {
                    
                    const size = 100

                    save()
                    beginPath()
                    arc(location.x, location.y, size / 2, 0, 2*Math.PI)
                    closePath()
                    clip()
    
                    drawImage(favicon, location.x - size / 2, location.y - size / 2, size, size)
                    drawImage(image, location.x - size / 2, location.y - size / 2, size, size)
    
                    restore()
                }
        }

    }

    await message.channel.send({ files: [ await canvas.toBuffer() ] })
    message.channel.stopTyping(true)
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Carte actuelle avec les personnages',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
