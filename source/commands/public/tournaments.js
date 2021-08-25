const { MessageEmbed } = require('discord.js')
const axios = require('axios')
const { registerFont, createCanvas, loadImage } = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ADD_REACTIONS'])) return

    const translations = await getTranslations(message.guild, false, ['0001', '3084'])

    const errorEmbed = new MessageEmbed()
        .setColor(config.embedsColor)
        .setTitle(translations['0001'])

    const { data } = await axios({
        method: 'get',
        url: 'https://fortniteapi.io/v1/events/list',
        params: {
            region: translations.region,
            lang: translations.lang
        },
        headers: {
            authorization: config.fortniteApiIo
        }
    })

    const futureTournaments = data
        .events
        .filter(t => new Date(t.endTime) > new Date())

    if (futureTournaments.length === 0)
        return message.channel.send(
            errorEmbed.setDescription('ERROR CODE: NO_FUTURE_TOURNAMENTS')
        )

    message.channel.startTyping()
    
    var windows = []
    
    for (const tournament of futureTournaments)
        for (const window of tournament.windows)
            if (new Date(window.endTime) > new Date()) {
                const copy = {}
                Object.assign(copy, tournament)
                copy.times = window
                windows.push(copy)
            }

    windows = windows.sort((a, b) => new Date(a.times.beginTime) - new Date(b.times.beginTime))

    const pages = []

    for (const i in windows) {
        if (i % 4 === 0) pages.push([])
        pages[pages.length - 1].push(windows[i])
    }

    const embeds = []

    await registerFont('./assets/fonts/font.otf', { family: 'burbank' })

    for (const page of pages) {
        const canvas = await createCanvas(2000, 900)
        const ctx = canvas.getContext('2d')

        with (ctx) {

            const g = createLinearGradient(0, 0, 0, canvas.height)
            g.addColorStop(0, '#0093fb')
            g.addColorStop(1, '#014cbc')
            fillStyle = g
            fillRect(0, 0, canvas.width, canvas.height)

            fillStyle = '#fff'

            font = '130px burbank'
            fillText(translations['3084'].toUpperCase(), (canvas.width - measureText(translations['3084'].toUpperCase()).width) / 2, 150)

            font = '50px burbank'
            fillText(bot.user.username.toUpperCase(), (canvas.width - measureText(bot.user.username.toUpperCase()).width) / 2, canvas.height - 50)

            const posters = {
                x: 160,
                y: 200,
                unit: {
                    height: 550,
                    width: 550 / 1.44,
                    offset: 50
                }
            }

            for (const window of page) {

                const x = posters.x + (posters.unit.width + posters.unit.offset) * page.indexOf(window)

                const poster = await loadImage(window.poster)
                drawImage(poster, x, posters.y, posters.unit.width, posters.unit.height)

                var fontSize = 50
                do font = `${fontSize--}px burbank`
                while (measureText(window.name_line1.toUpperCase()).width > posters.unit.width - 20)
                fillText(window.name_line1.toUpperCase(), x + (posters.unit.width - measureText(window.name_line1.toUpperCase()).width) / 2, posters.y + posters.unit.height - 180 + measureText('I').actualBoundingBoxAscent)

                fontSize = 50
                do font = `${fontSize--}px burbank`
                while (measureText(window.name_line2.toUpperCase()).width > posters.unit.width - 20)
                fillText(window.name_line2.toUpperCase(), x + (posters.unit.width - measureText(window.name_line2.toUpperCase()).width) / 2, posters.y + posters.unit.height - 100)

                font = '25px burbank'
                const beginDate = new Date(window.times.beginTime).toLocaleDateString(translations.lang, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()
                const endDate = new Date(window.times.endTime).toLocaleDateString(translations.lang, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()
                const date = beginDate === endDate ? beginDate : `${beginDate} - ${endDate}`
                fillText(date, x + (posters.unit.width - measureText(date).width) / 2, posters.y + posters.unit.height - 50)

                const beginTime = new Date(window.times.beginTime).toLocaleTimeString(translations.lang, { hour: '2-digit', minute:'2-digit' })
                const endTime = new Date(window.times.endTime).toLocaleTimeString(translations.lang, { hour: '2-digit', minute:'2-digit' })
                const display = beginTime + ' - ' + endTime
                fillText(display, x + (posters.unit.width - measureText(display).width) / 2, posters.y + posters.unit.height - 25)
            }

        }

        const logChannel = await bot.channels.cache.find(c => c.id === config.logChannel)
        const m = await logChannel.send({ files: [canvas.toBuffer()] })

        embeds.push(
            new MessageEmbed()
                .setColor(config.embedsColor)
                .setImage(m.attachments.first().url)
                .setFooter(`Page ${embeds.length+1}/${pages.length}`)
        )
    }

    message.channel.stopTyping(true)

    const embedMessage = await message.channel.send(embeds[0])

    embedMessage.react('◀️')
        .then(() => embedMessage.react('▶️'))
        .catch(() => { return embedMessage.edit(errorEmbed.setFooter('ERROR CODE : CANT_REACT')) })
    
    const filtre = async (reaction, user) => {
        if (user.id == message.author.id) {
            embedMessage.reactions.resolve(reaction._emoji.name).users.remove(user.id).catch(() => {})
            const pageNumber = Number(embedMessage.embeds[0].footer.text.replace('Page ', '').replace(`/${embeds.length}`, '')) - 1
            if (reaction._emoji.name == '◀️') {
                if (pageNumber > 0) {
                    embedMessage.edit(embeds[pageNumber - 1])
                }
            }
            if (reaction._emoji.name == '▶️') {
                if (pageNumber < embeds.length-1) {
                    embedMessage.edit(embeds[pageNumber + 1])  
                }
            }
        }
    }

    embedMessage.awaitReactions(filtre, { max: 1, time: 300000 })
        .then(() => {
            embedMessage.reactions.removeAll().catch(() => {})
        })
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Liste des tournois annoncés et recherche des règles / résultats',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
