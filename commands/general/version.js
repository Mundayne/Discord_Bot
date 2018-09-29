const VERSION = require('../../package.json').version

exports.pre = async (client, message) => {
	console.log('Version command run by ' + message.author.username)
}

exports.run = async (client, message, args, pre) => {
	return message.channel.send(`v${VERSION}`)
}

exports.post = async (client, message, result) => {
	console.log('Version command complete!')
}

exports.help = {
	name: ['version'],
	group: 'general',
	description: 'Shows the bot\'s version.',
	args: ''
}
