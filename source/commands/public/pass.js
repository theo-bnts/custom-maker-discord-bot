const Discord = require('discord.js')
const Canvas = require('canvas')
const needle = require('needle')
const util = require('util')
const mysql = require('mysql')

const cooldown = new Set()

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ADD_REACTIONS'])) return

    if (cooldown.has(message.author.id)) return message.channel.send(new Discord.MessageEmbed().setColor(config.embedsColor).setDescription('Tu as déja fait cette commande il y a moins d\'une minute.\nMerci de patienter quelques instants.'))
    cooldown.add(message.author.id)
    setTimeout(() => { cooldown.delete(message.author.id) }, 60000)

    var language = 'en'
    try {
        const connection = mysql.createConnection(config.mysql)
        const query = util.promisify(connection.query).bind(connection)
        language = (await query(`SELECT language FROM guild_settings WHERE id='${message.guild.id}'`))[0].language
    } catch (e) {}

    const embedError = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription("An error occurred ...")

    const embeds = []

    const pass = (await needle('get', `https://fortniteapi.io/v2/battlepass?lang=${language}&season=${args[0]}`, { headers: {'Authorization': config.fortniteApiIo} })).body

    if (!pass || !pass.result) return message.channel.send(embedError.setFooter('ERROR CODE : NO_RESULT'))
    if (!pass.rewards || pass.rewards.length == 0) return message.channel.send(embedError.setFooter('ERROR CODE : EMPTY_RESULT'))

    message.channel.startTyping()

    await Canvas.registerFont('./assets/fonts/font.otf', { family: 'burbank' })
    const logChannel = await bot.channels.cache.find(c => c.id == config.logChannel)
    const pages = []

    for (var i=0; i<20; i++) {
        if (i==2) goDisplay()

        const canvas = await Canvas.createCanvas(1000, 525)
        const ctx = canvas.getContext('2d')

        with (ctx) {
            const gradient = createLinearGradient(0, 0, 0, canvas.height)
            gradient.addColorStop(0, '#0093fb')
            gradient.addColorStop(1, '#014cbc')
            fillStyle = gradient
            fillRect(0, 0, canvas.width, canvas.height)

            fillStyle = '#fff'
            font = '100px burbank'
            fillText(pass.displayInfo.battlepassName.toUpperCase(), (canvas.width-measureText(pass.displayInfo.battlepassName.toUpperCase()).width)/2, 130)

            font = '40px burbank'
            fillText(pass.displayInfo.chapterSeason.toUpperCase(), (canvas.width-measureText(pass.displayInfo.chapterSeason.toUpperCase()).width)/2, 170)
            fillText(bot.user.username.toUpperCase(), (canvas.width-measureText(bot.user.username.toUpperCase()).width)/2, canvas.height-30)

            var x=5; y=225
            for (var j=0; j<5; j++) {
                try {
                    const image = await Canvas.loadImage(pass.rewards[i*5+j].item.images.full_background)
                    await drawImage(image, x, y, 190, 190)
                } catch (e) {}
                
                x+=200
            }

            const m = await logChannel.send({files: [canvas.toBuffer()]})
            embeds.push(
                new Discord.MessageEmbed()
                    .setColor(config.embedsColor)
                    .setImage(m.attachments.first().url)
                    .setFooter(`Page ${embeds.length+1}/20`)
            )
        }
    }

    async function goDisplay() {
        message.channel.stopTyping(true)
        const embedMessage = await message.channel.send(embeds[0])

        embedMessage.react('◀️')
            .then(() => embedMessage.react('▶️'))
            .catch(() => { return embedMessage.edit(embedError.setFooter('ERROR CODE : CANT_REACT')) })
        
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
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Contenu du passe de combat',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
