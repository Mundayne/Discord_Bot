exports.run = async (handler, message, args, pre) => {
	let initialText = args.echo
	let text = ''
	for (let i = 0; i < args.repeat; i++) text += initialText
	return message.author.send(text)
}

exports.yargsOpts = {
	alias: {
		help: ['h']
	},
	string: ['echo'],
	integer: ['repeat'],
	default: {
		repeat: 1
	},
	required: ['echo']
}

exports.help = {
	name: ['testunix'],
	group: 'dev',
	description: 'A test command with Unix-style arguments.'
}
