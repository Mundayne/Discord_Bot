const Discord = require('discord.js')
const Client = new Discord.Client()
const Handler = new (require('./src/classes/Handler'))(Client)

Handler.start()
