
const commonHelper = require('all-in-one');
const haversine = require('haversine');
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
    const key = `PASSANGER:PICKUP:${data.metadata.driverId}`;
    const offerPassanger = await this.redisClient.getData(key);
    if(!_.isEmpty(offerPassanger.data)){
      const offerData = JSON.parse(offerPassanger.data)
      global.io.to(data.socketId).emit('pickup-passanger', {routeSummary:offerData.routeSummary, passangerId: offerData.passangerId});
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
  
  async tripTracker(data) {
    try {
      const {latitude, longitude, orderId} = data;
      const {driverId} = data.metadata;
      const currentLocation = { latitude, longitude };
      const redisKey = `order:${orderId}:driver:${driverId}`;
      const prevLocationData = await this.redisClient.getData(redisKey);
      let distance = 0;
      if (!_.isEmpty(prevLocationData.data)) {
        const prevLocation = JSON.parse(prevLocationData.data).data;
        distance = haversine(prevLocation, currentLocation, { unit: 'km' });
      }
  
      const updatedDistance = await this.redisClient.hincrbyfloat(`order:${orderId}:distance`, driverId, distance);
      if(updatedDistance.error){
        return wrapper.error(updatedDistance.error);
      }
      const distanceUpdate = parseFloat(updatedDistance.data);
      await this.redisClient.setDataEx(redisKey, currentLocation,60);
      const dataDistance = {
        driverId,
        distance:distanceUpdate.toFixed(2)
      }
      await this.redisClient.setData(`trip:${orderId}`, dataDistance);
      return wrapper.data(distanceUpdate.toFixed(2)); 
    } catch (error) {
      return wrapper.error(error);
    }

  }
  
  async broadcastPickupPassanger(data) {
    if(global.io.sockets.sockets.has(data.socketId)){
      global.io.to(data.socketId).emit('pickup-passanger', {routeSummary:data.routeSummary, passangerId: data.passangerId});
    }else{
      const key = `PASSANGER:PICKUP:${data.driverId}`;
      await this.redisClient.setDataEx(key,data,300);
    }
    return wrapper.data();
  }

}

module.exports = Driver;
