var bitcore = require('bitcore-lib');
var explorers = require('bitcore-explorers');
var config = require('../../config.json');

var utils = require('../utility/address');

exports.send_description = function(req, res) {

    var description = {
        "Method": "POST",
        "url": "http://this_ip_you_access_the_api.com:" + config.port + "/send",
        params: {
            "boadcast": "(true|false) the default is true",
            "pk": "Private Key",
            "to_address": "To Address",
            "satoshis": "Default is all unspent, mininum satoshis is 10000 satoshis",
            "fee": "Default is 10000 satoshis"
        }
    };

    return res.json(description).status(200);
}

exports.send = function(req, res) {

    // set parametor
    var boadcast = (boadcast ? true : req.body.boadcast);
    if (req.body.boadcast === undefined) {
        var boadcast = true;
    }

    var pk = req.body.pk;
    var to_address = req.body.to_address;
    var satoshis = req.body.satoshis;
    var fee = req.body.fee;

    if (!pk) {
        return res.json({ err: 'Not have private key provide' }).status(200);
    }

    if (!to_address) {
        return res.json({ err: 'Not found address for sending' }).status(200);
    }

    if (satoshis < 10000) {
        return json({ err: 'Satoshis should more than 10000 for sending' }).status(200);
    }

    if (!fee) {
        fee = config.default_fee;
    }

    satoshis = parseInt(satoshis);
    utils.getAddressFromPK(pk, function(err, addr) {
        if (addr) {

            // create custome url for your own node, default is bitpay node
            var client = new explorers.Insight();
            client.getUnspentUtxos(addr, function(err, utxos) {
                if (err) {
                    return res.json({ err: 'Not found unspent transaction !' });
                } else {
                    if (utxos) {

                        utils.getTotalUnspent(utxos, function(err, balance) {
                            if (balance > 0) {
                                if (!satoshis) {
                                    satoshis = balance;
                                }
                                if ((balance - satoshis - fee) > 0) {
                                    trunback = balance - satoshis;
                                    var rawtx = new bitcore.Transaction()
                                        .from(utxos)
                                        .to(to_address, satoshis - fee)
                                        .to(addr, trunback)
                                        .sign(pk);
                                } else {
                                    trunback = 0;
                                    var rawtx = new bitcore.Transaction()
                                        .from(utxos)
                                        .to(to_address, satoshis - fee)
                                        .sign(pk);
                                }

                                if (!rawtx) {
                                    return res.json({ err: 'Not found sign by decode raw transaction' });
                                } else {

                                    if (boadcast) {
                                        client.broadcast(rawtx.serialize(), function(err, id) {
                                            if (err) {
                                                console.log('tx boardcast error ' + err);
                                                return res.json({ err: 'transaction boardcast error' });
                                            } else {
                                                console.log('sending bitcoin success : ' + rawtx);
                                                res.json({
                                                    "from_address": addr,
                                                    "to_address": to_address,
                                                    "satoshis": satoshis,
                                                    "balance": balance,
                                                    "trunback": trunback,
                                                    "fee": fee,
                                                    "transaction": rawtx,
                                                });
                                            }
                                        });
                                    } else {
                                        return res.json({ rawtx: rawtx.serialize() }).status(200);
                                    }
                                }
                            } else {
                                return res.json({ err: 'Balance is not enought' });
                            }
                        });

                    } else {
                        return res.json({ err: 'Not found utxos' });
                    }
                }
            });
        } else {
            return res.json({ err: 'Not found address from privatekey' });
        }
    });
};