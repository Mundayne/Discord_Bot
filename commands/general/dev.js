const Discord = require('discord.js')
const { DevApplication } = require('../../src/models')
const { PENDING } = require('../../src/constants/devApplications.js').COLORS

exports.run = async (handler, message, args, pre) => {
	let responseMessage
	let existingApplication = await DevApplication.findOne({ userId: message.author.id, guildId: message.guild.id }).exec()

	if (existingApplication) {
		responseMessage = 'You\'ve already requested the developer role; please be patient as The Council processes your request.'
	} else if (message.member.roles.cache.some(r => r.name.toLowerCase() === 'developer')) {
		responseMessage = 'You\'re already a developer.'
	} else {
		let modLog = message.guild.channels.cache.find(c => c.name === 'mod-log')
		let applicationMessage = new Discord.MessageEmbed()
			.setAuthor(message.member.displayName, message.author.displayAvatarURL())
			.setTitle('Developer Role Application')
			.addField('User ID:', message.member.id)
			.addField('GitHub URL:', args.githubURL)
			.setColor(PENDING)

		let logMessage = await modLog.send({ embed: applicationMessage })

		let devApplication = new DevApplication({ userId: message.author.id, guildId: message.guild.id, githubUrl: args.githubURL, messageId: logMessage.id })
		await devApplication.save()

		responseMessage = 'Thank you for your application! Please be patient as The Council processes your request.'
	}

	await message.author.send(responseMessage)
}

exports.yargsOpts = {
	alias: {
		help: ['h']
	},
	positional: {
		args: [
			{
				name: 'githubURL',
				type: 'string'
			}
		],
		required: 1
	}
}

exports.help = {
	name: ['dev', 'developer'],
	group: 'general',
	description: 'Apply to get the developer role.'
}
