const Discord = require('discord.js')
const mysql = require('mysql')

module.exports = async (bot, config, guild) => {

    const connection = mysql.createConnection(config.mysql)
    connection.query(`SELECT * FROM guild_settings WHERE id='${guild.id}';`, (err, results) => {
        if (!results[0]) {
            connection.query(`INSERT INTO guild_settings (id, prefix, language) VALUES ('${guild.id}', '*', 'fr');`)
            setTimeout(() => { connection.destroy() }, 1000)
        } else {
            setTimeout(() => { connection.destroy() }, 1000)
        }
    })
}