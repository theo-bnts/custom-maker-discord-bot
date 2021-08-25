const Discord = require('discord.js')
const needle = require('needle')
const Canvas = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const translations = await getTranslations(message.guild, false, ['0001', '3074'])

    const regions = {
        'us-east': 'NAE',
        'us-central': 'NAE',
        'us-west': 'NAW',
        'us-south': 'NAW',
        'brazil': 'BR',
        'europe': 'EU',
        'eu-central': 'EU',
        'eu-west': 'EU',
        'amsterdam': 'EU',
        'frankfurt': 'EU',
        'singapore': 'ASIA',
        'russia': 'ASIA',
        'japan': 'ASIA',
        'southafrica': 'ASIA',
        'india': 'ASIA',
        'dubai': 'ASIA',
        'sydney': 'OCE',
        'hongkong': 'CN',
        'london': 'EU'
    }

    const modes = (await needle('get', `https://fortniteapi.io/v1/game/modes?region=${regions[message.guild.region]}&lang=${translations.lang}&enabled=true`, { headers: {'Authorization': config.fortniteApiIo} })).body?.modes

    if (modes?.length == 0) return message.channel.send(new Discord.MessageEmbed().setColor(config.embedsColor).setDescription(translations['0001']))
    else {
        message.channel.startTyping()

        const categories = []
        var precedentPriority = 1000
        for (const mode of modes) {
            if (mode.priority < precedentPriority)
                categories.push([])
            categories[categories.length-1].push(mode)
            precedentPriority = mode.priority
        }

        const indexLongest = categories
            .map(a=>a.length)
            .indexOf(Math.max(...categories.map(a=>a.length)))

        const
            margin = 100, 
            interval = 50,
            titleY = margin + 150
            modeSize = 512

        await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
        const canvas = await Canvas.createCanvas(2*margin + categories[indexLongest].length*(modeSize+interval) - interval, titleY + 2*margin + categories.length*(modeSize+margin) - margin)
        const ctx = canvas.getContext('2d')
        with (ctx) {
            const gradient = createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, '#0093fb')
            gradient.addColorStop(1, '#014cbc')
            fillStyle = gradient
            fillRect(0, 0, canvas.width, canvas.height)

            font = '150px burbank'
            fillStyle = '#fff'
            fillText(translations['3074'].toUpperCase(), margin, titleY)
            fillStyle = '#75c4f1'
            fillText(bot.user.username.toUpperCase(), canvas.width - margin - measureText(bot.user.username.toUpperCase()).width, titleY)

            var x = margin, y = titleY + margin
            for (const category of categories) {
                for (const mode of category) {
                    lineWidth = 8
                    strokeStyle = '#0093fb'
                    rect(x, y, modeSize, modeSize)
                    stroke()

                    if (mode.image) {
                        try {
                            const image = await Canvas.loadImage(mode.image)
                            drawImage(image, (image.width-modeSize)/2, 0, image.height, image.height, x, y, modeSize, modeSize)
                        } catch (e) {}
                    }

                    fillStyle = '#0007'
                    if (mode.team?.length) {
                        fillRect(x, y+2*(modeSize/3), modeSize, modeSize/3)
    
                        if (mode.matchmakingIcon) {
                            try {
                                const image = await Canvas.loadImage(mode.matchmakingIcon)
                                drawImage(image, x+interval/2, y+modeSize-interval/2-50, 60, 60)
                            } catch (e) {}
                        }
    
                        fillStyle = '#fff'

                        if (!mode.name) mode.name = 'unknown'
                        var fontSize = 60
                        do { font = `${fontSize--}px burbank` }
                        while (measureText(mode.name.toUpperCase()).width > modeSize - interval)
                        fillText(mode.name.toUpperCase(), x+interval/2, y+2*(modeSize/3)+interval/2+measureText('I').actualBoundingBoxAscent)

                        font = '60px burbank'
                        fillText(mode.team.toUpperCase(), x+interval+50, y+modeSize-interval/2)
                    } else {
                        fillRect(x, y+modeSize-50-interval, modeSize, 50+interval)

                        fillStyle = '#fff'
                        if (mode.matchmakingIcon) {
                            try {
                                const image = await Canvas.loadImage(mode.matchmakingIcon)
                                drawImage(image, x+interval/2, y+modeSize-interval/2-50, 60, 60)
                            } catch (e) {}

                            if (!mode.name) mode.name = 'unknown'
                            var fontSize = 60
                            do { font = `${fontSize--}px burbank` }
                            while (measureText(mode.name.toUpperCase()).width > modeSize - interval - 50)
                            fillText(mode.name.toUpperCase(), x+interval+50, y+modeSize-interval/2)
                        } else {
                            if (!mode.name) mode.name = 'unknown'
                            var fontSize = 60
                            do { font = `${fontSize--}px burbank` }
                            while (measureText(mode.name.toUpperCase()).width > modeSize - interval)
                            fillText(mode.name.toUpperCase(), x+interval/2, y+modeSize-interval/2)
                        }
                    }

                    x += modeSize + interval
                }
                y += modeSize + margin
                x = margin
            }
        }

        await message.channel.send({files: [canvas.toBuffer()]})
        message.channel.stopTyping(true)
    }
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Liste des modes activés',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}