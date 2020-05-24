const mongoose = require('mongoose')

const schema = mongoose.Schema({
	guildId: String,
	name: String,
	content: String,
	file: Buffer,
	filename: String
})

module.exports = mongoose.model('Tag', schema, 'tags')
