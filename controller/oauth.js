'use strict';

var OAuth2Strategy = require('passport-oauth2').Strategy,
	// merge = require('utils-merge'),
	// path = require('path'),
	// CoreUtilities,
	// CoreController,
	// CoreMailer,
	appSettings,
	mongoose,
	passport,
	logger,
	loginExtSettings,
	linkSocialAccount,
	authenticateUser,
	passportController;

var use_oauth_client = function(){
	if (loginExtSettings && loginExtSettings.passport && loginExtSettings.passport.oauth.oauth2client && Array.isArray(loginExtSettings.passport.oauth.oauth2client) && loginExtSettings.passport.oauth.oauth2client.length>0) {
		loginExtSettings.passport.oauth.oauth2client.forEach(function(oauth2client_settings){
			passport.use(`oauth2client-${oauth2client_settings.service_name}`, new OAuth2Strategy({
				clientID: oauth2client_settings.client_token_id,
				clientSecret: oauth2client_settings.client_secret,
				callbackURL: oauth2client_settings.callback_url || `/auth/oauth2client-${oauth2client_settings.service_name}/callback`,
		    authorizationURL: oauth2client_settings.authorization_url,
		    tokenURL: oauth2client_settings.token_url,
				passReqToCallback: true,
			},
			function (req, accessToken, refreshToken, profile, done) {
				logger.silly('oauth2client req:',req); 	
				logger.silly('oauth2client accessToken:',accessToken); 
				logger.silly('oauth2client refreshToken:',refreshToken);
				logger.silly('oauth2client profile:', profile);

				var oauth2clientdata = profile;
				authenticateUser({
					exitinguserquery: {
						email: oauth2clientdata.email,
						// 'attributes.oauth2clientid': oauth2clientdata.id,
						// 'attributes.oauth2clientaccesstokensecret': tokenSecret.toString()
					},
					existinusercallback: function (user) {
						logger.silly(`user from oauth2client-${oauth2client_settings.service_name} passport`, user);
						return done(null, user);
					},
					nonusercallback: function () {
						let findsocialaccountquery={};
						let socialaccountattributes = {};

						findsocialaccountquery[`attributes.oauth2clientid_${oauth2client_settings.service_name}`] = oauth2clientdata.id;

						socialaccountattributes[`oauth2clientid_${oauth2client_settings.service_name}`] = oauth2clientdata.id;
						socialaccountattributes[`oauth2clientusername_${oauth2client_settings.service_name}`] = oauth2clientdata.username;
						socialaccountattributes[`oauth2clientaccesstoken_${oauth2client_settings.service_name}`] = accessToken;
						socialaccountattributes[`oauth2clientrefreshtoken_${oauth2client_settings.service_name}`] = refreshToken;
						socialaccountattributes[`oauth2clientaccesstokenupdated_${oauth2client_settings.service_name}`] = new Date();

						linkSocialAccount({
							donecallback: done,
							linkaccountservice: `oauth2client-${oauth2client_settings.service_name}`,
							requestobj: req,
							findsocialaccountquery: findsocialaccountquery,
							socialaccountattributes: socialaccountattributes,
							newaccountdata: {
								email: oauth2clientdata.username + `@oauth2client-${oauth2client_settings.service_name}.account.com`,
								username: oauth2clientdata.username,
								activated: true,
								accounttype: 'social-sign-in',
							}
						});
					},
					donecallback: done
				});
			}));
		});	
	}
};

/**
 * facebook oauth callback
 * @param  {object} req
 * @param  {object} res
 * @return {Function} next() callback
 */
var oauth2callback = function(options){
	return function (req, res, next) {
		var loginUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoggedInHomepage;
		var loginFailureUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoginPath + '?return_url=' + req.session.return_url;
		passport.authenticate(`/oauth2client-${options.service_name}`, {
			successRedirect: loginUrl,
			failureRedirect: loginFailureUrl,
			failureFlash: `Invalid ${options.service_name} authentication credentials username or password.`
		})(req, res, next);
	};
}; 

/**
 * login controller
 * @module authController
 * @{@link https://github.com/typesettin/periodic}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @requires module:passport
 * @requires module:path
 * @requires module:passport-local
 * @requires module:passport-facebook
 * @requires module:fs-extra
 * @requires module:periodicjs.core.utilities
 * @requires module:periodicjs.core.controller
 * @requires module:periodicjs.core.extensions
 * @param  {object} resources variable injection from current periodic instance with references to the active logger and mongo session
 * @return {object}           sendmail
 */
var controller = function (resources) {
	logger = resources.logger;
	mongoose = resources.mongoose;
	appSettings = resources.settings;

	use_oauth_client();

	// var appenvironment = appSettings.application.environment;
	loginExtSettings = resources.app.controller.extension.login.loginExtSettings;
	passportController = resources.app.controller.extension.login.auth.passportController;
	passport = passportController.passport;
	authenticateUser = passportController.authenticateUser;

	return {
		oauth2callback:oauth2callback
	};
};

module.exports = controller;
