const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    const res = (await needle('get', 'https://fortniteapi.io/v1/game/aes')).body
    message.channel.send(
        new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .addFields(
                { name: 'Version', value: res.version },
                { name: 'AES', value: res.mainKey }
            )
    )
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Get Fortnite version and main AES key',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
