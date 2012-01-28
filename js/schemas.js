var User = persistence.define('users_v1', {
	name: "TEXT",
	stored_hash: "TEXT",
	key_phrase: "TEXT",
	home: "TEXT",
	defaultHandlers: "TEXT"
});
var User_Preference = persistence.define('user_preference_v3', {
	user: "TEXT",
	key: "TEXT",
	val: "TEXT",
});
//User has password.
//Key is encrypted using the password.
//The same key is used to encrypt other data for the user.
//No key, No data.
//There is no way to know if the key is correct.
//So there has to be another way to determine it.