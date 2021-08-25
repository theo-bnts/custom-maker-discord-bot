const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const needle = require('needle')
const Canvas = require('canvas')
const canvasTxt = require('canvas-txt').default

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS'])) return

    const translations = await getTranslations(message.guild, false, ['3054', '3055', '3056', '3057', '3058', '3059', '3060', '3061', '3062', '3063', '3064', '3065', '3066', '3067', '3068', '3069', '3070', '3071', '3072'])

    const embed = new Discord.MessageEmbed().setColor(config.embedsColor)
        
    if (args.length == 0)
        return message.channel.send(embed.setDescription(translations['0002'].replace('{p}', message.content.charAt(0)).replace('{c}', 'item').replace('{a}', '[item name]')))

    message.channel.startTyping()

    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
    const check = await Canvas.loadImage('assets/images/check.png')
    const cross = await Canvas.loadImage('assets/images/cross.png')
    const canvas = await Canvas.createCanvas(2000, 1125)
    const ctx = canvas.getContext('2d')
    with (ctx) {
        const gradient = createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#0093fb')
        gradient.addColorStop(1, '#014cbc')
        fillStyle = gradient
        fillRect(0, 0, canvas.width, canvas.height)
    }
    
    var res = (await needle('get', `https://fortniteapi.io/v2/items/list?name=*${encodeURI(args.join(' '))}*&searchLang=all&lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo}})).body.items.sort((a, b) => { return b.interest - a.interest })
    if (res?.length > 0)
        if (res.filter(f => f.name.toLowerCase() == args.join(' ').toLowerCase()).length>0) res = res.filter(f => f.name.toLowerCase() == args.join(' ').toLowerCase())[0]
        else res = res[0]
    else 
        res = (await needle('get', `https://fortniteapi.io/v1/loot/fish?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo}})).body.fish.filter(f => f.name.toLowerCase().includes(args.join(' ').toLowerCase()))[0]
    if (res) {
        with (ctx) {
            var image = await Canvas.loadImage(res.image || res.images.featured || res.images.icon)
            if (res.images && res.images.featured) drawImage(image, 0, 125, 1000, 1000)
            else drawImage(image, 150, 325, 600, 600)
    
            font = '70px burbank'
            fillStyle = '#fff'
            fillText(res.name.toUpperCase(), 900, 150)
            fillStyle = '#75c4f1'
            fillText(bot.user.username.toUpperCase(), canvas.width - 100 - measureText(bot.user.username.toUpperCase()).width, 150)
    
            const texts = [
                [translations['3054'], 'res.type.name'],
                [translations['3055'], 'res.description'],
                [translations['3056'], 'res.rarity.name'],
                [translations['3057'], 'res.series.name'],
                [translations['3058'], 'res.set.name'],
                [translations['3059'], 'res.price'],
                [translations['3060'], "new Date(res.releaseDate || res.added.date || needError).toLocaleDateString(translations.lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })"],
                [translations['3061'], "new Date(res.lastAppearance || needError).toLocaleDateString(translations.lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })"],
                [translations['3068'], 'res.details'],
                [translations['3069'], 'res.sizeMin'],
                [translations['3070'], 'res.sizeMax'],
                [translations['3071'], 'res.heal'],
                [translations['3072'], 'res.maxStackSize']
            ]

            var x=900, y=225
            font = '45px burbank'
            for (const text of texts) {
                try {
                    with (canvasTxt) {
                        fontSize = 45
                        font = 'burbank'
                        fillStyle = '#fff'
                        align = 'left'
                        vAlign = 'top'
                        drawedText = drawText(ctx, eval(text[1]).toString().toUpperCase(), x, y, 1050)
                    }

                    fillStyle = '#75c4f1'
                    fillText(text[0].toUpperCase(), x, y)

                    y+=drawedText.height+70
                } catch (e) {}
            }

            if (res.video) {
                await message.channel.send({ files: [{ attachment: canvas.toBuffer(), name: `${res.id}.png`}, { attachment: (await needle('get', res.video)).body, name: `${res.id}.mp4`}] })
                    .catch(async () => {
                        await message.channel.send(res.video, { files: [{ attachment: canvas.toBuffer(), name: `${res.id}.png`}] })
                    })
            } else await message.channel.send({ files: [{ attachment: canvas.toBuffer(), name: `${res.id}.png`}] })
            return message.channel.stopTyping(true)
        }
    }


    res = (await needle('get', `https://fortniteapi.io/v1/loot/list?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo}})).body.weapons.filter(w => w.name.toLowerCase().includes(args.join(' ').toLowerCase())).sort((a, b) => { return (a.enabled == b.enabled)? 0 : a.enabled? -1 : 1 })
    const rarities = (await needle('get', `https://fortniteapi.io/v2/rarities?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo}})).body.rarities
    if (res[0]) {
        with (ctx) {
            const image = await Canvas.loadImage(res[0].images.icon)
            drawImage(image, 75, canvas.height/2-75, 400, 400)

            font = '70px burbank'
            fillStyle = '#fff'
            fillText(res[0].name.toUpperCase(), 50, 150)
            fillStyle = '#75c4f1'
            fillText(bot.user.username.toUpperCase(), canvas.width - 100 - measureText(bot.user.username.toUpperCase()).width, 150)

            const colors = ['#202020', '#fff', '#4dc73a', '#00b7fd', '#bc3ddb', '#dbb63d']
            var x=550, y=250, width=350, height=775, radius=80, n=0

            for (const color of colors) {
                const newGradient = createLinearGradient(0, 0, 0, 1500)
                newGradient.addColorStop(0, color)
                newGradient.addColorStop(1, '#202020')
                fillStyle = newGradient

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
                fill()

                x += width + 25
                width = 175
            }

            const texts = [
                [translations['3056'], 'item.rarity'],
                [translations['3062'], 'item.mainStats.DmgPB'],
                [translations['3063'], 'item.mainStats.DamageZone_Critical'],
                [translations['3064'], 'item.mainStats.ClipSize'],
                [translations['3065'], 'item.mainStats.FiringRate'],
                [translations['3066'], 'item.mainStats.ReloadTime'],
                [translations['3067'], 'item.enabled']
            ]
            const raritiesList = ['common', 'uncommon', 'rare', 'epic', 'legendary']

            y = 350, x=1015
            fillStyle = '#fff'
            font = '55px burbank'
            for (const text of texts) {
                var fontSize = 55+1
                do font = `${fontSize--}px burbank`
                while (measureText(text[0].toUpperCase()).width > 310)
                fillText(text[0].toUpperCase(), 875-measureText(text[0].toUpperCase()).width, y)
                for (const rarity of raritiesList) {
                    if (res.some(r => r.rarity == rarity)) {
                        const item = res.find(r => r.rarity == rarity)
                        var evaluedText = eval(text[1])
                        if (text[1] == 'item.rarity') evaluedText = await rarities.find(r => evaluedText.toLowerCase() == r.id.toLowerCase()).name
                        evaluedText = evaluedText.toString().toUpperCase()
                        fontSize = 55+1
                        do font = `${fontSize--}px burbank`
                        while (measureText(evaluedText).width > 150)
                        if (evaluedText == 'TRUE') drawImage(check, x-25, y-50, 50, 50)
                        else if (evaluedText == 'FALSE') drawImage(cross, x-25, y-50, 50, 50)
                        else fillText(evaluedText, x-measureText(evaluedText).width/2, y)
                    } else {
                        fillText('-', x-measureText('-').width/2, y)
                    }
                    x += 200
                }
                y+=95, x=1015
            }

            await message.channel.send({ files: [canvas.toBuffer()]})
            return message.channel.stopTyping()
        }
    }

    message.channel.send(embed.setDescription(translations['1036']))
    message.channel.stopTyping(true)
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Informations sur un article ou une arme',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}
