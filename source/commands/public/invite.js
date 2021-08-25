const Discord = require('discord.js')
const mysql = require('mysql')

module.exports.run = async (bot, config, message) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return
    
    const embed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription(`${message.author}, invite moi dans ton serveur en cliquant **[ici](https://invite-cm.fortool.fr)** !`)

    message.channel.send(embed).catch(() => {})
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Lien d\'invitation du robot',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: false
}
