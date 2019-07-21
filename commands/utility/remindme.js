const Reminder = require('../../src/models/Reminders.js')

exports.run = async (handler, message, args, pre) => {
	if (!args.days && !args.hours && !args.minutes && !args.seconds) {
		return message.channel.send('Days, hours, minutes, or seconds argument must be given.')
	}

	// get total milliseconds
	var ms = ((args.days ? args.days : 0) * 86400000) + ((args.hours ? args.hours : 0) * 3600000) + ((args.minutes ? args.minutes : 0) * 60000) + ((args.seconds ? args.seconds : 0) * 1000)

	// if ms > 32bit integer max size
	if (ms > 2147483646) {
		return message.channel.send('Reminder is too far into the future. Try a shorter time!')
	}

	// get future date
	var reminderDate = Date.now() + ms

	await message.channel.send(`Set a reminder for ${new Date(reminderDate).toISOString().replace(/T/, ' ').replace(/\..+/, '')} ${args.reason ? ` for \`${args.reason}\`` : ''}.`)

	// send the reminder to the database
	var reminder = new Reminder({ userId: message.author.id, reminderDate: reminderDate, reminderReason: args.reason })
	await reminder.save()

	// create a timer for the reminder
	setTimeout(async () => {
		await reminder.delete()
		await message.author.send(`Reminding you${args.reason ? ` for \`${args.reason}\`` : ''}!`)
	}, reminderDate - Date.now())
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
