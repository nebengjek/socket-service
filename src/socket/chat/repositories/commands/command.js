const config = require('../../../../infra/configs/global_config');
const dbDynamo = require('../../../../helpers/databases/dynamodb/db');
const DBPREFIX =  config.get('/dynamoDB');

class Query {

  constructor(db) {
    this.dbMysql = db;
  }

  async saveConnections(connectionId) {
    const recordSet = await dbDynamo.findAll({
      TableName: `${DBPREFIX}_Connections`,
      Item: {
        ConnectionID: connectionId
      }
    });
    return recordSet;
  }

  async deleteConnections(connectionId) {
    const recordSet = await dbDynamo.deleteData({
      TableName: `${DBPREFIX}_Connections`,
      Key: {
        ConnectionID: connectionId
      }
    });
    return recordSet;
  }

  async deleteUser(userId,connectionId) {
    const recordSet = await dbDynamo.deleteData({
      TableName: `${DBPREFIX}_Users`,
      Key: {
        UserID: `${userId}`,
        ConnectionID: `${connectionId}`
      },
      ConditionExpression: '#34f60 = :34f60',
      ExpressionAttributeValues: {':34f60':`${userId}`},
      ExpressionAttributeNames: {'#34f60' : 'UserID'}
    });
    return recordSet;
  }

  async deleteRoomUser(userId,connectionId, roomId) {
    const recordSet = await dbDynamo.deleteData({
      TableName: `${DBPREFIX}_Room`,
      Key: {
        RoomID: `${roomId}`,
        ConnectionID: `${connectionId}`
      },
      ConditionExpression: '#34f60 = :34f60',
      ExpressionAttributeValues: {':34f60':`${userId}`},
      ExpressionAttributeNames: {'#34f60' : 'UserId'}
    });
    return recordSet;
  }

  async insertUser(userId,connectionId) {
    const recordSet = await dbDynamo.insertData({
      TableName: `${DBPREFIX}_Users`,
      Item: {
        UserID: `${userId}`,
        ConnectionID: `${connectionId}`
      },
    });
    return recordSet;
  }

  async insertRoomUser(userId,connectionId, roomId) {
    const recordSet = await dbDynamo.insertData({
      TableName: `${DBPREFIX}_Room`,
      Item: {
        RoomID: `${roomId}`,
        ConnectionID: `${connectionId}`,
        UserId: `${userId}`,
        Status: 'active'
      },
    });
    return recordSet;
  }

  async updateRoomUser(userId,connectionId, roomId) {
    const recordSet = await dbDynamo.updateData({
      TableName: `${DBPREFIX}_Room`,
      Key: {
        RoomID: `${roomId}`,
        ConnectionID: `${connectionId}`
      },
      UpdateExpression: 'SET #f67b0 = :f67b0',
      ConditionExpression: '#16bc1 = :16bc1',
      ExpressionAttributeValues: {':f67b0': 'inactive',':16bc1':userId},
      ExpressionAttributeNames: {
        '#f67b0': 'Status',
        '#16bc1': 'UserId'
      }
    });
    return recordSet;
  }
}

module.exports = Query;
