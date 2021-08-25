const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    try {
        var input = await needle('get', args[0], { headers: {'Authorization': config.fortniteApiIo} })
        input = await JSON.stringify(input.body)
    
        const segments = await input.split('"')
    
        for (const segment of segments)
            if (segment.startsWith('http')) {
                const resultat = await needle('get', segment)
                if (resultat.statusCode != '200')
                    message.channel.send(resultat.statusCode + ' | ' + segment)
            }
    
        message.channel.send('Verification ended.')
    } catch (e) {
        message.channel.send(e.message)
    }
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'FortniteApi.io dead links check',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}