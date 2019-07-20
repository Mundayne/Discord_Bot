exports.run = async (handler, message, args, pre) => {
	if (!args.hours && !args.minutes && !args.seconds) {
		return message.channel.send('Days, hours, minutes, or seconds argument must be given.')
	}

	var time = ((args.days ? args.days : 0) * 86400000) + ((args.hours ? args.hours : 0) * 3600000) + ((args.minutes ? args.minutes : 0) * 60000) + ((args.seconds ? args.seconds : 0) * 1000)

	await message.channel.send(`Set timer for ${args.days ? `${args.days} days, ` : ''}${args.hours ? `${args.hours} hours, ` : ''}${args.minutes ? `${args.minutes} minutes, ` : ''}${args.seconds ? `${args.seconds} seconds ` : ''}from now${args.reason ? ` for \`${args.reason}\`` : ''}.`)

	setTimeout(() => {
		return message.channel.send(`<@${message.member.id}>, Reminding you${args.reason ? ` for \`${args.reason}\`` : ''}!`)
	}, time)
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
