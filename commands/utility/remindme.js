const Reminder = require('../../src/models/Reminder.js')

exports.run = async (handler, message, args, pre) => {
	if (!args.days && !args.hours && !args.minutes && !args.seconds) {
		return message.channel.send('Days, hours, minutes, or seconds argument must be given.')
	}

	// get total milliseconds
	let ms = ((args.days ? args.days : 0) * 86400000) + ((args.hours ? args.hours : 0) * 3600000) + ((args.minutes ? args.minutes : 0) * 60000) + ((args.seconds ? args.seconds : 0) * 1000)

	// get future date
	let reminderDate = Date.now() + ms

	await message.channel.send(`Set a reminder for ${new Date(reminderDate).toISOString().replace(/T/, ' ').replace(/\..+/, '')}${args.reason ? ` for \`${args.reason}\`` : ''}.`)

	// send the reminder to the database
	let reminder = new Reminder({ userId: message.author.id, reminderDate: reminderDate, reminderReason: args.reason })
	await reminder.save()

	// ensure new reminder is loaded if it's due soon
	handler.reminderManager.loadReminders()
}

exports.yargsOpts = {
	alias: {
		days: ['d'],
		hours: ['h'],
		minutes: ['m'],
		seconds: ['s'],
		reason: ['r']
	},
	integer: ['days', 'hours', 'minutes', 'seconds'],
	string: ['reason']
}

exports.help = {
	name: ['remindme'],
	group: 'utility',
	description: 'Set up reminders.'
}
