const Discord = require('discord.js')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const logChannel = await bot.channels.cache.find(c => c.id == '701611194825441310')
    const lastPatch = await logChannel.messages.fetch(logChannel.lastMessageID)

    const embed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setTitle('Voici la note de patch de la dernière mise à jour')
        .setDescription(lastPatch.content)
    
    message.channel.send(embed)
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Voir la dernière mise à jour',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: false
}