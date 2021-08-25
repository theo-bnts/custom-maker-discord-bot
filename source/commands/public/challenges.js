const Discord = require('discord.js')
const util = require('util')
const mysql = require('mysql')
const needle = require('needle')
const Canvas = require('canvas')
const canvasTxt = require('canvas-txt').default

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['ATTACH_FILES'])) return

    const translations = await getTranslations(message.guild, false, ['1010'])

    var bundles = (await needle('get', `https://fortniteapi.io/v2/challenges?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body.bundles
    bundles = await bundles.filter(b => b.quests.length > 1 && b.id.startsWith('MissionBundle_S'))

    const emojis = ['✅']; for (var i=1; i<bundles.length; i++) emojis.push('🔹')
    var description = ''; for (var i=0; i<bundles.length; i++) description += `${emojis[i]} ${bundles[i].name}\n`
    
    const embed = new Discord.MessageEmbed().setColor(config.embedsColor).setTitle(translations['1010']).setDescription(description)
    const m = await message.channel.send(embed)
    m.react('🔼')
        .then(() => {
            m.react('🔽')
            m.react('✅')
        })
        .catch(() => { return })

    const filtre = async (reaction, user) => {
        if (user.id != message.author.id) return
        m.reactions.resolve(reaction._emoji.name).users.remove(user.id).catch(() => {})
        const p = emojis.indexOf('✅')
        if (reaction._emoji.name == '🔼' || reaction._emoji.name == '🔽') {
            if (reaction._emoji.name == '🔼' && p > 0) {
                emojis[p] = '🔹'
                emojis[p-1] = '✅'
            }
            if (reaction._emoji.name == '🔽' && p <= emojis.length-2) {
                emojis[p] = '🔹'
                emojis[p+1] = '✅'
            }
            description = ''; for (var i=0; i<emojis.length; i++) description += `${emojis[i]} ${bundles[i].name}\n`
            m.edit(embed.setDescription(description))
        } else if (reaction._emoji.name == '✅') {
            embed.title = null; embed.description = null
            m.edit(embed.setImage('https://cdn.discordapp.com/attachments/747601010846859405/801458078913789972/loading.png'))
            m.reactions.removeAll().catch(() => {})
            createImage(bundles[p])
        }
    }

    return m.awaitReactions(filtre, { max: 1, time: 300000 }).then(() => { return m.reactions.removeAll() })

    async function createImage(choicedWeek) {
        const xShift = 200, yInterval = 25, heightSize = 200, fontSize = 65, boxPadding = 25, xpIconSize = 120, radius = 25
        var y = 200, subLevel = 1

        const canvas = await Canvas.createCanvas(2000, 220+(heightSize+yInterval)*choicedWeek.quests.length)
        const ctx = canvas.getContext('2d')
        await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
        const favicon = await Canvas.loadImage('assets/images/favicon.png')
        const xp = await Canvas.loadImage('assets/images/xp.png')

        with (ctx) {
            const gradient = createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, '#0093fb')
            gradient.addColorStop(1, '#014cbc')
            fillStyle = gradient
            fillRect(0, 0, canvas.width, canvas.height)

            font = '70px burbank'
            fillStyle = '#fff'
            fillText(choicedWeek.name.toUpperCase(), 50, 130)

            fillStyle = '#75c4f1'
            fillText(bot.user.username.toUpperCase(), canvas.width-measureText(bot.user.username.toUpperCase()).width-50, 130)

            for (const quest of choicedWeek.quests) {
                if (quest.parentQuest) subLevel++
                else {
                    subLevel = 1
                    drawImage(favicon, 20, y, xpIconSize, xpIconSize)

                    if (quest.tandemCharacter?.images?.toast) {
                        const toast = await Canvas.loadImage(quest.tandemCharacter.images.toast)
                        drawImage(toast, 20, y, xpIconSize, xpIconSize)
                    }
                }

                fillStyle = '#031b58'
                drawRoundedRect(ctx, subLevel*xShift, y, canvas.width-xShift*(subLevel+1), heightSize, radius)

                fillStyle = '#ce59ff'
                drawBubble(ctx, subLevel*xShift, y, radius, heightSize, radius)

                beginPath()
                moveTo(subLevel*xShift-50, y+30)
                lineTo(subLevel*xShift, y+30)
                lineTo(subLevel*xShift, y+30+40)
                lineTo(subLevel*xShift-50, y+30)
                fill()

                font = '45px burbank'
                fillText(`/ ${quest.progressTotal}`, canvas.width-xShift-boxPadding-measureText(`/ ${quest.progressTotal}`).width, y+heightSize-boxPadding)
                
                fillStyle = '#fff'
                fillText(quest.reward.xp, canvas.width-(xShift+measureText(quest.reward.xp).width)/2, y+heightSize-15)
                drawImage(xp, canvas.width-(xShift+xpIconSize)/2, y+15, xpIconSize, xpIconSize)
                fillText(0, canvas.width-xShift-boxPadding-measureText(`0 / ${quest.progressTotal}`).width, y+heightSize-boxPadding)

                fillStyle = '#75c4f1'
                canvasTxt.fontSize = fontSize
                canvasTxt.font = 'burbank'
                canvasTxt.align = 'left'
                canvasTxt.vAlign = 'top'
                canvasTxt.drawText(ctx, quest.name, subLevel*xShift+boxPadding+radius, y+boxPadding, canvas.width-xShift*(subLevel+1)-2*boxPadding-radius, heightSize-2*boxPadding)

                y += heightSize + yInterval
            }
        }

        const i = await bot.channels.cache.find(c => c.id == config.logChannel).send({files: [canvas.toBuffer()]})
        m.edit(new Discord.MessageEmbed().setColor(config.embedsColor).setImage(i.attachments.first().url))
    }

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
    description: 'Défi hebdomadaire en cours',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
