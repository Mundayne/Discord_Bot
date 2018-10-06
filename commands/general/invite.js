exports.pre = async (client, message) => {
  console.log('Invite command run by ' + message.author.username);
}

exports.run = async (client, message, args, pre) => {
	return message.channel.send(`https://discord.gg/xRFmHYQ`)
}

exports.yargsOpts = {}

exports.post = async (client, message, result) => {
	console.log('Invite command complete!')
}

exports.help = {
	name: ['invite'],
	group: 'general',
	description: 'Shows the official invite for the Discord_Bots server.',
	args: UnixArguments.generateUsage(exports.yargsOpts)
}
