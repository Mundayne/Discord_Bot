class ArgumentError extends Error {
	constructor (format, value) {
		if (format.required && (!value || value.length === 0)) {
			super(`${format.name} is a required argument.`)
		} else if (!format.type.includes(typeof value)) {
			super(`${format.name} must be a(n) ${format.type}.`)
		} else {
			super(`${format.name} was given an incorrect value.`)
		}
	}
}
module.exports = ArgumentError
