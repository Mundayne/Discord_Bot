const { DevApplication } = require('../../src/models')
const { APPROVED, DENIED, ORPHANED } = require('../../src/constants/devApplications.js').COLORS

exports.run = async (handler, message, args, pre) => {
	let responseMessage
	let devApplication = await DevApplication.where().findOne({ userId: args.user, guildId: message.guild.id }).exec()

	if (devApplication) {
		let log = message.guild.channels.cache.find(c => c.name === 'mod-log')
		let msg = await log.messages.fetch(devApplication.messageId)
		let msgEmbed = msg.embeds[0]
		// remove circular json
		delete msgEmbed.author.embed
		let embed = {
			author: msgEmbed.author,
			title: msgEmbed.title,
			fields: msgEmbed.fields.map(field => {
				// remove circular json
				delete field.embed
				return field
			}),
			color: msgEmbed.color
		}

		let member
		try {
			member = message.guild.member(args.user) || await message.guild.members.fetch(args.user)
		} catch (err) {
			if (err.message === 'Unknown Member') {
				embed.color = ORPHANED
				await msg.edit({ embed: embed })
				await devApplication.remove()
				return message.reply('that user is no longer in the server.')
			}
			throw err
		}

		if (args.approved) {
			let developerRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'developer')
			await member.roles.add(developerRole)
			await member.send(`Your application for the Developer role has been approved!\n${args.message || ''}`)
			responseMessage = 'application approved, member informed.'
			embed.color = APPROVED
		} else {
			await member.send(`Your application for the Developer role has been denied.\n${args.message || ''}`)
			responseMessage = 'application denied, member informed.'
			embed.color = DENIED
		}
		await msg.edit({ embed: embed })
		await devApplication.remove()
	} else {
		responseMessage = 'that user has not applied for the developer role.'
	}
	await message.reply(responseMessage)
}

exports.yargsOpts = {
	alias: {
		user: ['u', 'id', 'i'],
		approved: ['a'],
		message: ['m', 'msg'],
		help: ['h']
	},
	user: ['user'],
	boolean: ['approved'],
	string: ['message'],
	required: ['user', 'approved']
}

exports.help = {
	name: ['approve', 'app'],
	group: 'moderation',
	description: 'Approve or deny a developer role application.'
}
