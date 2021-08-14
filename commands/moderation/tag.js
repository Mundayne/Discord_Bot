const got = require('got')

const { FILESIZE_LIMIT } = require('../../src/constants/tags.js')
const Tag = require('../../src/models/Tag.js')

exports.run = async (handler, message, args, pre) => {
	let tag = await Tag.findOne({ guildId: message.guild.id, name: args.name }).exec()

	if (args.delete) {
		if (tag) {
			await tag.delete()
			return message.reply(`deleted tag "${args.name}".`)
		} else {
			return message.reply(`tag "${args.name}" does not exist.`)
		}
	}

	if (!args.content && message.attachments.size === 0) {
		return message.reply('must specify "content" argument and/or attach a file.')
	}

	if (tag && !args.update) {
		return message.reply(`tag "${args.name}" already exists.`)
	}

	let attachment = message.attachments.first()
	let attachmentBuf
	if (attachment) {
		if (attachment.size > FILESIZE_LIMIT) {
			return message.reply('attached file is too large.')
		}
		attachmentBuf = await got(attachment.url).buffer()
	}

	tag = tag || new Tag({ guildId: message.guild.id, name: args.name })
	tag.content = args.content
	tag.file = attachmentBuf
	tag.filename = attachment?.name
	await tag.save()

	return message.reply(`tag "${args.name}" ${args.update ? 'updated' : 'created'}.`)
}

exports.yargsOpts = {
	alias: {
		update: ['u', 'edit', 'e'],
		delete: ['d', 'remove', 'r'],
		help: ['h']
	},
	boolean: ['update', 'delete'],
	exclusive: [
		['update', 'delete']
	],
	positional: {
		args: [
			{
				name: 'name',
				type: 'string'
			},
			{
				name: 'content',
				type: 'string'
			}
		],
		required: 1
	}
}

exports.help = {
	name: ['tag'],
	group: 'general',
	description: 'Create, update and delete tags.'
}
