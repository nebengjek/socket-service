
const Driver = require('./domain');
const Mongo = require('../../../../helpers/databases/mongodb/db');
const config = require('../../../../infra');

const db = new Mongo(config.get('/mongoDbUrl'));
const driver = new Driver(db);

const locationUpdate = async (data) => {
  const getData = async () => {
    const result = await driver.locationUpdate(data);
    return result;
  };
  const result = await getData();
  return result;
};

const broadcastPickupPassanger = async (data) => {
  const postData = async (pyld) => {
    const result = await driver.broadcastPickupPassanger(pyld);
    return result;
  };
  const result = await postData(data);
  return result;
};

module.exports = {
  locationUpdate,
  broadcastPickupPassanger
};
