module.exports = function(app) {
    var send = require('../controllers/send.controller');
    app.route('/send')
        .get(send.send_description)
        .post(send.send);
};