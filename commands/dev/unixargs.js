const UnixArguments = require('../../src/utility/arguments/UnixArguments.js')

exports.run = async (client, message, args, pre) => {
	let parsed
	try {
		parsed = UnixArguments.parse(JSON.parse(args.opts), message.content.slice('?unixargs'.length).trim())
	} catch (err) {
		return message.channel.send('Error:```\n' + err + '\n```')
	}
	delete parsed.opts

	let optionsJson = JSON.stringify(JSON.parse(args.opts), null, '\t')
	let usage = UnixArguments.generateUsage(JSON.parse(args.opts))
	let parsedJson = JSON.stringify(parsed, null, '\t')
	return message.channel.send(`Options:${'```'}\n${optionsJson}\n${'```'}\nUsage:${'```'}\n${usage || '\u200b'}\n${'```'}\nParsed:${'```'}\n${parsedJson}\n${'```'}`)
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
