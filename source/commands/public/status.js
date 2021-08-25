const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    const components = (await needle('get', `https://ft308v428dv3.statuspage.io/api/v2/summary.json`)).body.components

    const status = {
        operational: {
            emoji: "☑️",
            display: "Operational"
        },
        degraded_performance: {
            emoji: "◽",
            display: "Degraded performance"
        },
        partial_outage: {
            emoji: "🔸",
            display: "Partial outage"
        },
        major_outage: {
            emoji: "🔻",
            display: "Major outage"
        },
        under_maintenance: {
            emoji: "🔹",
            display: "Under maintenance"
        },
    }

    const embed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)

    var legend = ''
    for (const value of Object.values(status)) {
        legend += `${value.emoji} ${value.display}\n`
    }
    embed.addField('Legend', legend)


    const fortnite = await components.find(c => c.name == 'Fortnite')
    embed.setTitle(`Fortnite - ${status[fortnite.status].emoji}`)


    var description = ''
    for (var component of fortnite.components) {
        component = await components.find(c => c.id == component)
        description += `${status[component.status].emoji} ${component.name}\n`
    }
    embed.setDescription(description)
    

    message.channel.send(embed)
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Status des serveurs Fortnite',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}