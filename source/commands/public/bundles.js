const Discord = require('discord.js')
const Canvas = require('canvas')
const needle = require('needle')

module.exports.run = async (bot, config, message, args, prefix) => {
    const translations = await getTranslations(message.guild, false, [])

    const bundles = (await needle('get', `https://fortniteapi.io/v1/bundles?lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body?.bundles?.filter(b => b.available == true)
    
    if (!bundles.length || bundles.length == 0) return message.channel.send(new Discord.MessageEmbed().setColor(config.embedsColor).setDescription(translations['0001'].setFooter('ERROR CODE: EMPTY_RESULT')))
    
    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })

    const margin = 50

    const canvas = await Canvas.createCanvas(2*margin*1.5+bundles.length*(512+margin)-margin, 1000)
    const ctx = canvas.getContext('2d')

    with (ctx) {
        const gradient = createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#0093fb')
        gradient.addColorStop(1, '#014cbc')
        fillStyle = gradient
        fillRect(0, 0, canvas.width, canvas.height)

        fillStyle = '#fff'

        font = '250px burbank'
        fillText('bundles'.toUpperCase(), (canvas.width - measureText('bundles'.toUpperCase()).width) / 2, 250)

        font = '100px burbank'
        fillText(bot.user.username.toUpperCase(), (canvas.width-measureText(bot.user.username.toUpperCase()).width) / 2, canvas.height - 40)

        var x = margin*1.5, y = 250+margin*1.5

        for (const bundle of bundles) {
            if (bundle.colors?.background) {
                fillStyle = bundle.colors.background
                fillRect(x, y, 512, 512)
            }

            if (bundle.colors?.gradiant?.start && bundle.colors?.gradiant?.stop) {
                const gradient = createRadialGradient(x+256, y+256, 0, x+256, y+256, 512)
                gradient.addColorStop(0, bundle.colors.gradiant.start)
                gradient.addColorStop(1, bundle.colors.gradiant.stop)
                fillStyle = gradient
                fillRect(x, y, 512, 512)
            }

            const image = await Canvas.loadImage(bundle.image || bundle.thumbnail)
            drawImage(image, x, y, 512, 512)

            const priceRectH = 30

            fillStyle = '#0e0e0e'
            fillRect(x, y+512-priceRectH, 512, priceRectH)

            var price = bundle.prices.find(p => p.paymentCurrencyCode == translations.paymentCode)
            price = `${price.paymentCurrencyAmountNatural}${price.paymentCurrencySymbol}`

            fillStyle = '#ccc'
            font = '27px burbank'
            fillText(price, x + 512 - 5 - measureText(price).width, y + 512 - 5)

            fillStyle = '#1e1e1e'
            beginPath()
            moveTo(x, y+512-priceRectH)
            lineTo(x, y+512-priceRectH-50)
            lineTo(x+512, y+512-priceRectH-50-10)
            lineTo(x+512, y+512-priceRectH)
            lineTo(x, y+512-priceRectH)
            fill()

            fillStyle = '#eee'
            font = '40px burbank'
            fillText(bundle.name.toUpperCase(), x + (512 - measureText(bundle.name.toUpperCase()).width) / 2, y + 512 - priceRectH - 10)

            x += 512 + 50
        }

        await message.channel.send({ files: [{ attachment: canvas.toBuffer(), name: 'bundles.png' }]})
    }
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Liste des packs',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}