module.exports = {
	String: ['string'],
	Integer: ['integer', 'number'],
	Float: ['float', 'number'],
	Boolean: ['boolean']
}

/*
		This looks like a very strange enum and it is, but for good reason.
		There are only 3 DataTypes in JavaScript, if you can call them that: String,
	Number and Boolean, where a Number is any real number. Thus telling the
	difference between an integer and a float is a bit tricky, since `typeof` will
	only tell us that it is a Number of some description.
		The way I get around this without creating a whole new case for integers and
	floats is by checking to see if `type.includes(typeof value)`. This way it is
	still possible to tell an integer from a float since
	`Types.Integer !== Types.Float` have different arrays, whilst both being able
	to be compared to the Number type.
*/
