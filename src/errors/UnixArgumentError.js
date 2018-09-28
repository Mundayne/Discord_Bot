class UnixArgumentError extends Error {
	constructor (errData) {
		switch (errData.error) {
		case 'exclusive': {
			super(`Arguments ${errData.args.map(e => `"${e}"`).join(', ')} are mutually exclusive.`)
			break
		}
		case 'narg': {
			super(`Argument "${errData.args[0]}" needs ${errData.expected} values.`)
			break
		}
		case 'required': {
			if (errData.args.length === 1) {
				super(`Argument "${errData.args[0]}" is required.`)
			} else {
				super(`One of ${errData.args.map(e => `"${e}"`).join(', ')} is required.`)
			}
			break
		}
		case 'type': {
			super(`Argument "${errData.args[0]}" must be of type ${errData.expected}.`)
			break
		}
		default: super('An unknown error occurred.')
		}
		this.name = 'UnixArgumentError'
	}
}

module.exports = UnixArgumentError
