const UnixArguments = require('../../src/utility/arguments/UnixArguments.js')

exports.pre = async (client, message) => {
}

exports.run = async (client, message, args, pre) => {
	return message.channel.send(`https://discord.gg/xRFmHYQ`)
}

exports.yargsOpts = {}

exports.post = async (client, message, result) => {
}

exports.help = {
	name: ['invite'],
	group: 'general',
	description: 'Show the official invite for the /r/Discord_Bots server.',
	args: UnixArguments.generateUsage(exports.yargsOpts)
}
