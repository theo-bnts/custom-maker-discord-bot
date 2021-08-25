const Discord = require('discord.js')

module.exports = async (bot, config, button) => {
    if (button.id == 'blue_to_red_love') 
        button.message.buttonsEdit(undefined, {
            buttons: [
                {
                    style: 'url',
                    label: 'Voter',
                    url: 'https://vote-cm.fortool.fr'
                },
                {
                    style: 'red',
                    label: '❤️',
                    id: 'blue_to_red_love'
                }
            ]
        })
}