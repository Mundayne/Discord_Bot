const Tag = require('../../src/models/Tag.js')

exports.run = async (handler, message, args, pre) => {
	let tags = await Tag.find({ guildId: message.guild.id }).exec()

	return message.channel.send(tags.length ? tags.map(e => '`' + e.name + '`').sort().join(', ') : 'No tags found.')
}

exports.yargsOpts = {
	alias: {
		help: ['h']
	}
}

exports.help = {
	name: ['tags'],
	group: 'general',
	description: 'List existing tags.'
}
