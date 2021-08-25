const Discord = require('discord.js')
const mysql = require('mysql')
const needle = require('needle')
const Canvas = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    const translations = await getTranslations(message.guild, false, ['1030', '1038', '1039'])

    const embed = new Discord.MessageEmbed().setColor(config.embedsColor)

    const connection = mysql.createConnection(config.mysql)
    connection.query(`SELECT * FROM users WHERE id_discord='${message.author.id}';`, async (err, results) => {
        if (results[0]?.id_epic && new Date(results[0].verification_date).getFullYear() > 2010) {
            const username = (await needle('get', `https://fortniteapi.io/v1/lookupUsername?id=${results[0].id_epic}`, { headers: {'Authorization': config.fortniteApiIo} })).body.accounts[0].username
            const seasons = (await needle('get', `https://fortniteapi.io/v1/seasons/list?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body.seasons

            var data = []
            for (var i=10; i<seasons.length; i++) {
                const season = (await needle('get', `https://fortnitetracker.com/api/v0/profile/${results[0].id_epic}/stats?season=${i}&isCompetitive=true`)).body
                if (season[0]?.arena)
                    data.push({season:season[0].season, division:season[0].arena.division.metadata, points:season[0].stats.all[0].value})
            }

            if (data.length == 0) return message.channel.send(new Discord.MessageEmbed().setColor(config.embedsColor).setDescription(translations['1038'].replace('{username}', username)))

            message.channel.startTyping()
            
            const canvas = await Canvas.createCanvas(1150, 220+data.length*100)
            const ctx = canvas.getContext('2d')
            await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })

            with (ctx) {
                var gradient = createLinearGradient(0, 0, 0, canvas.height)
                gradient.addColorStop(0, '#0093fb')
                gradient.addColorStop(1, '#014cbc')
                fillStyle = gradient
                fillRect(0, 0, canvas.width, canvas.height)
                
                fillStyle = '#fff'
                font = '70px burbank'
                fillText(translations['1039'].replace('{username}', username).toUpperCase(), 50, measureText('I').actualBoundingBoxAscent+50)

                fillStyle = '#92eeff'
                font = '40px burbank'
                fillText(bot.user.username.toUpperCase(), canvas.width-measureText(bot.user.username).width-50, canvas.height-40)

                font = '50px burbank'
                var y = 200

                gradient = createLinearGradient(500, 0, 1100, 0)
                gradient.addColorStop(0, '#fff')
                gradient.addColorStop(1, '#fff0')

                for (const d of data) {

                    strokeStyle = gradient
                    fillStyle = gradient
                    beginPath()
                    moveTo(500, y-55)
                    lineTo(500+600, y-55)
                    lineTo(500+600, y-55+75)
                    lineTo(500-50, y-55+75)
                    lineTo(500, y-55)
                    stroke(); fill()

                    const icon = await Canvas.loadImage(d.division.iconUrl)
                    drawImage(icon, 440, y-65, 80, 80)
                    
                    fillStyle = '#fff'
                    fillText(seasons.find(s => s.season == d.season).displayName.toUpperCase(), 50, y)

                    fillStyle = '#444'
                    fillText(`${d.division.categoryName} ∙ ${d.points} ⚡`, 525, y)

                    y += 100
                }
            }

            await message.channel.send({ files: [await canvas.toBuffer()] })

            message.channel.stopTyping(true)

        } else message.channel.send(embed.setDescription(translations['1030']))
            .then(m => m.react('📘'))
    })
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Vos points en arène',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}