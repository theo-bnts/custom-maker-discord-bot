const Discord = require('discord.js')
const fs = require('fs')
const os = require('os')
const config = require('./assets/config.json')
const bot = new Discord.Client({ partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'], allowedMentions: { parse: ['users'] }})

bot.commands = new Discord.Collection()

const loadCommands = (dir) => {
    fs.readdirSync(dir).forEach(dirs => {
        const commands = fs.readdirSync(`${dir}/${dirs}`).filter(files => files.endsWith('.js'))
        for (const file of commands) {
            const fileContent = require(`${dir}/${dirs}/${file}`)
            bot.commands.set(fileContent.help.name, fileContent)
        }
    })
}

const loadEvents = (dir) => {
    fs.readdirSync(dir).forEach(dirs => {
        const events = fs.readdirSync(`${dir}/${dirs}`).filter(files => files.endsWith('.js'))
        for (const file of events) {
            const fileContent = require(`${dir}/${dirs}/${file}`)
            const eventName = file.split('.')[0]
            bot.on(eventName, fileContent.bind(null, bot, config))
        }
    })
}

loadCommands('./commands/')
loadEvents('./events/')

if (os.type().toLocaleLowerCase().startsWith('l'))
    bot.login(config.tokens.public)
else
    bot.login(config.tokens.beta)