const Mysql = require('../../../../helpers/databases/mysql/db');
const config = require('../../../../infra/configs/global_config');
const Chat = require('./domain');
const db = new Mysql(config.get('/mysqlConfig'));
const chat = new Chat(db);

const connectionManager = async (data) => {
  const getData = async () => {
    const result = await chat.connectionManager(data);
    return result;
  };
  const result = await getData();
  return result;
};

module.exports = {
  connectionManager
};
