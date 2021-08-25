const Discord = require('discord.js')
const clock = require('date-events')()
const mysql = require('mysql')
const needle = require('needle')
const Canvas = require('canvas')
const humanizeDuration = require('humanize-duration')
const fs = require('fs')
const Twitter = require('twitter')

module.exports = async (bot, config) => {
    clock.on('minute', async function (min) {
        if (min % 2) return
        
        const asiaFont = ['ja', 'ko', 'zh-cn'] //bug
        const languagesOrder = ['ar', 'de', 'en', 'es', 'es-419', 'fr', 'it', 'pl', 'pt-br', 'ru', 'tr']

        for (const language of languagesOrder) {
            await sleep(10000)
            var res = (await needle('get', `https://fortniteapi.io/v2/shop?lang=${language}`, undefined, { headers: {'Authorization': config.fortniteApiIo} })).body
            const connection = mysql.createConnection(config.mysql)
            connection.query(`SELECT date, data FROM updates WHERE type='shop' AND language='${language}'`, async (err, results) => {
                setTimeout(() => {connection.destroy()}, 500)

                if (res.result
                    && res.fullShop
                    && res.shop?.length > 0
                    && !!res.currentRotation
                    && Object.values(res.currentRotation).length > 0
                    && res.lastUpdate?.date?.length > 0
                    && results?.[0]?.data?.length > 0
                    && !isNaN(new Date(res.lastUpdate.date))
                    && !isNaN(new Date(results?.[0]?.data))
                    && new Date().getTime() - new Date(results?.[0]?.data).getTime() > 1000*60*60*2
                    && new Date().getTime() - new Date(results?.[0]?.date).getTime() > 1000*60*60*2
                    && new Date(res.lastUpdate.date).getTime() - new Date(results?.[0]?.data).getTime() >= 1000*60*60*1
                ) {
                    const translations = await getTranslations(false, language, ['3039', '3040', '3041'])

                    //// DEBUT GEN SHOP ////

                    console.log(`Shop event: ${language} generation starting`)

                    const interval=20, breakSize=82, defaultX=breakSize, defaultY=300, defaultWidth=256, defaultHeight=437
                    var x=defaultX, maxX=0, y=defaultY, middle=false, section, sections=[], sectionNameSize
                
                    const date = new Date().toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                
                    res = (await needle('get', `https://fortniteapi.io/v2/shop?renderData=true&lang=${language}`, { headers: {'Authorization': config.fortniteApiIo} })).body
                    const colors1 = (await needle('get', 'https://fortniteapi.io/v1/rarities', { headers: {'Authorization': config.fortniteApiIo} })).body
                    const colors2 = (await needle('get', 'https://fortniteapi.io/v2/rarities', { headers: {'Authorization': config.fortniteApiIo} })).body
                    if (asiaFont.includes(language)) 
                        await Canvas.registerFont('assets/fonts/asia-font.otf', { family: 'asia-burbank' })
                    else
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
                                            language: language,
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
                
                    var finalWithoutCarousel = await Canvas.createCanvas(maxX-interval+breakSize, assembleItems.height)
                    const finalWithoutCarouselContext = await finalWithoutCarousel.getContext('2d')
                    with (finalWithoutCarouselContext) {
                        drawImage(assembleItems, 0, 0, assembleItems.width, assembleItems.height)
                        fillStyle = '#92eeff'
                        font = '40px burbank'
                        fillText(date.toUpperCase(), finalWithoutCarousel.width-breakSize-measureText(date.toUpperCase()).width, breakSize+50)
                        fillText(`${bot.user.username} ${translations['3040']} fortool`.toUpperCase(), finalWithoutCarousel.width-breakSize-finalWithoutCarouselContext.measureText(`${bot.user.username} ${translations['3040']} fortool`.toUpperCase()).width, breakSize+120)
                    }
                
                    finalWithoutCarousel = await finalWithoutCarousel.toBuffer()
                    await fs.writeFileSync(`assets/shop/${language}.png`, finalWithoutCarousel)

                    finalWithoutCarousel = await Canvas.loadImage(finalWithoutCarousel)

                    // ADD CAROUSEL IF IS AVAILABLE

                    var carouselHeigth = 0
                    if (res.carousel && res.carousel.title && res.carousel.url) carouselHeigth = 9*(maxX-interval+breakSize)/16
                    
                    const finalWithCarousel = await Canvas.createCanvas(maxX-interval+breakSize, finalWithoutCarousel.height+carouselHeigth)
                    const finalWithCarouselContext = await finalWithCarousel.getContext('2d')
                    with (finalWithCarouselContext) {
                        if (res.carousel && res.carousel.title && res.carousel.url) {
                            const carousel = await Canvas.loadImage(res.carousel.url)
                            drawImage(carousel, 0, 0, maxX-interval+breakSize, carouselHeigth)
                
                            fillStyle = '#fff'
                            font = '60px burbank'
                            fillText(res.carousel.title.toUpperCase(), (maxX-interval+breakSize-measureText(res.carousel.title.toUpperCase()).width)/2, carouselHeigth-50)
                
                            beginPath()
                            strokeStyle = '#111'
                            lineWidth = 1
                            strokeText(res.carousel.title.toUpperCase(), (maxX-interval+breakSize-measureText(res.carousel.title.toUpperCase()).width)/2, carouselHeigth-50)
                            stroke()
                        }
                        drawImage(finalWithoutCarousel, 0, carouselHeigth, finalWithoutCarousel.width, finalWithoutCarousel.height)
                    }

                    const bufferWithCarousel = await finalWithCarousel.toBuffer()
                    await fs.writeFileSync(`assets/shop/carousel/${language}.png`, bufferWithCarousel)

                    //// FIN GEN SHOP ////

                    console.log(`Shop event: ${language} generation ended`)

                    const connection = mysql.createConnection(config.mysql)
                    connection.query(`SELECT date, data FROM updates WHERE type='shop' AND language='${language}'`, async (err, results) => {
                        if (res.result
                            && res.fullShop
                            && res.shop?.length > 0
                            && !!res.currentRotation
                            && Object.values(res.currentRotation).length > 0
                            && res.lastUpdate?.date?.length > 0
                            && results?.[0]?.data?.length > 0
                            && !isNaN(new Date(res.lastUpdate.date))
                            && !isNaN(new Date(results?.[0]?.data))
                            && new Date().getTime() - new Date(results?.[0]?.data).getTime() >= 1000*60*60*2
                            && new Date().getTime() - new Date(results?.[0]?.date).getTime() >= 1000*60*60*2
                            && new Date(res.lastUpdate.date).getTime() - new Date(results?.[0]?.data).getTime() >= 1000*60*60*1
                        ) {
                            connection.query(`UPDATE updates SET date='${new Date().toISOString()}', data='${new Date(res.lastUpdate.date).toISOString()}' WHERE type='shop' AND language='${language}'`, async (err) => {
                                if (!err) {
                                    console.log(`Shop event: sending ${language}`)
                                    bot.guilds.cache = await bot.guilds.cache.sort((a, b) => { return b.memberCount - a.memberCount })
                                    for (const guild of bot.guilds.cache) {
                                        connection.query(`SELECT shop_channel FROM guild_settings WHERE id='${guild[1].id}' AND language='${language}'`, async (err, results) => {
                                            if (results?.[0]?.shop_channel && guild?.[1]?.channels?.cache?.some(r => r.id == results[0].shop_channel)) {
                                                try {
                                                    const channel = await guild[1].channels.cache.find(r => r.id == results[0].shop_channel)
                                                    await channel.send(
                                                        new Discord.MessageEmbed()
                                                            .setColor(config.embedsColor)
                                                            .setImage(`https://fortool.fr/cm/assets/shop/${language}.png?c=${new Date().getMonth()}${new Date().getDate()}${new Date().getHours()}`)
                                                    )
                                                    .then((msg) => {
                                                        if (msg.channel.type == 'news')
                                                            msg.crosspost()
                                                                .catch(() => {})
                                                    })
                                                } catch (e) {}
 
                                                await sleep(2000)
                                            }
                                        })
                                    }

                                    if (bot.token == config.tokens.public) {
                                        const messages = {
                                            en: `Here is the shop of the day ( ${date} ) !\nJoin us on Discord here: https://discord.fortool.fr`,
                                            fr: `Voici la boutique du jour ( ${date} ) !\nRejoingnez-nous sur Discord ici: https://discord.fortool.fr`
                                        }
                                        if (config?.social?.twitter?.[language]?.oauth)
                                            try {
                                                const twitterClient = new Twitter(config.social.twitter[language].oauth)
                                                const imageData = await fs.readFileSync(`assets/shop/${language}.png`)
                                                twitterClient.post('media/upload', {media: imageData}, function(error, media, response) {
                                                    if (!error) twitterClient.post('statuses/update.json', {status: messages[language], media_ids: media.media_id_string})
                                                })
                                            } catch (e) {}
                                    }
                                } else console.log(err)
                            })
                        }
                    })
                } else {
                    console.log(`Shop event: ${language} not updated or not full`)
                }
            })
        }
    })
}