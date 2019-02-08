'use strict';
const periodic = require('periodicjs');
const capitalize = require('capitalize');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const passport = periodic.locals.extensions.get('periodicjs.ext.passport').passport;
const passportExtSettings = periodic.settings.extensions['periodicjs.ext.passport'];
const passportExtOAuth2Clients = passportExtSettings.oauth.oauth2client;
const utilities = require('./utilities');
const oauth2clientExtConfig = periodic.extensions.get('periodicjs.ext.oauth2client');
const logger = periodic.logger;

module.exports = () => {
  return new Promise((resolve, reject) => {
    try {
      /**
       * sets a name spaced passport authentication strategy based on the service name in the array of oauth clients, if the user exists, it will link the account, if the user is signed in, it will associate accounts, if the user doesnt exist it will recreate a new account
       */
      oauth2clientExtConfig.periodic_config = {
        periodicjs_ext_admin: {
          ['OAuth2 Logins']: [],
        },
      };

      passportExtOAuth2Clients.forEach(oauth2client_settings => {
        passport.use(`oauth2client-${oauth2client_settings.service_name}`, new OAuth2Strategy({
          passReqToCallback: true,
          clientID: oauth2client_settings.client_token_id,
          clientSecret: oauth2client_settings.client_secret,
          callbackURL: oauth2client_settings.callback_url || `/auth/oauth2client-${oauth2client_settings.service_name}/callback`,
          authorizationURL: oauth2client_settings.authorization_url,
          tokenURL: oauth2client_settings.token_url,
        }, utilities.oauth.oauthLoginVerifyCallback({ oauth2client_settings, })));
        oauth2clientExtConfig.periodic_config.periodicjs_ext_admin['OAuth2 Logins'].push({
          link: `/auth/oauth2client-${oauth2client_settings.service_name}`,
          title: `${capitalize(oauth2client_settings.service_name)} login`,
        });
      });
      // console.log({ oauth2clientExtConfig });

      periodic.status.on('configuration-complete', () => {
        const clients = periodic.settings.extensions[ 'periodicjs.ext.passport' ].oauth.oauth2client;
        utilities.oauth.create_client_auth_headers({ clients })
          .then(() => {
            logger.silly('initialized client auth headers');
          })
          .catch(logger.error);
      });

      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
};