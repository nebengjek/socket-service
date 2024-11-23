const sinon = require('sinon');
const { expect } = require('chai');
const commonHelper = require('all-in-one');
const ConsumerManager = require('../../../../../src/helpers/events/kafka/manager');
const { initConsumers } = require('../../../../../src/modules/driver/handlers/event_handler');
const project = require('../../../../../package.json');

// src/modules/driver/handlers/event_handler.test.js

describe('Event Handler - initConsumers', () => {
  let consumerStub;
  let logStub;

  beforeEach(() => {
    consumerStub = {
      subscribe: sinon.stub().resolves(),
      run: sinon.stub().resolves()
    };
    sinon.stub(ConsumerManager, 'getInstance').returns(consumerStub);
    logStub = sinon.stub(commonHelper, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should initialize consumers successfully', async () => {
    await initConsumers();

    expect(ConsumerManager.getInstance.calledOnceWith(project.name)).to.be.true;
    expect(consumerStub.subscribe.calledOnceWith('broadcast-pickup-passanger')).to.be.true;
    expect(consumerStub.run.calledOnce).to.be.true;
    expect(logStub.calledWith(['INFO', 'event_controller'], 'All consumers initialized successfully')).to.be.true;
  });

  it('should log error if consumer initialization fails', async () => {
    const error = new Error('Initialization failed');
    consumerStub.subscribe.rejects(error);

    await initConsumers();

    expect(ConsumerManager.getInstance.calledOnceWith(project.name)).to.be.true;
    expect(consumerStub.subscribe.calledOnceWith('broadcast-pickup-passanger')).to.be.true;
    expect(logStub.calledWith(['ERROR', 'event_controller'], `Error initializing consumers: ${error.message}`)).to.be.true;
  });
});
