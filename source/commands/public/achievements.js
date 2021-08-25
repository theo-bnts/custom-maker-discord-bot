const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ADD_REACTIONS'])) return

    var language = (await getTranslations(message.guild, false, [])).lang

    const res = (await needle('get', `https://fortniteapi.io/v1/achievements?lang=${language}`, { headers: { 'Authorization': config.fortniteApiIo } })).body

    const embeds = []
    for (const achievement of res.achievements) {
        const embed = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setTitle(achievement.name)
            .setDescription(achievement.description)
            .setThumbnail(achievement.image)
            .setFooter(`Page ${embeds.length + 1}/${res.achievements.length}`)
        embeds.push(embed)
    }
    const embedMessage = await message.channel.send(embeds[0])

    embedMessage.react('◀️').catch(() => { return embedMessage.edit(embedReactError) })
    embedMessage.react('▶️')
    const filtre = async (reaction, user) => {
        if (user.id == message.author.id) {
            const pageNumber = Number(embedMessage.embeds[0].footer.text.replace('Page ', '').replace(`/${embeds.length}`, '')) - 1
            if (reaction._emoji.name == '◀️' && pageNumber > 0) embedMessage.edit(embeds[pageNumber - 1])
            if (reaction._emoji.name == '▶️' && pageNumber < embeds.length - 1) embedMessage.edit(embeds[pageNumber + 1])
            if (embedMessage.channel.permissionsFor(embedMessage.guild.me).has(['MANAGE_MESSAGES'])) embedMessage.reactions.resolve(reaction._emoji.name).users.remove(user.id)
        }
    }
    embedMessage.awaitReactions(filtre, { max: 1, time: 300000 }).then(() => { embedMessage.reactions.removeAll().catch(() => { }) })
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Quêtes de saison',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}