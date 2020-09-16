require('./src/utility/configureLogger')

const Discord = require('discord.js')
const Handler = require('./src/classes/Handler')

const client = new Discord.Client({
	ws: {
		intents: Discord.Intents.ALL
	}
})
const handler = new Handler(client)

handler.start()
