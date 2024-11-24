const { Kafka,logLevel } = require('kafkajs');
const moment = require('moment');
const timestamp = moment().local();
const config = require('../../../infra');
const commonHelper = require('all-in-one');
const kafkaConfig = config.get('/kafka');

const kafka = new Kafka({
  clientId: kafkaConfig.kafkaClientId,
  brokers: [kafkaConfig.kafkaHost],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: kafkaConfig.kafkaSaslUsername,
    password: kafkaConfig.kafkaSaslPassword
  },
  logLevel: logLevel.INFO
});
const ctx = 'kafka-producer';

const producer = kafka.producer();
producer.on('producer.connect', () => {
  /* istanbul ignore next */
  commonHelper.log(['INFO','producer.connect'], 'Kafka Producer is connected and ready.');
});

producer.on('producer.disconnect', () => {
  /* istanbul ignore next */
  commonHelper.log(['EROOR','producer.disconnect'], 'Kafka Producer could not connect');
});
producer.on('producer.network.request_timeout', (payload) => {
  /* istanbul ignore next */
  commonHelper.log(['EROOR','producer.network.request_timeout'], `Kafka Producer request timeout ${payload.clientId}`);
});

const kafkaSendProducerAsync = async (data) => {
  await producer.connect();
  const { topic, body } = data;
  const buffer = new Buffer.from(JSON.stringify(body));
  const record = {
    topic: data.topic,
    messages: [
      {
        value: buffer,
      },
    ],
  };
  /* istanbul ignore next */
  try {
    await producer.send(record);
    commonHelper.log(['INFO','kafkaSendProducerAsync'], `Kafka Send data to ${topic}`);
  } catch (err) {
    commonHelper.log(['ERROR','kafkaSendProducerAsync'], `Kafka producer-error-send ${err}`);
  }
};

module.exports = {
  kafkaSendProducerAsync
};
