const Discord = require('discord.js')
const clock = require('date-events')()
const mysql = require('mysql')
const needle = require('needle')
const Canvas = require('canvas')
const canvasTxt = require('canvas-txt').default
const GIFEncoder = require('gifencoder')
const fs = require('fs')
const Twitter = require('twitter')

module.exports = async (bot, config) => {
    clock.on('minute', async function (min) {
        if (min % 2) return
        
        const languagesOrder = ['ar', 'de', 'en', 'es', 'es-419', 'fr', 'it', 'pl', 'pt-br', 'ru', 'tr']

        for (const language of languagesOrder) {
            await sleep(10000)
            var res = (await needle('get', `https://fortniteapi.io/v1/news?lang=${language}&type=br&live=true`, { headers: {'Authorization': config.fortniteApiIo} })).body
            const connection = mysql.createConnection(config.mysql)
            connection.query(`SELECT data FROM updates WHERE type='news' AND language='${language}'`, async (err, results) => {
                setTimeout(() => {connection.destroy()}, 500)
                const savedData = JSON.parse(results[0].data)
                if (res?.news && res?.news[0] && results && results[0] && results[0]?.data && savedData.sorted) {
                    var newNews = false
                    for (const news of res.news) {
                        if (news.id && !JSON.parse(results[0].data).sorted.includes(news.id)) newNews = true
                    }
                    if (!newNews) return console.log(`News event: ${language} not updated`)

                    //// DEBUT GEN NEWS ////

                    console.log(`News event: ${language} generation starting`)

                    const encoder = new GIFEncoder(1280, 720)
                    encoder.createReadStream().pipe(fs.createWriteStream(`assets/news/br/${language}.gif`))
                    encoder.start()
                    encoder.setRepeat(0)
                    encoder.setDelay(5000)

                    const canvas = Canvas.createCanvas(1280, 720)
                    const c = canvas.getContext('2d')
                    await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })

                    const tabTitleWidth = canvas.width/res.news.length

                    for (const news of res.news) {
                        with (c) {
                            const image = await Canvas.loadImage(news.image)
                            drawImage(image, 0, 0, canvas.width, canvas.height)
                            
                            fillStyle = '#014cbc70'
                            fillRect(0, 0, canvas.width, 50)
                            fillStyle = '#fff5'
                            fillRect(tabTitleWidth*res.news.indexOf(news), 0, tabTitleWidth, 50)
                            for (const n of res.news) {
                                fillStyle = '#fff'
                                var fontSize = 30
                                do font = `${fontSize--}px burbank`
                                while (measureText(n.tabTitle.toUpperCase()).width > (tabTitleWidth / 1.1))
                                fillText(n.tabTitle.toUpperCase(), tabTitleWidth * res.news.indexOf(n) + tabTitleWidth / 2 - (measureText(n.tabTitle.toUpperCase()).width / 2), (50+measureText('I').actualBoundingBoxAscent) / 2)
                            }

                            with (canvasTxt) {
                                font = 'burbank'
                                fontSize = 30
                                align = 'left'
                                vAlign = 'top'
                                text = drawText(c, news.body, 0, 2000, 950, 500)
                                text = drawText(c, news.body, 30, canvas.height-text.height-40, 950, 500)
                            }

                            const gradient = createLinearGradient(0, canvas.height-text.height-250, 0, canvas.height)
                            gradient.addColorStop(0, '#0000')
                            gradient.addColorStop(1, '#014cbc')
                            fillStyle = gradient
                            fillRect(0, canvas.height-text.height-250, canvas.width, text.height+250)

                            fillStyle = '#fff'
                            font = '50px burbank'
                            fillText(news.title.toUpperCase(), 30, canvas.height-text.height-45)

                            fillStyle = '#34f1ff'
                            with (canvasTxt) {
                                font = 'burbank'
                                fontSize = 30
                                align = 'left'
                                vAlign = 'top'
                                text = drawText(c, news.body, 0, 2000, 950, 500)
                                text = drawText(c, news.body, 30, canvas.height-text.height-40, 950, 500)
                            }

                            await encoder.addFrame(c)
                        }
                    }

                    encoder.finish()

                    //// FIN GEN NEWS ////

                    console.log(`News event: ${language} generation ended`)

                    const connection = mysql.createConnection(config.mysql)
                    connection.query(`SELECT data FROM updates WHERE type='news' AND language='${language}'`, async (err, results) => {
                        if (res?.news && res?.news[0] && results && results[0] && results[0]?.data && JSON.parse(results[0].data).sorted) {
                            savedData.current = []
                            newNews = false
                            for (const news of res.news) {
                                if (news.id && !JSON.parse(results[0].data).sorted.includes(news.id)) {
                                    newNews = true
                                    savedData.sorted.push(news.id)
                                }
                                savedData.current.push(news.id)
                            }
                            if (!newNews) return
                            connection.query(`UPDATE updates SET date='${new Date().toISOString()}', data='${JSON.stringify(savedData)}' WHERE type='news' AND language='${language}'`, async (err) => {
                                if (!err) {
                                    console.log(`News event: sending ${language}`)
                                    bot.guilds.cache = await bot.guilds.cache.sort((a, b) => { return b.memberCount - a.memberCount })
                                    for (const guild of bot.guilds.cache) {
                                        connection.query(`SELECT news_channel FROM guild_settings WHERE id='${guild[1].id}' AND language='${language}'`, async (err, results) => {
                                            if (results && results[0]?.news_channel && guild[1].channels.cache.some(r => r.id == results[0].news_channel)) {
                                                const channel = await guild[1].channels.cache.find(r => r.id == results[0].news_channel)
                                                await channel.send({ files: [{ attachment: `assets/news/br/${language}.gif`, name: 'news.gif' }] })
                                                    .then((msg) => {
                                                        console.log(guild[1].name)
                                                        if (msg.channel.type == 'news') msg.crosspost().catch(() => {})
                                                    })
                                                    .catch((e) => {
                                                        console.log(guild[1].name, e.message)
                                                    })
                                                await sleep(500)
                                            }
                                        })
                                    }

                                    if (bot.token == config.tokens.public) {
                                        const messages = {
                                            en: 'New news! Join us on Discord here: https://discord.fortool.fr',
                                            fr: 'Nouvelles actualités !\nRejoingnez-nous sur Discord ici: https://discord.fortool.fr'
                                        }
                                        if (config?.social?.twitter?.[language]?.oauth)
                                            try {
                                                const twitterClient = new Twitter(config.social.twitter[language].oauth)
                                                const imageData = await fs.readFileSync(`assets/news/br/${language}.gif`)
                                                twitterClient.post('media/upload', {media: imageData}, function(error, media, response) {
                                                    if (!error) twitterClient.post('statuses/update.json', {status: messages[language], media_ids: media.media_id_string})
                                                })
                                            } catch (e) {}
                                    }
                                } else console.log(err)
                            })
                        }
                    })
                }
            })
        }
    })
}