const Discord = require('discord.js')

module.exports.run = async (bot, config, message, args) => {
    if (message.author.id == config.owner) {
        const code = args.join(' ')
        const time = Date.now()

        await message.channel.send(
            new Discord.MessageEmbed()
                .setColor(config.embedsColor)
                .setTitle('Do you want execute this ?')
                .setDescription(`\`\`\`js\n${code}\`\`\``)
                .setFooter(`Type confirm ${time}`)
        )

        filtre = async (msg) => { 
            return message.author == msg.author && msg.content.includes('confirm') && msg.content.includes(time)
        }

        await message.channel.awaitMessages(filtre, { max: 1, time: 300000 })
            .then(async () => {
                try {
                    eval(code)
                    .then(() => {
                        message.channel.send(
                            new Discord.MessageEmbed()
                                .setColor(config.embedsColor)
                                .setDescription('☑️')
                        )
                    })
                } catch (e) {
                    message.channel.send(
                        new Discord.MessageEmbed()
                            .setColor(config.embedsColor)
                            .setDescription(e)
                    )
                }
            })
    }
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Eval',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: false
}