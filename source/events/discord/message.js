const Discord = require('discord.js')
const mysql = require('mysql')

module.exports = async (bot, config, message) => {
    var guildID
    var prefix
    
    if (message.author.bot) return
    else if (message.channel.type == 'dm') return
    else if (message.author.id == bot.user.id) guildID = 0
    else guildID = message.guild.id

    const connection = mysql.createConnection(config.mysql)
    connection.query(`SELECT prefix, delete_commands FROM guild_settings WHERE id='${guildID}';`, async (error, results) => {
        connection.destroy()

        if (error) {
            const embed = new Discord.MessageEmbed()
                .setColor(config.embedsColor)
                .setDescription('An error occured ...')
                .setFooter('ERROR CODE : GLOBAL_DATABASE_ACCESS_FAILED')

            if (message.content.match(/^[A-Z0-9]/i)) return
            else {
                if (await checkPermisions(message, message.channel, ['EMBED_LINKS'])) 
                    return //message.channel.send(embed)
                else
                    return //message.channel.send(`>>> ${embed.description}\n${embed.footer}`)
            }
        }

        if (results && results[0] && message.author.id != bot.user.id)
            prefix = results[0].prefix
        else prefix = config.defaultPrefix

        var args = message.content
            .replace(`<@!${bot.user.id}> `, prefix)
            .replace('*help', `${prefix}help`)
            .split(' ')

        args[0] = args[0]

        if (!args[0].startsWith(prefix)) return

        const commandFile = bot.commands.get(args[0].toLowerCase().slice(prefix.length))
        if (!commandFile)
            return

        if (!commandFile.help.isPublic && message.author.id != config.owner && !config.administrators.includes(message.author.id))
            return

        if (results && results[0] && results[0].delete_commands)
            message.delete()

        console.log(message.author.id, commandFile.help.name)

        args.splice(0, 1)

        commandFile.run(bot, config, message, args, prefix)
    })
}