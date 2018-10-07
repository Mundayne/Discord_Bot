const UnixArguments = require('../../src/utility/arguments/UnixArguments.js')

exports.pre = async (client, message) => {
}

function remind (message) {
	let author = message.author
	let msg = message.toString()

	message.channel.send(`${author} ${msg.substring(msg.indexOf('"') + 1, msg.lastIndexOf('"'))}`)
}

exports.run = async (client, message, args, pre) => {
	let strDelay = message.toString().substring(9, message.toString().indexOf('"'))
	let delay = parseInt(strDelay) * 1000
	setTimeout(remind, delay, message)
}

exports.yargsOpts = {}

exports.post = async (client, message, result) => {
}

exports.help = {
	name: ['remindme'],
	group: 'general',
	description: 'Reminds a person.',
	args: UnixArguments.generateUsage(exports.yargsOpts)
}
