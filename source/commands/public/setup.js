const Discord = require('discord.js')
const mysql = require('mysql')
const cooldown = new Set()

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ADD_REACTIONS'])) return

    var prefix = '*'
    var shopLobby = 'Aucun'
    var newsLobby = 'Aucun'
    var verificationLobby = 'Aucun'
    var verifedRole = 'Aucun'
    var rename = 'Non'
    var deleteCommands = 'Non'
    var setupChoiced = false
    var userId = message.author.id
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔺', '🔻']
    const textChannelsSave = []
    const rolesSave = []
    const list = []
    const promiseEmojiFirst = []
    const promiseEmojiSecond = []
    var a = 0
    var b = 0
    var c = 0
    var d = 0
    var e = 0
    var canDown
    var canUp
    const embedChoiceLobby = []
    var UpAndDownChoiced = false
    var actualEmbed
    var numberEmbed
    var highest = 0
    var lobbyType

    const loading = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription('Chargement ...')
    const notPermission = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription('Seuls les administrateurs peuvent faire cette commande.')
    const cooldownEmbed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription('Tu as déja fait cette commande il y a moins de 30 secondes.\nMerci de patienter quelques instants.')
    const choiceSetup = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setTitle('Que voulez vous configurer ?')
    const setupNotChoice = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription('Vous n\'avez pas réagit à temps.')
    const successChangeLobby = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
    const embedShop = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription('Ce salon recevra désormais quotidiennement la boutique Fortnite')
    const embedNews = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription('Ce salon recevra désormais quotidiennement les actualités Fortnite')
    const embedNoRole = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription(`${bot.user.username} ne peux pas attribuer de roles. Tenter de monter son rôle au dessus dans la liste des rôles.`)
    const embedError = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setTitle('Un problème est survenu')
        .setDescription('Je ne parviens pas à réagir à ce message.')

    message.channel.send(loading)
        .then((editm) => {
            if (!message.member.hasPermission('ADMINISTRATOR')) return editm.edit(notPermission)
            if (cooldown.has(message.author.id)) return editm.edit(cooldownEmbed)

            cooldown.add(message.author.id)
            setTimeout(() => { cooldown.delete(message.author.id) }, 30000)

            const connection = mysql.createConnection(config.mysql)
            connection.query(`SELECT * FROM guild_settings WHERE id='${message.guild.id}';`, async (error, results) => {

                if (!results[0]) {
                    connection.query(`INSERT INTO guild_settings (id, prefix) VALUES ('${message.guild.id}', '*')`)
                }

                if (results[0]) {
                    prefix = results[0].prefix

                    if (results[0].shop_channel) {
                        if (message.guild.channels.cache.some(i => i.id == results[0].shop_channel)) {
                            shopLobby = message.guild.channels.cache.find(i => i.id == results[0].shop_channel)
                        }
                    }
                    if (results[0].news_channel) {
                        if (message.guild.channels.cache.some(i => i.id == results[0].news_channel)) {
                            newsLobby = message.guild.channels.cache.find(i => i.id == results[0].news_channel)
                        }
                    }
                    /*if (results[0].verification_lobby) {
                        if (message.guild.channels.cache.some(i => i.id == results[0].verification_lobby)) {
                            verificationLobby = message.guild.channels.cache.find(i => i.id == results[0].verification_lobby)
                        }
                    }*/
                    if (results[0].verified_role) {
                        if (message.guild.roles.cache.some(i => i.id == results[0].verified_role)) {
                            verifedRole = message.guild.roles.cache.find(i => i.id == results[0].verified_role)
                        }
                    }
                    if (results[0].rename_pseudo) {
                        rename = 'Oui'
                    }
                    if (results[0].delete_commands) {
                        deleteCommands = 'Oui'
                    }
                }

                choiceSetup.addFields(
                    { name: emojis[0], value: 'Configurer le prefixe', inline: true },
                    { name: 'Actuel', value: prefix, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: emojis[1], value: 'Configurer le salon de la boutique', inline: true },
                    { name: 'Actuel', value: shopLobby, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: emojis[2], value: 'Configurer le salon des actualités', inline: true },
                    { name: 'Actuel', value: newsLobby, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: emojis[3], value: 'Configurer le salon de vérification', inline: true },
                    { name: 'Actuel', value: verificationLobby, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: emojis[4], value: 'Configurer le rôle des joueurs vérifiés', inline: true },
                    { name: 'Actuel', value: verifedRole, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: emojis[5], value: 'Configurer le renommage des joueurs vérifiés', inline: true },
                    { name: 'Actuel', value: rename, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: emojis[6], value: 'Supprimer les commandes', inline: true },
                    { name: 'Actuel', value: deleteCommands, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }
                )

                while (a < (choiceSetup.fields.length / 3)) {
                    promiseEmojiFirst.push(editm.react(emojis[a]))
                    a++
                }

                Promise.all(promiseEmojiFirst)
                    .then(() => editm.edit(choiceSetup))
                    .catch(() => { return editm.edit(embedError) })

                var emojiNumber = promiseEmojiFirst.length
                while (emojiNumber < emojis.length) {
                    promiseEmojiSecond.push(editm.react(emojis[emojiNumber]))
                    emojiNumber++
                }
                Promise.all(promiseEmojiSecond)

                const firstFiltre = (reaction, user) => {
                    if (setupChoiced == true) return
                    if (user.id != userId || reaction.message.id != editm.id) return
                    if (editm.channel.permissionsFor(editm.guild.me).has(['MANAGE_MESSAGES'])) editm.reactions.resolve(reaction._emoji.name).users.remove(user.id)
                    var emojiPosition = emojis.indexOf(reaction._emoji.name)
                    if (emojiPosition < 0 || emojiPosition > 6) return
                    setupChoiced = true
                    if (emojiPosition == 0) choicePrefix()
                    if (emojiPosition == 1) choiceLobby('shop')
                    if (emojiPosition == 2) choiceLobby('news')
                    if (emojiPosition == 3) choiceLobby('verification')
                    if (emojiPosition == 4) choiceRole()
                    if (emojiPosition == 5) choiceBoolean(editm, 'rename')
                    if (emojiPosition == 6) choiceBoolean(editm, 'deleteCommands')
                }

                editm.awaitReactions(firstFiltre, { max: 1, time: 120000 })
                    .then(() => {
                        if (setupChoiced == true) return
                        editm.reactions.removeAll()
                        return editm.edit(setupNotChoice)
                    })

            })

            function choiceLobby(lobbyType) {
                const textChannels = editm.guild.channels.cache.filter(c => c.type === 'text')
                const numberOfTextChannels = textChannels.size+1

                textChannels.forEach((c) => {
                    textChannelsSave.push(c)
                })

                textChannelsSave.sort((a, b) => {
                    return a.rawPosition - b.rawPosition
                })

                while (b < (numberOfTextChannels / 9)) {
                    list.push(textChannelsSave.slice((b * 9), (9 + (b * 9))))
                    b++
                }

                list[list.length-1].push('❌')

                while (c < list.length) {
                    embedChoiceLobby.push([])
                    if (lobbyType == 'shop') {
                        embedChoiceLobby[c] = new Discord.MessageEmbed()
                            .setColor(config.embedsColor)
                            .setTitle('Choisissez le salon où vous souhaitez recevoir quotidiennement la boutique.')
                            .setFooter(`Page ${(c + 1)} sur ${list.length}`)
                    }
                    if (lobbyType == 'news') {
                        embedChoiceLobby[c] = new Discord.MessageEmbed()
                            .setColor(config.embedsColor)
                            .setTitle('Choisissez le salon où vous souhaitez recevoir les actualitées.')
                            .setFooter(`Page ${(c + 1)} sur ${list.length}`)
                    }
                    if (lobbyType == 'verification') {
                        embedChoiceLobby[c] = new Discord.MessageEmbed()
                            .setColor(config.embedsColor)
                            .setTitle('Choisissez le salon où vos membres pourront se vérifier.')
                            .setFooter(`Page ${(c + 1)} sur ${list.length}`)
                    }
                    while (d < list[c].length) {
                        embedChoiceLobby[c].addField(emojis[d], list[c][d], true)
                        d++
                    }
                    d = 0
                    c++
                }

                editm.edit(embedChoiceLobby[0])

                const upAndDownFiltre = async (reaction, user) => {
                    if (UpAndDownChoiced == true) return
                    if (user.id != userId || reaction.message.id != editm.id) return
                    if (editm.channel.permissionsFor(editm.guild.me).has(['MANAGE_MESSAGES'])) editm.reactions.resolve(reaction._emoji.name).users.remove(user.id)
                    const emojiPosition = emojis.indexOf(reaction._emoji.name)
                    if (emojiPosition < 0) return
                    if (emojiPosition < 9) {
                        e = 0
                        while (e < editm.embeds[0].fields.length) {
                            if (editm.embeds[0].fields[e].name == emojis[emojiPosition]) {
                                UpAndDownChoiced = true
                                editm.reactions.removeAll()
                                var lobby = editm.embeds[0].fields[e].value.replace(/[^0-9\.]+/g, '')
                                if (message.guild.channels.cache.some(i => i.id == lobby)) lobby = message.guild.channels.cache.find(i => i.id == lobby)
                                if (lobbyType == 'shop') {
                                    if (editm.embeds[0].fields[e].value == '❌') {
                                        connection.query(`UPDATE guild_settings SET shop_channel = NULL WHERE id = '${editm.guild.id}';`)
                                        editm.edit(successChangeLobby.setDescription(`✅ Vous ne recevrez plus la boutique sur ce serveur.`))
                                    } else {
                                        if (!await checkPermisions(message, lobby, ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'])) return
                                        connection.query(`UPDATE guild_settings SET shop_channel = '${lobby.id}' WHERE id = '${editm.guild.id}';`)
                                        editm.edit(successChangeLobby.setDescription(`✅ Le salon pour la boutique quotidienne à bien été modifié pour ${lobby}`))
                                        lobby.send(embedShop).then(() => lobby.send({ files: [{ attachment: 'assets/shop/fr.png', name: 'boutique.png' }]}))
                                    }
                                }
                                if (lobbyType == 'news') {
                                    if (editm.embeds[0].fields[e].value == '❌') {
                                        connection.query(`UPDATE guild_settings SET news_channel = NULL WHERE id = '${editm.guild.id}';`)
                                        editm.edit(successChangeLobby.setDescription(`✅ Vous ne recevrez plus les actualités sur ce serveur.`))
                                    } else {
                                        if (!await checkPermisions(message, lobby, ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'])) return
                                        connection.query(`UPDATE guild_settings SET news_channel = '${lobby.id}' WHERE id = '${editm.guild.id}';`)
                                        editm.edit(successChangeLobby.setDescription(`✅ Le salon pour les actualités Fortnite à bien été modifié pour ${lobby}`))
                                        lobby.send(embedNews).then(() => lobby.send({ files: [{ attachment: 'assets/news/fr.gif', name: 'news.gif' }]}))
                                    }
                                }
                                if (lobbyType == 'verification') {
                                    if (editm.embeds[0].fields[e].value == '❌') {
                                        //connection.query(`UPDATE guild_settings SET verification_lobby = NULL WHERE id = '${editm.guild.id}';`)
                                        editm.edit(successChangeLobby.setDescription(`✅ Le salon de vérification a été désactivé.`))
                                    } else {
                                        if (!await checkPermisions(message, lobby, ['VIEW_CHANNEL', 'SEND_MESSAGES', 'ATTACH_FILES', 'ADD_REACTIONS'])) return
                                        //connection.query(`UPDATE guild_settings SET verification_lobby = '${lobby.id}' WHERE id = '${editm.guild.id}'`)
                                        editm.edit(successChangeLobby.setDescription(`✅ Le salon de vérification à bien été modifié pour ${lobby}`))
                                        lobby.send({ files: [{ attachment: './assets/images/link-account.png', name: 'verifie_ton_compte.png' }]}).then((e) => e.react('📘'))
                                    }
                                }
                                setTimeout(() => { connection.destroy() }, 1000)
                            }
                            e++
                        }
                    }
                    actualEmbed = editm.embeds[0].footer.text.split(' ')[1] - 1
                    numberEmbed = list.length

                    if (actualEmbed > 0) canDown = true
                    else canDown = false
                    if (actualEmbed < numberEmbed) canUp = true
                    else canUp = false

                    if (emojiPosition == 9 && canDown == true) editm.edit(embedChoiceLobby[actualEmbed - 1])
                    if (emojiPosition == 10 && canUp == true) editm.edit(embedChoiceLobby[actualEmbed + 1])
                }

                editm.awaitReactions(upAndDownFiltre, { max: 1, time: 120000 })
                    .then(() => {
                        if (UpAndDownChoiced == true) return
                        editm.reactions.removeAll()
                        return editm.edit(setupNotChoice)
                    })
            }

            function choiceRole() {
                const botRoles = editm.channel.guild.me.roles.cache

                botRoles.forEach((r) => {
                    if (r.rawPosition > highest) highest = r.rawPosition
                })

                const roles = editm.guild.roles.cache
                const numberOfRoles = roles.size

                roles.forEach((c) => {
                    if (c.rawPosition < highest && c.managed == false && c.name != '@everyone') rolesSave.push(c)
                })

                rolesSave.sort((a, b) => {
                    return b.rawPosition - a.rawPosition
                })

                if (rolesSave.length < 1) {
                    editm.reactions.removeAll()
                    return editm.edit(embedNoRole)
                }

                while (b < (rolesSave.length / 10)) {
                    list.push(rolesSave.slice((b * 10), (9 + (b * 10))))
                    b++
                }

                while (c < list.length) {
                    embedChoiceLobby.push([])
                    embedChoiceLobby[c] = new Discord.MessageEmbed()
                        .setColor(config.embedsColor)
                        .setTitle('Choisissez le rôle que vous souhaitez donner aux membres vérifiés.')
                        .setFooter(`Page ${(c + 1)} sur ${list.length}`)
                    while (d < list[c].length) {
                        embedChoiceLobby[c].addField(emojis[d], list[c][d], true)
                        d++
                    }
                    d = 0
                    c++
                }

                editm.edit(embedChoiceLobby[0])

                const upAndDownFiltre = async (reaction, user) => {
                    if (UpAndDownChoiced == true) return
                    if (user.id != userId || reaction.message.id != editm.id) return
                    if (editm.channel.permissionsFor(editm.guild.me).has(['MANAGE_MESSAGES'])) editm.reactions.resolve(reaction._emoji.name).users.remove(user.id)
                    const emojiPosition = emojis.indexOf(reaction._emoji.name)
                    if (emojiPosition < 0) return
                    if (emojiPosition < 9) {
                        e = 0
                        while (e < editm.embeds[0].fields.length) {
                            if (editm.embeds[0].fields[e].name == emojis[emojiPosition]) {
                                UpAndDownChoiced = true
                                editm.reactions.removeAll()
                                if (!await checkPermisions(message, message.channel, ['MANAGE_ROLES'])) return
                                editm.edit(successChangeLobby.setDescription(`✅ Le rôle des membres vérifiés à bien été modifié pour <@&${editm.embeds[0].fields[e].value.replace(/[^0-9\.]+/g, '')}>`))
                                connection.query(`UPDATE guild_settings SET verified_role = '${editm.embeds[0].fields[e].value.replace(/[^0-9\.]+/g, '')}' WHERE id = '${editm.channel.guild.id}';`)
                                setTimeout(() => { connection.destroy() }, 1000)
                            }
                            e++
                        }
                    }
                    actualEmbed = editm.embeds[0].footer.text.split(' ')[1] - 1
                    numberEmbed = list.length

                    if (actualEmbed > 0) canDown = true
                    else canDown = false
                    if (actualEmbed < numberEmbed) canUp = true
                    else canUp = false

                    if (emojiPosition == 9 && canDown == true) editm.edit(embedChoiceLobby[actualEmbed - 1])
                    if (emojiPosition == 10 && canUp == true) editm.edit(embedChoiceLobby[actualEmbed + 1])
                }

                editm.awaitReactions(upAndDownFiltre, { max: 1, time: 120000 })
                    .then(() => {
                        if (UpAndDownChoiced == true) return
                        editm.reactions.removeAll()
                        return editm.edit(setupNotChoice)
                    })
            }

            function choicePrefix() {
                const prefixes = ['*', '!', '?', '>', '/', '-', '+', '&', 'c']

                while (b < (prefixes.length / 10)) {
                    list.push(prefixes.slice((b * 10), (9 + (b * 10))))
                    b++
                }

                while (c < list.length) {
                    embedChoiceLobby.push([])
                    embedChoiceLobby[c] = new Discord.MessageEmbed()
                        .setColor(config.embedsColor)
                        .setTitle('Choisissez le préfixe que vous souhaitez utiliser pour les commandes.')
                        .setFooter(`Page ${(c + 1)} sur ${list.length}`)
                    while (d < list[c].length) {
                        embedChoiceLobby[c].addField(emojis[d], list[c][d], true)
                        d++
                    }
                    d = 0
                    c++
                }

                editm.edit(embedChoiceLobby[0])

                const upAndDownFiltre = (reaction, user) => {
                    if (UpAndDownChoiced == true) return
                    if (user.id != userId || reaction.message.id != editm.id) return
                    if (editm.channel.permissionsFor(editm.guild.me).has(['MANAGE_MESSAGES'])) editm.reactions.resolve(reaction._emoji.name).users.remove(user.id)
                    const emojiPosition = emojis.indexOf(reaction._emoji.name)
                    if (emojiPosition < 0) return
                    if (emojiPosition < 9) {
                        e = 0
                        while (e < editm.embeds[0].fields.length) {
                            if (editm.embeds[0].fields[e].name == emojis[emojiPosition]) {
                                UpAndDownChoiced = true
                                editm.reactions.removeAll()
                                if (editm.embeds[0].fields[e].value.length == 1) editm.edit(successChangeLobby.setDescription(`✅ Le préfixe à bien été modifié pour \`${editm.embeds[0].fields[e].value}\``))
                                else { return editm.edit(successChangeLobby.setDescription('Une erreur innatendu est survenue')) }
                                connection.query(`UPDATE guild_settings SET prefix = '${editm.embeds[0].fields[e].value}' WHERE id = '${editm.channel.guild.id}'`)
                                setTimeout(() => { connection.destroy() }, 1000)
                            }
                            e++
                        }
                    }
                    actualEmbed = editm.embeds[0].footer.text.split(' ')[1] - 1
                    numberEmbed = list.length

                    if (actualEmbed > 0) canDown = true
                    else canDown = false
                    if (actualEmbed < numberEmbed) canUp = true
                    else canUp = false

                    if (emojiPosition == 9 && canDown == true) editm.edit(embedChoiceLobby[actualEmbed - 1])
                    if (emojiPosition == 10 && canUp == true) editm.edit(embedChoiceLobby[actualEmbed + 1])
                }

                editm.awaitReactions(upAndDownFiltre, { max: 1, time: 120000 })
                    .then(() => {
                        if (UpAndDownChoiced == true) return
                        editm.reactions.removeAll()
                        return editm.edit(setupNotChoice)
                    })
            }
        })

    function choiceBoolean(editm, type) {
        const embedChoiceBoolean = new Discord.MessageEmbed()
        if (type == 'rename') {
            embedChoiceBoolean
                .setTitle('Choisissez si vous souhaitez ou non renommer les joueurs par leur pseudo Fortnite')
        }
        if (type == 'deleteCommands') {
            embedChoiceBoolean
                .setTitle('Choisissez si vous souhaitez ou non supprimer les commandes')
        }

        embedChoiceBoolean
            .setColor(config.embedsColor)
            .addFields(
                { name: emojis[0], value: 'Oui', inline: true },
                { name: emojis[1], value: 'Non', inline: true }
            )

        editm.edit(embedChoiceBoolean)

        const upAndDownFiltre = async (reaction, user) => {
            if (UpAndDownChoiced == true) return
            if (user.id != userId || reaction.message.id != editm.id) return
            if (editm.channel.permissionsFor(editm.guild.me).has(['MANAGE_MESSAGES'])) editm.reactions.resolve(reaction._emoji.name).users.remove(user.id)
            const emojiPosition = emojis.indexOf(reaction._emoji.name)
            if (emojiPosition < 0) return
            if (emojiPosition < 2) {
                e = 0
                while (e < editm.embeds[0].fields.length) {
                    if (editm.embeds[0].fields[e].name == emojis[emojiPosition]) {
                        UpAndDownChoiced = true
                        editm.reactions.removeAll()
                        const successChangeBoolean = new Discord.MessageEmbed()
                            .setColor(config.embedsColor)
                        const connection = mysql.createConnection(config.mysql)
                            if (!await checkPermisions(message, message.channel, ['MANAGE_NICKNAMES'])) return
                        if (type == 'rename') {
                            editm.edit(successChangeBoolean.setDescription(`✅ Le renommage à bien été modifié pour \`${editm.embeds[0].fields[e].value}\``))
                            if (editm.embeds[0].fields[e].value == 'Oui') connection.query(`UPDATE guild_settings SET rename_pseudo = '1' WHERE id = '${editm.channel.guild.id}'`)
                            else connection.query(`UPDATE guild_settings SET rename_pseudo = '0' WHERE id = '${editm.channel.guild.id}'`, (err, results) => { if (err) throw err })
                        }
                        if (type == 'deleteCommands') {
                            if (!await checkPermisions(message, message.channel, ['MANAGE_MESSAGES'])) return
                            editm.edit(successChangeBoolean.setDescription(`✅ La suppression des commandes à bien été modifié pour \`${editm.embeds[0].fields[e].value}\``))
                            if (editm.embeds[0].fields[e].value == 'Oui') connection.query(`UPDATE guild_settings SET delete_commands = '1' WHERE id = '${editm.channel.guild.id}'`)
                            else connection.query(`UPDATE guild_settings SET delete_commands = '0' WHERE id = '${editm.channel.guild.id}'`, (err, results) => { if (err) throw err })
                        }
                        setTimeout(() => { connection.destroy() }, 1000)
                    }
                    e++
                }
            }
        }

        editm.awaitReactions(upAndDownFiltre, { max: 1, time: 120000 })
            .then(() => {
                if (UpAndDownChoiced == true) return
                editm.reactions.removeAll()
                return editm.edit(setupNotChoice)
            })
    }
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Configurer le robot pour votre serveur',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: false
}
