const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ADD_REACTIONS'])) return
    
    var language = 'en'
    try {
        const connection = mysql.createConnection(config.mysql)
        query = util.promisify(connection.query).bind(connection)
        language = (await query(`SELECT language FROM guild_settings WHERE id='${message.guild.id}'`))[0].language
    } catch (e) {}

    const res = await needle('get', `https://www.epicgames.com/fortnite/api/blog/getPosts?postsPerPage=19&offset=0&locale=${language}&rootPageSlug=blog`)
    res.body.blogList.sort((a, b) => { return new Date(b.date) - new Date(a.date) })
    
    const embeds = []
    for (const article of res.body.blogList) {
        const embed = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setAuthor(article.author)
            .setTitle(article.title)
            .setURL(`https://www.epicgames.com/fortnite${article.urlPattern}`)
            .setDescription(article.shareDescription)
            .setImage(article.trendingImage)
            .setFooter(`Page ${embeds.length+1}/${res.body.blogList.length}`)
            .setTimestamp(new Date(article.date))
        embeds.push(embed)
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
    description: 'Derniers posts du blog Epic Games',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}