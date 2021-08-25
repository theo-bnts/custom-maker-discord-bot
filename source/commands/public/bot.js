const Discord = require('discord.js')
const nos = require('node-os-utils')
const shell = require('shelljs')
const needle = require('needle')

const cooldown = new Set()

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    if (cooldown.has(message.author.id)) return message.channel.send(new Discord.MessageEmbed().setColor(config.embedsColor).setDescription('Tu as déja fait cette commande il y a moins de 30 secondes.\nMerci de patienter quelques instants.'))
    cooldown.add(message.author.id)
    setTimeout(() => { cooldown.delete(message.author.id) }, 30000)
    
    const m = await message.channel.send(new Discord.MessageEmbed().setColor(config.embedsColor).setDescription('Chargement des statistiques ...'))

    try {
        const botStats = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setTitle('Statistiques')
            .setTimestamp()
            .addFields(
                {name: '\u200B', value: '`Application`'},
                {name: 'Développeur', value: '<@448882532830674948>', inline: true},
                {name: 'Serveurs', value: (await bot.shard.fetchClientValues('guilds.cache.size')).reduce((a, b) => b + a), inline: true},
                {name: 'Utilisateurs', value: (await bot.shard.broadcastEval('this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)')).reduce((a, b) => b + a), inline: true},
                
                {name: '\u200B', value: '`Processus`'},
                {name: 'NodeJS', value: process.version, inline: true},
                {name: 'Uptime', value: `${Math.round(process.uptime()/60)} min`, inline: true},
                {name: '\u200B', value: '\u200B', inline: true},

                {name: '\u200B', value: '`Serveur`'},
                {name: 'CPU', value: `${await nos.cpu.usage()} %`, inline: true},
                {name: 'RAM', value: `${(100 - (await nos.mem.info()).freeMemPercentage).toFixed(2)} %`, inline: true},
                {name: 'Disque', value: `${(await nos.drive.used()).usedPercentage} %`, inline: true},
                {name: 'Température', value: (await shell.exec('sensors')).split(' ').find(t => t.endsWith('°C')), inline: true },
                {name: 'Uptime', value: `${Math.round(nos.os.uptime()/3600)} h`, inline: true},

                {name: '\u200B', value: `[Inviter ${bot.user.username}](https://invite-cm.fortool.fr)\n[Rejoindre le serveur de support](https://discord.fortool.fr)\n[Voter gratuitement](https://vote-cm.fortool.fr)\n[Powered by fortniteapi.io](https://fortniteapi.io)`}
            )
            .setFooter(`Réponse en ${m.createdTimestamp - message.createdTimestamp} ms`)

        m.edit(botStats)

    } catch (e) {
        m.edit(new Discord.MessageEmbed().setColor(config.embedsColor).setDescription('Erreur inconnue ...'))
        console.log(e)
    }
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Informations sur le robot',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: false
}
