exports.addressbyprivatekey = function(req, res){
	//Bitcore 
	var bitcore = require('bitcore-lib');
	var explorers = require('bitcore-explorers');

	pk = req.query.pk;

	if (!pk) {
		res.json({
			"error" : "Invalid Private Key"
		});
	}

	address = getAddress(pk);

    res.json({"address" : address});	

	function getAddress(pk) {
		//  find address by private key
	    var privateKey = new bitcore.PrivateKey(pk);
		var publicKey = privateKey.publicKey;
		var address = publicKey.toAddress().toString();

		return address;
	}
};

exports.genaddress = function(req, res){
	var bitcore = require('bitcore-lib');
	var explorers = require('bitcore-explorers');

	//  find address by private key
    var privateKey = new bitcore.PrivateKey();
	var publicKey = privateKey.publicKey;
	var address = publicKey.toAddress().toString();
	var wif = privateKey.toWIF();

	res.json({
		"private" : privateKey.toString(),
		"public" : publicKey.toString(),
		"address" : address,
		"wif" : wif,
	});
};