const Discord = require('discord.js')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return
    
    const embed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription('👍')
    message.channel.send(embed)

    message.channel.stopTyping(true)

}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Stop "is writing ..."',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: false
}