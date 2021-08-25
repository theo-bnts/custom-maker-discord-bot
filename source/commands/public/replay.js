const Discord = require('discord.js')
const needle = require('needle')
const Canvas = require('canvas')
const { get } = require('request-promise')
const { unlink, writeFile } = require('fs').promises
const reader = require('../../assets/replay-parser')

const cooldown = new Set()

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ATTACH_FILES'])) return

    const cooldownEmbed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription('Tu as déja fait cette commande il y a moins de une minute.\nMerci de patienter quelques instants.')

    if (cooldown.has(message.author.id)) return message.channel.send(cooldownEmbed)
    cooldown.add(message.author.id)
    setTimeout(() => { cooldown.delete(message.author.id) }, 60000)

    var choicedTopsTiers, choicedTopsTiersPoints, killPoints, url, messageToDelete

    const embedBase = new Discord.MessageEmbed().setColor(config.embedsColor).setDescription('Chargement ...')
    const interactiveEmbed = await message.channel.send(embedBase)

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
    const predefineTopsTiers = [[25, 12, 8, 3, 1], [12, 8, 4, 2, 1], [12, 6, 3, 2, 1]]
    const predefineTopsTiersPoints = [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]]
    var desc = ''
    for (var i=0; i<predefineTopsTiers.length; i++) {
        interactiveEmbed.react(emojis[i])
        desc += `\n${emojis[i]}\n`
        for (var j=0; j<predefineTopsTiers[i].length; j++) {
            desc += `TOP ${predefineTopsTiers[i][j]} : ${predefineTopsTiersPoints[i][j]} POINTS\n`
        }
    }
    interactiveEmbed.edit(embedBase.setTitle('Choississez les paliers et points en réagissant').setDescription(desc))

    var filtre = async (reaction, user) => {
        if (user.id != message.author.id) return
        if (interactiveEmbed.channel.permissionsFor(interactiveEmbed.guild.me).has(['MANAGE_MESSAGES'])) interactiveEmbed.reactions.resolve(reaction._emoji.name).users.remove(user.id)
        if (emojis.includes(reaction._emoji.name) && predefineTopsTiers[emojis.indexOf(reaction._emoji.name)]) return true
    }

    await interactiveEmbed.awaitReactions(filtre, { max: 1, time: 300000 })
        .then((c) => {
            if (c.size == 0) {
                if (interactiveEmbed.channel.permissionsFor(interactiveEmbed.guild.me).has(['MANAGE_MESSAGES'])) interactiveEmbed.reactions.removeAll()
            } else {
                choicedTopsTiers = predefineTopsTiers[emojis.indexOf(c.first()._emoji.name)]
                choicedTopsTiersPoints = predefineTopsTiersPoints[emojis.indexOf(c.first()._emoji.name)]
            }
        })
    if (!choicedTopsTiers || !choicedTopsTiers) return

    embedBase.title = null
    interactiveEmbed.edit(embedBase.setDescription('Chargement ...'))
    const reactions = []
    for (const reaction of interactiveEmbed.reactions.cache) reactions.push(reaction[0])
    for (const emoji of emojis) if (!reactions.includes(emoji)) await interactiveEmbed.react(emoji)
    interactiveEmbed.edit(embedBase.setDescription('Choisissez le nombre de points par éliminations'))

    filtre = async (reaction, user) => { if (user.id == message.author.id && emojis.includes(reaction._emoji.name)) return true }
    await interactiveEmbed.awaitReactions(filtre, { max: 1, time: 300000 })
        .then((c) => {
            if (interactiveEmbed.channel.permissionsFor(interactiveEmbed.guild.me).has(['MANAGE_MESSAGES'])) interactiveEmbed.reactions.removeAll()
            if (c.size > 0) killPoints = emojis.indexOf(c.first()._emoji.name)+1
        })
    if (!killPoints) return

    embedBase.description = null
    embedBase.addFields(
            { name: 'Si vous êtes utilisateurs de Discord Nitro', value: 'Uploader simplement votre fichier .replay' },
            { name: 'Si vous n\'êtes pas utilisateur de Discord Nitro', value: `:one: Rendez vous sur https://upload.fortool.fr\n:two: Cliquez sur "Send files" et sélectionner votre fichier\n:three: Patientez puis cliquer sur "Copy Link"\n:four: Envoyez le lien copié dans ce chat` }
    )
    interactiveEmbed.edit(embedBase)

    filtre = async (msg) => { 
        if (msg.content.startsWith('https://filetransfer.io/data-package/') || (msg.attachments && msg.attachments.first() && msg.attachments.first().attachment.endsWith('.replay'))) return true
    }
    await interactiveEmbed.channel.awaitMessages(filtre, { max: 1, time: 300000 })
        .then((c) => {
            if (c.size > 0) {
                if (c.first().content.startsWith('https://filetransfer.io/data-package/')) {
                    url = `${c.first().content.split('#')[0]}/download`
                } else {
                    url = c.first().attachments.first().attachment
                }
                messageToDelete = c.first()
            }
        })

    embedBase.fields = null

    if (!url) return interactiveEmbed.edit(embedBase.setDescription('Temps écoulé. Vous pouvez essayer à nouveau.'))

    interactiveEmbed.edit(embedBase.setDescription('Début du traitement, cela peut prendre 1 minute au maximum'))
    message.channel.startTyping()

    var replay
    const fileName = Date.now()
    try {
        const attachmentFile = await get({ url: url, encoding: null })
        if (interactiveEmbed.channel.permissionsFor(interactiveEmbed.guild.me).has(['MANAGE_MESSAGES'])) messageToDelete.delete()
        writeFile(`assets/temp/${fileName}.replay`, attachmentFile)
        replay = await reader(`assets/temp/${fileName}.replay`, true)
        unlink(`assets/temp/${fileName}.replay`)
    } catch (e) {
        message.channel.stopTyping(true)
        interactiveEmbed.edit(embedBase.setDescription('Impossible de traiter ce fichier pour une raison inconnue'))
        return unlink(`assets/temp/${fileName}.replay`)
    }

    if (replay.teamStats.Position > 2) {
        message.channel.stopTyping(true)
        return interactiveEmbed.edit(embedBase.setDescription('Je peux uniquement traiter des replays des premiers ou seconds d\'une partie'))
    }

    const teams = []
    for (const team of replay.teamData) {
        if (team.PlayerNames && team.PlayerNames.length > 0 && !team.PlayerNames.includes(null) && team.Placement) {
            if (team.PlayerNames.length > 20) {
                message.channel.stopTyping(true)
                return interactiveEmbed.edit(embedBase.setDescription('Je ne peux pas traiter les replays de ce mode à très grandes équipes'))
            }
            const sorted = [] 
            for (var i=0; i<team.PlayerNames.length; i++) sorted.push(team.PlayerNames[i].toLowerCase())
            const users = (await needle('get', `https://fortniteapi.io/v1/lookupUsername?id=${sorted.join(',')}`, { headers: {'Authorization': config.fortniteApiIo} })).body.accounts
            const usernames = []
            for (const user of users) usernames.push(user.username)
            teams.push({
                usernames: usernames,
                placement: team.Placement,
                kills: team.TeamKills,
                points: null
            })
        }
    }
    teams.sort((a, b) => { return a.placement - b.placement })

    for (const team of teams) {
        if (!team.kills) team.kills = 0

        team.placement = teams.indexOf(team)+1

        var topPoints = 0
        for (const top of choicedTopsTiers) if (team.placement <= top) topPoints = choicedTopsTiersPoints[choicedTopsTiers.indexOf(top)]
        team.points = team.kills*killPoints + topPoints
    }

    const columns = []
    var usersInColumn = 100
    for (const team of teams) {
        if (usersInColumn + team.usernames.length > 20) {
            columns.push([])
            usersInColumn = 0
        }
        columns[columns.length-1].push(team)
        usersInColumn += team.usernames.length
    }
    
    const canvas = await Canvas.createCanvas(3500, 2000)
    const ctx = canvas.getContext('2d')

    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })

    with (ctx) {
        const gradient = createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#7abaff')
        gradient.addColorStop(1, '#1a4370')
        fillStyle = gradient
        fillRect(0, 0, canvas.width, canvas.height)

        fillStyle = '#fff'
        font = '200px burbank'
        fillText('CLASSEMENT', canvas.width / 2 - measureText('CLASSEMENT').width / 2, 200)

        const xPositions = [300, 600, 900, 2600, 2900, 3200]
        for (var i=0; i<=xPositions.length; i++) {
            const texts = []
            if (xPositions[i] != 300) { texts[0] = `TOP ${choicedTopsTiers[i-1]}`; texts[1] = `${choicedTopsTiersPoints[i-1]}✪` }
            else { texts[0] = 'ELIM'; texts[1] = `${killPoints}✪` }
            font = '60px burbank'; fillText(texts[0], xPositions[i] - measureText(texts[0]).width/2, 200)
            font = '100px burbank'; fillText(texts[1], xPositions[i] - measureText(texts[1]).width/2, 140)
            font = '80px burbank'; fillText(bot.user.username.toUpperCase(), canvas.width - measureText(bot.user.username.toUpperCase()).width / 2 - 350, canvas.height - 100)
        }

        var x = 50
        const interval = 25
        const columnWidth = (canvas.width-x*2-interval*(columns.length-1))/columns.length
        const cellHeight = 80

        var color = '#888'
        for (const column of columns) {
            var y = 340
            for (const team of column) {
                await roundRect(x, y-cellHeight+10, columnWidth, cellHeight*team.usernames.length, 50, color, ctx)
                if (color == '#888') { fillStyle = '#fff'; color = '#fff' }
                else { fillStyle = '#888'; color = '#888' }
                font = '80px burbank'
                const pointsWidth = measureText(`${team.points}✪`).width
                fillText(`${team.points}✪`, x+columnWidth-pointsWidth-5, y+cellHeight*team.usernames.length/2-50)
                fillText(`#${team.placement}`, x+5, y+cellHeight*team.usernames.length/2-50)
                for (const username of team.usernames) {
                    var fontSize = 70
                    do font = `${fontSize--}px burbank`
                    while (measureText(username.toUpperCase()).width > columnWidth/6*5-pointsWidth-15)
                    fillText(username.toUpperCase(), x+columnWidth/6, y-cellHeight/2+10+measureText('I').actualBoundingBoxAscent/2)
                    y += cellHeight
                }
                y += 5
            }
            x += columnWidth + interval
        }
        
        const logChannel = await bot.channels.cache.find(c => c.id == config.logChannel)
        const result = await logChannel.send({files: [canvas.toBuffer()]})
        embedBase.description = null
        interactiveEmbed.edit(embedBase.setTitle('Tout est terminé !').setImage(result.attachments.first().attachment))
        message.channel.stopTyping(true)
    }

    async function roundRect(x, y, width, height, radius, color, ctx) {
        if (radius > height/2) radius = height/2
        with (ctx) {
            beginPath()
            moveTo(x + radius, y)
            lineTo(x + width - radius, y)
            quadraticCurveTo(x + width, y, x + width, y + radius)
            lineTo(x + width, y + height - radius)
            quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
            lineTo(x + radius, y + height)
            quadraticCurveTo(x, y + height, x, y + height - radius)
            lineTo(x, y + radius)
            quadraticCurveTo(x, y, x + radius, y)
            fillStyle = color
            fill()
        }
    }
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Créer un classement à partir d\'un fichier .replay',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}