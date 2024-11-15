const events = require('events');
events.EventEmitter.defaultMaxListeners = 20;
const apm = require('elastic-apm-node');
const commonHelper = require('all-in-one');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const config = require('../infra');
const mongoConnectionPooling = require('../helpers/databases/mongodb/connection');
const mongoConfig = config.get('/mongoDbUrl');
const routes = require('../routes');
const jwtAuth = require('../auth/jwt_auth_helper');
const observer = require('./observers');
class AppServer {

  constructor() {
    this.init();
  }

  async init() {
    const app = express();
    this.server = http.createServer(app);
    mongoConnectionPooling.init(mongoConfig);
    
    const io = new Server(this.server, {
      cors: {
        origin: '*',
      }
    });

    io.use(jwtAuth.authSocket);
    io.engine.use(helmet());
    io.use((socket, next) => {
      const logEvent = (eventName, data) => {
        const message = `${eventName} - ${JSON.stringify(data)}`;
        const clientIp = socket.handshake.address;
        const meta = {
          'service.name': process.env.SERVICE_NAME,
          'service.version': process.env.VERSION,
          'log.logger': 'socketio',
          tags: ['audit-log'],
          'event.name': eventName,
          'client.address': clientIp,
          'client.ip': clientIp,
          'user.id': socket.userId || '',
          'user.roles': socket.role ? [socket.role] : undefined,
          'event.data': data ? JSON.stringify(data) : '',
          'event.duration': 0,
          'http.response.date': new Date().toISOString(),
        };
    
        const obj = {
          context: 'service-info',
          scope: 'audit-log',
          message: message,
          meta: meta,
          ...apm.currentTraceIds,
        };
        
        commonHelper.log('Info',obj);
      };
      socket.onAny((eventName, ...args) => {
        logEvent(eventName, args);
      });
      next();
    });

    const onConnection = (socket) => {
      commonHelper.log(['Info'], `Socket connected: ${socket.id}, userId: ${socket.userId}, driverId: ${socket.driverId}`);
      routes(socket);
    };
    global.io = io;
    io.on("connection", onConnection);
    observer.init();
  }
}

module.exports = AppServer;
