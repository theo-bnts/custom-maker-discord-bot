const Discord = require('discord.js')
const mysql = require('mysql')
const util = require('util')
const needle = require('needle')
const Canvas = require('canvas')
const humanizeDuration = require('humanize-duration')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ATTACH_FILES', 'USE_EXTERNAL_EMOJIS'])) return

    message.channel.startTyping()

    const translations = await getTranslations(message.guild, false, ['3039', '3040', '3041'])

    const interval=20, breakSize=82, defaultX=breakSize, defaultY=300, defaultWidth=256, defaultHeight=437
    var x=defaultX, maxX=0, y=defaultY, middle=false, section, sections=[], sectionNameSize

    const date = new Date().toLocaleDateString(translations.lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const res = (await needle('get', `https://fortniteapi.io/v2/shop?renderData=true&lang=${translations.lang}`, { headers: {'Authorization': config.fortniteApiIo} })).body
    const colors1 = (await needle('get', 'https://fortniteapi.io/v1/rarities', { headers: {'Authorization': config.fortniteApiIo} })).body
    const colors2 = (await needle('get', 'https://fortniteapi.io/v2/rarities', { headers: {'Authorization': config.fortniteApiIo} })).body
    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
    const vbuckImage = await Canvas.loadImage('assets/images/vbuck.png')
    const chronometerImage = await Canvas.loadImage('assets/images/chronometer.png')
    const interrogationImage = await Canvas.loadImage('assets/images/interrogation.png')
    const moreImage = await Canvas.loadImage('assets/images/more.png')

    for (const item of res.shop) sections.push(item.section.id); sections = [...new Set(sections)]

    var assembleItems = await Canvas.createCanvas(3000, sections.length*(defaultHeight+breakSize)+defaultY)
    const assembleItemsContext = await assembleItems.getContext('2d')
    with (assembleItemsContext) {
        const gradient = createLinearGradient(0, 0, 0, assembleItems.height)
        gradient.addColorStop(0, '#0093fb')
        gradient.addColorStop(1, '#014cbc')
        fillStyle = gradient
        fillRect(0, 0, assembleItems.width, assembleItems.height)
        fillStyle = '#fff'
        font = '150px burbank'
    }

    assembleItemsContext.fillText(translations['3039'].toUpperCase(), defaultX, breakSize+120)

    for (var i=0; i<res.shop.length; i++) {
        if (res.shop[i].section.landingPriority === null) {
            res.shop[i].section.landingPriority = -1
        }
    }

    for (const item of res.shop) {
        async function drawGradient(itemImageContext) {
            var render = item.displayAssets[0].renderData
            if (!render.Background_Color_A.color) render.Background_Color_A.color = '#fff'
            if (!render.Background_Color_B.color) render.Background_Color_B.color = '#555'

            with (itemImageContext) {
                globalCompositeOperation = 'lighter'

                var gradient = createRadialGradient(
                    render.Gradient_Position_X*(defaultHeight/150),
                    render.Gradient_Position_Y*(defaultHeight/100),
                    0, 
                    render.Gradient_Position_X*(defaultHeight/150),
                    render.Gradient_Position_Y*(defaultHeight/100),
                    render.Gradient_Size*7
                )
                gradient.addColorStop(0, render.Background_Color_B.color)
                gradient.addColorStop(1, render.Background_Color_A.color)
                fillStyle = gradient
                fillRect(0, 0, defaultHeight*2, defaultHeight)
    
                if (render.Spotlight_Intensity && render.Spotlight_Size && render.Spotlight_Position_X && render.Spotlight_Position_Y) {
                    gradient = createRadialGradient(
                        render.Spotlight_Position_X*(defaultHeight/150),
                        render.Spotlight_Position_Y*(defaultHeight/100),
                        0, 
                        render.Spotlight_Position_X*(defaultHeight/150),
                        render.Spotlight_Position_Y*(defaultHeight/100),
                        render.Spotlight_Size*3
                    )

                    gradient.addColorStop(0, render.FallOff_Color.color)
                    gradient.addColorStop(1, '#0000')

                    fillStyle = gradient
                    fillRect(0, 0, defaultHeight*2, defaultHeight)
                }

                globalCompositeOperation = 'source-over'
            }
        }

        var background=false, image=false
        if (item.series) {
            try {
                background = await Canvas.loadImage(`assets/images/series/${item.series.id}.png`)
            } catch (e) {
                if (colors2.series.some(s => s.id == item.series.id) && colors2.series.find(s => s.id == item.series.id).image) {
                    background = await Canvas.loadImage(colors2.series.find(s => s.id == item.series.id).image).catch(() => {})
                }
            }
        }

        try {
            image = await Canvas.loadImage(item.displayAssets[0].url)
        } catch (e) {
            image = interrogationImage
        }

        var itemImage, itemImageContext
        if (item.tileSize == 'Small') {
            itemImage = await Canvas.createCanvas(defaultWidth, (defaultHeight-interval)/2)
            itemImageContext = itemImage.getContext('2d')
            drawGradient(itemImageContext)
            with (itemImageContext) {
                if (background) drawImage(background, 0, 0, itemImage.width, itemImage.width)
                drawImage(image, 0, 0, itemImage.width, itemImage.width)
                if (item.displayAssets.length > 1) drawImage(moreImage, defaultWidth-35, (defaultHeight-interval)/2-65-35, 30, 30)
            }
        } else if (item.tileSize == 'DoubleWide') {
            itemImage = await Canvas.createCanvas(defaultWidth*2+interval, defaultHeight)
            itemImageContext = itemImage.getContext('2d')
            drawGradient(itemImageContext)
            with (itemImageContext) {
                if (background) drawImage(background, 0, 0, itemImage.width, itemImage.width)
                drawImage(image, 0, 0, itemImage.width, itemImage.width)
                if (item.displayAssets.length > 1) drawImage(moreImage, defaultWidth*2+interval-35, defaultHeight-65-35, 30, 30)
            }
        } else {
            itemImage = await Canvas.createCanvas(defaultWidth, defaultHeight)
            itemImageContext = itemImage.getContext('2d')
            drawGradient(itemImageContext)
            with (itemImageContext) {
                if (background) drawImage(background, (itemImage.width-itemImage.height)/2, 0, itemImage.height, itemImage.height)
                drawImage(image, (itemImage.width-itemImage.height)/2, (itemImage.height-itemImage.height)/2, itemImage.height, itemImage.height)
                if (item.displayAssets.length > 1) drawImage(moreImage, defaultWidth-35, defaultHeight-65-35, 30, 30)
            }
        }
        with (itemImageContext) {
            fillStyle = '#0d0c0d'
            fillRect(0, itemImage.height-17, itemImage.width, 17)
            drawImage(vbuckImage, itemImage.width-28, itemImage.height-17, 28, 17)
            font = '16px burbank'
            fillStyle = '#fff'
            fillText(item.price.finalPrice, itemImage.width-measureText(item.price.finalPrice).width-30, itemImage.height-3)
            fillStyle = '#5b5a5c'
            if (item.price.finalPrice < item.price.regularPrice) {
                fillText(item.price.regularPrice, itemImage.width-measureText(item.price.finalPrice).width-measureText(item.price.regularPrice).width-35, itemImage.height-3)
                strokeStyle = '#5b5a5c'
                lineWidth = 2
                beginPath()
                moveTo(itemImage.width-measureText(item.price.finalPrice).width-measureText(item.price.regularPrice).width-35, itemImage.height-7)
                lineTo(itemImage.width-measureText(item.price.regularPrice).width-35, itemImage.height-7)
                stroke()
            }

            fillStyle = '#1c1b1c'
            fillRect(0, itemImage.height-17-42, itemImage.width, 42)
            fillStyle='#fff'
            var fontSize = 20
            if (!item.displayName) item.displayName = 'unknown'
            do font = `${fontSize--}px burbank`
            while (measureText(item.displayName.toUpperCase()).width > itemImage.width)
            fillText(item.displayName.toUpperCase(), (itemImage.width-measureText(item.displayName.toUpperCase()).width)/2, itemImage.height-30)

            var color = '#fff'
            if (item.series && colors2.series.some(s => s.id == item.series.id)) color = colors2.series.find(s => s.id == item.series.id).colors.Color1
            else if (item.rarity && colors1.rarities.some(c => c.name.toLowerCase() == item.rarity.id.toLowerCase())) color = colors1.rarities.find(c => c.name.toLowerCase() == item.rarity.id.toLowerCase()).colorA
            fillStyle = color
            beginPath()
            moveTo(0, itemImage.height-17-42-3)
            lineTo(itemImage.width, itemImage.height-17-42-7)
            lineTo(itemImage.width, itemImage.height-17-42)
            lineTo(0, itemImage.height-17-42)
            fill()
        }
        itemImage = await itemImage.toBuffer()
        itemImage = await Canvas.loadImage(itemImage)

        with (assembleItemsContext) {
            if (section != item.section.id) {
                middle = false
                if (section) {
                    x = defaultX
                    y += defaultHeight + breakSize
                }
                sectionNameSize=0
                if (item.section.name) {
                    fillStyle = '#fff'
                    font = '40px burbank'
                    fillText(item.section.name.toUpperCase(), x+interval, y-interval*0.75)
                    sectionNameSize = measureText(item.section.name.toUpperCase()).width

                    fillStyle = '#92eeff'
                    font = ' 30px burbank'
                    drawImage(chronometerImage, x+sectionNameSize+interval*1.5, y-interval*0.75-30+3, 30, 30)
                    if (new Date(res.currentRotation[item.section.id]).getTime()-new Date().getTime() > 0)
                        fillText(await humanizeDuration(new Date(res.currentRotation[item.section.id]).getTime()-new Date().getTime(), {
                            language: translations.lang,
                            fallbacks: ['en'],
                            largest: 1,
                            round: true
                        }).toUpperCase(), x+sectionNameSize+interval*1.5+35, y-interval*0.75)
                    else fillText(translations['3041'].toUpperCase(), x+sectionNameSize+interval*1.5+35, y-interval*0.75)
                }
            }

            section = item.section.id

            var tempY
            if (middle) tempY = y+interval+itemImage.height
            else tempY = y

            drawImage(itemImage, x, tempY, itemImage.width, itemImage.height)
            if (item.banner) {
                font = '19px burbank'
                lineWidth = 10
                if (item.banner.intensity == 'High') {
                    strokeStyle = '#fff'
                    fillStyle = '#ff0'
                } else {
                    strokeStyle = '#ff2d85'
                    fillStyle = '#cb0463'
                }
                beginPath()
                moveTo(x-5, tempY-3)
                lineTo(x+5+measureText(item.banner.name.toUpperCase()).width, tempY-4)
                lineTo(x+5+measureText(item.banner.name.toUpperCase()).width-6, tempY+26)
                lineTo(x-5+4, tempY+25)
                lineTo(x-5, tempY-3)
                lineTo(x+5+measureText(item.banner.name.toUpperCase()).width, tempY-4)
                stroke(); fill()
                if (item.banner.intensity == 'High') fillStyle = '#111'
                else fillStyle = '#fff'
                fillText(item.banner.name.toUpperCase(), x, tempY+interval-3)
            }

            if (middle) {
                middle = false
                x += itemImage.width + interval
            } else {
                if (itemImage.height < defaultHeight) middle = true
                else x += itemImage.width + interval
            }

            if (x > maxX) maxX = x
        }
    }

    assembleItems = await assembleItems.toBuffer()
    assembleItems = await Canvas.loadImage(assembleItems)

    const final = await Canvas.createCanvas(maxX-interval+breakSize, assembleItems.height)
    const finalContext = await final.getContext('2d')
    with (finalContext) {
        drawImage(assembleItems, 0, 0, assembleItems.width, assembleItems.height)
        fillStyle = '#92eeff'
        font = '40px burbank'
        fillText(date.toUpperCase(), final.width-breakSize-measureText(date.toUpperCase()).width, breakSize+50)
        fillText(`${bot.user.username} ${translations['3040']} fortool`.toUpperCase(), final.width-breakSize-finalContext.measureText(`${bot.user.username} ${translations['3040']} fortool`.toUpperCase()).width, breakSize+120)
    }

    const buffer = await final.toBuffer()
    message.channel.send({files: [{attachment: buffer, name: `${translations['3039']}.png`}]})
        .catch(() => {
            message.channel.send(new Discord.MessageEmbed().setColor(config.embedsColor).setImage(`https://fortool.fr/cm/assets/shop/${translations.lang}.png?t=${Date.now()}`))
        })
    message.channel.stopTyping(true)

    const votes = (await needle('get', 'https://ams-lb.fnbr.co/api/shop/votes')).body.data
    message.channel.send(
        new Discord.MessageEmbed()
            .setColor(config.embedsColor)
            .setDescription(`${votes.up} <:like:757630900367261798>\n${votes.neutral} :white_small_square:\n${votes.down} <:dislike:757630900077985925>`)
    )
    
}

module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Boutique quotidienne avec gradients manuels',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}