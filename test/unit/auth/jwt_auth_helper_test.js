const sinon = require('sinon');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const commonHelper = require('all-in-one');

const { ForbiddenError } = commonHelper.Error;
const wrapper = commonHelper.Wrapper;
const { generateToken, verifyToken, authSocket } = require('../../../src/auth/jwt_auth_helper');

describe('Token Helper', () => {
  let req;
  let res;
  let next;
  let socket;

  beforeEach(() => {
    socket = {
      handshake: {
        auth: {},
        query: {
          token:''
        }
      },
      emit: sinon.stub(),
      disconnect: sinon.stub()
    };
    req = {
      headers: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub()
    };
    next = sinon.stub();
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('generateToken', () => {
    it('should generate a token with the given payload', async () => {
      const payload = { user: 'user123' };
      const signStub = sinon.stub(jwt, 'sign').resolves('generatedToken');

      const token = await generateToken(payload);

      expect(token).to.equal('generatedToken');
      expect(signStub.calledOnceWithExactly(payload, sinon.match.string, sinon.match.object)).to.be.true;

      signStub.restore();
    });
  });

  describe('verifyToken', () => {
    it('should call next if token is valid', async () => {
      req.headers.authorization = 'Bearer validToken';
      const decodedToken = { metadata: { userId: 'user123' } };
      const verifyStub = sinon.stub(jwt, 'verify').returns(decodedToken);

      await verifyToken(req, res, next);

      expect(req.userMeta).to.deep.equal(decodedToken.metadata);
      expect(next.calledOnce).to.be.true;

      verifyStub.restore();
    });

    it('should return ForbiddenError if token is expired', async () => {
      req.headers.authorization = 'Bearer expiredToken';
      const verifyStub = sinon.stub(jwt, 'verify').throws(new jwt.TokenExpiredError());

      // Stub wrapper.response to simulate the behavior
      const wrapperResponseStub = sinon.stub(wrapper, 'response');

      // Call the function to test
      await verifyToken(req, res, next);

      // Assert that wrapper.response is called with the expected parameters
      expect(wrapperResponseStub.calledOnce).to.be.true;
      expect(wrapperResponseStub.calledWithExactly(res, 'fail',
        sinon.match({ err: sinon.match.instanceOf(ForbiddenError) }),
        'Access token expired!', sinon.match.number)).to.be.true;

      // Restore stubs
      verifyStub.restore();
      wrapperResponseStub.restore();
    });

    it('should return ForbiddenError if token is invalid', async () => {
      req.headers.authorization = 'InvalidToken';
      const verifyStub = sinon.stub(jwt, 'verify').throws(new jwt.JsonWebTokenError());

      const wrapperResponseStub = sinon.stub(wrapper, 'response');
      await verifyToken(req, res, next);

      expect(wrapperResponseStub.calledOnce).to.be.true;

      verifyStub.restore();
      wrapperResponseStub.restore();
    });


    it('should return ForbiddenError if authorization header is missing', async () => {
      const verifyStub = sinon.stub(jwt, 'verify');
      await verifyToken(req, res, next);

      verifyStub.restore();
    });
  });

  describe('authSocket', () => {
    it('should authenticate socket with valid token', async () => {
      const validToken = 'Bearer validToken';
      const decodedToken = { sub: 'user123',metadata: {mobileNumber:'+6281234567', mitra: true, _id: '12345'} };
      socket.handshake.auth.token = validToken;

      const verifyStub = sinon.stub(jwt, 'verify').returns(decodedToken);

      await authSocket(socket, next);

      expect(socket.userId).to.equal(decodedToken.sub);
      expect(verifyStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
    });

    it('should handle expired token', async () => {
      socket.handshake.auth.token = 'Bearer expiredToken';
      const error = new jwt.TokenExpiredError('Token expired');

      sinon.stub(jwt, 'verify').throws(error);

      await authSocket(socket, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('Authentication error: Invalid token');
    });

    it('should handle missing token', async () => {
      socket.handshake.auth.token = '';
      await authSocket(socket, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('Authentication error: Token is required');
    });

    it('should handle invalid token', async () => {
      socket.handshake.auth.token = 'InvalidToken';
      const error = new jwt.JsonWebTokenError('Invalid token');

      sinon.stub(jwt, 'verify').throws(error);

      await authSocket(socket, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('Authentication error: Invalid token');
    });

    it('should handle malformed token format', async () => {
      socket.handshake.auth.token = 'InvalidTokenFormat';

      await authSocket(socket, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.equal('Authentication error: Invalid token');
    });
  });
});
