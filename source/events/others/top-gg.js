const Discord = require('discord.js')
const clock = require('date-events')()
const express = require('express')
const Topgg = require('@top-gg/sdk')

module.exports = async (bot, config) => {
    clock.on('minute', (min) => {
        if (min.toString().endsWith('0')) {
            const sdk = new Topgg.Api(config.top_gg.token)
            sdk.postStats({
                serverCount: bot.guilds.cache.size,
                shardId: bot.shard.ids[0],
                shardCount: bot.options.shardCount
            })
        }
    })

    
    const app = express()
    const webhook = new Topgg.Webhook(config.top_gg.webhook_authorization)
    app.post('/dblwebhook', webhook.middleware(), async (req) => {
        const user = await bot.users.fetch(req.vote.user)
        const voteChannel = await bot.channels.cache.find(c => c.id == config.top_gg.channel)
        const embed = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setDescription(`${user.tag} vient de voter pour ${bot.user.username} !\nMerci de nous permettre de nous améliorer !\n\n[Voter gratuitement](https://vote-cm.fortool.fr)`)
        voteChannel.send(`||${user}||`, {embed: embed})
    })

    if (bot.shard.ids[0] == 0)
        app.listen(3000)
}