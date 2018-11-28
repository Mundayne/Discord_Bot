const mongoose = require('mongoose')

const schema = mongoose.Schema({
	guildId: String,
	userId: String,
	roleIds: [String]
})

module.exports = mongoose.model('MemberRoles', schema, 'memberRoles')
