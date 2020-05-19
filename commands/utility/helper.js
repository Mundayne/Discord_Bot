exports.run = async (handler, message, args, pre) => {
	// Member that sends message
	let member = await message.guild.fetchMember(message.author)

	// Grab roles
	let helperRole = await message.guild.roles.find(role => role.name === 'Helper')
	let developerRole = await message.guild.roles.find(role => role.name === 'Developer')

	// Tracks how to respond
	let hadRole = false
	let isDeveloper = false

	// Handle adding and removing the helper role if a developer
	if (member.roles.has(developerRole.id)) {
		if (member.roles.has(helperRole.id)) {
			await member.removeRole(helperRole)
			hadRole = false
		} else if (!member.roles.has(helperRole.id)) {
			await member.addRole(helperRole)
			hadRole = true
		}

		isDeveloper = true
	}

	// Send a message explaining the actions done
	if (!isDeveloper) {
		message.reply(' you are not a developer. Please apply to be a developer before adding the helper role!')
	} else if (hadRole) {
		message.reply(' added the helper role!')
	} else if (!hadRole) {
		message.reply(' removed the helper role!')
	}
}

// Export to help
exports.yargsOpts = {
	alias: {
		help: ['h']
	}
}

// How it appears in help
exports.help = {
	name: ['helper'],
	group: 'utility',
	description: 'Toggles the helper role if you are a developer.'
}
