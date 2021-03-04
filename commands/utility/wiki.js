const https = require('https')
const Discord = require('discord.js')

exports.run = async (handler, message, args, pre) => {
	if (!args.text) {
		return message.reply('Must provide a text argument.')
	}

	let query = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts&titles=${args.text}&exintro=&exsentences=2&redirects=&explaintext=&formatversion=2&piprop=original&format=json`

	https.get(query, (res) => {
		let data = ''

		res.on('data', (chunk) => {
			data += chunk
		})

		res.on('end', () => {
			let wikiJson = JSON.parse(data).query.pages[0]

			if (wikiJson.missing) {
				return message.reply('Page not found!')
			}

			let embed = new Discord.MessageEmbed()
				.setColor('BLUE')
				.setTitle(wikiJson.title)
				.setDescription(wikiJson.extract + '\n\n[Permalink](https://en.wikipedia.org/wiki/' + query + ')')
				.setFooter('Page ID: ' + wikiJson.pageid)

			if (wikiJson.original) embed.setThumbnail(wikiJson.original.source)

			message.channel.send(embed)
		})
	})
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
