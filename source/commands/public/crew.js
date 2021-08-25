const Discord = require('discord.js')
const needle = require('needle')
const mysql = require('mysql')
const util = require('util')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    var language = 'en'
    try {
        const connection = mysql.createConnection(config.mysql)
        const query = util.promisify(connection.query).bind(connection)
        language = (await query(`SELECT language FROM guild_settings WHERE id='${message.guild.id}'`))[0].language
    } catch (e) {}

    const crewList = (await needle('get', `https://fortniteapi.io/v1/game/crew?lang=${language}`, { headers: {'Authorization': config.fortniteApiIo} })).body.fortniteCrew
    const seasons = (await needle('get', `https://fortniteapi.io/v1/seasons/list?lang=${language}`, { headers: {'Authorization': config.fortniteApiIo} })).body.seasons

    const embeds = []

    for (const crew of crewList.reverse()) {
        for (const season of seasons)
            if (crew.battlepassDescription.replace(/[\W_]/g, '').toLowerCase().trim().includes(season.displayName.replace(/[\W_]/g, '').toLowerCase().trim()))
                crew.battlepassDescription = season.displayName

        if (crew.type == 'next')
            crew.skinTitle = crew.skinTitle.split('!')[0].split(' ').slice(0, -1).join(' ')

        const date = new Date()
        if (crew.date && crew.date.month && crew.date.year) {
            date.setDate(1)
            date.setMonth(crew.date.month)
            date.setYear(crew.date.year)
        }

        embeds.push(
            new Discord.MessageEmbed()
                .setColor(config.embedsColor)
                .setImage(crew.apiImages.presentation)
                .setTitle(`${crew.skinTitle.charAt(0).toUpperCase()}${crew.skinTitle.substring(1).toLowerCase()} • ${crew.battlepassDescription}`)
                .setFooter(`Page ${embeds.length+1}/${crewList.length}`)
                .setTimestamp(date)
        )
    }

    const embedMessage = await message.channel.send(embeds[crewList.findIndex(c => c.type == 'current')])

    embedMessage.react('◀️')
            .then(() => embedMessage.react('▶️'))
            .catch(() => { return embedMessage.edit(embedError.setFooter('ERROR CODE : CANT_REACT')) })
        
    const filtre = async (reaction, user) => {
        if (user.id == message.author.id) {
            embedMessage.reactions.resolve(reaction._emoji.name).users.remove(user.id).catch(() => {})
            const pageNumber = Number(embedMessage.embeds[0].footer.text.replace('Page ', '').replace(`/${crewList.length}`, '')) - 1
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
    description: 'Liste des packs du Club de Fortnite',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}