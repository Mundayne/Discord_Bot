const Discord = require('discord.js')
const { DevApplication } = require('../../src/models')
const { PENDING } = require('../../src/constants/devApplications.js').COLORS

exports.run = async (handler, message, args, pre) => {
	let responseMessage
	let existingApplication = await DevApplication.findOne({ userId: message.author.id, guildId: message.guild.id }).exec()
	let member = message.member || await message.guild.members.fetch(message.author)

	if (existingApplication) {
		responseMessage = 'You\'ve already requested the developer role; please be patient as The Council processes your request.'
	} else if (member.roles.cache.some(r => r.name.toLowerCase() === 'developer')) {
		responseMessage = 'You\'re already a developer.'
	} else {
		let modLog = message.guild.channels.cache.find(c => c.name === 'mod-log')
		let applicationMessage = new Discord.MessageEmbed()
			.setAuthor(member.displayName, message.author.displayAvatarURL())
			.setTitle('Developer Role Application')
			.addField('User ID:', message.member.id)
			.addField('GitHub URL:', args.github)
			.setColor(PENDING)

		let logMessage = await modLog.send({ embed: applicationMessage })

		let devApplication = new DevApplication({ userId: message.author.id, guildId: message.guild.id, githubUrl: args.github, messageId: logMessage.id })
		await devApplication.save()

		responseMessage = 'Thank you for your application! Please be patient as The Council processes your request.'
	}

	await message.author.send(responseMessage)
}

exports.yargsOpts = {
	alias: {
		github: ['g', 'url', 'u'],
		help: ['h']
	},
	string: ['github'],
	required: ['github']
}

exports.help = {
	name: ['wizard', 'wiz', 'developer', 'dev'],
	group: 'general',
	description: 'Get the developer role.'
}
