const Discord = require('discord.js')
const needle = require('needle')
const Canvas = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const translations = await getTranslations(message.guild, false, ['1037', '3073'])

    const req = (
        await needle(
            `https://fortniteapi.io/v2/shop/sections/active?lang=${translations.lang}`,
            { headers: {'Authorization': config.fortniteApiIo} }
        )
    ).body

    if (!req.list.some(i => i.apiTag === 'next'))
        return message.channel.send(new Discord.MessageEmbed().setColor(config.embedsColor).setDescription(translations['1037']))

    const tabs = req.list.find(i => i.apiTag === 'next').sections

    const alp = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase()
    const tabsAndQuantity = []

    for (var tab of tabs) {
        var tabName = ''

        if (tab.displayName) {
            tabName = tab.displayName
        } else {
            if (tab.id.endsWith('B'))
                tab.id = tab.id.slice(0, -1)

            if (!isNaN(tab.id[tab.id.length-1]))
                tab.id = tab.id.slice(0, -1)
            
            for (var i=0; i < tab.id.length; i++)
                if (i>0 && !alp.includes(tab.id[i-1]) && alp.includes(tab.id[i]))
                    tabName += ' ' + tab.id[i]
                else
                    tabName += tab.id[i]
        }

        var isSameAtAnotherTab = false
        for (const tab of tabsAndQuantity)
            if (tab[0] == tabName) {
                tab[1]++
                isSameAtAnotherTab = true
            }

        if (isSameAtAnotherTab != true)
            tabsAndQuantity.push([tabName, 1])
    }

    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
    const canvas = await Canvas.createCanvas(1000, tabsAndQuantity.length*4*50+150)
    const ctx = await canvas.getContext('2d')

    with (ctx) {
        const gradient = createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#0093fb')
        gradient.addColorStop(1, '#014cbc')
        fillStyle = gradient
        fillRect(0, 0, canvas.width, canvas.height)

        font = '100px burbank'

        fillStyle = '#fff'
        save()
        translate(measureText('I').actualBoundingBoxAscent+50, canvas.height/2)
        rotate(-Math.PI/2)
        textAlign = "center"
        fillText(translations['3073'].toUpperCase(), 0, 0)
        restore()

        const x = measureText('I').actualBoundingBoxAscent + 2*50

        var y = 50

        for (const tab of tabsAndQuantity) {
            fillStyle = '#031b58'
            drawRoundedRect(ctx, x, y, 15*50, 3*50, 25)

            fillStyle = '#fc3232'
            drawBubble(ctx, x, y, 25, 3*50, 25)

            
            const display = `${tab[0]} ${tab[1] > 1 ? 'x' + tab[1] : ''}`.toUpperCase()

            fillStyle = '#fff'

            var fontSize = 80

            do font = `${fontSize--}px burbank`
            while (measureText(display).width > 15*50-50)

            fillText(display, x+50, y+measureText('I').actualBoundingBoxAscent/2+1.5*50)
            y += 4*50
        }

        fillStyle = '#92eeff'
        font = '80px burbank'
        fillText(bot.user.username.toUpperCase(), canvas.width-50-measureText(bot.user.username.toUpperCase()).width, y+measureText('I').actualBoundingBoxAscent)
    }
    
    message.channel.send({files: [await canvas.toBuffer()]})

    async function drawRoundedRect (ctx, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2
        if (h < 2 * r) r = h / 2
        with (ctx) {
            beginPath()
            moveTo(x+r, y)
            arcTo(x+w, y,   x+w, y+h, r)
            arcTo(x+w, y+h, x,   y+h, r)
            arcTo(x,   y+h, x,   y,   r)
            arcTo(x,   y,   x+w, y,   r)
            fill()
        }
    }

    async function drawBubble (ctx, x, y, w, h, r) {
        if (w < r) r = w
        if (h < 2 * r) r = h / 2
        with (ctx) {
            beginPath()
            moveTo(x+r, y)
            lineTo(x+w, y,   x+w, y+h, r)
            lineTo(x+w, y+h, x,   y+h, r)
            arcTo(x,   y+h, x,   y,   r)
            arcTo(x,   y,   x+w, y,   r)
            fill()
        }
    }
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Découvrez en avance les catégories à venir dans la boutique',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
