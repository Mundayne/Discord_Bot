exports.pre = (client, message) => {
	console.log('Test command run by ' + message.author.username)
}

exports.run = (client, message, args, pre) => {
	let initialText = args.echo || 'Test message.'
	let text = ''
	for (let i = 0; i < args.repeat; i++) text += initialText
	message.author.send(text).catch(console.error)
}

exports.post = (client, message, result) => {
	console.log('Test command complete!')
}

exports.help = {
	name: ['test'],
	group: 'dev',
	description: 'A test command.',
	args: '<echo:string> [repeat:integer=1]'
}
