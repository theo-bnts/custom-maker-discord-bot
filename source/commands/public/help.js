const Discord = require('discord.js')

module.exports.run = async (bot, config, message, args, prefix) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ADD_REACTIONS'])) return

    const embeds = []

    for (const commandFile of bot.commands) {
        const cmd = commandFile[1].help
        if (embeds.length == 0 || embeds[embeds.length-1].fields.length == 24) {
            embeds[embeds.length] = new Discord.MessageEmbed().setColor(config.embedsColor).setTitle(`Commandes Fortnite - Prefixe : ${prefix}`)
        }
        if (cmd.isPublic && cmd.isFortnite) {
            embeds[embeds.length-1].addField(`${cmd.name.charAt(0).toUpperCase()}${cmd.name.slice(1)}`, cmd.description, true)
        }
    }

    embeds[embeds.length] = new Discord.MessageEmbed().setColor(config.embedsColor).setTitle(`Commandes complémentaires - Prefixe : ${prefix}`)
    for (const commandFile of bot.commands) {
        const cmd = commandFile[1].help
        if (cmd.isPublic && !cmd.isFortnite) {
            embeds[embeds.length-1].addField(`${cmd.name.charAt(0).toUpperCase()}${cmd.name.slice(1)}`, cmd.description)
        }
    }

    if (message.author.id == config.owner || config.administrators.includes(message.author.id)) {
        embeds[embeds.length] = new Discord.MessageEmbed().setColor(config.embedsColor).setTitle(`Commandes administrateurs - Prefixe : ${prefix}`)
        for (const commandFile of bot.commands) {
            const cmd = commandFile[1].help
            if (!cmd.isPublic) embeds[embeds.length-1].addField(`${cmd.name.charAt(0).toUpperCase()}${cmd.name.slice(1)}`, cmd.description)
        }
    }
    
    for (var i=0; i<embeds.length; i++) {
        embeds[i].setFooter(`Page ${i+1}/${embeds.length}`)
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
    description: 'Commande d\'aide',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: false
}