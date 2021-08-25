const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const translations = await getTranslations(message.guild, false, ['1040', '1041'])
       
    const res = (await needle(
        'get',
        'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game',
        { headers: { 'Accept-Language': translations.lang } }
    )).body?.emergencynoticev2

    if (res?.emergencynotices?.emergencynotices?.length > 0) {
        const embed = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setTitle(translations['1040'])
            .setTimestamp(new Date(res.lastModified))

        for (const emergency of res.emergencynotices.emergencynotices)
            embed.addField(emergency.title, emergency.body)

        return message.channel.send(embed)
    } else
        return message.channel.send(
            new Discord.MessageEmbed()
                .setColor(config.embedsColor)
                .setDescription(translations['1041'])
        )
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Messages d\'alertes intégrés',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}