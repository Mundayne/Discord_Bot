const mongoose = require('mongoose')
const FS = require('fs')
const { Arguments, UnixArguments } = require('../utility')
const { ArgumentError, InsufficientPermissionsError, PreCheckFailedError, UnixArgumentError, UnixHelpError } = require('../errors')
const Config = require('../../config')

class Handler {
	constructor (client) {
		let _self = this
		this.commands = { }

		this.client = client
		client.on('message', message => _self.message(_self, message))
		client.on('guildMemberAdd', member => _self.guildMemberAdd(_self, member))

		this.loadCommands()
	}

	loadCommands () {
		let groups = FS.readdirSync('./commands')
		let commands
		let command
		let count = { groups: 0, commands: 0 }

		groups.forEach(group => {
			this.commands[group] = { }
			commands = FS.readdirSync(`./commands/${group}`)
			commands.forEach(cmd => {
				command = require(`../../commands/${group}/${cmd}`)
				command.help.name.forEach(name => {
					if (Object.keys(this.commands[group]).includes(name)) {
						console.warn(`${name} already exists; skipping...`)
					} else {
						console.info(`Loaded command ${name}.`)
						// generate default pre and post functions if the command does not have them
						if (typeof command.pre !== 'function') {
							if (group === 'moderation') {
								command.pre = async (client, message) => {
									let authorMember = await message.guild.fetchMember(message.author)
									if (!authorMember.hasPermission('ADMINISTRATOR')) {
										throw new InsufficientPermissionsError()
									}
								}
							} else {
								command.pre = async (client, message) => {}
							}
						}
						if (typeof command.post !== 'function') {
							command.post = async (client, message, result) => {}
						}
						this.commands[group][name] = command
					}
				})
				count.commands++
			})
			count.groups++
		})
		console.info(`Done! ${count.commands} commands loaded across ${count.groups} groups.`)
	}

	async start () {
		try {
			await mongoose.connect(Config.database, { useNewUrlParser: true })
			await this.client.login(Config.token)
			process.title = Config.procName
		} catch (err) {
			console.error('Fatal error while starting bot:')
			console.error(err)
			process.exit(1)
		}
	}

	async message (_self, message) {
		// Non-handling cases
		if (message.author.bot) return
		if (message.channel.type !== 'text') return
		if (message.content.substring(0, Config.prefix.length) !== Config.prefix) return

		let content = message.content.split(' ')
		let name = content.splice(0, 1)[0].substring(Config.prefix.length)
		let cmds = { }
		Object.values(_self.commands).forEach(c => { cmds = { ...cmds, ...c } })
		if (!cmds.hasOwnProperty(name)) return console.warn(`Command ${name} not found.`)
		let command = cmds[name]
		try {
			console.log(`Command "${name}" run by ${message.author.username} (${message.author.id})`)
			let pre = await command.pre(this, message)
			let args = command.yargsOpts ? UnixArguments.parse(command.yargsOpts, message.content.slice(Config.prefix.length + name.length).trim()) : Arguments.parse(command.help.args, content.join(' '))
			let result = await command.run(this, message, args, pre)
			await command.post(this, message, result)
			console.log(`Command "${name}" complete`)
		} catch (e) {
			if (e instanceof ArgumentError) {
				message.reply(e.message).then(m => m.delete(8000)).catch(console.error)
			} else if (e instanceof InsufficientPermissionsError) {
				console.log(`${message.author.username} (${message.author.id}) lacks permissions for command "${name}"`)
				message.reply('you are not authorized to use this command.').then(m => m.delete(8000)).catch(console.error)
			} else if (e instanceof PreCheckFailedError) {
				console.log(`Pre-Check failed for command "${name}", reason: ${e.message}`)
			} else if (e instanceof UnixArgumentError) {
				message.reply(e.message).then(m => m.delete(8000)).catch(console.error)
			} else if (e instanceof UnixHelpError) {
				message.channel.send(`${'```'}\nUsage:\n${Config.prefix}${name} ${command.help.args}\n${'```'}`).catch(console.error)
			} else {
				console.error(`Error during command "${name}":`)
				console.error(e)
			}
		}
	}

	guildMemberAdd (_self, member) {

	}
}
module.exports = Handler
