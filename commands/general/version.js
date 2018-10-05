const UnixArguments = require('../../src/utility/arguments/UnixArguments.js')

const VERSION = require('../../package.json').version

exports.pre = async (client, message) => {}

exports.run = async (client, message, args, pre) => {
	return message.channel.send(`v${VERSION}`)
}

exports.post = async (client, message, result) => {}

exports.yargsOpts = {}

exports.help = {
	name: ['version'],
	group: 'general',
	description: 'Shows the bot\'s version.',
	args: UnixArguments.generateUsage(exports.yargsOpts)
}
