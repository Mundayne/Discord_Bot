const mongoose = require('mongoose')

const schema = mongoose.Schema({
	userId: String,
	guildId: String,
	githubUrl: String,
	helper: Boolean,
	messageId: String
})

module.exports = mongoose.model('DevApplication', schema, 'devApplications')
