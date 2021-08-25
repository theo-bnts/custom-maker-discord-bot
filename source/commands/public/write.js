const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const fs = require('fs')
const humanizeDuration = require('humanize-duration')
const Canvas = require('canvas')
const cooldown = new Set()

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS'])) return

    var translations
    const connection = mysql.createConnection(config.mysql)
    const query = util.promisify(connection.query).bind(connection)
    const language = (await query(`SELECT language FROM guild_settings WHERE id='${message.guild.id}'`))[0].language
    if (fs.existsSync(`assets/translations/${language}.json`)) translations = await require(`../../assets/translations/${language}.json`)
    else translations = require('../../assets/translations/en.json')

    const embed = new Discord.MessageEmbed().setColor(config.embedsColor)
    const logChannel = await bot.channels.cache.find(c => c.id == config.logChannel)

    config = undefined; bot = undefined

    const emojis = ['⚪', '⚫', '🟤', '🟠', '🟡', '🟢', '🔵', '🟣', '🔴']
    const colors = ['#fff', '#000', '#8a5c47', '#ff5405', '#f7ff05', '#38e03b', '#4287ff', '#8e00e0', '#f71d1d']
    const colorsNames = []; for (var i=3018; i<=3026; i++) colorsNames.push(translations[i.toString()])

    if (!args[0]) 
        return message.channel.send(
            embed.setDescription(
                translations['0002']
                    .replace('{p}', message.content.charAt(0))
                    .replace('{c}', 'write')
                    .replace('{a}', `[${translations["3027"]}]`)
            )
        )

    if (colorsNames.includes(args[0])) {
        const m = await message.channel.send(embed)
        return createImage(colors[colorsNames.indexOf(args[0])], m)
    }

    if (cooldown.has(message.author.id))
        return message.channel.send(
            embed.setDescription(
                translations['0003']
                    .replace('{d}', humanizeDuration(30000, {language: translations.lang, largest: 1}))
            )
        )

    cooldown.add(message.author.id)
    setTimeout(() => { cooldown.delete(message.author.id) }, 30000)

    const m = await message.channel.send(embed.setDescription(translations["1003"]))
    embed.setDescription('')

    for (const emoji of emojis)
        m.react(emoji)
            .catch(() => m.edit(
                embed
                .setDescription(translations["0001"]
                .setFooter('ERROR CODE: CANT_REACT')
            )))

    const filtre = (reaction, user) => {
        return user == message.author && emojis.includes(reaction._emoji.name)
    }

    m.awaitReactions(filtre, { max: 1, time: 300000 })
        .then(async (c) => {
            await createImage(colors[emojis.indexOf(c.first()._emoji.name)], m)
        })


    async function createImage(color, m) {
        if (colorsNames.includes(args[0])) args.shift()

        await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
        const canvas = await Canvas.createCanvas(1000, 300)
        const ctx = await canvas.getContext('2d')

        const text = args.join(' ')

        with (ctx) {
            var fontSize = 300
            do font = `${fontSize--}px burbank`
            while (measureText(text).width > canvas.width)

            fillStyle = color
            await fillText(text, canvas.width / 2 - measureText(text).width / 2, canvas.height / 2 + (measureText(text).actualBoundingBoxAscent - measureText(text).actualBoundingBoxDescent) /2)

            const i = await logChannel.send({files: [canvas.toBuffer()]})
            m.edit(embed.setImage(i.attachments.first().url))
            
            m.reactions.removeAll()
                .catch(() => {})
        }
        
    }
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Ecrivez comme dans Fortnite',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
