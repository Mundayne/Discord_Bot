const Discord = require('discord.js')

const { EMBED_DESCRIPTION_LIMIT } = require('../../src/constants/embedLimits')

exports.run = async (client, message, args, pre) => {
	if (!args.message && !args.text && !args.link) {
		return message.reply('must provide either "link", "message" or "text" argument.')
	}

	let channel
	let quoteMessage
	if (args.link) {
		// get message by link
		let regex = /discordapp\.com\/channels\/\d+\/(\d+)\/(\d+)$/
		try {
			let match = regex.exec(args.link)
			let channelId = match[1]
			let messageId = match[2]
			channel = message.client.channels.get(channelId)
			quoteMessage = await channel.fetchMessage(messageId)
		} catch (err) {
			return message.reply('invalid message link.')
		}
	} else {
		channel = args.channel ? message.client.channels.get(args.channel) : message.channel
		if (!channel || channel.type !== 'text') {
			return message.reply('"channel" must be a valid text channel.')
		}
		if (args.message) {
			// get message by ID
			try {
				quoteMessage = await channel.fetchMessage(args.message)
			} catch (err) {
				if (err.message.includes('snowflake')) {
					return message.reply('invalid message ID.')
				}
				return message.reply('message not found.')
			}
		} else {
			// get message by starting text
			let user
			if (args.user !== undefined) {
				user = message.client.users.get(args.user)
				if (!user) {
					return message.reply('invalid user.')
				}
			}
			let lastMessages = (await channel.fetchMessages({ limit: 100 })).array()
			for (let msg of lastMessages) {
				if (msg.content.toLowerCase().startsWith(args.text.toLowerCase()) && (!user || msg.author.id === user.id)) {
					quoteMessage = msg
					break
				}
			}
			if (!quoteMessage) {
				return message.reply('message not found.')
			}
		}
	}

	let quoteText = quoteMessage.content
	let embed = new Discord.RichEmbed()
		.setColor(message.guild.member(quoteMessage.author).displayColor || null)
		.setAuthor(quoteMessage.author.username, quoteMessage.author.avatarURL)
		.setTimestamp(quoteMessage.createdTimestamp)

	if (args.next) {
		let nextMessages = (await channel.fetchMessages({ after: quoteMessage.id, limit: 100 })).array()
		nextMessages = nextMessages.filter(e => e.author.id === quoteMessage.author.id).reverse()
		for (let i = 0; i < args.next && i < nextMessages.length; ++i) {
			quoteText += '\n' + nextMessages[i].content
		}
	}

	if (quoteText.length > EMBED_DESCRIPTION_LIMIT) {
		quoteText = quoteText.slice(0, EMBED_DESCRIPTION_LIMIT - 1) + '…'
	}
	embed.setDescription(quoteText)

	return message.channel.send(quoteMessage.url, { embed })
}

exports.yargsOpts = {
	alias: {
		help: ['h'],
		channel: ['c'],
		link: ['l'],
		message: ['m'],
		next: ['n'],
		text: ['t'],
		user: ['u']
	},
	default: {
		channel: { description: 'current channel' }
	},
	channel: ['channel'],
	integer: ['next'],
	string: ['message', 'text', 'link'],
	user: ['user']
}

exports.help = {
	name: ['quote'],
	group: 'utility',
	description: 'Quote a message.'
}
