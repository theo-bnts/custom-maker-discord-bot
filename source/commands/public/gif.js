const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['ATTACH_FILES'])) return

    const res = (await needle('get', `https://api.giphy.com/v1/gifs/search?api_key=${config.giphy.api}&q=fortnite`)).body.data
    const gifInformations = res[Math.floor(Math.random() * Math.floor(res.length))]
    
    message.channel.send(
        new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setImage(gifInformations.images.original.url.split('?')[0])
            .setFooter('Powered by Giphy')
    )
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Gifs aléatoires',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}