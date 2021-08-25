const Discord = require('discord.js')
const needle = require('needle')
const util = require('util')
const mysql = require('mysql')
const clock = require('date-events')()
const { Client } = require('fnbr')

module.exports = async (bot, config) => {
    const client = new Client(config.epic[0].account)
    await client.login()
    console.log(`${client.user.displayName} up`)

    const embed = new Discord.MessageEmbed().setColor(config.embedsColor)

    var verificationCode = 'PLEASE WAIT'

    client.pendingFriends.forEach((r) => { r.reject() })

    clock.on('minute', () => {
        verificationCode = Math.floor(Math.random() * 9000) + 1000
        const connection = mysql.createConnection(config.mysql)
        connection.query(`UPDATE config SET data = '${verificationCode}' WHERE id = 'fortnite_statut'`, () => {
            connection.destroy()
        })
    })

    clock.on('second', () => {
        const sec = 60 - (new Date).getSeconds()
        if (!(sec%5)) {
            client.setStatus(`CODE: ${verificationCode} - ${sec}s`)
                .catch(console.error)
        }
    })

    client.on('friend:request', async (friendRequest) => {
        const connection = await mysql.createConnection(config.mysql); const query = util.promisify(connection.query).bind(connection); setTimeout(() => { connection.destroy }, 600000)

        const guildId = (await query(`SELECT last_verification_guild FROM users WHERE id_epic='${friendRequest.id}'`))[0].last_verification_guild
        const translations = await getTranslations({id: guildId}, false, ['1011', '1012', '1013', '1014', '1015', '1016', '1017', '1018', '1019', '1020', '1021', '1022', '1023', '1024', '1025', '1026', '1027', '1028', '1029'])

        connection.query(`SELECT * FROM users WHERE id_epic='${friendRequest.id}'`, async (err, results) => {
            if (results) {
                if (results[0]) {
                    const yearVerificationDate = (await new Date(results[0].verification_date)).getFullYear()
                    const user = await bot.users.fetch(results[0].id_discord)
                    if (yearVerificationDate < 2010) {
                        user.send(embed.setDescription(translations['1012']))
                        .then((m) => {
                            friendRequest.accept()
                            const filter = (collectedMessage) => { return collectedMessage.author.bot == false }
                            m.channel.awaitMessages(filter, { max: 1, time: 300000, errors: ['time'] })
                            .then(async (collected) => {
                                connection.query(`SELECT * FROM config WHERE id='fortnite_statut'`, async (err, results) => {
                                    if (results[0].data == collected.first().content) {
                                        connection.query(`UPDATE users SET verification_date = NOW() WHERE id_discord = '${user.id}'`)
                                        user.send(embed.setDescription(translations['1019'].replace('{fortniteUsername}', friendRequest.displayName).replace('{discordUsername}', user.tag).replace('{botUsername}', bot.user.username)))
                                        sendFortniteMessage("Sucess : Your account is now link !")
                                        needle('get', `https://fortniteapi.io/v1/matches?account=${results[0].id_epic}`, { headers: {'Authorization': config.fortniteApiIo} })
                                        connection.query(`SELECT last_verification_guild, verified_role, rename_pseudo FROM users, guild_settings WHERE last_verification_guild = guild_settings.id AND id_discord = ${user.id}`, async (err, results) => {
                                            var guild
                                            if (await bot.guilds.cache.some(g => g.id == results[0].last_verification_guild)) 
                                                guild = await bot.guilds.cache.find(g => g.id == results[0].last_verification_guild)
                                            else return user.send(embed.setDescription(translations['1015'].replace('{botUsername}', bot.user.username)))
                                            var member = await guild.members.fetch(user.id).catch(() => {})
                                            if (!member) return user.send(embed.setDescription(translations['1022']))
                                            if (results[0].rename_pseudo) 
                                                member.setNickname(friendRequest.displayName)
                                                    .catch(() => { user.send(embed.setDescription(translations['1017'])) })
                                            if (results[0].verified_role) {
                                                const verifiedRole = await guild.roles.cache.find(r => r.id == results[0].verified_role)
                                                if (verifiedRole) {
                                                    member.roles.add(verifiedRole)
                                                        .catch(() => { user.send(embed.setDescription(translations['1018'].replace('{role}', verifiedRole.name))) })
                                                } else user.send(embed.setDescription(translations['1020']))
                                            }
                                        })
                                    } else {
                                        user.send(embed.setDescription(translations['1016'])); user.send(embed.setDescription(translations['1013'].replace('{clientUsername}', client.user.displayName)))
                                        sendFortniteMessage(translations['1024'])
                                    }
                                })
                            })
                            .catch(() => { 
                                user.send(embed.setDescription(translations['1021'])); user.send(embed.setDescription(translations['1013'].replace('{clientUsername}', client.user.displayName)))
                                sendFortniteMessage(translations['1025'])
                            })
                        })
                        .catch(() => { sendFortniteMessage(translations['1026']) })
                    } else {
                        sendFortniteMessage(translations['1027'])
                        user.send(embed.setDescription(translations['1011']))
                    }
                } else
                    sendFortniteMessage(translations['1028'])
            } else
                sendFortniteMessage(translations['1029'])
        })

        function sendFortniteMessage(e) {
            if (!client.friends.some(f => f.id == friendRequest.id)) friendRequest.accept()
            setTimeout(() => { client.sendFriendMessage(friendRequest.id, e) }, 2000)
            setTimeout(() => { client.removeFriend(friendRequest.id) }, 4000)
        }
    })



    global.reactionAdd = async function reactionAdd(reaction, user) {
        const connection = await mysql.createConnection(config.mysql); const query = util.promisify(connection.query).bind(connection); setTimeout(() => { connection.destroy }, 600000)

        const translations = await getTranslations(reaction.message.guild, false, ['1011', '1012', '1013', '1014', '1015', '1016', '1017', '1018', '1019', '1020', '1021', '1022', '1023', '1024', '1025', '1026', '1027', '1028', '1029'])

        if (reaction.partial) await reaction.fetch()
        if (reaction._emoji.name == '📘' && reaction.message.author.id == bot.user.id && user.bot == false) {
            connection.query(`SELECT * FROM users WHERE id_discord='${user.id}';`, async (err, results) => {
                if (!results[0]) await query(`INSERT INTO users (id_discord) VALUES (${user.id})`)
                connection.query(`SELECT * FROM users WHERE id_discord='${user.id}'`, async (err, results) => {
                    if (results[0].id_epic && new Date(results[0].verification_date).getFullYear() > 2010) { 
                        const fortniteUser = await client.getProfile(results[0].id_epic)
                        connection.query(`SELECT * FROM guild_settings WHERE id='${reaction.message.guild.id}'`, async (err, results) => {
                            const member = await reaction.message.guild.members.fetch(user.id).catch(() => {})
                            if (member) {
                                if (results[0].verified_role) {
                                    const verifiedRole = reaction.message.guild.roles.cache.find(r => r.id == results[0].verified_role)
                                    if (verifiedRole) {
                                        member.roles.add(verifiedRole)
                                            .catch(() => {user.send(embed.setDescription(translations['1018'].replace('{role}', verifiedRole.name))) })
                                    } else user.send(embed.setDescription(translations['1020']))
                                }
                                if (results[0].rename_pseudo)
                                    member.setNickname(fortniteUser.displayName)
                                        .catch(() => { user.send(embed.setDescription(translations['1017'])) })
                            } else user.send(embed.setDescription(translations['1022']))
                            connection.query(`UPDATE users SET last_verification_guild = '${reaction.message.guild.id}' WHERE id_discord = '${user.id}'`)
                            user.send(embed.setDescription(translations['1019'].replace('{fortniteUsername}', fortniteUser.displayName).replace('{discordUsername}', user.tag).replace('{botUsername}', bot.user.username)))
                                .catch((f) => {
                                    console.log(f)
                                })
                        })
                    } else {
                        const m = await user.send(embed.setDescription(translations['1014']))
                            .catch(() => {return})
                        const filter = (collectedMessage) => { return collectedMessage.author.bot == false }
                        m.channel.awaitMessages(filter, { max: 1, time: 300000, errors: ['time'] })
                            .catch(() => {
                                user.send(embed.setDescription(translations['1021']))
                            })
                            .then(async (collected) => {
                                const fortniteUser = await client.getProfile(collected.first().content)
                                if (!fortniteUser) return user.send(embed.setDescription(translations['1023'].replace('{url}', reaction.message.url)))
                                user.send(embed.setDescription(translations['1013'].replace('{clientUsername}', client.user.displayName)))
                                    .catch(() => {})
                                connection.query(`UPDATE users SET id_epic = '${fortniteUser.id}', last_verification_guild = '${reaction.message.guild.id}' WHERE id_discord = '${user.id}'`)
                            })
                    }
                })
            })
        }
    }
}