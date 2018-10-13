const Discord = require('discord.js')
const client = new Discord.Client()
const handler = new (require('./src/classes/Handler'))(client)

handler.start()
