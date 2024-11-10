const validate = require('validate.js');
const Command = require('./command');
const Query = require('../queries/query');
const wrapper = require('../../../../helpers/utils/wrapper');
const { NotFoundError,InternalServerError } = require('../../../../helpers/error');
const config  = require('../../../../infra/configs/global_config');
const wsClient = require('../../../../helpers/components/aws-socket/client-socket');
class Chat {

  constructor(db) {
    this.query = new Query(db);
    this.command = new Command(db);
  }

  async connectionManager(payload) {
    const {event,userId} = payload;
    let result;
    switch (event.eventType) {
      case 'CONNECT':
        const postConnection = await this.command.saveConnections(event.connectionId);
        if (postConnection.err){
          await wsClient.send(event.connectionId, event,null,{
            event: "error",
            message: `Error, ${postConnection.err}`
          });
          return wrapper.error(new InternalServerError('Internal server error'));
        }
        await this.openConnections(userId,event.connectionId);
        result = {
          connectionId: event.connectionId,
          userId: userId,
          status: 'connected'
        };
        return wrapper.data(result, 'Connect successful.', 200);
      case 'DISCONNECT':
        const getRooms = this.query.getRoomConnections(event.connectionId);
        const rooms = getRooms.data.Items;
        console.log(getRooms);
        if (getRooms.Count > 0){
          const results = rooms.map(async room => {
            await this.command.updateRoomUser(userId,event.connectionId,room.RoomID);
          });
          await Promise.all(results);
        }
        await this.command.deleteConnections(event.connectionId);
        result = {
          connectionId: event.connectionId,
          userId: userId,
          status: 'Disconnected'
        };
        return wrapper.data(result, 'Disconnect successful.', 200);
      default:
        console.log(`Connection manager received unrecognized eventType ${event.requestContext.eventType}`);
        result = {
          connectionId: event.connectionId,
          userId: userId,
          status: 'Disconnected'
        };
        return wrapper.error(new InternalServerError(`Connection manager received unrecognized eventType ${event.requestContext.eventType}`));
    }
  }

  async openConnections(userId, connectionId) {
    const cekUsers = await this.query.getUser(userId);
    if (cekUsers.Count > 0){
      await this.command.deleteUser(userId,cekUsers.data.Items[0].ConnectionID);
      await this.command.insertUser(userId,cekUsers.data.Items[0].ConnectionID);
    }else{
      await this.command.insertUser(userId,connectionId);
    }
    //perbaruii connectionID semua room yg di subscribe by userId
    const getRooms = await this.query.getRoomUser(userId);
    const rooms = getRooms.data.Items;
    if (getRooms.Count >= 1){
      const results = rooms.map(async room => {
        await this.command.deleteRoomUser(userId,room.ConnectionID,room.RoomID);
        await this.command.insertRoomUser(userId,connectionId,room.RoomID);
      });
      await Promise.all(results);
    }
    //e:perbaruii connectionID semua room yg di subscribe by userId
    return wrapper.data(getRooms.data, 'success open connections', 200);
  }

}

module.exports = Chat;
