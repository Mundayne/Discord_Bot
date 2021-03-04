const Discord = require('discord.js')
const got = require('got')

exports.run = async (handler, message, args, pre) => {
	if (!args.text) {
		return message.reply('Must provide a text argument.')
	}

	let query = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts&titles=${args.text}&exintro=&exsentences=2&redirects=&explaintext=&formatversion=2&piprop=original&format=json`

	try {
		let response = await got(query)
		let wikiJson = JSON.parse(response.body).query.pages[0]

		if (wikiJson.missing) {
			return await message.reply('Page not found!')
		}

		let embed = new Discord.MessageEmbed()
			.setColor('BLUE')
			.setTitle(wikiJson.title)
			.setDescription(`${wikiJson.extract}\n\n[Permalink](https://en.wikipedia.org/wiki/${wikiJson.title.replaceAll(' ', '_')})`)
			.setFooter('Page ID: ' + wikiJson.pageid)

		if (wikiJson.original) embed.setThumbnail(wikiJson.original.source)

		await message.channel.send(embed)
	} catch (error) {
		await message.reply('Something went wrong executing your request.')
		throw error
	}
}

exports.yargsOpts = {
	alias: {
		text: ['t']
	},
	string: ['text']
}

exports.help = {
	name: ['wiki'],
	group: 'utility',
	description: 'Look up wiki information about a topic.'
}
