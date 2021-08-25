const Discord = require('discord.js')
const util = require('util')
const mysql = require('mysql')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return
    
    var res, discordUser, epicUser

    const embed = new Discord.MessageEmbed().setColor(config.embedsColor)

    if (args.length == 0) return message.channel.send(embed.setDescription(`Veuillez indiquer un pseudo Epic Games ou mentionner un membre.\nLa commande s\'utilise comme cela : \`${message.content.charAt(0)}search [pseudo Epic ou mention de membre]\``))

    const connection = await mysql.createConnection(config.mysql)
    const query = util.promisify(connection.query).bind(connection)

    if (message.mentions.users.first()) {
        discordUser = message.mentions.users.first()
    } else {
        res = (await needle('get', `https://fortniteapi.io/v1/lookup?username=${encodeURI(args.join(' '))}`, { headers: {'Authorization': config.fortniteApiIo} })).body
        if (res.result) {
            res = await query(`SELECT * FROM users WHERE id_epic='${res.account_id}'`)

            if (!res[0]) {
                connection.destroy()
                return message.channel.send(embed.setDescription('Je ne trouve pas cet utilisateur dans la base de données.'))
            }

            discordUser = await bot.users.fetch(res[0].id_discord)
        } else {
            connection.destroy()
            return message.channel.send(embed.setDescription('Je ne trouve pas cet utilisateur.'))
        }
    }

    connection.query(`SELECT * FROM users WHERE id_discord='${discordUser.id}'`, async (err, results) => {
        connection.destroy()

        if (!results || !results[0]) return message.channel.send(embed.setDescription('Je ne trouve pas cet utilisateur dans la base de données.'))
        if (!results[0].id_epic) return message.channel.send(embed.setDescription('Cet utilisateur n\'a pas ajouter son compte Forntite.'))

        epicUser = (await needle('get', `https://fortniteapi.io/v1/lookupUsername?id=${results[0].id_epic}`, { headers: {'Authorization': config.fortniteApiIo} })).body.accounts[0]

        embed.addFields(
            { name: 'Pseudo Discord', value: discordUser.tag },
            { name: 'Pseudo Fortnite', value: epicUser.username }
        )

        if (message.author.id == config.owner) embed.setFooter(`EPIC ID : ${epicUser.id}`)

        if ((await new Date(results[0].verification_date)).getFullYear() > 2010) embed.addField('Statut', 'Vérifié')
        else embed.addField('Statut', 'Non vérifié')

        message.channel.send(embed)
    })
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Connaitre le pseudo Fortnite d\'un utilisateur Discord',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}