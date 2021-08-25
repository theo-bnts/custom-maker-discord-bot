const Discord = require('discord.js')
const needle = require('needle')

module.exports.run = async (bot, config, message, args) => {
    const translations = await getTranslations(message.guild, false, ['1005', '1006', '1007', '1008', '1009'])
    
    const embed = new Discord.MessageEmbed().setColor(config.embedsColor)

    const radioEmbed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setTitle(translations['1008'])
   
    var connection, m = message, radio, startDate

    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ADD_REACTIONS'])) return
    if (!message.member.voice.channel) return message.channel.send(embed.setDescription(translations['1005']))
    if (!await checkPermisions(message, message.member.voice.channel, ['VIEW_CHANNEL', 'CONNECT', 'SPEAK'])) return
    if (message.guild.me.voice.connection) {await message.guild.voice.channel.leave(); await sleep(500)}
    if (message.member.voice.channel.full) {
        if (message.member.voice.channel.manageable) {
            if (message.member.voice.channel.userLimit < 99) await message.member.voice.channel.setUserLimit(message.member.voice.channel.userLimit+1)
            else await message.member.voice.channel.setUserLimit(0)
        } else {
            return message.channel.send(embed.setDescription(translations['1006']))
        }
    }

    try {
        connection = await message.member.voice.channel.join()
    } catch (e) {
        return message.channel.send(embed.setDescription(translations['0001']).setFooter('ERROR CODE: CANT_JOIN_VOICE_CHANNEL'))
    }

    message.guild.me.voice.setSelfDeaf(true)
    if (message.channel.permissionsFor(message.guild.me).has(['DEAFEN_MEMBERS'])) {
        message.guild.me.voice.setDeaf(true).catch(() => {})
    }

    const radios = (await needle('get', `https://fortniteapi.io/v1/game/radios?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body.radios

    var dispatcher = connection.play(needle.get(radios[0].versions.slice(-1)[0].url), { volume: 0.2 })

    dispatcher.on('start', async () => {
        startDate = Date.now()

        const emojis = ['✅']; for (var i=1; i<radios.length; i++) emojis.push('🔹')
        var description = ''
        for (var i=0; i<radios.length; i++) description += `${emojis[i]} ${radios[i].name}\n`
        radioEmbed.setDescription(description).setThumbnail(radios[0].icon)
        m = await message.channel.send(radioEmbed)
        Promise.all([
            m.react('🔼'),
            m.react('🔽'),
            m.react('⏯️'),
            m.react('⏹️'),
            m.react('🔉'),
            m.react('🔊')
        ]).catch(() => {})

        const filtre = async (reaction, user) => {
            if (dispatcher._writableState.destroyed) {
                m.reactions.removeAll().catch(() => {})
                return m.edit(embed.setDescription(translations['1007'].replace('{prefix}', message.content.charAt(0))))
            }
            if (user.id != message.author.id) return
            if (m.channel.permissionsFor(m.guild.me).has(['MANAGE_MESSAGES'])) m.reactions.resolve(reaction._emoji.name).users.remove(user.id)
            if (reaction._emoji.name == '🔼' || reaction._emoji.name == '🔽') {
                const p = emojis.indexOf('✅')
                if ((reaction._emoji.name == '🔼' && p > 0) || (reaction._emoji.name == '🔽' && p <= emojis.length-2)) {
                    emojis[p] = '🔹'
                    if (reaction._emoji.name == '🔼') {
                        emojis[p-1] = '✅'
                        radio = radios[p-1]
                    }
                    if (reaction._emoji.name == '🔽') {
                        emojis[p+1] = '✅'
                        radio = radios[p+1]
                    }
                    console.log(dispatcher.volume)
                    dispatcher = connection.play(needle.get(radio.versions.slice(-1)[0].url), { volume: dispatcher.volume })
                    description = ''
                    for (var i=0; i<radios.length; i++) description += `${emojis[i]} ${radios[i].name}\n`
                    m.edit(radioEmbed.setDescription(description).setThumbnail(radio.icon))
                }
            } else if (reaction._emoji.name == '⏯️') {
                if (dispatcher.paused) dispatcher.resume()
                else dispatcher.pause()
            } else if (reaction._emoji.name == '⏹️') {
                m.guild.voice.channel.leave()
                m.edit(embed.setDescription(translations['1007'].replace('{prefix}', message.content.charAt(0))))
                return m.reactions.removeAll().catch(() => {})
            } else if (reaction._emoji.name == '🔉' || reaction._emoji.name == '🔊') {
                if (reaction._emoji.name == '🔊') {
                    if (dispatcher.volume < 1.5) dispatcher.setVolume(dispatcher.volume+0.2)
                } else {
                    if (dispatcher.volume > 0.3) dispatcher.setVolume(dispatcher.volume-0.2)
                }
            }
        }
        return m.awaitReactions(filtre, { max: 1, time: 3600000 }).then(() => { return m.reactions.removeAll().catch(() => {}) })
    })

    dispatcher.on('error', (e) => {
        console.log(e)
        m.guild.voice.channel.leave()
        m.edit(embed.setDescription(translations['0001']).setFooter('ERROR CODE: DISPATCHER_ERROR'))
        return m.reactions.removeAll().catch(() => {}) 
    })
    
    dispatcher.on('finish', () => { 
        if (Date.now() - startDate < 60000 ) {
            m.guild.voice.channel.leave()
            m.edit(embed.setDescription(translations['0001']).setFooter('ERROR CODE: PLAYER_STOPPED_BEFORE_STARTING'))
            return m.reactions.removeAll().catch(() => {})
        } else {
            m.guild.voice.channel.leave()
            m.edit(embed.setDescription(translations['1007'].replace('{prefix}', message.content.charAt(0))))
            return m.reactions.removeAll().catch(() => {})
        }
    })

    try {
        var compt = 0
        for(var i = 0; i < 1000; i++) {
            if (!dispatcher.serverDeaf && m.channel.permissionsFor(m.guild.me).has(['DEAFEN_MEMBERS'])){
                m.guild.me.voice.setDeaf(true).catch(() => {})
            }
            if (m.guild.me.voice.channel.members.size == 1) { compt++; setTimeout(() => {compt = 0}, 35000) }
            else if (m.guild.me.voice.mute) { compt++; setTimeout(() => {compt = 0}, 35000) }
            if (compt > 5) {
                m.guild.voice.channel.leave()
                m.edit(embed.setDescription(translations['1007'].replace('{prefix}', message.content.charAt(0))))
                return m.reactions.removeAll().catch(() => {})
            }
            await sleep(5000)
        }
    } catch(e) {}

}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Ecoutez la radio Fortnite',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
