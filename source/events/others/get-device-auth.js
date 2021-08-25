//const ClientLoginAdapter = require('epicgames-client-login-adapter')
//const ClientDeviceAuthAdapter = require('epicgames-client-deviceauth-adapter')

module.exports = async (bot, config) => {

  (async () => {

    const clientLoginAdapter = await ClientLoginAdapter.init({
      email: `${config.epic.email.split('@')[0]}+3@${config.epic.email.split('@')[1]}`,
      password: config.epic.password
    })

    const exchangeCode = await clientLoginAdapter.getExchangeCode()
    await clientLoginAdapter.close()

    await ClientDeviceAuthAdapter(exchangeCode)

  })()
}