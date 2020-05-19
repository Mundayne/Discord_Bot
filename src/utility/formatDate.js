module.exports = function (date) {
	return date.toISOString().replace(/T/, ' ').replace(/\.\d+/, '')
}
