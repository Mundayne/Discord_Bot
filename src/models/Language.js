const mongoose = require('mongoose')

const schema = mongoose.Schema({
	name: String,
	guildId: String
})

module.exports = mongoose.model('Language', schema, 'languages')
