
const commonHelper = require('all-in-one');
const Query = require('../queries/query');
const Command = require('./command');
const Redis = require('../../../../helpers/databases/redis/redis');
const { NotFoundError, UnauthorizedError, ConflictError } = commonHelper.Error;
const wrapper = commonHelper.Wrapper;
const _ = require('lodash');
const config = require('../../../../infra');
const producer = require('../../../../helpers/events/kafka/producer');
const REDIS_CLIENT_CONFIGURATION = config.get('/redis');

class Driver {

  constructor(db){
    this.command = new Command(db);
    this.query = new Query(db);
    this.redisClient = new Redis(REDIS_CLIENT_CONFIGURATION);
  }

  async locationUpdate(data) {
    // check is driver idle 
    const keyStatusDriver = `DRIVER:PICKING-PASSANGER:${data.metadata.driverId}`;
    const statusDriver = await this.redisClient.getData(keyStatusDriver);
    if(!_.isEmpty(statusDriver.data)){
      return wrapper.error(new ConflictError({message:'driver picking passanger',data:statusDriver.data,code:4001}))
    }
    const dataToKafka = {
      topic: 'driver-available',
      body: {
        ...data,
        available:true
      }
    };
    await producer.kafkaSendProducerAsync(dataToKafka);
    const geoaddlocation = await this.redisClient.addDriverLocation(data.metadata.driverId,data.latitude,data.longitude);
    return wrapper.data(geoaddlocation);
  }

}

module.exports = Driver;
