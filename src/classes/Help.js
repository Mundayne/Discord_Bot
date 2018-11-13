const Discord = require('discord.js')

class Help {
	constructor (handler) {
		this.handler = handler
	}

	async commandHelp (guild, command) {
		let cmds = {}
		Object.values(this.handler.commands).forEach(group => { cmds = { ...cmds, ...group } })
		if (!cmds.hasOwnProperty(command)) {
			return false
		}
		let commandObj = cmds[command]
		let embed = await this._baseEmbed(guild)
		embed.setTitle(commandObj.help.name[0])
		embed.addField('Description', commandObj.help.description)
		if (commandObj.help.name.length > 1) embed.addField('Aliases', commandObj.help.name.slice(1).join(', '))
		embed.addField('Usage', `${this.handler.prefix}${command} ${commandObj.help.args}`)
		return embed
	}

	async commandList (guild) {
		let embed = await this._baseEmbed(guild)
		embed.setTitle('Command List')
		for (let group in this.handler.commands) {
			if (group === 'dev') continue
			let uniqueCommands = Array.from(new Set(Object.values(this.handler.commands[group])).values())
			let text = ''
			for (let command of uniqueCommands) {
				text += `${this.handler.prefix}${command.help.name[0]} - ${command.help.description}\n`
			}
			embed.addField(group[0].toUpperCase() + group.slice(1), text)
		}
		return embed
	}

	async _baseEmbed (guild) {
		let botMember = await guild.fetchMember(guild.client.user)
		return new Discord.RichEmbed().setColor(botMember.displayColor || null)
	}
}
module.exports = Help
