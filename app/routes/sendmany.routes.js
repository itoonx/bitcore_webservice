module.exports = function(app) {
    var sendmany = require('../controllers/sendmany.controller');
    app.route('/sendmany')
        .get(sendmany.sendmany_description)
        .post(sendmany.sendmany);
};