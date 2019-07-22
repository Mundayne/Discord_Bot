const mongoose = require('mongoose')

const schema = mongoose.Schema({
	userId: String,
	reminderDate: Date,
	reminderReason: String
})

module.exports = mongoose.model('Reminder', schema, 'reminders')
