var fs = require('fs');
var crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encrypt(text) {
	let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') ,key:key.toString('hex') };
}
data = fs.readFileSync(__dirname + '/config.json', 'utf8');
encryptData = encrypt(data)
 console.log(JSON.stringify(encryptData))
fs.writeFile('test.json', JSON.stringify(encryptData), function (err) {
	if (err) throw err;
	console.log('complete');
})
