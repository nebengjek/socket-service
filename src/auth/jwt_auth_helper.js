const jwt = require('jsonwebtoken');
const commonHelper = require('all-in-one');

const config = require('../infra');

const jwtPrivateKey = String(config.get('/jwt/privateKey'));
const jwtPublicKey = String(config.get('/jwt/publicKey'));

const signOptions = {
  algorithm: config.get('/jwt/signOptions/algorithm'),
  audience: config.get('/jwt/signOptions/audience'),
  issuer: config.get('/jwt/signOptions/issuer'),
  expiresIn: config.get('/jwt/signOptions/expiresIn'),
};

const verifyOptions = {
  algorithms: [config.get('/jwt/verifyOptions/algorithm')],
  audience: config.get('/jwt/verifyOptions/audience'),
  issuer: config.get('/jwt/verifyOptions/issuer'),
};

const decodeKey = (secret) => Buffer.from(secret, 'base64').toString('ascii');

const generateToken = async (payload) => {
  const privateKey = decodeKey(jwtPrivateKey);
  return jwt.sign(payload, privateKey, signOptions);
};

const authSocket = async (socket, next) => {
  const publicKey = decodeKey(jwtPublicKey);
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    socket.emit('error', 'Authentication error: Token is required');
    return next(new Error('Authentication error: Token is required'));
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, publicKey, verifyOptions);
    socket.userId = decodedToken.sub;
    socket.driverId = decodedToken.metadata.mitra ? decodedToken.metadata._id : '';
    socket.mobileNumber = decodedToken.metadata.mobileNumber;
    next();
  } catch (error) {
    commonHelper.log(['error'],'JWT verification failed:', error);
    socket.emit('error', 'Authentication error: Invalid token');
    next(new Error('Authentication error: Invalid token'));
  }
};


module.exports = {
  generateToken,
  authSocket
};
