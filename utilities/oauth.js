'use strict';
const periodic = require('periodicjs');
const logger = periodic.logger;
const selectedUserAuthToken = {};
const clientAuthToken = {};
const passportExtSettings = periodic.settings.extensions['periodicjs.ext.passport'];
const passportLocals = periodic.locals.extensions.get('periodicjs.ext.passport');
const passport = passportLocals.passport;
const authenticateUser = passportLocals.auth.authenticateUser;

/**
 * oauth callback
 * @param  {object} options	pass a service name for the name spaced passport authentication oauth callback
 * @return {Function} returns the express middleware for the oauth callback
 */
function oauth2callback(options) {
  return function(req, res, next) {
    const { service_name, } = options;
    const entitytype = req.session.passport.user.entitytype || 'user';
    const redirectURL = (entitytype === 'account') ? passportExtSettings.redirect.account.logged_in_homepage : passportExtSettings.redirect.user.logged_in_homepage;
    const loginEntityURL = (entitytype === 'account') ? passportLocals.paths.account_auth_login : passportLocals.paths.user_auth_login;
    const loginUrl = (req.session.return_url) ?
      req.session.return_url :
      redirectURL;
    const loginFailureUrl = (req.session.return_url) ?
      req.session.return_url :
      loginEntityURL + '?return_url=' + req.session.return_url;
    // console.log({ entitytype, redirectURL, loginEntityURL, loginUrl, loginFailureUrl }, 'req.session', req.session, 'req.user', req.user);
    passport.authenticate(`oauth2client-${service_name}`, {
      successRedirect: loginUrl,
      failureRedirect: loginFailureUrl,
      failureFlash: `Invalid ${service_name} authentication credentials username or password.`,
    })(req, res, next);
  };
}


/**
 * set controller data auth header, for making authenticated API requests later
 * @param  {object} options	pass the client configuration from the login extension settings
 * @return {Function} returns the express middleware for the oauth callback
 */
function user_auth_request(options) {
  return function(req, res, next) {
    const { client, } = options;
    const service_name = client.service_name;
    req.controllerData = req.controllerData || {};
    // console.log('user_auth_request', { selectedUserAuthToken, client });
    if (!client.user_email) {
      next();
    } else if (selectedUserAuthToken[service_name] &&
      selectedUserAuthToken[service_name].extensionattributes &&
      selectedUserAuthToken[service_name].extensionattributes.passport[`oauth2client_${service_name}`] &&
      selectedUserAuthToken[service_name].extensionattributes.passport[`oauth2client_${service_name}`].accesstoken) {
      req.controllerData.authorization_header = 'Bearer ' + selectedUserAuthToken[service_name].extensionattributes.passport[`oauth2client_${service_name}`].accesstoken;
      next();
    } else {
      const coreDataModel = passportLocals.auth.getAuthCoreDataModel({ entitytype: client.user_entity_type });

      coreDataModel.load({
          query: { email: client.user_email, },
        })
        .then(user => {
          // console.log({ user });
          selectedUserAuthToken[service_name] = user;
          if (user) {
            req.controllerData.authorization_header = 'Bearer ' + selectedUserAuthToken[service_name].extensionattributes.passport[`oauth2client_${service_name}`].accesstoken;
          }
          // console.log('req.controllerData.authorization_header', req.controllerData.authorization_header);
          next();
        })
        .catch(next);
    }
  };
}


/**
 * set controller data auth header, for making authenticated API requests later
 * @param  {object} options	pass the client configuration from the login extension settings
 * @return {Function} returns the express middleware for the oauth callback
 */
function client_auth_request(options) {
  const { client, } = options;
  return function(req, res, next) {
    if (!clientAuthToken[client.service_name]) {
      clientAuthToken[client.service_name] = new Buffer(client.client_token_id + ':' + client.client_secret).toString('base64');
    }
    req.controllerData = req.controllerData || {};
    req.controllerData.authorization_header = 'Basic ' + clientAuthToken[client.service_name];
    next();
  };
}

function get_auth_tokens() {
  // console.log('get_auth_tokens', { selectedUserAuthToken });
  return {
    users: selectedUserAuthToken,
    clients: clientAuthToken,
  };
}

function getProfileFromAccessToken(options) {
  const { accessToken, } = options;
  return {
    email: accessToken.user_email,
    username: accessToken.user_username,
    entitytype: accessToken.user_entity_type,
    id: accessToken.user_id,
    _id: accessToken.user_id,
  };
}

function oauthLoginVerifyCallback(options) {
  const { oauth2client_settings, } = options;
  return function __passport_oauthLoginVerifyCallback(req, accessToken, refreshToken, profile, done) {
    // logger.silly('oauth2client req:',req); 	
    logger.silly('oauth2client accessToken:', accessToken);
    logger.silly('oauth2client refreshToken:', refreshToken);
    logger.silly('oauth2client profile:', profile);

    const oauth2clientdata = (profile && typeof profile === 'object' && Object.keys(profile).length) ? profile : getProfileFromAccessToken({ accessToken, });
    const accessTokenToSave = (typeof accessToken === 'string') ? accessToken : accessToken.value;
    // console.log('oauth2clientdata', oauth2clientdata);
    // console.log('accessTokenToSave', accessTokenToSave);
    const findsocialaccountquery = {
      [`attributes.oauth2client_${oauth2client_settings.service_name}.user_id`]: oauth2clientdata.id,
    };
    const socialaccountattributes = {
      [`oauth2client_${oauth2client_settings.service_name}`]: {
        user_id: oauth2clientdata.id,
        username: oauth2clientdata.username,
        entitytype: oauth2clientdata.entitytype,
        accesstoken: accessTokenToSave,
        refreshtoken: refreshToken,
        accesstokenupdated: new Date(),
      },
    };
    const existingUserQuery = {
      $or: [
        { email: oauth2clientdata.email, },
        {
          [`oauth2client_${oauth2client_settings.service_name}.user_id`]: oauth2clientdata.id,
        },
      ],
    };
    req.query.entitytype = oauth2clientdata.entitytype;
    authenticateUser({
      req,
      existingUserQuery,
      existingUserCallback: function(existingUser) {
        const coreDataModel = passportLocals.auth.getAuthCoreDataModel(existingUser);
        // logger.silly(`existingUser from oauth2client-${oauth2client_settings.service_name} passport`);
        existingUser.extensionattributes = existingUser.extensionattributes || {};
        existingUser.extensionattributes.passport = Object.assign({}, existingUser.extensionattributes.passport, socialaccountattributes);
        coreDataModel.update({
            depopulate: false,
            updatedoc: existingUser,
          })
          .then(updatedUser => {
            // console.log({ updatedUser });
            return done(null, updatedUser);
          })
          .catch(done);
      },
      nonusercallback: function() {
        linkSocialAccount({
          donecallback: done,
          linkaccountservice: `oauth2client-${oauth2client_settings.service_name}`,
          requestobj: { user: oauth2clientdata, },
          findsocialaccountquery: findsocialaccountquery,
          socialaccountattributes: socialaccountattributes,
          newaccountdata: {
            email: oauth2clientdata.username + `@oauth2client-${oauth2client_settings.service_name}.account.com`,
            username: oauth2clientdata.username,
            activated: true,
            accounttype: 'social-sign-in',
          },
        });
      },
      doneCallback: done,
    });
  };
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