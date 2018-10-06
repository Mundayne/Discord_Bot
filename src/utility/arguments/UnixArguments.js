const yargsParser = require('yargs-parser')

const { UnixArgumentError, UnixHelpError } = require('../../errors')

class UnixArguments {
	/**
	 * Generates a command's usage information from its parser options
	 * @param {Object} opts Parser options of the command
	 * @returns {String} Usage information for the command
	 */
	static generateUsage (opts) {
		let argStringsMap = new Map()

		// document argument names and types
		for (let type of ['boolean', 'channel', 'float', 'integer', 'number', 'string', 'user']) {
			for (let arg of (opts[type] || [])) {
				argStringsMap.set(arg, `--${arg}:${type}`)
			}
		}
		for (let arg of (opts.array || [])) {
			argStringsMap.set(arg, `--${arg}:string[]`)
		}

		// for arguments requiring a certain number of values, document that
		for (let arg in (opts.narg || {})) {
			let argString = argStringsMap.get(arg)
			if (!argString) continue
			if (argString.endsWith('[]')) {
				argStringsMap.set(arg, `${argString.slice(0, -1)}${opts.narg[arg]}]`)
			} else {
				argStringsMap.set(arg, `${argString}[${opts.narg[arg]}]`)
			}
		}

		// document default values
		for (let arg in (opts.default || {})) {
			let argString = argStringsMap.get(arg)
			if (!argString) continue
			if (opts.default[arg].description) {
				argStringsMap.set(arg, `${argString}={${opts.default[arg].description}}`)
			} else if (argString.includes(':string')) {
				argStringsMap.set(arg, `${argString}="${opts.default[arg]}"`)
			} else {
				argStringsMap.set(arg, `${argString}=${opts.default[arg]}`)
			}
		}

		// handle exclusive groups
		let groupArgStrings = []
		let groupArgs = []
		for (let group of (opts.exclusive || [])) {
			groupArgs.push(...group)
			let required = group.some(e => (opts.required || []).includes(e))
			let groupArgString = group.map(e => argStringsMap.get(e)).sort().join(' | ')
			if (required) {
				groupArgStrings.push(`<${groupArgString}>`)
			} else {
				groupArgStrings.push(`[${groupArgString}]`)
			}
		}
		for (let arg of groupArgs) {
			argStringsMap.delete(arg)
		}

		// handle the remaining single arguments
		let singleArgStrings = []
		for (let [key, value] of argStringsMap.entries()) {
			if ((opts.required || []).includes(key)) {
				singleArgStrings.push(`<${value}>`)
			} else {
				singleArgStrings.push(`[${value}]`)
			}
		}

		// positional arguments
		let positionalRequired = (opts.positional && opts.positional.required) || 0
		let positionalArgStrings = ((opts.positional && opts.positional.args) || []).map((e, i) => {
			let argString = `${e.name}:${e.type}`
			if (e.default !== undefined) {
				if (e.default.description) {
					argString += `={${e.default.description}}`
				} else if (e.type === 'string') {
					argString += `="${e.default}"`
				} else {
					argString += `=${e.default}`
				}
			}
			if (i < positionalRequired) {
				return `<${argString}>`
			} else {
				return `[${argString}]`
			}
		})

		/*
			put everthing together in this order:
			required groups, required single args, optional groups, optional single args, positional args
			arguments within each category are sorted alphabetically
		*/
		let usageInfo = []
		for (let arg of groupArgStrings.filter(e => e.startsWith('<')).sort()) {
			usageInfo.push(arg)
		}
		for (let arg of singleArgStrings.filter(e => e.startsWith('<')).sort()) {
			usageInfo.push(arg)
		}
		for (let arg of groupArgStrings.filter(e => e.startsWith('[')).sort()) {
			usageInfo.push(arg)
		}
		for (let arg of singleArgStrings.filter(e => e.startsWith('[')).sort()) {
			usageInfo.push(arg)
		}
		usageInfo.push(...positionalArgStrings)
		return usageInfo.join(' ')
	}

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

		// ensure all arrays are strings (so we're able to give a single type in the usage information)
		if (optsCopy.array) {
			optsCopy.string = optsCopy.string || []
			for (let item of (optsCopy.array || [])) {
				if (!optsCopy.string.includes(item)) {
					optsCopy.string.push(item)
				}
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

		// if "help" is set, abort and print usage
		if (parsed.help) throw new UnixHelpError()

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
				if (Number.isNaN(e) || (e !== undefined && e !== Math.trunc(e))) {
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

		// validate positional arguments
		if (opts.positional && opts.positional.args) {
			opts.positional.args.forEach((e, i) => {
				if (parsed._[i] === undefined) {
					// check requiredness
					if (i < opts.positional.required) throw new UnixArgumentError({ error: 'required', args: [e.name] })
					// assign default value
					if (e.default && !e.default.description) {
						parsed._[i] = e.default
					}
				} else {
					// validate type
					switch (e.type) {
					case 'boolean': {
						if (String(parsed._[i]) === 'true' || String(parsed._[i]) === '1') {
							parsed._[i] = true
						} else if (String(parsed._[i]) === 'false' || String(parsed._[i]) === '0') {
							parsed._[i] = false
						} else {
							throw new UnixArgumentError({ error: 'type', args: [e.name], expected: 'boolean' })
						}
						break
					}
					case 'float':
					case 'number': {
						parsed._[i] = Number(parsed._[i])
						if (Number.isNaN(parsed._[i])) {
							throw new UnixArgumentError({ error: 'type', args: [e.name], expected: e.type })
						}
						break
					}
					case 'integer': {
						parsed._[i] = Number(parsed._[i])
						if (Number.isNaN(parsed._[i]) || parsed._[i] !== Math.trunc(parsed._[i])) {
							throw new UnixArgumentError({ error: 'type', args: [e.name], expected: 'integer' })
						}
						break
					}
					case 'channel': {
						parsed._[i] = this._coerceChannel(String(parsed._[i]))
						break
					}
					case 'user': {
						parsed._[i] = this._coerceUser(String(parsed._[i]))
						break
					}
					case 'string': {
						parsed._[i] = String(parsed._[i])
						break
					}
					}
				}
				if (parsed[e.name] === undefined) parsed[e.name] = parsed._[i]
			})
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
