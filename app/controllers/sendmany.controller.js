var bitcore = require('bitcore-lib');
var explorers = require('bitcore-explorers');
var config = require('../../config.json');

var utils = require('../utility/address');

exports.sendmany_description = function(req, res) {

    var description = {
        "Method": "POST",
        "url": "http://this_ip_you_access_the_api.com:" + config.port + "/sendmany",
        params: {
            "boadcast": "(true|false) the default is false",
            "pk": "Private Key",
            addresses: [{
                    "to_address": "To Address 1",
                    "satoshis": 1111
                },
                {
                    "to_address": "To Address 2",
                    "satoshis": 2222
                },
                {
                    "to_address": "To Address 3",
                    "satoshis": 3333
                }
            ],
            "fee": "Default is 10000 satoshis"
        }
    };

    return res.json(description).status(200);
}

function countSatoshis(addresses, callback) {
    var temp_satoshis = 0;
    addresses.map(function(addr, index) {
        temp_satoshis += addr.satoshis;
        if (addresses.length === index + 1) {
            callback(null, temp_satoshis);
        }
    });
}

function estimateFeeByTransaction(transaction, fee_per_kb, callback) {
    //  estimate size of transaction and calculate fee
    var fee = Math.floor(fee_per_kb * transaction._estimateSize() / 1024);
    callback(null, fee);
}

function toAddressValidator(addresses, callback) {

    // Validate to address parameter
    if (addresses) {
        addresses.map(function(to_address, index) {

            if (to_address.satoshis === undefined || to_address.satoshis == '' || to_address == null) {
                callback('Please input the parameter [satoshis] amount, error by key ' + (index + 1), null);
            }

            if (typeof to_address.satoshis != 'number') {
                callback('The value of satoshis should be number', null);
            }

            if (addresses.length === index + 1) {
                callback(null, true);
            }

        });
    }
}

exports.sendmany = function(req, res) {

    var boadcast = (boadcast ? true : req.body.boadcast);
    if (req.body.boadcast === undefined) {
        var boadcast = false;
    } else if (req.body.boadcast === 'false' || req.body.boadcast === "false") {
        var boadcast = false
    } else if (req.body.boadcast === 'true' || req.body.boadcast === "true") {

    }

    var pk = req.body.pk;
    var addresses = req.body.addresses;
    var fee_per_kb = req.body.fee_per_kb;

    if (!pk) {
        return res.json({ err: 'Not have private key provide' }).status(200);
    }

    if (!addresses) {
        return res.json({ err: 'Not found address for sending' }).status(200);
    }

    if (!typeof addresses === 'object') {
        return res.json({ err: 'Addresses is not object' }).status(200);
    }

    if (!fee_per_kb) {
        fee_per_kb = config.fee_per_kb; // 256 = 256*32=8192 satoshi per byte
    }

    var min_transaction_amount = 546;

    toAddressValidator(addresses, function(err, result) {
        if (err) return res.json({ err: err });

        utils.getAddressFromPK(pk, function(err, addr) {
            if (addr) {

                // create custome url for your own node, default is bitpay node
                var client = new explorers.Insight();

                // get unspent transaction
                client.getUnspentUtxos(addr, function(err, utxos) {

                    console.log("unspent", utxos);

                    if (err) {
                        return res.json({ err: 'Not found unspent transaction !', message: err });
                    } else {

                        if (utxos) {

                            // get total unspent
                            utils.getTotalUnspent(utxos, function(err, balance) {

                                // sum satoshis output
                                countSatoshis(addresses, function(err, satoshis_pending) {
                                    if (!err) {

                                        // create raw transaction
                                        var transaction = new bitcore.Transaction();
                                        transaction.from(utxos);

                                        // total value
                                        var total_value = balance;

                                        // total output
                                        var total_output = 0;
                                        for (var i = 0; i < addresses.length; i++) {
                                            var address_item = addresses[i];
                                            transaction.to(address_item.to_address, parseInt(address_item.satoshis))
                                            total_output += parseInt(address_item.satoshis);
                                        }

                                        //  estimate size of transaction and calculate fee
                                        estimateFeeByTransaction(transaction, fee_per_kb, function(err, fee) {
                                            if (err) return res.json({ err: err });

                                            // trunback balance
                                            var trunback = balance - satoshis_pending;

                                            console.log("total_output", total_output);
                                            console.log("total_value", total_value);
                                            console.log("fee", fee);

                                            if (total_value < total_output + fee) {
                                                return res.json({ err: 'Not enough for create transaction' });
                                            }

                                            if (trunback > 0 && trunback < min_transaction_amount) {
                                                return res.json({ err: 'The trunback amount is too small' });
                                            }

                                            console.log("trunback", total_value - total_output - fee);

                                            transaction.fee(fee);
                                            if (trunback > 0) {
                                                transaction.change(addr);
                                            }

                                            transaction.enableRBF()
                                                .sign(pk);

                                            var tx_hex = transaction.serialize();

                                            console.log("tx_hex", tx_hex);
                                            /*console.log( JSON.stringify(transaction.toObject()), "end");*/

                                            if (!tx_hex) {
                                                return res.json({ err: 'serialize transaction has failed' });
                                            } else {

                                                if (boadcast) {

                                                    /** warning for sensitive case -- ensure you want to push the transaction to network */

                                                    client.broadcast(transaction.serialize(), function(err, id) {
                                                        if (err) {
                                                            console.log('tx boardcast error ' + err);
                                                            return res.json({ err: 'transaction boardcast error', message: err });
                                                        } else {
                                                            console.log('sending bitcoin success : ' + transaction);
                                                            res.json({
                                                                "from_address": addr,
                                                                "to_address": addresses,
                                                                "total_input": total_value,
                                                                "total_output": total_output,
                                                                "trunback": trunback,
                                                                "fee": fee,
                                                                "transaction": transaction,
                                                            });
                                                        }
                                                    });

                                                } else {
                                                    return res.json({ transaction: transaction.serialize() }).status(200);
                                                }

                                            }

                                        });

                                    }
                                });

                            });

                        } else {
                            return res.json({ err: 'Not have unspent transaction' });
                        }
                    }
                });
            }
        });

    });
};