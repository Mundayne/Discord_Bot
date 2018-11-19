const { DevApplication } = require('../../src/models')
const discord = require('discord.js')

exports.run = async (handler, message, args, pre) => {
	let responseMessage
	let existingApplication = await DevApplication.findOne({ userId: message.author.id }).exec()
	if (existingApplication) {
		responseMessage = 'You\'ve already requested the developer role; please be patient as The Council processes your request.'
	} else {
		let modLog = message.guild.channels.find(c => c.name === 'mod-log')
		let applicationMessage = new discord.RichEmbed()
			.setAuthor(message.member.displayName, message.author.displayAvatarURL)
			.setTitle('Developer Role Application')
			.addField('GitHub URL:', args.github)
			.addField('Wants to be Helper:', args.helper ? 'yes' : 'no')
			.setColor(0xffffff)

		let messageId
		await modLog.send({ embed: applicationMessage }).then(function (m) { messageId = m.id })

		let devApplication = new DevApplication({ userId: message.author.id, githubUrl: args.github, helper: args.helper, messageId: messageId })
		await devApplication.save()

		responseMessage = 'Thank you for your application! Please be patient as The Council processes your request.'
	}

	message.author.send(responseMessage)
}

exports.yargsOpts = {
	alias: {
		github: ['g', 'url', 'u'],
		help: ['h']
	},
	string: ['github'],
	boolean: ['helper'],
	default: {
		helper: false
	},
	required: ['github']
}

exports.help = {
	name: ['wizard', 'wiz', 'developer', 'dev'],
	group: 'general',
	description: 'Get the developer role.'
}
