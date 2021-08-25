const clock = require('date-events')()
const shell = require('shelljs')
const { unlink } = require('fs').promises

module.exports = async (bot, config) => {

    clock.on('hour', async () => {

        const timestamp = Date.now()

        try {
            await shell.exec(`mysqldump -u ${config.mysql.user} -p'${config.mysql.password}' ${config.mysql.database} > /root/cmaker/assets/temp/${timestamp}.sql`)
            const owner = await bot.users.fetch(config.owner)
            await owner.send({ files: [`assets/temp/${timestamp}.sql`] })
            await unlink(`assets/temp/${timestamp}.sql`)
        } catch (error) {
            await unlink(`assets/temp/${timestamp}.sql`)
        }

    })
}