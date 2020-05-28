exports.run = async (handler, message, args, pre) => {
	let helperRole = await message.guild.roles.cache.find(role => role.name.toLowerCase() === 'helper')
	let developerRole = await message.guild.roles.cache.find(role => role.name.toLowerCase() === 'developer')

	if (message.member.roles.cache.has(developerRole.id)) {
		if (message.member.roles.cache.has(helperRole.id)) {
			await message.member.roles.remove(helperRole)
			await message.reply('removed the Helper role!')
		} else {
			await message.member.roles.add(helperRole)
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
