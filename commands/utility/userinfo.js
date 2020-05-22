const Discord = require('discord.js')

const formatDate = require('../../src/utility/formatDate.js')

exports.run = async (handler, message, args, pre) => {
	let member

	if (args.user) {
		let user

		try {
			user = message.client.users.cache.get(args.user) || await message.client.users.fetch(args.user)
			member = message.guild.member(user) || await message.guild.members.fetch(user)
		} catch (exception) {
			if (user) {
				return message.channel.send('User is not in server.')
			} else {
				return message.channel.send('Invalid user.')
			}
		}
	}

	if (!member) {
		member = message.member || await message.guild.members.fetch(message.author)
	}

	const embed = new Discord.MessageEmbed()
		.setColor(member.displayColor || null)
		.setAuthor(`${member.user.tag}`, member.user.avatarURL())

	if (member.nickname) {
		embed.addField('Nickname', member.nickname, true)
	}

	embed.addField('Date Joined', `${formatDate(member.joinedAt)}`, true)
		.addField('User Creation Date', `${formatDate(member.user.createdAt)}`, true)

	return message.channel.send({ embed })
}

exports.yargsOpts = {
	positional: {
		args: [
			{
				name: 'user',
				type: 'user'
			}
		],
		required: 0
	}
}

exports.help = {
	name: ['userinfo'],
	group: 'utility',
	description: 'Get information about someone or yourself.'
}
