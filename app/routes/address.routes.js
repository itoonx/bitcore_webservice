module.exports = function(app) {
	var address = require('../controllers/address.controller');
	app.route('/address')
		.get(address.addressbyprivatekey);
	app.route('/genaddress')
		.get(address.genaddress);
};