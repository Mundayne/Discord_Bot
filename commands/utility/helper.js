exports.run = async (handler, message, args, pre) => {
	let member = await message.guild.members.fetch(message.author)

	let helperRole = await message.guild.roles.cache.find(role => role.name === 'Helper')
	let developerRole = await message.guild.roles.cache.find(role => role.name === 'Developer')

	let hadRole = false
	let isDeveloper = false

	if (member.roles.cache.has(developerRole.id)) {
		if (member.roles.cache.has(helperRole.id)) {
			await member.roles.remove(helperRole)
			hadRole = false
		} else if (!member.roles.cache.has(helperRole.id)) {
			await member.roles.add(helperRole)
			hadRole = true
		}

		isDeveloper = true
	}

	if (!isDeveloper) {
		message.reply('you are not a developer. Please apply to be a developer before adding the helper role!')
	} else if (hadRole) {
		message.reply(`added the Helper role!`)
	} else if (!hadRole) {
		message.reply('removed the Helper role!')
	}
}

exports.yargsOpts = {
	alias: {
		help: ['h']
	}
}

exports.help = {
	name: ['helper'],
	group: 'utility',
	description: 'Toggle the helper role if you are a developer.'
}
