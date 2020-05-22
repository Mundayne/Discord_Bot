const logger = require('winston').loggers.get('default')
const Reminder = require('../../src/models/Reminder.js')
const { LOAD_INTERVAL } = require('../../src/constants/reminders.js')

class ReminderManager {
	constructor (handler) {
		this.handler = handler
		this.loadedReminders = new Set()
	}

	/**
	 * Loads all reminders due in the near future
	 * @returns {Promise<void>}
	 */
	async loadReminders () {
		let reminders = await Reminder.find({ reminderDate: { $lt: Date.now() + LOAD_INTERVAL } })
		for (let reminder of reminders) {
			if (this.loadedReminders.has(String(reminder._id))) continue
			this.loadedReminders.add(String(reminder._id))
			let reminderTimeout = reminder.reminderDate - Date.now()
			setTimeout(async () => {
				try {
					let user = await this.handler.client.users.fetch(reminder.userId)
					await user.send(`Reminding you${reminder.reminderReason ? ` for \`${reminder.reminderReason}\`` : ''}!`)
					await reminder.delete()
					this.loadedReminders.delete(String(reminder._id))
				} catch (err) {
					logger.error(`Something happened with a reminder.`)
					logger.error(err)
				}
			}, reminderTimeout > 0 ? reminderTimeout : 1) // If the reminder time <= 0, remind the user immediately
		}
	}
}

module.exports = ReminderManager
