const Language = require('../../src/models/Language.js')
const UnixArguments = require('../../src/utility/arguments/UnixArguments.js')
const UnixHelpError = require('../../src/errors/UnixHelpError.js')

exports.pre = async (client, message) => {}

exports.run = async (client, message, args, pre) => {
	let authorMember = await message.guild.fetchMember(message.author)
	if (!authorMember.hasPermission('ADMINISTRATOR')) {
		return message.reply('you are not authorized to use this command.')
	}
	if (!(args.create || args.delete || args.list)) {
		throw new UnixHelpError()
	}

	let availableLanguages = await Language.find({ guildId: message.guild.id }).exec()

	// delete any languages that don't have roles anymore
	let deletions = []
	for (let i = availableLanguages.length - 1; i >= 0; --i) {
		if (!message.guild.roles.find(e => e.name === availableLanguages[i].name)) {
			deletions.push(availableLanguages[i].delete())
			availableLanguages.splice(i, 1)
		}
	}
	await Promise.all(deletions)

	let createdLanguages = []
	let createdRoles = []
	let removedLanguages = []

	// create languages
	for (let lang of Array.from(new Set(args.add || []).values())) {
		if (availableLanguages.find(e => e.name === lang)) {
			// language already exists
			continue
		}
		if (!message.guild.roles.find(e => e.name === lang)) {
			await message.guild.createRole({ name: lang, permissions: [] })
			createdRoles.push(lang)
		}
		let language = new Language({ name: lang, guildId: message.guild.id })
		await language.save()
		createdLanguages.push(lang)
	}
	// remove languages
	for (let lang of Array.from(new Set(args.delete || []).values())) {
		let language = availableLanguages.find(e => e.name === lang)
		if (!language) {
			// language doesn't exist
			continue
		}
		await language.delete()
		removedLanguages.push(lang)
	}

	let text = `${message.author}\n`
	if (!(createdRoles.length || createdLanguages.length || removedLanguages.length)) {
		text += `No roles or languages modified.`
	} else {
		if (createdRoles.length) {
			text += `Created role${createdRoles.length === 1 ? '' : 's'} ${createdRoles.map(e => `"${e}"`).join(', ')}.\n`
		}
		if (createdLanguages.length) {
			text += `Created language${createdLanguages.length === 1 ? '' : 's'} ${createdLanguages.map(e => `"${e}"`).join(', ')}.\n`
		}
		if (removedLanguages.length) {
			text += `Removed language${removedLanguages.length === 1 ? '' : 's'} ${removedLanguages.map(e => `"${e}"`).join(', ')}.\n`
		}
	}
	return message.channel.send(text)
}

exports.post = async (client, message, result) => {}

exports.yargsOpts = {
	alias: {
		create: ['c', 'add', 'a'],
		delete: ['d', 'remove', 'r'],
		help: ['h']
	},
	array: ['create', 'delete']
}

exports.help = {
	name: ['set-languages'],
	group: 'moderation',
	description: 'Command to manage the available programming langage roles.',
	args: UnixArguments.generateUsage(exports.yargsOpts)
}
