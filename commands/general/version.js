const VERSION = require('../../package.json').version

exports.run = async (client, message, args, pre) => {
	return message.channel.send(`v${VERSION}`)
}

exports.yargsOpts = {}

exports.help = {
	name: ['version'],
	group: 'general',
	description: 'Show the bot\'s version.'
}
