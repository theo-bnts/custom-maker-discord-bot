const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const res = (await needle('get', 'https://fortniteapi.io/v1/api/account', { headers: {'Authorization': config.fortniteApiIo} })).body

    message.channel.send(
        new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setTitle('FortniteApi.io')
            .setURL('https://dashboard.fortniteapi.io')
            .addFields(
                { name: 'Limite Journalière', value: res.account.dailyLimit },
                { name: 'Réinitialisation', value: new Date(res.account.limitReset).toLocaleString('fr', { timeZone: 'CET' }) },
                { name: 'Utilisation ce jour', value: res.account.dailyUse },
                { name: 'Utilisation hier', value: Object.values(res.account.history)[1] },
                { name: 'Utilisation moyenne', value: Object.values(res.account.history).reduce((a, b) => a + b, 0)/Object.values(res.account.history).length}
            )
    )
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'FortniteApi.io stats',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}