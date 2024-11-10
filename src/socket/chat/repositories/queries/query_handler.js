const Mysql = require('../../../../helpers/databases/mysql/db');
const config = require('../../../../infra/configs/global_config');
const Chat = require('./domain');
const db = new Mysql(config.get('/mysqlConfig'));
const chat = new Chat(db);

const historyKlobers = async (data) => {
  const getData = async () => {
    const result = await chat.historyKlobers(data);
    return result;
  };
  const result = await getData();
  return result;
};

const notifMessageKlobers = async (data) => {
  const getData = async () => {
    const result = await chat.notifMessageKlobers(data);
    return result;
  };
  const result = await getData();
  return result;
};

const historyCorporates = async (data) => {
  const getData = async () => {
    const result = await chat.historyCorporates(data);
    return result;
  };
  const result = await getData();
  return result;
};

const notifMessageCorporates = async (data) => {
  const getData = async () => {
    const result = await chat.notifMessageCorporates(data);
    return result;
  };
  const result = await getData();
  return result;
};

module.exports = {
  historyKlobers,
  historyCorporates,
  notifMessageKlobers,
  notifMessageCorporates
};
