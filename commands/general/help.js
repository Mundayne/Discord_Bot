exports.run = async (handler, message, args, pre) => {
	if (args.command) {
		let embed = await handler.help.commandHelp(message.guild, args.command)
		if (!embed) {
			await message.channel.send(`Command "${args.command}" not found.`)
			return
		}
		await message.channel.send(embed)
	} else {
		let embed = await handler.help.commandList(message.guild)
		await message.channel.send(embed)
	}
}

exports.yargsOpts = {
	positional: {
		args: [
			{
				name: 'command',
				type: 'string'
			}
		],
		required: 0
	}
}

exports.help = {
	name: ['help'],
	group: 'general',
	description: 'List all commands or show information about a specific command.'
}
