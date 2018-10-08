const UnixArguments = require('../../src/utility/arguments/UnixArguments.js')

function remind (channel, msg, author) {
	channel.send(author + ' ' + msg)
}

exports.run = async (client, message, args, pre) => {
	let delay = 0
	args.delay = message.toString().substring(9, message.toString().indexOf('"') - 1)
	args.message = message.toString().substring(message.toString().indexOf('"') + 1, message.toString().lastIndexOf('"'))

	if (args.delay.includes('s')) {
		let seconds = args.delay.substring(0, args.delay.indexOf('s'))
		delay += parseFloat(seconds.substring(seconds.lastIndexOf(' '))) * 1000
	}

	if (args.delay.includes('m')) {
		let minutes = args.delay.substring(0, args.delay.indexOf('m'))
		delay += parseFloat(minutes.substring(minutes.lastIndexOf(' '))) * 60000
	}

	if (args.delay.includes('h')) {
		let hours = args.delay.substring(0, args.delay.indexOf('h'))
		delay += parseFloat(hours.substring(hours.lastIndexOf(' ') - 1)) * 3.6e+6
	}

	if (args.delay.includes('d')) {
		let days = args.delay.substring(0, args.delay.indexOf('d'))
		delay += parseFloat(days.substring(days.lastIndexOf(' ') - 1)) * 8.64e+7
	}

	if (args.delay.includes('M')) {
		let months = args.delay.substring(0, args.delay.indexOf('M'))
		delay += parseFloat(months.substring(months.lastIndexOf(' ') - 1)) * 2.628e+9
	}

	setTimeout(remind, delay, message.channel, args.message, message.author)
}

exports.yargsOpts = {
	positional: {
		args: [
			{
				name: 'delay',
				type: 'string'
			},
			{
				name: 'message',
				type: 'string'
			}
		],
		required: 2
	}
}

exports.help = {
	name: ['remindme'],
	group: 'general',
	description: 'Reminds a person.',
	args: UnixArguments.generateUsage(exports.yargsOpts)
}
