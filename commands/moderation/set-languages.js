const Language = require('../../src/models/Language.js')
const UnixHelpError = require('../../src/errors/UnixHelpError.js')

exports.run = async (client, message, args, pre) => {
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
		if (availableLanguages.find(e => e.name.toLowerCase() === lang.toLowerCase())) {
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
		let language = availableLanguages.find(e => e.name.toLowerCase() === lang.toLowerCase())
		if (!language) {
			// language doesn't exist
			continue
		}
		let actualName = language.name
		await language.delete()
		removedLanguages.push(actualName)
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
	description: 'Manage the available programming langage roles.'
}
