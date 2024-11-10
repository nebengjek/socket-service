const config = require('../../../../infra/configs/global_config');
const dbDynamo = require('../../../../helpers/databases/dynamodb/db');
const DBPREFIX =  config.get('/dynamoDB');

class Query {

  constructor(db) {
    this.dbMysql = db;
  }

  async getUser(userId) {
    const recordSet = await dbDynamo.findAll({
      TableName: `${DBPREFIX}_Users`,
      KeyConditionExpression: 'UserID = :userId',
      ExpressionAttributeValues: {':userId':`${userId}`},
      Limit: 1,
      ScanIndexForward: false
    });
    return recordSet;
  }

  async getRoomConnections(connectionId) {
    const recordSet = await dbDynamo.findAll({
      TableName: `${DBPREFIX}_Room`,
      ConsistentRead: false,
      FilterExpression: '#d24e0 = :d24e0',
      ExpressionAttributeValues: {
        ':d24e0': `${connectionId}`
      },
      ExpressionAttributeNames: {
        '#d24e0': 'ConnectionID'
      }
    });
    return recordSet;
  }

  async getRoomUser(userId) {
    const recordSet = await dbDynamo.findAll({
      TableName: `${DBPREFIX}_Room`,
      ConsistentRead: false,
      FilterExpression: '#d24e0 = :d24e0',
      ExpressionAttributeValues: {
        ':d24e0': `${userId}`
      },
      ExpressionAttributeNames: {
        '#d24e0': 'UserId'
      }
    });
    return recordSet;
  }
}

module.exports = Query;
