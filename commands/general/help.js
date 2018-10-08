const Discord = require('discord.js')

exports.run = async (client, message, args, pre) => {
	let botMember = await message.guild.fetchMember(message.client.user)
	let embed = new Discord.RichEmbed()
	embed.setColor(botMember.displayColor || null)
	if (args.command) {
		let cmds = {}
		Object.values(client.commands).forEach(group => { cmds = { ...cmds, ...group } })
		if (!cmds.hasOwnProperty(args.command)) {
			await message.channel.send(`Command "${args.command}" not found.`)
			return
		}
		let commandObj = cmds[args.command]
		embed.setTitle(commandObj.help.name[0])
		embed.addField('Description', commandObj.help.description)
		if (commandObj.help.name.length > 1) embed.addField('Aliases', commandObj.help.name.slice(1).join(', '))
		embed.addField('Usage', `${client.prefix}${args.command} ${commandObj.help.args}`)
		await message.channel.send(embed)
	} else {
		embed.setTitle('Command List')
		for (let group in client.commands) {
			let uniqueCommands = Array.from(new Set(Object.values(client.commands[group])).values())
			let text = ''
			for (let command of uniqueCommands) {
				text += `${client.prefix}${command.help.name[0]} - ${command.help.description}\n`
			}
			embed.addField(group[0].toUpperCase() + group.slice(1), text)
		}
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
