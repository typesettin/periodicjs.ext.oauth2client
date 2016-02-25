'use strict';

var OAuth2Strategy = require('passport-oauth2').Strategy,
	merge = require('utils-merge'),
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

/**
 * sets a name spaced passport authentication strategy based on the service name in the array of oauth clients, if the user exists, it will link the account, if the user is signed in, it will associate accounts, if the user doesnt exist it will recreate a new account
 */
var use_oauth_client = function(){
	if (loginExtSettings && loginExtSettings.passport && loginExtSettings.passport.oauth.oauth2client && Array.isArray(loginExtSettings.passport.oauth.oauth2client) && loginExtSettings.passport.oauth.oauth2client.length>0) {
		loginExtSettings.passport.oauth.oauth2client.forEach(function(oauth2client_settings){
			passport.use(`oauth2client-${oauth2client_settings.service_name}`, new OAuth2Strategy({
				clientID: oauth2client_settings.client_token_id,
				clientSecret: oauth2client_settings.client_secret,
				callbackURL: oauth2client_settings.callback_url || `/auth/oauth2client-${oauth2client_settings.service_name}/callback`,
		    authorizationURL: oauth2client_settings.authorization_url,
		    tokenURL: oauth2client_settings.token_url
			},
			function ( accessToken, refreshToken, profile, done) {
				// logger.silly('oauth2client req:',req); 	
				logger.silly('oauth2client accessToken:',accessToken); 
				logger.silly('oauth2client refreshToken:',refreshToken);
				logger.silly('oauth2client profile:', profile);

				var oauth2clientdata =(profile && typeof profile ==='object' && Object.keys(profile).length>0)? profile : {
					email: accessToken.user_email,
					username: accessToken.user_username,
					id: accessToken.user_id,
					_id: accessToken.user_id
				};
				var accessTokenToSave = (typeof accessToken==='string')? accessToken : accessToken.value;
				// console.log('oauth2clientdata',oauth2clientdata);
				// console.log('accessTokenToSave',accessTokenToSave);
				var findsocialaccountquery={};
				var socialaccountattributes = {};
				var exitinguserquery={
					$or:[]
				};

				findsocialaccountquery[`attributes.oauth2client_${oauth2client_settings.service_name}.user_id`] = oauth2clientdata.id;
				socialaccountattributes[`oauth2client_${oauth2client_settings.service_name}`] = {
					user_id : oauth2clientdata.id,
					username : oauth2clientdata.username,
					accesstoken: accessTokenToSave,
					refreshtoken : refreshToken,
					accesstokenupdated : new Date()
				};

				exitinguserquery.$or.push({email: oauth2clientdata.email});
				var exitinguserquery_userid_query = {};
				exitinguserquery_userid_query[`oauth2client_${oauth2client_settings.service_name}.user_id`] = oauth2clientdata.id;
				exitinguserquery.$or.push(exitinguserquery_userid_query);
				authenticateUser({
					exitinguserquery:exitinguserquery,
					existinusercallback: function (existingUser) {
						logger.silly(`existingUser from oauth2client-${oauth2client_settings.service_name} passport`, existingUser);
						existingUser.attributes = merge(existingUser.attributes, socialaccountattributes);
						existingUser.markModified('attributes');
						existingUser.save(function(err){
							return done(err, existingUser);
						});
					},
					nonusercallback: function () {
						linkSocialAccount({
							donecallback: done,
							linkaccountservice: `oauth2client-${oauth2client_settings.service_name}`,
							requestobj: {user:oauth2clientdata},
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
 * oauth callback
 * @param  {object} options	pass a service name for the name spaced passport authentication oauth callback
 * @return {Function} returns the express middleware for the oauth callback
 */
var oauth2callback = function(options){
	return function (req, res, next) {
		// console.log('req.body',req.body)
		// console.log('req.query',req.query)
		// console.log('req.headers',req.headers)
		var loginUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoggedInHomepage;
		var loginFailureUrl = (req.session.return_url) ? req.session.return_url : loginExtSettings.settings.authLoginPath + '?return_url=' + req.session.return_url;
		passport.authenticate(`oauth2client-${options.service_name}`, {
			successRedirect: loginUrl,
			failureRedirect: loginFailureUrl,
			failureFlash: `Invalid ${options.service_name} authentication credentials username or password.`
		})(req, res, next);
	};
}; 

/**
 * oauth2client login controller
 * @module oauthController
 * @{@link https://github.com/typesettin/periodic}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2016 Typesettin. All rights reserved.
 * @license MIT
 * @requires module:passport-oatuh2
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

	// var appenvironment = appSettings.application.environment;
	loginExtSettings = resources.app.controller.extension.login.loginExtSettings;
	passportController = resources.app.controller.extension.login.auth.passportController;
	passport = passportController.passport;
	authenticateUser = passportController.authenticateUser;
	linkSocialAccount = passportController.linkSocialAccount;

	use_oauth_client();

	return {
		oauth2callback:oauth2callback
	};
};

module.exports = controller;
