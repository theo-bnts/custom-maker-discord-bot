const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const fs = require('fs')

module.exports = async (bot, config) => {
    global.checkPermisions = async function checkPermisions(message, channel, permissions) {
        if (channel.type == 'dm') return true
        if (channel.type == 'text') permissions.push('SEND_MESSAGES')
        if (channel.permissionsFor(message.guild.me).has(permissions)) return true

        const permissionsStatus = []
        const permissionsFrenchNames = []

        for (const permission of permissions) {
            if (channel.permissionsFor(message.guild.me).has(permission)) permissionsStatus.push('✅')
            else permissionsStatus.push('❎')

            switch (permission) {
                case 'ADMINISTRATOR': permissionsFrenchNames.push('ADMINISTRATEUR'); break
                case 'VIEW_AUDIT_LOG': permissionsFrenchNames.push('VOIR LES LOGS DU SERVEUR'); break
                case 'VIEW_GUILD_INSIGHTS': permissionsFrenchNames.push('VOIR LES ANALYSES DE SERVEUR'); break
                case 'MANAGE_GUILD': permissionsFrenchNames.push('GERER LE SERVEUR'); break
                case 'MANAGE_ROLES': permissionsFrenchNames.push('GERER LES ROLES'); break
                case 'MANAGE_CHANNELS': permissionsFrenchNames.push('GERER LES SALONS'); break
                case 'KICK_MEMBERS': permissionsFrenchNames.push('EXPULSER DES MEMBRES'); break
                case 'BAN_MEMBERS': permissionsFrenchNames.push('BANNIR DES MEMBRES'); break
                case 'CREATE_INSTANT_INVITE': permissionsFrenchNames.push('CREER UNE INVITATION'); break
                case 'CHANGE_NICKNAME': permissionsFrenchNames.push('CHANGER LE PSEUDO'); break
                case 'MANAGE_NICKNAMES': permissionsFrenchNames.push('GERER LES PSEUDOS'); break
                case 'MANAGE_EMOJIS': permissionsFrenchNames.push('GERER LES EMOJIS'); break
                case 'MANAGE_WEBHOOKS': permissionsFrenchNames.push('GERER LES WEBHOOKS'); break
                case 'VIEW_CHANNEL': permissionsFrenchNames.push('LIRE LES MESSAGES OU VOIR LE SALON'); break
                case 'SEND_MESSAGES': permissionsFrenchNames.push('ENVOYER DES MESSAGES'); break
                case 'SEND_TTS_MESSAGES': permissionsFrenchNames.push('ENVOYER DES MESSAGES TTS'); break
                case 'MANAGE_MESSAGES': permissionsFrenchNames.push('GERER LES MESSAGES'); break
                case 'EMBED_LINKS': permissionsFrenchNames.push('INTEGRER DES LIENS'); break
                case 'ATTACH_FILES': permissionsFrenchNames.push('JOINDRE DES FICHIERS'); break
                case 'READ_MESSAGE_HISTORY': permissionsFrenchNames.push('VOIR LES ANCIENS MESSAGES'); break
                case 'MENTION_EVERYONE': permissionsFrenchNames.push('MENTIONNER @EVERYONE, @HERE ET TOUS LES RÔLES'); break
                case 'USE_EXTERNAL_EMOJIS': permissionsFrenchNames.push('UTILISER DES EMOJIS EXTERNES'); break
                case 'ADD_REACTIONS': permissionsFrenchNames.push('AJOUTER DES REACTIONS'); break
                case 'CONNECT': permissionsFrenchNames.push('SE CONNECTER'); break
                case 'SPEAK': permissionsFrenchNames.push('PARLER'); break
                case 'STREAM': permissionsFrenchNames.push('VIDEO'); break
                case 'MUTE_MEMBERS': permissionsFrenchNames.push('COUPER LE MICRO DE MEMBRES'); break
                case 'DEAFEN_MEMBERS': permissionsFrenchNames.push('METTRE EN SOURDINE DES MEMBRES'); break
                case 'MOVE_MEMBERS': permissionsFrenchNames.push('DEPLACER DES MEMBRES'); break
                case 'USE_VAD': permissionsFrenchNames.push('UTILISER LA DETECTION DE VOIX'); break
                case 'PRIORITY_SPEAKER': permissionsFrenchNames.push('VOIX PRIORITAIRE'); break
                default: permissionsFrenchNames.push('ERROR : UNKNOWN PERMISSION')
            }
        }

        var messageContent = '>>> Je requis les permissions suivantes '
        if (channel) {
            if (message.channel.id != channel.id) messageContent += `dans le salon ${channel} `
            else messageContent += 'dans ce salon '
        }
        messageContent += 'pour cette commande :'
        for (var i = 0; i < permissionsFrenchNames.length; i++) {
            messageContent += `\n${permissionsStatus[i]} \`${permissionsFrenchNames[i]}\``
        }
        message.channel.send(messageContent).catch(() => {
            message.author.send(messageContent).catch(() => {})
        })
        return false
    }

    global.sleep = async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    global.getTranslations = async function getTranslations(guild, specificLanguage, requierements) {
        var language = specificLanguage
        if (guild) {
            const connection = mysql.createConnection(config.mysql)
            const query = util.promisify(connection.query).bind(connection)
            language = (await query(`SELECT language FROM guild_settings WHERE id='${guild.id}'`))[0].language
        }
        if (fs.existsSync(`assets/translations/${language}.json`)) {
            const translations = await require(`../../assets/translations/${language}.json`)
            for (const requierement of requierements)
                if (!translations[requierement])
                    return require('../../assets/translations/en.json')
            return translations
        } else
            return require('../../assets/translations/en.json')
    }
}