const winston = require('winston')
const LOGGER = require('../constants/logger')
const CONFIG = require('../../config')

/* custom formats */

// winston.format.padLevels() seems to be broken, so this is a custom version
const customPadLevels = winston.format(info => {
	let maxLength = Math.max(...Object.keys(LOGGER.LEVELS).map(e => e.length))
	info.message = ' '.repeat(maxLength - info[Symbol.for('level')].length) + info.message
	return info
})

// makes sure errors are printed as their stacktrace instead of just their message
const printErrorStacktrace = winston.format(info => {
	if (info.message instanceof Error) {
		info.message = info.message.stack
	} else if (info instanceof Error) {
		info.message = info.stack
	}
	return info
})

let validLoggingLevel = Object.keys(LOGGER.LEVELS).includes(CONFIG.loggingLevel)

let logger = winston.loggers.add('default', {
	level: validLoggingLevel ? CONFIG.loggingLevel : LOGGER.DEFAULT_LEVEL,
	levels: LOGGER.LEVELS,
	format: winston.format.combine(
		winston.format.colorize({
			level: true,
			colors: LOGGER.COLORS
		}),
		printErrorStacktrace(),
		customPadLevels(),
		winston.format.timestamp(),
		winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
	),
	transports: [
		// always log everything to stdout
		new winston.transports.Console(),
		// in production, log all errors also separatly to stderr
		new winston.transports.Console({
			level: 'error',
			silent: process.env.NODE_ENV !== 'production',
			stderrLevels: [
				'fatal',
				'error'
			]
		})
	]
})

if (!validLoggingLevel) logger.error(`Invalid logging level, defaulting to "${LOGGER.DEFAULT_LEVEL}".`)
