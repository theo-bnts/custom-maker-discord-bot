const Canvas = require('canvas')
const { stringify } = require('qs')
const { request } = require('axios')
const { MessageEmbed } = require('discord.js')

module.exports.run = async (bot, config, message, args, prefix) => {

    const { data } = await request({
        method: 'get',
        baseURL: 'https://fortniteapi.io/',
        url: 'v2/maps/items/list',
        params: {
            displayName: true
        },
        headers: {
            Authorization: config.fortniteApiIo
        }
    })

    const ids = [
        ...new Set(
            data.items.map(i => i.mappedType.type)
        )
    ]

    const displayNames = ids.map(id => {
        const item = data.items.find(i => i.mappedType.type === id)
        return Format(item.mappedType.displayName ? item.mappedType.displayName : id)
    })

    const emojis = ['🟩']

    for (var i = 0; i < ids.length - 1; i++)
        emojis.push('🔹')

    const reply = await message.channel.send(
        new MessageEmbed()
            .setColor(config.embedsColor)
            .setTitle('Choose the object whose locations you want to see')
            .setDescription(ids.map(id => emojis[ids.indexOf(id)] + ' ' + displayNames[ids.indexOf(id)]).join('\n'))
    )

    for (const emoji of '🔼🔽✅')
        reply.react(emoji)

    const filter = (reaction, user) => '🔼🔽✅'.includes(reaction.emoji.name) && user.id === message.author.id

    const collector = reply.createReactionCollector(filter, { time: 5 * 60 * 1000 })

    collector.on('collect', collected => {
        const greenPosition = emojis.indexOf('🟩')

        const emoji = collected.emoji.name

        reply.reactions.resolve(emoji).users.remove(message.author.id)

        switch (emoji) {
            case '🔼':
                if (greenPosition > 0) {
                    emojis[greenPosition] = '🔹'
                    emojis[greenPosition - 1] = '🟩'
                }
                break

            case '🔽':
                if (greenPosition < ids.length - 1) {
                    emojis[greenPosition] = '🔹'
                    emojis[greenPosition + 1] = '🟩'
                }
                break

            case '✅':
                reply.edit(
                    new MessageEmbed()
                        .setColor(config.embedsColor)
                        .setImage('https://cdn.discordapp.com/attachments/747601010846859405/801458078913789972/loading.png')
                )
                reply.reactions.removeAll()
                return createImageAndEditReply(ids[greenPosition])
        }

        reply.edit(
            reply
                .embeds[0]
                .setDescription(
                    ids.map(id => emojis[ids.indexOf(id)] + ' ' + displayNames[ids.indexOf(id)]).join('\n')
                )
        )
    })

    collector.on('end', () => reply.reactions.removeAll())

    async function createImageAndEditReply(id) {
        const logs = await bot.channels.cache.find(c => c.id === config.logChannel)

        await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
    
        const map = await Canvas.loadImage(
            'https://media.fortniteapi.io/images/map.png?' + stringify({
                lang: 'fr',
                showPOI: true
            })
        )
        
        const icon = await Canvas.loadImage('assets/images/map_pointer.png')

        const { data } = await request({
            method: 'get',
            baseURL: 'https://fortniteapi.io/',
            url: 'v2/maps/items/list',
            params: {
                coordinates: 'map',
                type: id,
                displayName: true
            },
            headers: {
                Authorization: config.fortniteApiIo
            }
        })
    
        const canvas = await Canvas.createCanvas(map.width, map.height)
        const ctx = canvas.getContext('2d')
    
        with (ctx) {
            drawImage(map, 0, 0, canvas.width, canvas.height)
        
            font = '70px burbank'
            fillStyle = '#fff'
            fillText(bot.user.username.toUpperCase(), 100, canvas.width - 100)
           
            for (const object of data.items) {
                if (object.mappedType.displayName)
                    id = object.mappedType.displayName

                drawImage(icon, object.location.x - 50, object.location.y - 100, 100, 100)
            }
        }
    
        const log = await logs.send({
            files: [canvas.toBuffer()]
        })
    
        reply.edit(
            new MessageEmbed()
                .setColor(config.embedsColor)
                .setTitle(displayNames[ids.indexOf(id)])
                .setImage(log.attachments.first().url)
        )
    }
}

function Format (str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace('_', ' ')
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Cartes avec position des éléments (coffres, pièces d\'xp ...)',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}