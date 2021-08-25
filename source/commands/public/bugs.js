const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ADD_REACTIONS'])) return

    const embeds = []
    const lists = (await needle('get', 'https://api.trello.com/1/boards/5a8ae9c6b95d537ef2173cd1/lists')).body

    for (const list of lists) {
        if (list.name.toLowerCase().includes('issues')) {
            embeds[embeds.length] = new Discord.MessageEmbed().setColor(config.embedsColor).setTitle(list.name).setFooter(`Page ${embeds.length+1}/${lists.length-1}`)
            const cards = (await needle('get', `https://api.trello.com/1/lists/${list.id}/cards`)).body
            for (const card of cards) {
                const labels = []; for (const label of card.labels) labels.push(label.name)
                var fieldContent = `Dernière modification : ${new Date(card.dateLastActivity).getDay()} ${new Date(card.dateLastActivity).toLocaleString('fr', { month: 'long' })}\n`
                if (labels.length > 0) fieldContent += `Labels : ${labels.join(', ')}\n`
                fieldContent += `[Lien](${card.url})\n\n`
                embeds[embeds.length-1].addField(card.name, fieldContent)
            }
        }
    }
    const embedMessage = await message.channel.send(embeds[0])
    embedMessage.react('◀️').catch(() => { return embedMessage.edit(embedReactError) })
    embedMessage.react('▶️')
    const filtre = async (reaction, user) => {
        if (user.id == message.author.id) {
            const pageNumber = Number(embedMessage.embeds[0].footer.text.replace('Page ', '').replace(`/${embeds.length}`, '')) - 1
            if (reaction._emoji.name == '◀️' && pageNumber > 0) embedMessage.edit(embeds[pageNumber - 1])
            if (reaction._emoji.name == '▶️' && pageNumber < embeds.length-1) embedMessage.edit(embeds[pageNumber + 1])
            if (embedMessage.channel.permissionsFor(embedMessage.guild.me).has(['MANAGE_MESSAGES'])) embedMessage.reactions.resolve(reaction._emoji.name).users.remove(user.id)
        }
    }
    embedMessage.awaitReactions(filtre, { max: 1, time: 300000 }).then(() => { embedMessage.reactions.removeAll().catch(() => {}) })
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Liste des bugs connus par les équipes Epic Games',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}