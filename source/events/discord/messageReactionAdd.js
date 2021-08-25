const Discord = require('discord.js')

module.exports = async (bot, config, reaction, user) => {
    if (!user.bot && ['📘', '📙'].includes(reaction._emoji.name)) {
        if (typeof reactionAdd != 'function') {
            const embed = new Discord.MessageEmbed()
                .setColor(config.embedsColor)
                .setTitle('Oups ... Quelque chose ne s\'est pas passé comme prévu !')
                .setDescription('Je ne parviens pas à accéder à cette commande.\nSi vous voyez ce message d\'erreur veuillez contacter un développeur, s\'il vous plaît.')
                .setFooter('CODE ERREUR : FIRST_ACCOUNT_NOT_ACCESSIBLE')
            return user.send(embed).catch(() => {})
        }
        reactionAdd(reaction, user)
    }
}