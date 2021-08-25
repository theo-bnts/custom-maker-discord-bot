const Discord = require('discord.js')
const Canvas = require('canvas')
const needle = require('needle')
const humanizeDuration = require('humanize-duration')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ATTACH_FILES'])) return

    const translations = await getTranslations(message.guild, false, ['1032', '3049', '3050', '3051'])

    const embed =  new Discord.MessageEmbed().setColor(config.embedsColor)
    const seasons = (await needle('get', `https://fortniteapi.io/v1/seasons/list?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body.seasons

    await Canvas.registerFont('./assets/fonts/font.otf', { family: 'burbank' })

    if(args.length == 0) {
        const season = seasons[seasons.length-2]

        const interval = new Date(season.endDate) - new Date(season.startDate)
        const staying = new Date(season.endDate) - new Date()
        const displayStaying = await humanizeDuration(staying, { language: translations.lang, fallbacks: ['en'], round: true }).toUpperCase()
        const percent = Math.round(100-100*staying/interval)

        const canvas = await Canvas.createCanvas(1200, 500)
        const ctx = canvas.getContext('2d')

        with (ctx) {
            const gradient = createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, '#0093fb')
            gradient.addColorStop(1, '#014cbc')
            fillStyle = gradient

            fillRect(0, 0, canvas.width, canvas.height)

            strokeStyle = '#fff'
            lineWidth = 5
            fillStyle = '#fff'
            font = '90px burbank'

            fillText(season.displayName.toUpperCase(), (canvas.width - measureText(season.displayName.toUpperCase()).width)/2, 150)
            beginPath(); rect(95, 195, 1010, 110); stroke()
            fillRect(100, 200, percent*10, 100)

            font = '50px burbank'

            fillText(`${percent} %`, (canvas.width - measureText(`${percent} %`).width)/2, 265)
            beginPath()

            strokeStyle = gradient
            lineWidth = 2

            strokeText(`${percent} %`, (canvas.width - measureText(`${percent} %`).width)/2, 265)
            stroke()

            font = '40px burbank'
            fillStyle = '#fff'

            fillText(displayStaying, (canvas.width - measureText(displayStaying).width)/2, 375)
            fillText(bot.user.username.toUpperCase(), (canvas.width - measureText(bot.user.username).width)/2, 450)

            await message.channel.send({files: [await canvas.toBuffer()]})

            message.channel.send(embed.setDescription(translations['1032'].replace('{prefix}', message.content.charAt(0)).replace('{seasonsNumber}', seasons.length-1)))
        }
    } else {
        const maps = (await needle('get', 'https://fortniteapi.io/v1/maps/list', { headers: {'Authorization': config.fortniteApiIo} })).body.maps
        if (maps.some(m => m.patchVersion.split('.')[0] == args[0])) {
            const season = seasons.find(s => s.season == args[0])
            const seasonMaps = maps.filter(m => m.patchVersion.split('.')[0] == args[0])
            const mapImage = await Canvas.loadImage(seasonMaps[seasonMaps.length-1].url)
            
            const canvas = await Canvas.createCanvas(1700, 1125)
            const ctx = canvas.getContext('2d')
            
            with (ctx) {
                const gradient = createLinearGradient(0, 0, 0, canvas.height)
                gradient.addColorStop(0, '#0093fb')
                gradient.addColorStop(1, '#014cbc')
                fillStyle = gradient
                fillRect(0, 0, canvas.width, canvas.height)

                const mapSize = 900
                drawImage(mapImage, canvas.width - mapSize - 100, 100, mapSize, mapSize)

                fillStyle = '#fff'
                font = '60px burbank'
                fillText(season.displayName.toUpperCase(), 340-measureText(season.displayName.toUpperCase()).width/2, 325)

                font = '50px burbank'
                const options = { day: 'numeric', month: 'long', year: 'numeric' }
                const dates = `${new Date(season.startDate).toLocaleDateString(translations.lang, options)} - ${new Date(season.endDate).toLocaleDateString(translations.lang, options)}`
                fillText(dates.toUpperCase(), 340 - measureText(dates.toUpperCase()).width/2, 400)

                fillText(translations['3049'].toUpperCase(), 340 - measureText(translations['3049'].toUpperCase()).width/2, 575)
                fillText(season.patchList.length, 340 - measureText(season.patchList.length).width/2, 650)

                fillText(translations['3050'].toUpperCase(), 340 - measureText(translations['3050'].toUpperCase()).width/2, 750)
                fillText(seasonMaps.length, 340 - measureText(seasonMaps.length).width/2, 825)

                font = '40px burbank'
                fillText(bot.user.username.toUpperCase(), (canvas.width-measureText(bot.user.username.toUpperCase()).width)/2, 1085)

                return message.channel.send({files: [canvas.toBuffer()]})
            }
        } else message.channel.send(embed.setDescription(translations['3051']))
    }
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Informations sur une saison',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
