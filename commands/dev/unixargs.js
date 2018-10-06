const UnixArguments = require('../../src/utility/arguments/UnixArguments.js')

exports.pre = async (client, message) => {
	console.log('UNIX argument parser test command run by ' + message.author.username)
}

exports.run = async (client, message, args, pre) => {
	let parsed
	try {
		parsed = UnixArguments.parse(JSON.parse(args.opts), message.content.slice('?unixargs'.length).trim())
	} catch (err) {
		return message.channel.send('Error:```\n' + err + '\n```')
	}
	delete parsed.opts
	return message.channel.send('Options:```\n' + JSON.stringify(JSON.parse(args.opts), null, '\t') + '\n```\nUsage:```\n' + UnixArguments.generateUsage(JSON.parse(args.opts)) + '\n```\nParsed:```\n' + JSON.stringify(parsed, null, '\t') + '\n```')
}

exports.post = async (client, message, result) => {
	console.log('UNIX argument parser test command complete!')
}

exports.yargsOpts = {
	string: ['opts'],
	default: {
		opts: '{}'
	}
}

exports.help = {
	name: ['unixargs'],
	group: 'dev',
	description: 'A command to test the UNIX argument parsing.',
	args: UnixArguments.generateUsage(exports.yargsOpts)
}
