const TYPES = require('./Types')
const { ArgumentError } = require('../../errors')

const argumentRegex = /^[[<](\w+):(\w+)(?:=(.+))?[\]>]$/

class Arguments {
	static parse (format, raw) {
		// Only parse valid format strings
		if (!format || (format[0] !== '<' && format[0] !== '[')) return

		// Will contain argument map for final return
		let args = {}
		// Will hold argument format objects as arguments are parsed
		let argFormats = []

		// Grab all the relevant information from the argument format string
		format.split(/(?<=>|]) (?=<|\[)/).forEach(arg => {
			let name, type, _default
			try {
				[, name, type, _default] = argumentRegex.exec(arg)
			} catch (err) {
				throw new Error(`Invalid argument format string: "${arg}"`)
			}
			// Temporarily hold some information for each argument's parse
			argFormats.push({
				name: name,
				type: type[0] === '?'
					? type.substring(1, type.length - 1)
					: type,
				required: arg[0] === '<',
				default: _default
			})
		})

		// Parse individual arguments, returning a result object
		let result
		let repeat
		let passed = raw.split(' ')
		argFormats.forEach((argFormat, i) => {
			do {
				repeat = false
				result = Arguments.parseArgument(passed[i], argFormat)
				if (!result.success) {
					/*
						If the argument was optional, perhaps this value is intended to be
						the next argument's
					*/
					if (!argFormat.required && argFormats[i + 1] && argFormats[i + 1].type.includes(typeof passed[i])) {
						repeat = true
						i++
					} else {
						throw new ArgumentError(argFormat, passed[i])
					}
					// Merge the new argument into the argument map
				} else args = { ...args, ...result.argument }
			} while (repeat)
		})

		return args
	}

	static parseArgument (value, format) {
		let result = { argument: { }, success: false }

		// Check nullable argument type and assign default
		// If no default is provided, let it return false
		if (!value || value.length === 0) {
			if (format.default) value = format.default
			else return result
		}
		// Parse values to correct types; see Types.js
		if (TYPES.String.includes(format.type)) {
			result.argument[format.name] = value
			result.success = true
		} else if (TYPES.Integer.includes(format.type)) {
			if (!isNaN(value)) {
				result.argument[format.name] = parseInt(value)
				result.success = true
			}
		} else if (TYPES.Float.includes(format.type)) {
			if (!isNaN(value)) {
				result.argument[format] = parseFloat(value)
				result.success = true
			}
		} else if (TYPES.Boolean.includes(format.type)) {
			let val = value.toLowerCase()
			if (val === 'true' || val === '1' || val === 'yes' || val === 'y') {
				result.argument[format.name] = true
				result.success = true
			} else if (val === 'false' || val === '0' || val === 'no' || val === 'n') {
				result.argument[format.name] = false
				result.success = true
			}
		}

		return result
	}
}

module.exports = Arguments
