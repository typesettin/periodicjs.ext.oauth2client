'use strict';

var csrf = require('csurf'),
	// path = require('path'),
	// fs = require('fs-extra'),
	// extend = require('utils-merge'),
	// stylietreeview = require('stylie.treeview'),
	// settingJSON,
	// loginExtSettingsFile = path.join(__dirname, '../../content/config/extensions/periodicjs.ext.login/settings.json'),
	// defaultExtSettings = require('./controller/default_config'),
	loginExtSettings,
	passport;

/**
 * An login authentication extension that uses passport oauth to connect to oauth2 service providers.
 * @{@link https://github.com/typesettin/periodicjs.ext.login}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2016 Typesettin. All rights reserved.
 * @license MIT
 * @exports periodicjs.ext.oauth2client
 * @requires module:passport
 * @param  {object} periodic variable injection of resources from current periodic instance
 */
module.exports = function (periodic) {
	// periodic = express,app,logger,config,db,mongoose
	passport = periodic.app.controller.extension.login.auth.passportController.passport;
	loginExtSettings = periodic.app.controller.extension.login.loginExtSettings;
	periodic.app.controller.extension.oauth2client = {};
	periodic.app.controller.extension.oauth2client.oauth = require('./controller/oauth')(periodic);

	var authRouter = periodic.express.Router(),
		oauthController = periodic.app.controller.extension.oauth2client.oauth;


	if (loginExtSettings && loginExtSettings.passport && loginExtSettings.passport.oauth.oauth2client && Array.isArray(loginExtSettings.passport.oauth.oauth2client) && loginExtSettings.passport.oauth.oauth2client.length>0) {

		if (periodic.app.controller.extension.login.loginExtSettings.login_csrf) {
			authRouter.use(csrf());
			authRouter.use(function (req, res, next) {
				res.locals.token = req.csrfToken();
				next();
			});
		}

		authRouter.get('*', global.CoreCache.disableCache);
		authRouter.post('*', global.CoreCache.disableCache);

		//social controller & router
		loginExtSettings.passport.oauth.oauth2client.forEach(function(oauth2client_settings){
			authRouter.get(`/oauth2client-${oauth2client_settings.service_name}`, passport.authenticate(`oauth2client-${oauth2client_settings.service_name}`));
			authRouter.get(`/oauth2client-${oauth2client_settings.service_name}/callback`, oauthController.oauth2callback({service_name:oauth2client_settings.service_name}));
		});
		periodic.app.use('/auth', authRouter);
	}

	return periodic;
};
