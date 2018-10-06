class InsufficientPermissionsError extends Error {
	constructor (errData) {
		super(errData)
		this.name = 'InsufficientPermissionsError'
	}
}

module.exports = InsufficientPermissionsError
