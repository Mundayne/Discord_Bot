const UnixHelpError = require('../../src/errors/UnixHelpError.js')

exports.run = async (handler, message, args, pre) => {

    let member = await message.guild.fetchMember(message.author)

    let helperRole = await message.guild.roles.find(role => role.name === 'Helper')
    let developerRole = await message.guild.roles.find(role => role.name === 'Developer')

    let hadRole = false
    let isDeveloper = false

    if (member.roles.has(developerRole.id)) {
        if (member.roles.has(helperRole.id)) {
            await member.removeRole(helperRole)
            hadRole = false
        } else if (!member.roles.has(helperRole.id)) {
            await member.addRole(helperRole)
            hadRole = true
        }

        isDeveloper = true
    }

    if (!isDeveloper) {
        message.reply(' you are not a developer. Please apply to be a developer before adding the helper role!')
    } else if (hadRole) {
        message.reply(` added the Helper role!`)
    } else if (!hadRole) {
        message.reply(' removed the Helper role!')
    }
}

exports.yargsOpts = {
    alias: {
        help: ['h']
    }
}

exports.help = {
    name: ['helper'],
    group: 'utility',
    description: 'Toggles the helper role if you are a developer.'
}
