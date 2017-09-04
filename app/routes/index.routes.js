module.exports = function(app) {
	var index = require('../controllers/index.controller');
	app.route('/')
		.get(index.render)
		.post(index.render);
};