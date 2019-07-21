const mongoose = require('mongoose')

const schema = mongoose.Schema({
	userId: String,
	reminderDate: String,
	reminderReason: String
})

module.exports = mongoose.model('Reminders', schema, 'reminders')
