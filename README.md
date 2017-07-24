# periodicjs.ext.oauth2client [![Coverage Status](https://coveralls.io/repos/github/githubUserOrgName/periodicjs.ext.oauth2client/badge.svg?branch=master)](https://coveralls.io/github/githubUserOrgName/periodicjs.ext.oauth2client?branch=master) [![Build Status](https://travis-ci.org/githubUserOrgName/periodicjs.ext.oauth2client.svg?branch=master)](https://travis-ci.org/githubUserOrgName/periodicjs.ext.oauth2client)

A simple extension.

[API Documentation](https://github.com/githubUserOrgName/periodicjs.ext.oauth2client/blob/master/doc/api.md)

## Usage

### CLI TASK

You can preform a task via CLI
```
$ cd path/to/application/root
### Using the CLI
$ periodicjs ext periodicjs.ext.oauth2client hello  
### Calling Manually
$ node index.js --cli --command --ext --name=periodicjs.ext.oauth2client --task=hello 
```

## Configuration

You can configure periodicjs.ext.oauth2client


## Configure

Add an array of OAUTH 2 services in your login extension's passport settings.

e.g. Login Extension `content/config/extensions/periodicjs.ext.passport/settings.json` configuration:
```json
	{
      "passport":{
				"oauth":{
					"facebook":{
						"appid": "NEEDFBAPPID",
						"appsecret": "NEEDFBAPPSECRET",
						"callbackurl": "http://local.getperiodic.com:8786/auth/facebook/callback",
						"scope":["email", "publish_actions", "offline_access", "user_status", "user_likes", "user_checkins", "user_about_me", "read_stream"]
					},
					"oauth2client":[{
						"client_token_id": "a51f14a3dccf5a57b10947265f4bff14",
						"client_secret": "547d3e64c1183b6a0d3fac5005c97f67",
						"authorization_url":"https://my-oauth2-service.com/api/oauth2/authorize",
						"token_url":"https://my-oauth2-service.com/api/oauth2/token",
						"service_name":"my_oauth2_service",
						"scope":["all-access"]
					}]
				}
			}
	}
```

### Default Configuration
```javascript
{
  settings: {
    defaults: true,
  },
  databases: {
  },
};
```


## Installation

### Installing the Extension

Install like any other extension, run `npm run install periodicjs.ext.oauth2client` from your periodic application root directory and then normally you would run `periodicjs addExtension periodicjs.ext.oauth2client`, but this extension does this in the post install npm script.
```
$ cd path/to/application/root
$ npm run install periodicjs.ext.oauth2client
$ periodicjs addExtension periodicjs.ext.oauth2client //this extension does this in the post install script
```
### Uninstalling the Extension

Run `npm run uninstall periodicjs.ext.oauth2client` from your periodic application root directory and then normally you would run `periodicjs removeExtension periodicjs.ext.oauth2client` but this extension handles this in the npm post uninstall script.
```
$ cd path/to/application/root
$ npm run uninstall periodicjs.ext.oauth2client
$ periodicjs removeExtension periodicjs.ext.oauth2client // this is handled in the npm postinstall script
```


## Testing
*Make sure you have grunt installed*
```
$ npm install -g grunt-cli
```

Then run grunt test or npm test
```
$ grunt test && grunt coveralls #or locally $ npm test
```
For generating documentation
```
$ grunt doc
$ jsdoc2md commands/**/*.js config/**/*.js controllers/**/*.js  transforms/**/*.js utilities/**/*.js index.js > doc/api.md
```
## Notes
* Check out https://github.com/typesettin/periodicjs for the full Periodic Documentation