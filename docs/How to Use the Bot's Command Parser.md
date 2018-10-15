# How to Use the Bot's Command Parser

## Configuring a Command's Arguments

A command's arguments are configured by exporting an object as `module.exports.yargsOpts`. This object must always be present for a command to use the parser. If a command does not have any arguments, it is an empty object.

The bot's command parser uses yargs-parser at its core, and as such the `yargsOpts` object is mostly equivalent to yargs-parser's options object (see [the yargs-parser documentation](https://github.com/yargs/yargs-parser/tree/v10.1.0#requireyargs-parserargs-opts)), with a few additional features:

### Argument Types

All of yargs-parser's types (array, boolean, number, string) are supported, however array argumentss are always treated as strings.

For numbers, additional supported types are "integer" and "float". The "integer" type will accept only whole numbers (although this includes numbers like `12.0`). The "float" type is semantically equivalent to "number", and merely emphasizes that non-integer values are allowed.

For strings, additional supported types are "channel" and "user". These types allow both their respective mentions as well as just the IDs. Regardless of which is passed as an argument, the parser will convert it into the ID. If nothing resembling an ID is passed, `false` is returned.

(Note: There is no guarantee that the IDs actually exist, only that they look like valid IDs. Validation in the command is required.)

### Dynamic Default Values

Passing an object with a `description` property as a default value will treat it not as a literal value, but a description of a default value
that's computed at runtime. It is the command implementer's responsibility to actually compute and set that value, as the parser cannot do that.

Example:  
*("user" is not automatically assigned a default value by the parser; the command has to check whether it has been set and if not, determine its value itself.)*

```javascript
{
    user: ['user'],
    default: {
        user: {
            description: 'you'
        }
    }
}
```

### Required Arguments

Arguments can be marked as required with the `required` field. Any argument not listed is treated as optional.

Example:  
*("foo" is a required argument, "bar" is optional.)*

```javascript
{
    string: ['foo', 'bar'],
    required: ['foo']
}
```

### Mutually Exclusive Arguments

The `exclusive` field can be used to define groups of mutually exclusive arguments. Setting one or more arguments of a group as required will mean the entire group is required. (Meaning exactly one argument of the group must be given.)

Example:  
*("foo" and "bar" cannot both be passed.)*

```javascript
{
    string: ['foo', 'bar', 'baz'],
    exclusive: [
        ['foo', 'bar']
    ]
}
```

### Positional Arguments

Positional arguments can be configured with the `positional` field. `positional.args` is an array of objects defining the arguments (via a `name`, `type` and optionally `default` field). A positional argument can be of any supported type except "array". `positional.required` is a number defining how many of the arguments are required.

Positional arguments can be accessed using the name given, but they will also still be available via yargs-parser's `_` field.

Example:  
*("foo" and "bar" are required arguments, "baz" is optional.)*

```javascript
{
    positional: {
        args: [
            {
                name: 'foo',
                type: 'string'
            },
            {
                name: 'bar',
                type: 'string'
            },
            {
                name: 'baz',
                type: 'string',
                default: 'xyz'
            }
        ],
        required: 2
    }
}
```

### The `--help` Argument

The `--help` argument is reserved. If it (or any alias of it) is used, the command is not executed, and its usage information is displayed instead.

## Accessing Arguments During Command Execution

The arguments passed to the command can be accessed via the `args` parameter of the command's `run` function.

This parameter is an object of key/value pairs for each argument and its value.

This parameter is an object effectively identical to the result of yargs-parser's `parse()` method. It has key/value pairs for each argument and its value, a `_` field containing an array of positional arguments, and, depending on the configuration used, a `--` field containing an array of values passed after the end-of-options flag `--`.
