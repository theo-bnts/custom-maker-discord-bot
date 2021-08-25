const os = require('os')
const clock = require('date-events')()

module.exports = async (bot) => {
    console.log(`${bot.user.username} up`)

    clock.on('minute', async (min) => {
        bot.user.setActivity('powered by fortniteapi.io')
        setTimeout(async () => {
            const guildsNumber = (await bot.shard.fetchClientValues('guilds.cache.size')).reduce((a, b) => b + a)
            bot.user.setActivity(`${guildsNumber} guilds | *help`, { type: 'WATCHING' })
        }, 5000)
    })
    
    bot.emit('global-functions')
    
    if (os.type().toLocaleLowerCase().startsWith('l')) {
        const events = ['regen-shop', 'regen-news', 'regen-next-rotation', 'first-account', 'second-account', 'top-gg', 'save-db']
        for (const event of events)
            bot.emit(event)
    }

    //bot.emit('get-device-auth')
}