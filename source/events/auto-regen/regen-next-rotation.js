const clock = require('date-events')()
const mysql = require('mysql')
const Canvas = require('canvas')
const fs = require('fs')
const Twitter = require('twitter')

module.exports = async (bot, config) => {

    clock.on('minute', async (min) => {
        if (min % 2) return

        const languages = ['ar', 'de', 'en', 'es', 'es-419', 'fr', 'it', 'pl', 'pt-br', 'ru', 'tr']

        for (const language of languages) {

            await sleep(10000)

            const req = (
                await require('needle')(
                    `https://fortniteapi.io/v2/shop/sections/active?lang=${language}`,
                    { headers: { 'Authorization': config.fortniteApiIo } }
                )
            ).body

            var connection = mysql.createConnection(config.mysql)
            connection.query(`SELECT date, data FROM updates WHERE type='rotation' AND subtype='next' AND language='${language}'`, async (err, results) => {

                setTimeout(() => { connection.destroy() }, 500)

                if (req.result && new Date().getTime() - new Date(results[0].date).getTime() > 1000 * 60 * 10) {

                    var tabs = false
                    if (req.list.some(i => i.apiTag === 'next'))
                        tabs = req.list.find(i => i.apiTag === 'next').sections

                    if (
                        tabs?.length > 0 &&
                        JSON.stringify(tabs.map(t => t.id).sort()) != JSON.stringify(JSON.parse(results[0].data).sort())
                    ) {
                        console.log(`Rotation event: next: ${language} updated`)

                        const translations = await getTranslations(false, language, ['3073'])

                        const alp = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase()
                        const tabsAndQuantity = []

                        for (var tab of tabs) {
                            var tabName = ''
                    
                            if (tab.displayName) {
                                tabName = tab.displayName
                            } else {
                                if (tab.id.endsWith('B'))
                                    tab.id = tab.id.slice(0, -1)
                    
                                if (!isNaN(tab.id[tab.id.length-1]))
                                    tab.id = tab.id.slice(0, -1)
                                
                                for (var i=0; i < tab.id.length; i++)
                                    if (i>0 && !alp.includes(tab.id[i-1]) && alp.includes(tab.id[i]))
                                        tabName += ' ' + tab.id[i]
                                    else
                                        tabName += tab.id[i]
                            }
                    
                            var isSameAtAnotherTab = false
                            for (const tab of tabsAndQuantity)
                                if (tab[0] == tabName) {
                                    tab[1]++
                                    isSameAtAnotherTab = true
                                }
                    
                            if (isSameAtAnotherTab != true)
                                tabsAndQuantity.push([tabName, 1])
                        }

                        await Canvas.registerFont('assets/fonts/font.otf', { family: 'burbank' })
                        const canvas = await Canvas.createCanvas(1000, tabsAndQuantity.length * 4 * 50 + 150)
                        const ctx = await canvas.getContext('2d')

                        with (ctx) {
                            const gradient = createLinearGradient(0, 0, 0, canvas.height)
                            gradient.addColorStop(0, '#0093fb')
                            gradient.addColorStop(1, '#014cbc')
                            fillStyle = gradient
                            fillRect(0, 0, canvas.width, canvas.height)

                            font = '100px burbank'

                            fillStyle = '#fff'
                            save()
                            translate(measureText('I').actualBoundingBoxAscent + 50, canvas.height / 2)
                            rotate(-Math.PI / 2)
                            textAlign = 'center'
                            fillText(translations['3073'].toUpperCase(), 0, 0)
                            restore()

                            const x = measureText('I').actualBoundingBoxAscent + 2 * 50

                            var y = 50

                            for (const tab of tabsAndQuantity) {
                                fillStyle = '#031b58'
                                drawRoundedRect(ctx, x, y, 15 * 50, 3 * 50, 25)

                                fillStyle = '#fc3232'
                                drawBubble(ctx, x, y, 25, 3 * 50, 25)

                                const display = `${tab[0]} ${tab[1] > 1 ? 'x' + tab[1] : ''}`.toUpperCase()

                                fillStyle = '#fff'

                                var fontSize = 80

                                do font = `${fontSize--}px burbank`
                                while (measureText(display).width > 15*50-50)

                                fillText(display, x+50, y+measureText('I').actualBoundingBoxAscent/2+1.5*50)

                                y += 4 * 50
                            }

                            fillStyle = '#92eeff'
                            font = '80px burbank'
                            fillText(bot.user.username.toUpperCase(), canvas.width - 50 - measureText(bot.user.username.toUpperCase()).width, y + measureText('I').actualBoundingBoxAscent)
                        }

                        fs.writeFileSync(`assets/rotations/next/${language}.png`, await canvas.toBuffer())

                        function drawRoundedRect(ctx, x, y, w, h, r) {
                            if (w < 2 * r) r = w / 2
                            if (h < 2 * r) r = h / 2
                            with (ctx) {
                                beginPath()
                                moveTo(x + r, y)
                                arcTo(x + w, y, x + w, y + h, r)
                                arcTo(x + w, y + h, x, y + h, r)
                                arcTo(x, y + h, x, y, r)
                                arcTo(x, y, x + w, y, r)
                                fill()
                            }
                        }

                        function drawBubble(ctx, x, y, w, h, r) {
                            if (w < r) r = w
                            if (h < 2 * r) r = h / 2
                            with (ctx) {
                                beginPath()
                                moveTo(x + r, y)
                                lineTo(x + w, y, x + w, y + h, r)
                                lineTo(x + w, y + h, x, y + h, r)
                                arcTo(x, y + h, x, y, r)
                                arcTo(x, y, x + w, y, r)
                                fill()
                            }
                        }

                        connection = mysql.createConnection(config.mysql)
                        connection.query(`SELECT date, data FROM updates WHERE type='rotation' AND subtype='next' AND language='${language}'`, async (err, results) => {

                            if (
                                tabs?.length > 0 &&
                                JSON.stringify(tabs.map(t => t.id).sort()) != JSON.stringify(JSON.parse(results[0].data).sort())
                            ) {

                                connection.query(`UPDATE updates SET date='${new Date().toISOString()}', data='${JSON.stringify(tabs.map(t => t.id).sort())}' WHERE type='rotation' && subtype='next' AND language='${language}'`, async (err) => {
                                    if (!err) {

                                        console.log(`Rotation event: ${language} succesfully updated`)

                                        if (bot.token == config.tokens.public) {
                                            const messages = {
                                                en: 'Here are the categories for the next shop !\nJoin us on Discord here: https://discord.fortool.fr',
                                                fr: 'Voici les catégories de la prochaine boutique !\nRejoignez-nous sur Discord ici: https://discord.fortool.fr'
                                            }

                                            if (config?.social?.twitter?.[language]?.oauth)
                                                try {
                                                    const twitterClient = new Twitter(config.social.twitter[language].oauth)
                                                    const imageData = await fs.readFileSync(`assets/rotations/next/${language}.png`)
                                                    twitterClient.post('media/upload', { media: imageData }, function (error, media, response) {
                                                        if (!error) twitterClient.post('statuses/update.json', { status: messages[language], media_ids: media.media_id_string })
                                                    })
                                                } catch (e) {
                                                    console.log(e)
                                                }
                                        }

                                    } else console.log(err)
                                })
                            }
                        })
                    } else if (!tabs && results[0].data != '[]') {
                        connection.query(`UPDATE updates SET date='${new Date().toISOString()}', data='[]' WHERE type='rotation' && subtype='next' AND language='${language}'`)
                        console.log(`Rotation event: next: ${language} set to null`)
                    } else
                        console.log(`Rotation event: next: ${language} not updated`)

                } else
                    console.log(`Rotation event: next: ${language} debouncer`)
            })
        }
    })
}