const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const fs = require('fs')
const needle = require('needle')
const Canvas = require('canvas')
const humanizeDuration = require('humanize-duration')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    var translations
    try {
        const connection = mysql.createConnection(config.mysql)
        const query = util.promisify(connection.query).bind(connection)
        const language = (await query(`SELECT language FROM guild_settings WHERE id='${message.guild.id}'`))[0].language
        if (fs.existsSync(`assets/translations/${language}.json`)) translations = await require(`../../assets/translations/${language}.json`)
        else translations = require('../../assets/translations/en.json')
    } catch (e) {}

    const embed = new Discord.MessageEmbed().setColor(config.embedsColor)
    const connection = mysql.createConnection(config.mysql)
    const query = util.promisify(connection.query).bind(connection)
    var account, urls = []

    if (message.mentions.users.first()) {
        const results = (await query(`
            SELECT id_epic, YEAR(verification_date) AS vd
            FROM users
            WHERE id_discord='${message.mentions.users.first().id}'`)
        )[0]
        if (results && results.vd > 2010) account = results.id_epic
        else return message.channel.send(embed.setDescription(translations['1001']))
    } else {
        if (args[0]) {
            account = (await needle('get', `https://fortniteapi.io/v1/lookup?username=${encodeURI(args.join(' '))}`, { headers: {'Authorization': config.fortniteApiIo} })).body.account_id
            if (!account) return message.channel.send(embed.setDescription(translations['1002']))
        } else {
            const results = (await query(`
                SELECT id_epic, YEAR(verification_date) AS vd
                FROM users
                WHERE id_discord='${message.author.id}'`)
            )[0]
            if (results && results.vd > 2010) account = results.id_epic
            else {
                return message.channel.send(
                    embed.setDescription(
                        translations['0002']
                            .replace('{p}', message.content.charAt(0))
                            .replace('{c}', 'stats')
                            .replace('{a}', '[pseudo]')
                    )
                )
            }
        }
    }

    for (const round of [['3014', ''], ['3015', '&season=current']]) {
        const fres = (await needle('get', `https://fortniteapi.io/v1/stats?account=${account}${round[1]}`, { headers: {'Authorization': config.fortniteApiIo} })).body

        if (!fres || !fres.global_stats)
            return message.channel.send(embed.setDescription(translations['1002']))

        message.channel.startTyping()

        var icon
        try {
            icon = await Canvas.loadImage(`assets/images/${Object.keys(fres.per_input)[0]}.png`)
        } catch (e) {
            icon = await Canvas.loadImage(`assets/images/keyboardmouse.png`)
        }
            
        try { await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' }) } catch (e) {}
        const canvas = await Canvas.createCanvas(1960, 1100)
        const ctx = canvas.getContext('2d')

        with (ctx) {
            const gradient = createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, '#0093fb')
            gradient.addColorStop(1, '#014cbc')
            fillStyle = gradient
            fillRect(0, 0, canvas.width, canvas.height)

            strokeStyle = '#fff'
            lineWidth = 10
            fillStyle = '#fff'
            drawRoundedRect(ctx, 30, 30, 750, 200, 25)

            drawImage(icon, 70, 70, 120, 120)
            
            drawText(ctx, fres.name, 215, 95, 100, 550)

            font = '70px burbank'
            fillStyle = '#92eeff'
            fillText(translations[round[0]].toUpperCase(), 215, 210)

            const tres = (await needle('get', `https://api.fortnitetracker.com/v1/powerrankings/global/global/${encodeURI(fres.name)}`, { headers: { 'TRN-Api-Key': config.fortniteTracker } })).body
            if (!tres) tres = {}

            const texts = [
                [translations['3001'], tres.points || 0],
                [translations['3002'], tres.rank || 0],
                [translations['3003'], tres.cashPrize || 0],
                [translations['3004'], fres.account.level],
            ]

            texts[2][1] += '$'

            for (var i=0; i<texts.length+1; i++) {
                const x = 30+750+30+100+(30+200)*i

                save()
                beginPath()
                arc(x, 30+100, 100, 0, 2*Math.PI)
                stroke()

                if (texts[i]) {
                    fillStyle = '#92eeff'
                    drawText(ctx, texts[i][0].toUpperCase(), x, 170, 60, 140, true)

                    fillStyle = '#fff'
                    drawText(ctx, texts[i][1], x, 100, 70, 130, true)
                } else {
                    const avatar = await Canvas.loadImage(bot.user.avatarURL({ format: 'png' }))

                    closePath()
                    clip()
                    drawImage(avatar, x-200/2, 30+100-200/2, 200, 200)
                    restore()

                    beginPath()
                    arc(x, 30+100, 100, 0, 2*Math.PI)
                    stroke()
                }
            }

            const modes = [
                [translations['3005'], 'solo'],
                [translations['3006'], 'duo'],
                [translations['3007'], 'squad'],
                [translations['3008'], 'overall']
            ]

            for (const mode of modes) {
                if (!fres.global_stats[mode[1]])
                    fres.global_stats[mode[1]] = {
                        score: 0,
                        matchesplayed: 0,
                        placetop1: 0,
                        winrate: 0,
                        kills: 0,
                        kd: 0,
                        minutesplayed: 0
                    }
            }

            for (const mode of modes) {
                if (mode[1] != 'overall')
                    for (const key of Object.keys(fres.global_stats[mode[1]])) {
                        fres.global_stats.overall[key] += fres.global_stats[mode[1]][key]
                    }
            }

            for (const key of ['winrate', 'kd'])
                fres.global_stats.overall[key] = fres.global_stats.overall[key]/3

            const statsNames = [translations['3009'], translations['3010'], translations['3011'], `${translations['3011'].slice(0, 4)}. (%)`, translations['3012'], 'k/d', translations['3013']]

            for (var i=0; i<modes.length; i++) {
                const roundRectWidth = (canvas.width-30)/modes.length-30
                drawRoundedRect(ctx, 30+i*(30+roundRectWidth), 260, roundRectWidth, canvas.height-290, 25)
                
                const d = humanizeDuration(fres.global_stats[modes[i][1]].minutesplayed*60*1000, { language: translations.lang, largest: 1 })

                const stats = [
                    fres.global_stats[modes[i][1]].score,
                    fres.global_stats[modes[i][1]].matchesplayed,
                    fres.global_stats[modes[i][1]].placetop1,
                    Math.round((fres.global_stats[modes[i][1]].winrate + Number.EPSILON) * 100) / 100,
                    fres.global_stats[modes[i][1]].kills,
                    Math.round((fres.global_stats[modes[i][1]].kd + Number.EPSILON) * 100) / 100,
                    d.toUpperCase().replace(' ', '').substring(0, d.match(/\d+/)[0].length + 1)
                ]

                font = '80px burbank'
                fillText(modes[i][0].toUpperCase(), 30+i*(30+roundRectWidth)+(roundRectWidth-measureText(modes[i][0].toUpperCase()).width)/2, 340)
                
                font = '70px burbank'
                for (var j=0; j<stats.length; j++) {
                    fillStyle = '#92eeff'
                    fillText(statsNames[j].toUpperCase().length < 10 ? statsNames[j].toUpperCase() : `${statsNames[j].toUpperCase().slice(0, 4)}.`, 30+i*(30+roundRectWidth)+30, 370+50+j*100)

                    fillStyle = '#fff'
                    fillText(stats[j], i*(30+roundRectWidth)+roundRectWidth-measureText(stats[j]).width, 370+50+j*100)
                }
            }
        }
        
        if (message.channel.permissionsFor(message.guild.me).has(['MANAGE_WEBHOOKS'])) {
            const channel = bot.channels.cache.find(c => c.id == config.logChannel)
            const m = await channel.send({ files: [canvas.toBuffer()] })
            urls.push(m.attachments.first().url)

            if (round[1].length > 0) {
                var webhook = await message.channel.createWebhook(bot.user.username, {
                    avatar: bot.user.avatarURL(),
                })
            
                await webhook.send({
                    embeds: [
                        {
                            color: config.embedsColor,
                            url: "https://twitter.com",
                            image: {
                                url: urls[0]
                            }
                        },
                        {
                            url: "https://twitter.com",
                            image: {
                                url: urls[1]
                            }
                        }
                    ]
                })

                webhook.delete()
            }
        } else await message.channel.send({ files: [canvas.toBuffer()] })

        message.channel.stopTyping()
    }

    async function drawRoundedRect (ctx, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2
        if (h < 2 * r) r = h / 2
        with (ctx) {
            beginPath()
            moveTo(x+r, y)
            arcTo( x+w, y,   x+w, y+h, r)
            arcTo( x+w, y+h, x,   y+h, r)
            arcTo( x,   y+h, x,   y,   r)
            arcTo( x,   y,   x+w, y,   r)
            stroke()
        }
    }

    async function drawText (ctx, text, x, y, defaultFontSize, maxWidth, isCenter) {
        with (ctx) {
            do font = `${defaultFontSize--}px burbank`
            while (measureText(text).width > maxWidth)
            const textHeight = measureText('I').actualBoundingBoxAscent + measureText('I').actualBoundingBoxDescent
            if (isCenter) x -= measureText(text).width/2
            fillText(text, x, y+textHeight/2)
        }
    }
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Statistique d\'un compte',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
