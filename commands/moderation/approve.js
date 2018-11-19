const { DevApplication } = require('../../src/models')

exports.run = async (handler, message, args, pre) => {
	let responseMessage
	let member = message.guild.members.get(args.user)
	let devApplication = await DevApplication.where().findOneAndDelete({ userId: args.user }).exec()

	if (devApplication) {
		let log = message.guild.channels.find(c => c.name === 'mod-log')
		let msg = await log.fetchMessage(devApplication.messageId)
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

		if (args.approved) {
			let developerRole = message.guild.roles.find(r => r.name.toLowerCase() === 'developer')
			let helperRole = message.guild.roles.find(r => r.name.toLowerCase() === 'helper')
			member.addRole(developerRole)
			if (devApplication.helper) member.addRole(helperRole)
			member.send('Your application for the Developer and/or Helper roles has been approved!')
			responseMessage = 'Application approved, member informed.'
			embed.color = 0x00ff00
		} else {
			member.send('Your application for the Developer and/or Helper roles has been denied.')
			responseMessage = 'Application denied, member informed.'
			embed.color = 0xff0000
		}
		msg.edit({ embed: embed })
	} else {
		responseMessage = 'That user has not applied for the developer role.'
	}
	message.reply(responseMessage)
}

exports.yargsOpts = {
	alias: {
		user: ['u', 'id', 'i'],
		approved: ['a'],
		help: ['h']
	},
	user: ['user'],
	boolean: ['approved'],
	required: ['user', 'approved']
}

exports.help = {
	name: ['approve', 'app'],
	group: 'moderation',
	description: 'Approve or deny a developer role application.'
}
