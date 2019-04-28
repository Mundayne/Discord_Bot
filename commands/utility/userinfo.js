const Discord = require('discord.js')

exports.run = async (handler, message, args, pre) => {
	const member = message.member
	const embed = new Discord.RichEmbed()
		.setColor(member.displayColor || null)
		.setAuthor(member.user.username, member.user.avatarURL)

	if (member.nickname) {
		embed.addField('Nickname', member.nickname)
	}

	embed.addField('Discriminator', member.user.discriminator, true)
		.addField('Date Joined', member.joinedAt.toISOString().slice(0, -5) + 'Z', true)

	return message.channel.send({ embed })
}

exports.help = {
	name: ['userinfo'],
	group: 'utility',
	description: 'Get information about yourself.'
}
