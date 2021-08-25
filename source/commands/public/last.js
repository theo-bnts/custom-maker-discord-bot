const Discord = require('discord.js')
const mysql = require('mysql')
const needle = require('needle')
const Canvas = require('canvas')

module.exports.run = async (bot, config, message, args) => {
    const entitles = ['3043', '3044', '3013', '3045', '3046', '3012', '3048', '3009']
    const topSacale = ['1', '3', '5', '6', '10', '12', '25']
    const translations = await getTranslations(message.guild, false, entitles.concat(['1030', '1031', '3042']))

    const embed = new Discord.MessageEmbed().setColor(config.embedsColor)

    const connection = mysql.createConnection(config.mysql)
    connection.query(`SELECT * FROM users WHERE id_discord='${message.author.id}';`, async (err, results) => {
        if (results[0] && results[0].id_epic && new Date(results[0].verification_date).getFullYear() > 2010) {
            const res = (await needle('get', `https://fortniteapi.io/v1/matches?account=${results[0].id_epic}&lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body
            const matches = res.matches.filter(m => m.platform != 'bp')
            if (matches.length > 0) {
                const heightSize = 50

                const canvas = await Canvas.createCanvas(2000, 270+heightSize*matches.length)
                const ctx = canvas.getContext('2d')
                await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })

                with (ctx) {
                    const gradient = createLinearGradient(0, 0, 0, canvas.height)
                    gradient.addColorStop(0, '#0093fb')
                    gradient.addColorStop(1, '#014cbc')
                    fillStyle = gradient
                    fillRect(0, 0, canvas.width, canvas.height)

                    font = '70px burbank'
                    fillStyle = '#fff'
                    fillText(translations['3042'].toUpperCase(), 50, 130)

                    fillStyle = '#75c4f1'
                    fillText(bot.user.username.toUpperCase(), canvas.width-measureText(bot.user.username.toUpperCase()).width-50, 130)

                    fillStyle = '#fff'
                    font = '30px burbank'

                    var offset = 0
                    for (var i=0; i<entitles.length; i++) {
                        if (i==5) offset += 130
                        else if (i==6) {
                            for (var j=0; j<topSacale.length; j++)
                                fillText(`${translations[entitles[i]].toUpperCase()} ${topSacale[j]}`, 50+i*130+offset+j*130, 220)
                            offset += 130*6
                        }
                        
                        fillText(translations[entitles[i]].toUpperCase().length < 8 ? translations[entitles[i]].toUpperCase() : `${translations[entitles[i]].toUpperCase().slice(0, 4)}.`, 50+i*130+offset, 220)
                    }

                    var y = 270
                    for (const matche of matches) {
                        const contents = [matche.platform, new Date(matche.date).toLocaleDateString(translations.lang, { day: 'numeric', month: 'short' }), matche.minutesplayed, matche.matchesplayed, matche.readable_name, '', matche.kills, matche.placetop1, matche.placetop3, matche.placetop5, matche.placetop6, matche.placetop10, matche.placetop12, matche.placetop25, matche.score]
                        for (var i=0; i<contents.length; i++) {
                            if (contents[i] == 'keyboardmouse' || contents[i] == 'gamepad' || contents[i] == 'touch') {
                                const icon = await Canvas.loadImage(`assets/images/${contents[i]}.png`)
                                drawImage(icon, 50+i*130, y-25, 30, 30)
                            } else fillText(contents[i].toString().toUpperCase(), 50+i*130, y)
                        }
                            
                        y+=heightSize
                    }

                    message.channel.send({files: [await canvas.toBuffer()]})
                }
            } else message.channel.send(embed.setDescription(translations['1031'].replace('{accountName}', res.name)))
        } else message.channel.send(embed.setDescription(translations['1030']))
    })
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Voir vos dernières parties',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}