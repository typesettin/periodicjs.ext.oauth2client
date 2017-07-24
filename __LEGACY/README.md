# periodicjs.ext.oauth2client
An extension that connects to an OAuth 2 Server using passport-oauth2 and saves the access token to the user's extension attributes

 [API Documentation](https://github.com/typesettin/periodicjs.ext.oauth2client/blob/master/doc/api.md)

## Installation

```
$ npm install periodicjs.ext.oauth2client
```


## Configure

Add an array of OAUTH 2 services in your login extension's passport settings.

e.g. Login Extension `content/config/extensions/periodicjs.ext.login/settings.json` configuration:
```json
	{
		"development":{
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
	}
```


##Development
*Make sure you have grunt installed*
```
$ npm install -g grunt-cli
```

Then run grunt watch
```
$ grunt watch
```
For generating documentation
```
$ grunt doc
$ jsdoc2md controller/**/*.js index.js install.js uninstall.js > doc/api.md
```
##Notes
* Check out https://github.com/typesettin/periodicjs for the full Periodic Documentation