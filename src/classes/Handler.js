const Discord = require('discord.js')
const mongoose = require('mongoose')
const logger = require('winston').loggers.get('default')
const fs = require('fs')
const { Arguments, UnixArguments } = require('../utility')
const { ArgumentError, InsufficientPermissionsError, PreCheckFailedError, UnixArgumentError, UnixHelpError } = require('../errors')
const Help = require('./Help')
const MemberRoles = require('../models/MemberRoles')
const CONFIG = require('../../config')
const ReminderManager = require('./ReminderManager.js')
const { LOAD_INTERVAL } = require('../../src/constants/reminders.js')
const Tag = require('../../src/models/Tag.js')

class Handler {
	constructor (client) {
		this.commands = { }
		this.prefix = CONFIG.prefix
		this.tagPrefix = CONFIG.tagPrefix
		this.client = client
		this.help = new Help(this)
		this.reminderManager = new ReminderManager(this)

		client.on('ready', () => this.ready())
		client.on('message', message => this.message(message))
		client.on('messageDelete', message => this.messageDelete(message))
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
						logger.warn(`${name} already exists; skipping...`)
					} else {
						logger.verbose(`Loaded command ${name}.`)
						// generate default pre and post functions if the command does not have them
						if (typeof command.pre !== 'function') {
							if (group === 'moderation') {
								command.pre = async (handler, message) => {
									let authorMember = await message.guild.members.fetch(message.author)
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
		logger.info(`Done! ${count.commands} commands loaded across ${count.groups} groups.`)
	}

	async start () {
		try {
			await mongoose.connect(CONFIG.database, { useNewUrlParser: true, useUnifiedTopology: true })
			await this.client.login(CONFIG.token)
			process.title = CONFIG.procName
		} catch (err) {
			logger.fatal('Fatal error while starting bot:')
			logger.fatal(err)
			process.exit(1)
		}
	}

	async ready () {
		logger.info('Ready.')
		await this.client.user.setActivity(`${this.prefix}help`)

		// update member roles database
		logger.debug('Updating member roles database.')
		let saveOps = []
		for (let guild of this.client.guilds.cache.array()) {
			await guild.members.fetch()
			let docs = await MemberRoles.find({ guildId: guild.id }).exec()

			// don't change documents of members that aren't in the server
			docs = docs.filter(e => guild.member(e.userId))

			// create documents for not yet saved members
			let newMembers = guild.members.cache.array().filter(e => !e.user.bot && e.roles.cache.size && !docs.find(d => d.userId === e.user.id))
			for (let newMember of newMembers) {
				docs.push(new MemberRoles({ guildId: guild.id, userId: newMember.user.id, roleIds: [] }))
			}

			for (let doc of docs) {
				let memberRoleIds = guild.member(doc.userId).roles.cache.filter(r => !r.managed && r.id !== r.guild.id).map(r => r.id).sort()
				if (memberRoleIds.join() !== doc.roleIds.join()) {
					doc.roleIds = memberRoleIds
					saveOps.push(doc.save())
				}
			}
		}
		await Promise.all(saveOps)
		logger.info('Finished updating member roles database.')

		this.reminderManager.loadReminders()
		this.client.setInterval(() => this.reminderManager.loadReminders(), LOAD_INTERVAL)
	}

	async message (message) {
		// Non-handling cases
		if (message.author.bot) return
		if (message.channel.type !== 'text') return

		if (message.content.startsWith(this.prefix)) {
			await this._handleCommand(message)
		}

		if (message.content.startsWith(this.tagPrefix)) {
			await this._handleTag(message)
		}
	}

	async messageDelete (message) {
		try {
			let logChannel = message.guild.channels.cache.find(e => e.name === 'message-deletions')
			if (!logChannel) throw new Error(`No logging channel for message deletions found in guild "${message.guild.name}"`)
			if (message.channel.id === logChannel.id) return
			let member
			try {
				member = message.member || await message.guild.members.fetch(message.author)
			} catch (err) {
				if (!err.message === 'Unknown Member') {
					throw err
				}
			}
			let embed = new Discord.MessageEmbed()
				.setColor((member && member.displayColor) || null)
				.setAuthor(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL())
				.setDescription(message.content)
				.addField('Channel', `${message.channel} (#${message.channel.name})`, true)
				.addField('Author', `${message.author}`, true)
				.setFooter(`Message ID: ${message.id}`)
				.setTimestamp(message.createdTimestamp)
			await logChannel.send({ embed })
		} catch (err) {
			logger.error('Error while logging message deletion:')
			logger.error(err)
		}
	}

	async guildMemberAdd (member) {
		if (member.user.bot) return

		let doc = await MemberRoles.findOne({ guildId: member.guild.id, userId: member.user.id }).exec()
		if (doc) {
			let rolesToAdd = []
			for (let roleId of doc.roleIds) {
				let role = member.guild.roles.cache.get(roleId)
				if (role) {
					rolesToAdd.push(role)
				}
			}
			if (rolesToAdd.length) {
				logger.info(`${member.user.username} (${member.user.id}) rejoined, readding ${rolesToAdd.length} roles`)
				member.roles.add(rolesToAdd).catch(logger.error)
			}
		}
	}

	async guildMemberUpdate (oldMember, newMember) {
		if (newMember.user.bot) return

		let oldMemberRoles = oldMember.roles.cache.filter(e => !e.managed && e.id !== e.guild.id).map(e => e.id).sort()
		let newMemberRoles = newMember.roles.cache.filter(e => !e.managed && e.id !== e.guild.id).map(e => e.id).sort()

		if (oldMemberRoles.join() !== newMemberRoles.join()) {
			let doc = await MemberRoles.findOne({ guildId: newMember.guild.id, userId: newMember.user.id }).exec()
			doc = doc || new MemberRoles({ guildId: newMember.guild.id, userId: newMember.user.id })
			doc.roleIds = newMemberRoles
			doc.save().catch(logger.error)
		}
	}

	async _handleCommand (message) {
		let content = message.content.split(' ')
		let name = content.splice(0, 1)[0].substring(this.prefix.length)
		if (!name) return
		let cmds = { }
		Object.values(this.commands).forEach(c => { cmds = { ...cmds, ...c } })
		if (!cmds.hasOwnProperty(name)) return logger.warn(`Command ${name} not found.`)
		let command = cmds[name]
		try {
			logger.info(`Command "${name}" run by ${message.author.username} (${message.author.id})`)
			let pre = await command.pre(this, message)
			let args = command.yargsOpts ? UnixArguments.parse(command.yargsOpts, message.content.slice(this.prefix.length + name.length).trim()) : Arguments.parse(command.help.args, content.join(' '))
			let result = await command.run(this, message, args, pre)
			await command.post(this, message, result)
			logger.info(`Command "${name}" complete`)
		} catch (e) {
			if (e instanceof ArgumentError) {
				logger.info(`Invalid arguments given for command "${name}"`)
				message.reply(e.message).then(m => m.delete({ timeout: 8000 })).catch(logger.error)
			} else if (e instanceof InsufficientPermissionsError) {
				logger.warn(`${message.author.username} (${message.author.id}) lacks permissions for command "${name}"`)
				message.reply('you are not authorized to use this command.').then(m => m.delete({ timeout: 8000 })).catch(logger.error)
			} else if (e instanceof PreCheckFailedError) {
				logger.warn(`Pre-Check failed for command "${name}", reason: ${e.message}`)
			} else if (e instanceof UnixArgumentError) {
				logger.info(`Invalid arguments given for command "${name}"`)
				message.reply(e.message).then(m => m.delete({ timeout: 8000 })).catch(logger.error)
			} else if (e instanceof UnixHelpError) {
				logger.info(`Sending usage information for command "${name}"`)
				let embed = await this.help.commandHelp(message.guild, name)
				message.channel.send(embed).catch(logger.error)
			} else {
				logger.error(`Error during command "${name}":`)
				logger.error(e)
			}
		}
	}

	async _handleTag (message) {
		let name = message.content.slice(this.tagPrefix.length)
		if (!name) return
		try {
			let tag = await Tag.findOne({ guildId: message.guild.id, name: name }).exec()
			if (!tag) return

			await message.channel.send(tag.content || '', { files: tag.file ? [{ attachment: tag.file, name: tag.filename }] : [] })
		} catch (err) {
			logger.error(`Error during tag "${name}":`)
			logger.error(err)
		}
	}
}
module.exports = Handler
