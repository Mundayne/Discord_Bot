exports.run = async (handler, message, args, pre) => {
	let member = message.member || await message.guild.members.fetch(message.author)

	let helperRole = await message.guild.roles.cache.find(role => role.name.toLowerCase() === 'helper')
	let developerRole = await message.guild.roles.cache.find(role => role.name.toLowerCase() === 'developer')

	if (member.roles.cache.has(developerRole.id)) {
		if (member.roles.cache.has(helperRole.id)) {
			await member.roles.remove(helperRole)
			await message.reply('removed the Helper role!')
		} else {
			await member.roles.add(helperRole)
			await message.reply(`added the Helper role!`)
		}
	} else {
		await message.reply('you are not a developer. Please apply to be a developer before adding the Helper role!')
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
