class UnixHelpError extends Error {
	constructor () {
		super('Help argument has been used.')
		this.name = 'UnixHelpError'
	}
}

module.exports = UnixHelpError
