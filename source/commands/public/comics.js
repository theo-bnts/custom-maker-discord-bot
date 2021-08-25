const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const translations = await getTranslations(message.guild, false, ['1040', '1041'])
       
    const res = (await needle(
        'get',
        'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game',
        { headers: { 'Accept-Language': translations.lang } }
    )).body.comics.library.comics

    const embeds = []
    for (const comic of res) {
        embeds.push([])
        for (const image of comic.images) {
            embeds[embeds.length-1].push(
                new Discord.MessageEmbed()
                    .setColor(config.embedsColor)
                    .setImage(image)
                    .setFooter(`Page ${embeds[embeds.length-1].length+1} / ${comic.images.length} | Comic ${res.indexOf(comic)+1} / ${res.length}`)
            )
        }
    }

    const embedMessage = await message.channel.send(embeds[0][0])

    const emojis = ['⏮️', '◀️', '▶️', '⏭️']
    for (const emoji of emojis)
        embedMessage.react(emoji)
            .catch(() => { return })

    const filtre = async (reaction, user) => {
        if (user.id == message.author.id) {
            const splitedFooter = embedMessage.embeds[0].footer.text.split(' | ')
            const page = Number(splitedFooter[0].match(/\d+/)[0]) - 1
            const comic = Number(splitedFooter[1].match(/\d+/)[0]) - 1

            if (reaction._emoji.name == '◀️' && page > 0) embedMessage.edit(embeds[comic][page-1])
            if (reaction._emoji.name == '▶️' && page < embeds[comic].length - 1) embedMessage.edit(embeds[comic][page+1])
            
            if (reaction._emoji.name == '⏮️' && comic > 0) embedMessage.edit(embeds[comic-1][page])
            if (reaction._emoji.name == '⏭️' && comic < embeds.length - 1) embedMessage.edit(embeds[comic+1][page])

            embedMessage.reactions.resolve(reaction._emoji.name).users.remove(user.id)
                .catch(() => {})
        }
    }
    embedMessage.awaitReactions(filtre, { max: 1, time: 300000 })
        .then(() => {
            embedMessage.reactions.removeAll()
                .catch(() => {})
        })
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Comics réalisés par Epic Games',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}