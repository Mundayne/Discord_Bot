const logger = require('winston').loggers.get('default')

exports.run = async (handler, message, args, pre) => {
	logger.info('Restarting via commmand')
	await handler.client.destroy()
	process.exit(2)
}

exports.yargsOpts = {}

exports.help = {
	name: ['restart'],
	group: 'moderation',
	description: 'Restart the bot.'
}
