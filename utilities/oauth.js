'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const selectedUserAuthToken = {};
const clientAuthToken = {};
const passportExtSettings = periodic.settings.extensions['periodicjs.ext.passport'];
const authenticateUser = periodic.locals.extensions.get('periodicjs.ext.passport').auth.authenticateUser;

/**
 * oauth callback
 * @param  {object} options	pass a service name for the name spaced passport authentication oauth callback
 * @return {Function} returns the express middleware for the oauth callback
 */
function oauth2callback(options) {
  return function(req, res, next) {
    const { service_name } = options;
    // console.log('req.body',req.body)
    // console.log('req.query',req.query)
    // console.log('req.headers',req.headers)
    // passportExtSettings
    // p.settings.extensions['periodicjs.ext.passport'].redirect.user.logged_in_homepage
    // $p.locals.extensions.get('periodicjs.ext.passport').paths.user_auth_login
    const loginUrl = (req.session.return_url) ?
      req.session.return_url :
      passportExtSettings.redirect.user.logged_in_homepage;
    const loginFailureUrl = (req.session.return_url) ?
      req.session.return_url :
      passportExtSettings.paths.user_auth_login + '?return_url=' + req.session.return_url;
    // console.log({ loginUrl, loginFailureUrl },'req.session',req.session);
    passport.authenticate(`oauth2client-${service_name}`, {
      successRedirect: loginUrl,
      failureRedirect: loginFailureUrl,
      failureFlash: `Invalid ${service_name} authentication credentials username or password.`
    })(req, res, next);
  };
};


/**
 * set controller data auth header, for making authenticated API requests later
 * @param  {object} options	pass the client configuration from the login extension settings
 * @return {Function} returns the express middleware for the oauth callback
 */
function user_auth_request(options) {
  return function(req, res, next) {
    const { client } = options;
    const service_name = client.service_name;
    req.controllerData = req.controllerData || {};
    if (!client.user_email) {
      next();
    } else if (selectedUserAuthToken[service_name] &&
      selectedUserAuthToken[service_name].attributes &&
      selectedUserAuthToken[service_name].attributes[`oauth2client_${service_name}`] &&
      selectedUserAuthToken[service_name].attributes[`oauth2client_${service_name}`].accesstoken) {
      req.controllerData.authorization_header = 'Bearer ' + selectedUserAuthToken[service_name].attributes[`oauth2client_${service_name}`].accesstoken;
      next();
    } else {
      var UserModelToQuery,
        userModelToUse = client.user_entity_type || 'user';
      UserModelToQuery = mongoose.model(capitalize(userModelToUse));
      UserModelToQuery.findOne({ email: client.user_email }, function(err, user) {
        selectedUserAuthToken[service_name] = user;
        if (user) {
          req.controllerData.authorization_header = 'Bearer ' + selectedUserAuthToken[service_name].attributes[`oauth2client_${service_name}`].accesstoken;
        }
        next();
      });
    }
  };
};


/**
 * set controller data auth header, for making authenticated API requests later
 * @param  {object} options	pass the client configuration from the login extension settings
 * @return {Function} returns the express middleware for the oauth callback
 */
function client_auth_request(options) {
  return function(req, res, next) {
    const { client } = options;
    if (!clientAuthToken[client.service_name]) {
      clientAuthToken[client.service_name] = new Buffer(client.client_token_id + ':' + client.client_secret).toString('base64');
    }
    req.controllerData = req.controllerData || {};
    req.controllerData.authorization_header = 'Basic ' + clientAuthToken[client.service_name];
    next();
  };
};

function get_auth_tokens() {
  return {
    users: selectedUserAuthToken,
    clients: clientAuthToken
  };
};

function getProfileFromAccessToken(options) {
  const { accessToken } = options;
  return {
    email: accessToken.user_email,
    username: accessToken.user_username,
    id: accessToken.user_id,
    _id: accessToken.user_id
  };
}

function oauthLoginVerifyCallback(req, accessToken, refreshToken, profile, done) {
  // logger.silly('oauth2client req:',req); 	
  logger.silly('oauth2client accessToken:', accessToken);
  logger.silly('oauth2client refreshToken:', refreshToken);
  logger.silly('oauth2client profile:', profile);

  const oauth2clientdata = (profile && typeof profile === 'object' && Object.keys(profile).length) ? profile : getProfileFromAccessToken({ accessToken });
  const accessTokenToSave = (typeof accessToken === 'string') ? accessToken : accessToken.value;
  // console.log('oauth2clientdata',oauth2clientdata);
  // console.log('accessTokenToSave',accessTokenToSave);
  const findsocialaccountquery = {
    [`attributes.oauth2client_${oauth2client_settings.service_name}.user_id`]: oauth2clientdata.id,
  };
  const socialaccountattributes = {
    [`oauth2client_${oauth2client_settings.service_name}`]: {
      user_id: oauth2clientdata.id,
      username: oauth2clientdata.username,
      accesstoken: accessTokenToSave,
      refreshtoken: refreshToken,
      accesstokenupdated: new Date(),
    }
  };
  const exitinguserquery = {
    $or: [
      { email: oauth2clientdata.email },
      {
        [`oauth2client_${oauth2client_settings.service_name}.user_id`]: oauth2clientdata.id },
    ]
  };

  authenticateUser({
    req,
    exitinguserquery,
    existinusercallback: function(existingUser) {
      logger.silly(`existingUser from oauth2client-${oauth2client_settings.service_name} passport`);
      existingUser.attributes = merge(existingUser.attributes, socialaccountattributes);
      existingUser.markModified('attributes');
      existingUser.save(function(err) {
        return done(err, existingUser);
      });
    },
    nonusercallback: function() {
      linkSocialAccount({
        donecallback: done,
        linkaccountservice: `oauth2client-${oauth2client_settings.service_name}`,
        requestobj: { user: oauth2clientdata },
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
}

module.exports = {
  selectedUserAuthToken,
  clientAuthToken,
  oauth2callback,
  user_auth_request,
  client_auth_request,
  get_auth_tokens,
  getProfileFromAccessToken,
  oauthLoginVerifyCallback,
};