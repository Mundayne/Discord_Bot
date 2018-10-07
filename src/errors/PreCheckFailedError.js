class PreCheckFailedError extends Error {
	constructor (errData) {
		super(errData)
		this.name = 'PreCheckFailedError'
	}
}

module.exports = PreCheckFailedError
