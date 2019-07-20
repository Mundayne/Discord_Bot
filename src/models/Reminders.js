const mongoose = require('mongoose')

const schema = mongoose.Schema({
	uniqueId: String,
	userId: String,
	remainingTime: String,
	reminderReason: String
})

module.exports = mongoose.model('Reminders', schema, 'reminders')
