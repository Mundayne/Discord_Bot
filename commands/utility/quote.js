const Discord = require('discord.js')

const { DESCRIPTION_LIMIT } = require('../../src/constants/embedLimits')

exports.run = async (handler, message, args, pre) => {
	if (!args.id && !args.text && !args.link) {
		return message.reply('must provide either "id", "link" or "text" argument.')
	}

	let channel
	let quoteMessage
	if (args.link) {
		// get message by link
		let regex = /discord\.com\/channels\/\d+\/(\d+)\/(\d+)$/
		try {
			let match = regex.exec(args.link)
			let channelId = match[1]
			let messageId = match[2]
			channel = message.client.channels.cache.get(channelId)
			quoteMessage = await channel.messages.fetch(messageId)
		} catch (err) {
			return message.reply('invalid message link.')
		}
	} else {
		channel = args.channel ? message.client.channels.cache.get(args.channel) : message.channel
		if (channel?.type !== 'text') {
			return message.reply('"channel" must be a valid text channel.')
		}
		if (args.id) {
			// get message by ID
			try {
				quoteMessage = await channel.messages.fetch(args.id)
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
				user = message.client.users.cache.get(args.user)
				if (!user) {
					return message.reply('invalid user.')
				}
			}
			let lastMessages = (await channel.messages.fetch({ limit: 100 })).array()
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
	let quotePermalink = `\n\n[Permalink](${quoteMessage.url})`
	let member
	try {
		member = quoteMessage.member || await quoteMessage.guild.members.fetch(quoteMessage.author)
	} catch (err) {
		if (!err.message === 'Unknown Member') {
			throw err
		}
	}
	let embed = new Discord.MessageEmbed()
		.setColor(member?.displayColor || null)
		.setAuthor(quoteMessage.author.username, quoteMessage.author.avatarURL())
		.setTimestamp(quoteMessage.createdTimestamp)

	if (args.next) {
		let nextMessages = (await channel.messages.fetch({ after: quoteMessage.id, limit: 100 })).array()
		nextMessages = nextMessages.filter(e => e.author.id === quoteMessage.author.id).reverse()
		for (let i = 0; i < args.next && i < nextMessages.length; ++i) {
			quoteText += '\n' + nextMessages[i].content
		}
	}

	if (quoteText.length > DESCRIPTION_LIMIT - quotePermalink.length) {
		quoteText = quoteText.slice(0, DESCRIPTION_LIMIT - quotePermalink.length - 1) + '…'
	}
	embed.setDescription(quoteText + quotePermalink)

	return message.channel.send({ embed })
}

exports.yargsOpts = {
	alias: {
		help: ['h'],
		channel: ['c'],
		link: ['l'],
		id: ['i', 'm', 'message'],
		next: ['n'],
		text: ['t'],
		user: ['u']
	},
	default: {
		channel: { description: 'current channel' }
	},
	channel: ['channel'],
	integer: ['next'],
	string: ['id', 'text', 'link'],
	user: ['user']
}

exports.help = {
	name: ['quote'],
	group: 'utility',
	description: 'Quote a message.'
}
