const Language = require('../../src/models/Language.js')
const UnixHelpError = require('../../src/errors/UnixHelpError.js')

exports.run = async (handler, message, args, pre) => {
	if (!(args.add || args.remove || args.list)) {
		throw new UnixHelpError()
	}

	let availableLanguages = await Language.find({ guildId: message.guild.id }).exec()

	// convert languages to lowercase
	args.add = (args.add || []).map(e => e.toLowerCase())
	args.remove = (args.remove || []).map(e => e.toLowerCase())

	// remove duplicates
	let languagesToAdd = Array.from(new Set(args.add).values())
	let languagesToRemove = Array.from(new Set(args.remove).values())

	// remove items that are in both lists
	for (let i = languagesToAdd.length - 1; i >= 0; --i) {
		let removeIndex = languagesToRemove.indexOf(languagesToAdd[i])
		if (removeIndex !== -1) {
			languagesToAdd.splice(i, 1)
			languagesToRemove.splice(removeIndex, 1)
		}
	}

	let rolesToAdd = []
	let rolesToRemove = []
	let notAvailable = false

	for (let lang of languagesToAdd) {
		if (!availableLanguages.find(e => e.name.toLowerCase() === lang)) {
			notAvailable = true
			continue
		}
		let role = message.guild.roles.find(e => e.name.toLowerCase() === lang)
		if (!role) {
			notAvailable = true
			continue
		}
		rolesToAdd.push(role)
	}
	for (let lang of languagesToRemove) {
		if (!availableLanguages.find(e => e.name.toLowerCase() === lang)) {
			notAvailable = true
			continue
		}
		let role = message.guild.roles.find(e => e.name.toLowerCase() === lang)
		if (!role) {
			notAvailable = true
			continue
		}
		rolesToRemove.push(role)
	}

	// if an unavailable language was chosen and/or the available languages need to be listed, delete any languages that don't have roles anymore
	if (notAvailable || args.list) {
		let deletions = []
		for (let i = availableLanguages.length - 1; i >= 0; --i) {
			if (!message.guild.roles.find(e => e.name === availableLanguages[i].name)) {
				deletions.push(availableLanguages[i].delete())
				availableLanguages.splice(i, 1)
			}
		}
		await Promise.all(deletions)
	}

	let member = await message.guild.fetchMember(message.author)

	// ignore roles that the user wants to add, but already has / wants to remove, but already doesn't have
	for (let i = rolesToAdd.length - 1; i >= 0; --i) {
		if (member.roles.has(rolesToAdd[i].id)) {
			rolesToAdd.splice(i, 1)
		}
	}
	for (let i = rolesToRemove.length - 1; i >= 0; --i) {
		if (!member.roles.has(rolesToRemove[i].id)) {
			rolesToRemove.splice(i, 1)
		}
	}

	await member.addRoles(rolesToAdd)
	await member.removeRoles(rolesToRemove)

	let text = `${message.author},`
	if (rolesToAdd.length) {
		text += ` added ${rolesToAdd.map(e => `"${e.name}"`).join(', ')}`
	}
	if (rolesToAdd.length && rolesToRemove.length) {
		text += ` and`
	}
	if (rolesToRemove.length) {
		text += ` removed ${rolesToRemove.map(e => `"${e.name}"`).join(', ')}`
	}
	if (rolesToAdd.length || rolesToRemove.length) {
		text += `.\n`
	} else {
		text += ` no roles modified.\n`
	}
	if (notAvailable || args.list) {
		text += `Available languages:\n${availableLanguages.length ? availableLanguages.map(e => `• ${e.name}`).sort().join('\n') : 'None'}`
	}
	return message.channel.send(text)
}

exports.yargsOpts = {
	alias: {
		add: ['a'],
		help: ['h'],
		list: ['l'],
		remove: ['r']
	},
	array: ['add', 'remove'],
	boolean: ['list']
}

exports.help = {
	name: ['languages'],
	group: 'utility',
	description: 'Manage your programming language roles.'
}
