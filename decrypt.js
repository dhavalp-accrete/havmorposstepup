const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
var fs = require('fs');

function decrypt(text) {
	let iv = Buffer.from(text.iv, 'hex');
	let key = Buffer.from(text.key, 'hex');
	let encryptedText = Buffer.from(text.encryptedData, 'hex');
	let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
}
data = JSON.parse(fs.readFileSync(__dirname + '/test.json', 'utf8'))
//return console.log(JSON.parse(data).iv)
decryptData = JSON.parse(decrypt(data))
return console.log(decryptData)