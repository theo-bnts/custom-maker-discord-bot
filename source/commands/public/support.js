const Discord = require('discord.js')

module.exports.run = async (bot, config, message, args) => {
    const embed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setTitle('Ces projets ne seraient pas possible sans vous, alors, merci !')
        .setDescription(`${bot.user.username} est gratuit et le restera, en utilisant les moyens suivant vous me permettez de faire vivre ${bot.user.username}, sans rien dépenser.\n\n• [Voter](https://vote-cm.fortool.fr)\n• Utiliser le code créateur: FTOOL`)

    message.buttons(undefined, {
        embed: embed,
        buttons: [
            {
                style: 'url',
                label: 'Voter',
                url: 'https://vote-cm.fortool.fr'
            },
            {
                style: 'blupurple',
                label: '💙',
                id: 'blue_to_red_love'
            }
        ]
    })
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Liste des moyens pour soutenir le projet',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: false
}
