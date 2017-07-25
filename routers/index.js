'use strict';

const periodic = require('periodicjs');
const extensionRouter = periodic.express.Router();
const authRouter = require('./auth');

extensionRouter.use('/auth', authRouter);

module.exports = extensionRouter;