const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const translations = await getTranslations(message.guild, false, ['3081', '3082', '3083'])

    const embed = new Discord.MessageEmbed().setColor(config.embedsColor)

    if (args.length == 0)
        embed.setDescription(
            translations['0002']
                .replace('{p}', message.content.charAt(0))
                .replace('{c}', 'creator')
                .replace('{a}', `[${translations['3083']}]`)
        )
    else {
        const res = (await needle('get', `https://fortnite-api.com/v2/creatorcode?name=${encodeURI(args.join(' '))}`)).body
        if (res?.status == 200) {
            const username = (await needle('get', `https://fortniteapi.io/v1/lookupUsername?id=${res.data.account.id}`, { headers: {'Authorization': config.fortniteApiIo} })).body.accounts?.[0]?.username
            embed
                .setDescription(`${translations['3081']}: \`${username || res.data.account.name}\``)
                .setFooter(`${translations['3082']}: ${res.data.status}`)
        } else
            embed
                .setDescription(translations['0001'])
                .setFooter('ERROR CODE: CREATOR_NOT_FOUND')
    }


    message.channel.send(embed)
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Propriétare d\'un code créateur',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}