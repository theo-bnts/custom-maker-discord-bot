const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const translations = await getTranslations(message.guild, false, ['1040', '1041'])
       
    const res = (await needle(
        'get',
        'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game',
        { headers: { 'Accept-Language': translations.lang } }
    )).body.playersurvey.s.s

    const embed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)

    for (const survey of res) {
        for (var question of survey.q) {
            question = question.mc.t
            while (question.includes('<keyword>'))
                question = question.replace('<keyword>', '').replace('</>', '')
            console.log(question)
        }
    }

    await message.channel.send(embed)
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Fortnite surveys',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}