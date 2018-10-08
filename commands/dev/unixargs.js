const UnixArguments = require('../../src/utility/arguments/UnixArguments.js')

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

exports.yargsOpts = {
	string: ['opts'],
	default: {
		opts: '{}'
	}
}

exports.help = {
	name: ['unixargs'],
	group: 'dev',
	description: 'Test the Unix-style argument parsing.'
}
