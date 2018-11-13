const mongoose = require('mongoose')
const fs = require('fs')
const { Arguments, UnixArguments } = require('../utility')
const { ArgumentError, InsufficientPermissionsError, PreCheckFailedError, UnixArgumentError, UnixHelpError } = require('../errors')
const Help = require('./Help')
const MemberRoles = require('../models/MemberRoles')
const CONFIG = require('../../config')

class Handler {
	constructor (client) {
		this.commands = { }
		this.prefix = CONFIG.prefix
		this.client = client
		this.help = new Help(this)

		client.on('ready', () => this.ready())
		client.on('message', message => this.message(message))
		client.on('guildMemberAdd', member => this.guildMemberAdd(member))
		client.on('guildMemberUpdate', (oldMember, newMember) => this.guildMemberUpdate(oldMember, newMember))

		this.loadCommands()
	}

	loadCommands () {
		let groups = fs.readdirSync('./commands')
		let commands
		let command
		let count = { groups: 0, commands: 0 }

		groups.forEach(group => {
			this.commands[group] = { }
			commands = fs.readdirSync(`./commands/${group}`)
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
								command.pre = async (handler, message) => {
									let authorMember = await message.guild.fetchMember(message.author)
									if (!authorMember.hasPermission('ADMINISTRATOR')) {
										throw new InsufficientPermissionsError()
									}
								}
							} else {
								command.pre = async (handler, message) => {}
							}
						}
						if (typeof command.post !== 'function') {
							command.post = async (handler, message, result) => {}
						}
						// generate usage information if the command uses the unix parser and does not have any
						if (command.yargsOpts && command.help.args === undefined) {
							command.help.args = UnixArguments.generateUsage(command.yargsOpts)
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
			await mongoose.connect(CONFIG.database, { useNewUrlParser: true })
			await this.client.login(CONFIG.token)
			process.title = CONFIG.procName
		} catch (err) {
			console.error('Fatal error while starting bot:')
			console.error(err)
			process.exit(1)
		}
	}

	async ready () {
		console.log('Ready.')
		await this.client.user.setActivity(`${this.prefix}help`)
	}

	async message (message) {
		// Non-handling cases
		if (message.author.bot) return
		if (message.channel.type !== 'text') return
		if (message.content.substring(0, this.prefix.length) !== this.prefix) return

		let content = message.content.split(' ')
		let name = content.splice(0, 1)[0].substring(this.prefix.length)
		if (!name) return
		let cmds = { }
		Object.values(this.commands).forEach(c => { cmds = { ...cmds, ...c } })
		if (!cmds.hasOwnProperty(name)) return console.warn(`Command ${name} not found.`)
		let command = cmds[name]
		try {
			console.log(`Command "${name}" run by ${message.author.username} (${message.author.id})`)
			let pre = await command.pre(this, message)
			let args = command.yargsOpts ? UnixArguments.parse(command.yargsOpts, message.content.slice(this.prefix.length + name.length).trim()) : Arguments.parse(command.help.args, content.join(' '))
			let result = await command.run(this, message, args, pre)
			await command.post(this, message, result)
			console.log(`Command "${name}" complete`)
		} catch (e) {
			if (e instanceof ArgumentError) {
				console.log(`Invalid arguments given for command "${name}"`)
				message.reply(e.message).then(m => m.delete(8000)).catch(console.error)
			} else if (e instanceof InsufficientPermissionsError) {
				console.log(`${message.author.username} (${message.author.id}) lacks permissions for command "${name}"`)
				message.reply('you are not authorized to use this command.').then(m => m.delete(8000)).catch(console.error)
			} else if (e instanceof PreCheckFailedError) {
				console.log(`Pre-Check failed for command "${name}", reason: ${e.message}`)
			} else if (e instanceof UnixArgumentError) {
				console.log(`Invalid arguments given for command "${name}"`)
				message.reply(e.message).then(m => m.delete(8000)).catch(console.error)
			} else if (e instanceof UnixHelpError) {
				console.log(`Sending usage information for command "${name}"`)
				let embed = await this.help.commandHelp(message.guild, name)
				message.channel.send(embed).catch(console.error)
			} else {
				console.error(`Error during command "${name}":`)
				console.error(e)
			}
		}
	}

	async guildMemberAdd (member) {
		let doc = await MemberRoles.findOne({ guildId: member.guild.id, userId: member.user.id }).exec()
		if (doc) {
			let rolesToAdd = []
			for (let roleId of doc.roleIds) {
				let role = member.guild.roles.get(roleId)
				if (role) {
					rolesToAdd.push(role)
				}
			}
			if (rolesToAdd.length) {
				console.log(`${member.user.username} (${member.user.id}) rejoined, readding ${rolesToAdd.length} roles`)
				member.addRoles(rolesToAdd).catch(console.error)
			}
		}
	}

	async guildMemberUpdate (oldMember, newMember) {
		let oldMemberRoles = oldMember.roles.filter(e => !e.managed && e.id !== e.guild.id).map(e => e.id).sort()
		let newMemberRoles = newMember.roles.filter(e => !e.managed && e.id !== e.guild.id).map(e => e.id).sort()

		if (oldMemberRoles.join() !== newMemberRoles.join()) {
			let doc = await MemberRoles.findOne({ guildId: newMember.guild.id, userId: newMember.user.id }).exec()
			doc = doc || new MemberRoles({ guildId: newMember.guild.id, userId: newMember.user.id })
			doc.roleIds = newMemberRoles
			doc.save().catch(console.error)
		}
	}
}
module.exports = Handler
