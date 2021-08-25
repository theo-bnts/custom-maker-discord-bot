const Discord = require('discord.js')

module.exports.run = async (bot, config, message, args) => {
    if (message.channel.type != 'dm') if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    if (typeof group != 'function') {
        const embed = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setTitle('Oups ... Quelque chose ne s\'est pas passé comme prévu !')
            .setDescription('Je ne parviens pas à accéder à cette commande.\nSi vous voyez ce message d\'erreur veuillez contacter un développeur, s\'il vous plaît.')
            .setFooter('CODE ERREUR : SECOND_ACCOUNT_NOT_ACCESSIBLE')
        if (message.author.id == bot.user.id) message.delete()
        return message.channel.send(embed).catch(() => {})
    }
    
    group(message, args)
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Nombre d\'utilisateur dans le groupe du robot',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
