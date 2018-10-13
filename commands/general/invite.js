exports.run = async (client, message, args, pre) => {
	return message.channel.send(`https://discord.gg/xRFmHYQ`)
}

exports.yargsOpts = {}

exports.help = {
	name: ['invite'],
	group: 'general',
	description: 'Show the official invite for the /r/Discord_Bots server.'
}
