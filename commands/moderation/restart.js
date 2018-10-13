exports.run = async (handler, message, args, pre) => {
	console.log('Restarting via commmand')
	await handler.client.destroy()
	process.exit(2)
}

exports.yargsOpts = {}

exports.help = {
	name: ['restart'],
	group: 'moderation',
	description: 'Restart the bot.'
}
