const Discord = require('discord.js')
const mysql = require('mysql')
const { Client, Enums } = require('fnbr')

const config = require('../../assets/config.json')
const FortniteApiCom = require('fortnite-api-com')
const fortniteApiCom = new FortniteApiCom(config.fortniteApiCom)

module.exports = async (bot, config) => {
    var ready = false

    const embedBotStarting = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription(`${bot.user.username} démarre, veuillez patienter.`)
    const embedPleaseJoin = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription('Vous pouvez rejoindre le groupe du robot')
    const embedHow = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setTitle('Bienvenu')
        .setDescription('Pour appliquer une tenue, une danse, une pioche ou un sac, entrez simplement le nom de l\'article dans le chat de patie du jeu.')

    const client = new Client(config.epic[1].account)

    (async () => {
        await client.login()
        ready = true
        console.log(`${client.user.displayName} up`)

        await client.pendingFriends.forEach((r) => {
            r.reject()
        })

        client.party.setPrivacy(Enums.PartyPrivacy.PUBLIC).catch(() => {})

        client.on('friend:request', async (friendRequest) => {
            const connection = await mysql.createConnection(config.mysql)
            
            connection.query(`SELECT * FROM users WHERE id_epic='${friendRequest.id}'`, async (err, results) => {
                connection.destroy()
                await friendRequest.accept()
                if (results[0]) {
                    const verificationDate = new Date(results[0].verification_date)
                    const yearVerificationDate = verificationDate.getFullYear()
                    if (yearVerificationDate > 2010) {
                        const user = await bot.users.cache.find(u => u.id == results[0].id_discord)
                        client.sendFriendMessage(friendRequest.id, 'Vous pouvez rejoindre mon groupe.')
                        client.invite(friendRequest.id)
                        user.send(embedPleaseJoin)
                    } else {
                        client.sendFriendMessage(friendRequest.id, 'Votre compte n\'est pas vérifié.')
                        setTimeout(() => { client.removeFriend(friendRequest.id) }, 2000)
                    }
                } else {
                    client.sendFriendMessage(friendRequest.id, 'Vous n\'etes pas inscrit.')
                    setTimeout(() => { client.removeFriend(friendRequest.id) }, 2000)
                }
            })
            
        })

        client.on('party:member:joined', async (member) => {
            if (member.id == client.user.id) return

            const connection = await mysql.createConnection(config.mysql)
            connection.query(`SELECT id_discord FROM users WHERE id_epic='${member.id}'`, async (err, results) => {
                connection.destroy()
                if (results) if (results[0]) {
                    const user = await bot.users.cache.find(u => u.id == results[0].id_discord)
                    if (user) user.send(embedHow)
                }
            })
            

            client.party.sendMessage('-\nBienvenu.\nPour nous rejoindre : discord.fortool.fr\nCode créteur: FTOOL\nPour appliquer une tenue, une danse, une pioche ou un sac, entrez simplement le nom de l\'article.')
            client.party.me.setOutfit('CID_843_Athena_Commando_M_HightowerTomato_Casual', [{channel: 'Progressive', variant: 'Stage2'}])
            client.party.me.setEmote('EID_FireDance')
            client.party.me.setReadiness(true)
            client.party.me.setBanner('NewsletterBanner', 'DefaultColor39')
        })

        client.on('party:member:message', async (partyMessage) => {
            if (!isNaN(Number(partyMessage.content))) return client.party.me.setLevel(partyMessage.content)

            var firstArg = partyMessage.content.split('+')[0]
            if (firstArg.slice(firstArg.length-1, firstArg.length) == ' ') firstArg = firstArg.slice(0, -1)
            fortniteApiCom.CosmeticsSearch({name: encodeURIComponent(firstArg), matchMethod: 'full', searchLanguage: 'fr', language: 'fr'})
                .then(res => {
                    if (res.data.type.value == 'emote') return client.party.me.setEmote(res.data.id)

                    const actualEmote = client.party.me.emote

                    if (res.data.type.value == 'pickaxe') {
                        client.party.me.setPickaxe(res.data.id)
                        client.party.me.setEmote('EID_IceKing')
                        return setTimeout(() => {if (actualEmote) client.party.me.setEmote(actualEmote)}, 5000)
                    }
                    if (res.data.type.value == 'backpack') client.party.me.setBackpack(res.data.id)
                    if (res.data.type.value == 'outfit') client.party.me.setOutfit(res.data.id)

                    const variantes = ['Aucune']
                    if (res.data.variants) { for (const variant of res.data.variants) { for (const option of variant.options) {
                        variantes.push(`${option.name.charAt(0).toUpperCase()}${option.name.slice(1).toLowerCase()}`)
                        if (partyMessage.content.split('+')[1]) if (option.name.replace(' ', '') == partyMessage.content.split('+')[1].toUpperCase().replace(' ', '')) client.party.me.setOutfit(res.data.id, [{channel: variant.channel, variant: option.tag}])
                    }}}
                    if (variantes.length > 1) variantes.shift()
                    while (variantes.indexOf('Par défaut') > -1) variantes.splice(variantes.indexOf('Par défaut'), 1)

                    client.party.sendMessage(`Trouvé !\n${res.data.type.displayValue} ${res.data.name} - ${res.data.rarity.displayValue}\n${res.data.description}\n${res.data.introduction.text}\nVariantes : ${variantes.join(', ')}`)

                    if (actualEmote) client.party.me.setEmote(actualEmote)
                })
                .catch(() => { client.party.sendMessage('Erreur: Impossible de trouver cet article.')})
        })
    })()

    
    global.group = async function group(message, args) {
        if (!ready) return message.channel.send(embedBotStarting)

        const numberOfUsersInGroup = client.party.members.size - 1

        const embed = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setDescription(`Il y a actuellement ${numberOfUsersInGroup} joueur(s) dans le groupe du robot`)

        if (message.author.id == bot.user.id) { await message.edit('-'); message.edit(embed) }
        else message.channel.send(embed)
    }

    global.join = async function join(message, args) {
        if (!ready) return message.channel.send(embedBotStarting)

        const embedPleaseAdd = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setDescription(`Veuillez ajouter \`${client.user.displayName}\``)
        const embedSendInPrivate = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
        const notIncrit = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setDescription('Vous n\'êtes pas inscrit.\nRéagissez avec l\'emoji pour vous inscrire.')
        const notMp = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setDescription('Vous devez activer vos messages privés.\n*(Paramètres utilisateur > Confidentialité & Sécurité > Autoriser les messages privés venant des membres du serveur > Oui)*')
        const inscriptionNotComplted = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setTitle('Vous n\'avez pas compléter le processus d\'inscription')
            .setDescription(`Veuillez vérifier vos **[messages privés](https://discordapp.com/channels/@me)**.`)
        const embedReactError = new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setTitle('Un problème est survenu')
            .setDescription('Je ne parviens pas à réagir à ce message.')

        const connection = mysql.createConnection(config.mysql)
        connection.query(`SELECT * FROM users WHERE id_discord='${message.author.id}';`, async (error, results) => {
            setTimeout(() => { connection.destroy() }, 1000)
            if (results && results[0]) {
                const verificationDate = new Date(results[0].verification_date)
                const yearVerificationDate = verificationDate.getFullYear()
                if (yearVerificationDate > 2010) {
                    message.author.send(embedPleaseAdd)
                    .then(e => {
                        embedSendInPrivate.setDescription(`Les instructions vous ont été envoyées en **[messages privés](https://discordapp.com/channels/@me/${message.author.dmChannel.id})**`)
                        message.channel.send(embedSendInPrivate)
                    })
                    .catch(() => {message.channel.send(notMp)})
                } else {
                    message.channel.send(inscriptionNotComplted)
                }
            } else {
                const m = await message.channel.send(notIncrit)
                m.react('📘').catch(() => { return m.edit(embedReactError) })
            }
        })
    }
}