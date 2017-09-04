var bitcore = require('bitcore-lib');
var explorers = require('bitcore-explorers');
var config = require('../../config.json');

function getAddressFromPK(pk, callback) {
    var privateKey = new bitcore.PrivateKey(pk);
    var publicKey = privateKey.publicKey;
    var address = publicKey.toAddress().toString();
    callback(null, address);
}

function getTotalUnspent(utxos, callback) {
    var balance = 0;
    utxos.forEach(summary_balance);

    function summary_balance(item, index) {
        balance = balance + item.satoshis;
    }
    callback(null, balance);
}

module.exports = {
    getAddressFromPK,
    getTotalUnspent
}