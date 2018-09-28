const yargsParser = require('yargs-parser')

const { UnixArgumentError } = require('../../errors')

class UnixArguments {
	/**
	 * Parses UNIX-style arguments for a command
	 * @param {Object} opts Parser options
	 * @param {String} raw Message content after the command
	 * @returns {Object} Object containing the parsed arguments
	 */
	static parse (opts, raw) {
		// we will be modifiying the options object, so make a copy to work on
		let optsCopy = JSON.parse(JSON.stringify(opts))

		// normalize "integer" and "float" to "number"
		if (optsCopy.integer) {
			optsCopy.number = optsCopy.number || []
			for (let item of optsCopy.integer) {
				optsCopy.number.push(item)
			}
		}
		if (optsCopy.float) {
			optsCopy.number = optsCopy.number || []
			for (let item of optsCopy.float) {
				optsCopy.number.push(item)
			}
		}

		// normalize "user" and "channel" to "string", and add coercion functions
		if (optsCopy.user) {
			optsCopy.coerce = optsCopy.coerce || {}
			optsCopy.string = optsCopy.string || []
			for (let item of optsCopy.user) {
				optsCopy.string.push(item)
				optsCopy.coerce[item] = UnixArguments._coerceUser
			}
		}
		if (optsCopy.channel) {
			optsCopy.coerce = optsCopy.coerce || {}
			optsCopy.string = optsCopy.string || []
			for (let item of optsCopy.channel) {
				optsCopy.string.push(item)
				optsCopy.coerce[item] = UnixArguments._coerceChannel
			}
		}

		// remove non-literal defaults
		if (optsCopy.default) {
			for (let key in optsCopy.default) {
				if (optsCopy.default[key].description) optsCopy.default[key] = undefined
			}
		}

		// use yargs-parser for main parsing
		let parsed = yargsParser(raw, optsCopy)

		// TODO if "help" is set, abort and print usage

		// validate parsing results (types and required/exclusive arguments)
		let required = opts.required || []
		let exclusive = opts.exclusive || []
		let requiredExclusive = []
		let optionalExclusive = []

		// sort exclusive groups into required and optional
		for (let item of exclusive) {
			if (item.some(e => required.includes(e))) {
				requiredExclusive.push(item)
			} else {
				optionalExclusive.push(item)
			}
		}
		// remove arguments in required exclusive groups from the "required" list (since they're checked seperately)
		for (let item of requiredExclusive) {
			for (let arg of item) {
				let index
				if ((index = required.findIndex(e => e === arg)) !== -1) {
					required.splice(index, 1)
				}
			}
		}

		// validate exclusive groups
		for (let item of requiredExclusive) {
			let count = 0
			for (let arg of item) {
				count += Number(parsed[arg] !== undefined)
			}
			if (count > 1) {
				throw new UnixArgumentError({ error: 'exclusive', args: item })
			} else if (count === 0) {
				throw new UnixArgumentError({ error: 'required', args: item })
			}
		}
		for (let item of optionalExclusive) {
			let count = 0
			for (let arg of item) {
				count += Number(parsed[arg] !== undefined)
			}
			if (count > 1) {
				throw new UnixArgumentError({ error: 'exclusive', args: item })
			}
		}

		// validate required arguments
		for (let item of required) {
			if (parsed[item] === undefined) {
				throw new UnixArgumentError({ error: 'required', args: [item] })
			}
		}

		// validate types
		for (let type of ['float', 'number']) {
			for (let arg of (opts[type] || [])) {
				let argValues = Array.isArray(parsed[arg]) ? parsed[arg] : [parsed[arg]]
				argValues.forEach(e => {
					if (Number.isNaN(e)) {
						throw new UnixArgumentError({ error: 'type', args: [arg], expected: type })
					}
				})
			}
		}
		for (let arg of (opts.integer || [])) {
			let argValues = Array.isArray(parsed[arg]) ? parsed[arg] : [parsed[arg]]
			argValues.forEach(e => {
				if (Number.isNaN(e) || e !== Math.trunc(e)) {
					throw new UnixArgumentError({ error: 'type', args: [arg], expected: 'integer' })
				}
			})
		}

		// validate nargs (arguments that need a certain number of values)
		for (let arg in (opts.narg || {})) {
			if (parsed[arg] !== undefined && opts.narg[arg] > 1 && (!Array.isArray(parsed[arg]) || parsed[arg].length !== opts.narg[arg])) {
				throw new UnixArgumentError({ error: 'narg', args: [arg], expected: opts.narg[arg] })
			}
		}

		return parsed
	}

	/**
	 * Transform a channel ID or a channel mention into a channel ID
	 * @param {String} arg A channel ID or channel mention
	 * @returns {String|Boolean} A channel ID, or false if no ID was found
	 */
	static _coerceChannel (arg) {
		if (Array.isArray(arg)) return arg.map(UnixArguments._coerceChannel)
		let match = /^<#(\d+)>$|^(\d+)$/.exec(arg.trim())
		if (!match) {
			return false
		}
		return match[1] || match[2]
	}

	/**
	 * Transform a user ID or a user mention into a user ID
	 * @param {String} arg A user ID or user mention
	 * @returns {String|Boolean} A user ID, or false if no ID was found
	 */
	static _coerceUser (arg) {
		if (Array.isArray(arg)) return arg.map(UnixArguments._coerceUser)
		let match = /^<@!?(\d+)>$|^(\d+)$/.exec(arg.trim())
		if (!match) {
			return false
		}
		return match[1] || match[2]
	}
}

module.exports = UnixArguments
