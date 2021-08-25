const Discord = require('discord.js')
const needle = require('needle')

const instagram = require('instagram-scraping')

module.exports.run = async (bot, config, message, args) => {
    if (!await checkPermisions(message, message.channel, ['EMBED_LINKS', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS'])) return

    const translations = await getTranslations(message.guild, false, ['socials', '0001', '1042', '3076', '3077'])

    const emojis = ['1️⃣', '2️⃣', '3️⃣'], embeds = []

    const twitterErrorEmbed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setDescription(translations['0001'])
        .setFooter('ERROR CODE: CANNOT_GET_TWEETS_FROM_THIS_USER')

    const baseEmbed = new Discord.MessageEmbed()
        .setColor(config.embedsColor)
        .setTitle(translations['1042'])

    var desc = ''
    for (const key of Object.keys(translations.socials))
        if (translations.socials[key])
            desc += `${emojis[Object.keys(translations.socials).indexOf(key)]} - ${key.charAt(0).toUpperCase()}${key.slice(1)}\n`
    baseEmbed.setDescription(desc)

    var replyMessage = await message.channel.send(baseEmbed)

    for (const emoji of emojis)
        if (desc.includes(emoji))
            replyMessage.react(emoji).catch(() => {})

    const choiceFiltre = async (reaction, user) => { 
        return (message.author.id == user.id && emojis.indexOf(reaction._emoji.name) != -1)
    }

    replyMessage.awaitReactions(choiceFiltre, { max: 1, time: 300000 })
        .then((c) => {
            replyMessage.reactions.removeAll().catch(() => {})
            switch (Object.keys(translations.socials)[emojis.indexOf(c.first()._emoji.name)]) {
                case 'youtube': lastYoutubeMovie().catch(() => {}); break
                case 'instagram': lastInstagramPublication().catch(() => {}); break
                case 'twitter': lastTwitterPublication().catch(() => {}); break
            }
        })
        .catch(() => replyMessage.reactions.removeAll().catch(() => {}))

    async function lastYoutubeMovie() {
        const channel = (await needle(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${translations.socials.youtube}&key=${config.social.youtube}`)).body
        const movies = (await needle(`https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&channelId=${translations.socials.youtube}&key=${config.social.youtube}`)).body

        for (const movie of movies.items) {
            const movieStats = (await needle(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${movie.id.videoId}&key=${config.social.youtube}`)).body

            embeds.push(
                new Discord.MessageEmbed()
                    .setColor(config.embedsColor)
                    .setAuthor(channel.items[0].snippet.title, channel.items[0].snippet.thumbnails.medium.url, `https://youtube.com/channel/${translations.socials.youtube}`)
                    .setTitle(movie.snippet.title)
                    .setDescription(`${movie.snippet.description}\n\n<:view:757630900585365590> ${movieStats.items[0].statistics.viewCount}\n<:like:757630900367261798> ${movieStats.items[0].statistics.likeCount}\n<:dislike:757630900077985925> ${movieStats.items[0].statistics.dislikeCount}\n<:comment:757630900447084604> ${movieStats.items[0].statistics.commentCount}\n\n[${translations['3076']}](https://youtube.com/embed/${movie.id.videoId})`)
                    .setImage(movie.snippet.thumbnails.medium.url)
                    .setFooter(`Page ${embeds.length+1}/${movies.items.length}`, bot.user.avatarURL())
            )
        }

        display()
    }

    async function lastInstagramPublication() {
        const page = await instagram.scrapeUserPage(translations.socials.instagram)
        for (const media of page.medias)
            embeds.push(
                new Discord.MessageEmbed()
                    .setColor(config.embedsColor)
                    .setAuthor(`${page.user.full_name} (@${page.user.username})`, page.user.profile_pic_url, `https://instagram.com/${page.user.username}`)
                    .setDescription(`${media.text ? `${media.text}\n\n` : ''}<:view:757630900585365590> ${media.video_view_count}\n<:heart:757644233405497454> ${media.like_count}\n<:comment:757630900447084604> ${media.comment_count}\n\n[${translations['3077']}](https://instagram.com/p/${media.shortcode})`)
                    .setImage(media.display_url)
                    .setFooter(`Page ${embeds.length+1}/${page.medias.length}`, bot.user.avatarURL())
            )

        display()
    }

    async function lastTwitterPublication() {
        const endpointTweetsList = 'https://api.twitter.com/2/tweets/search/recent'
        const paramsTweetsList = { 'query': `from:${translations.socials.twitter} -is:retweet -is:reply` }
        const tweetsList = (await needle('get', endpointTweetsList, paramsTweetsList, { headers: {'authorization': `Bearer ${config.social.twitter.en.bearer}`} })).body
        
        if (tweetsList.meta.result_count == 0) return replyMessage.edit(twitterErrorEmbed)

        for (const data of tweetsList.data) {
            const endpointTweetInfos = 'https://api.twitter.com/labs/2/tweets'
            const paramsTweetInfos = { 
                'ids': `${data.id}`,
                'tweet.fields': 'created_at,public_metrics',
                'expansions': 'author_id,attachments.media_keys',
                'media.fields': 'preview_image_url,url',
                'user.fields': 'profile_image_url'
            }
            const tweetInfos = (await needle('get', endpointTweetInfos, paramsTweetInfos, { headers: {'authorization': `Bearer ${config.social.twitter.en.bearer}`} })).body
    
            embeds.push(
                new Discord.MessageEmbed()
                    .setColor(config.embedsColor)
                    .setAuthor(`${tweetInfos.includes.users[0].name} (@${tweetInfos.includes.users[0].username})`, tweetInfos.includes.users[0].profile_image_url, `https://twitter.com/${tweetInfos.includes.users[0].username}`)
                    .setDescription(`${tweetInfos.data[0].text.replace(`https://t.co/${tweetInfos.data[0].text.split('https://t.co/').reverse()[0]}`)}\n\n<:comment:757630900447084604> ${tweetInfos.data[0].public_metrics.reply_count}\n<:retweet:757644233606955119> ${tweetInfos.data[0].public_metrics.retweet_count+tweetInfos.data[0].public_metrics.quote_count}\n<:heart:757644233405497454> ${tweetInfos.data[0].public_metrics.like_count}\n\n[${translations['3077']}](https://twitter.com/c/status/${tweetInfos.data[0].id})`)
                    .setImage(tweetInfos.includes.media?.[0].url)
                    .setFooter(`Page ${embeds.length+1}/${tweetsList.data.length}`, bot.user.avatarURL())
            )
        }
        
        display()
    }

    async function display() {
        replyMessage.edit(embeds[0])

        replyMessage.react('◀️').catch(() => {})
        replyMessage.react('▶️').catch(() => {})

        const slideFilter = async (reaction, user) => {
            if (user.id == message.author.id) {
                const pageNumber = Number(replyMessage.embeds[0].footer.text.replace('Page ', '').replace(`/${embeds.length}`, '')) - 1

                if (reaction._emoji.name == '◀️' && pageNumber > 0) replyMessage.edit(embeds[pageNumber - 1])
                if (reaction._emoji.name == '▶️' && pageNumber < embeds.length-1) replyMessage.edit(embeds[pageNumber + 1])

                replyMessage.reactions.resolve(reaction._emoji.name).users.remove(user.id).catch()
            }
            return false
        }

        replyMessage.awaitReactions(slideFilter, { max: 1, time: 300000 })
            .then(() => { replyMessage.reactions.removeAll().catch(() => {}) })
    }
}
module.exports.help = {
    name: __filename.split(/[\\/]/).pop().replace('.js', ''),
    description: 'Contenu des réseaux sociaux de Fortnite',
    isPublic: __dirname.split(/[\\/]/).includes('public'),
    isFortnite: true
}