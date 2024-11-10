const validate = require('validate.js');
const Query = require('./query');
const wrapper = require('../../../../helpers/utils/wrapper');
const { NotFoundError } = require('../../../../helpers/error');
const config  = require('../../../../infra/configs/global_config');
const files = config.get('/files');
class Chat {

  constructor(db) {
    this.query = new Query(db);
  }

  async historyKlobers(payload) {
    const {userId} = payload;
    const getListRoom = await this.query.getRoomByUser(userId);
    if (getListRoom.err) {
      return wrapper.error(new NotFoundError('Error'));
    }
    let corporates = [];
    let similar = '';
    if (getListRoom.data.Count > 0){
      const results = getListRoom.data.Items.map(async item => {
        if (similar !== item.RoomID)
        {
          const getListUnreadMessage = await this.query.getUnreadMessages({userId, roomId: item.RoomID});
          if (getListUnreadMessage.err) {
            return wrapper.error(new NotFoundError('Error'));
          }
          similar = item.RoomID;
          let corp = item.RoomID.split('|');
          let getCorporate = await this.query.queryMysql(`SELECT * FROM mco01 where corporate_id = '${corp[0]}'`);
          let getUser = await this.query.queryMysql(`SELECT * FROM mus01 where user_id = '${userId}'`);
          let lastName = validate.isEmpty(getUser.data[0].last_name) ? '' : ' '+getUser.data[0].last_name;
          let fullname = getUser.data[0].first_name+lastName;
          corporates.push({
            user: fullname,
            roomId: item.RoomID,
            userId: item.UserId,
            chatName: getCorporate.data[0].name,
            avatar: getCorporate.data[0].corporate_logo,
            messages: getListUnreadMessage.Count
          });
        }
      });
      await Promise.all(results);
    }
    return wrapper.data(corporates, 'History chat klobers', 200);
  }

  async notifMessageKlobers(payload) {
    const {userId} = payload;
    const getListUnreadMessage = await this.query.getUnreadMessagesByUserId({userId});
    if (getListUnreadMessage.err) {
      return wrapper.error(new NotFoundError('Error'));
    }
    return wrapper.data({newMessage:getListUnreadMessage.data.Count}, 'notification chat klobers', 200);
  }

  async historyCorporates(payload) {
    const {corporateId} = payload;
    const getListRoom = await this.query.getUnreadMessagesCorporates({corporateId});
    if (getListRoom.err) {
      return wrapper.error(new NotFoundError('Error'));
    }
    let corporates = [];
    if (getListRoom.data.Count > 0){
      const results = getListRoom.data.Items.map(async item => {
        let getUser = item.RoomID.split('|');
        let userKlobers = getUser[1];
        if (userKlobers === item.UserId){
          const getListUnreadMessage = await this.query.getUnreadMessages({userId:userKlobers, roomId: item.RoomID});
          if (getListUnreadMessage.err) {
            return wrapper.error(new NotFoundError('Error'));
          }
          let corp = item.RoomID.split('|');
          if (corp[1] === item.UserId){
            let getCorporate = await this.query.queryMysql(`SELECT * FROM mco01 where corporate_id = '${corp[0]}'`);
            let getUser = await this.query.queryMysql(`SELECT * FROM mus01 where user_id = '${item.UserId}'`);
            let lastName = validate.isEmpty(getUser[0].last_name) ? '' : ' '+getUser[0].last_name;
            let fullname = getUser[0].first_name+lastName;
            corporates.push({
              corporate: getCorporate[0].name,
              roomId: item.RoomID,
              userId: item.UserId,
              chatName: fullname,
              avatar: `${files}`+getUser[0].profile_picture_url,
              messages: getListUnreadMessage.Count
            });
          }
        }
      });
      await Promise.all(results);
    }
    return wrapper.data(corporates, 'History chat corporates', 200);
  }

  async notifMessageCorporates(payload) {
    const {userId,corporateId} = payload;
    const getListUnreadMessageKlob = await this.query.getUnreadMessagesByUserId({userId});
    if (getListUnreadMessageKlob.err) {
      return wrapper.error(new NotFoundError('Error'));
    }
    const counterAsKlobbers = getListUnreadMessageKlob.data.Count;
    let counterCorp = [];
    const getAllCorpId = corporateId.split(',');
    let counterCorpB = 0;
    const loopCorp = getAllCorpId.map( async corporated =>{
      let getCorporate = await this.query.queryMysql(`SELECT * FROM mco01 where corporate_id = '${corporated}'`);
      const getListRoom = await this.query.getRoomByCorp(corporated);
      let countC=0;
      if (getListRoom.data.Count === 0){
        counterCorp.push({
          roomId: corporated,
          corporates: getCorporate.data[0].name,
          messages: countC
        });
      }else if (getListRoom.data.Count >= 1){
        const results = getListRoom.data.Items.map(async item => {
          let getUser = item.RoomID.split('|');
          let userKlobers = getUser[1];
          if (userKlobers === item.UserId) {
            const getUnreadMessageCorporates = await this.query.getUnreadMessagesCorporatesByUserId({roomId:item.RoomID, userId:userKlobers});
            countC += getUnreadMessageCorporates.data.Count;
          }
        });
        await Promise.all(results);
        counterCorp.push({
          roomId: corporated,
          corporates: getCorporate.data[0].name,
          messages: countC
        });
      }
      counterCorpB += countC;
    });
    await Promise.all(loopCorp);
    const result = {
      klobbers: counterAsKlobbers,
      corporates: counterCorp,
      counter: counterCorpB + counterAsKlobbers
    };
    return wrapper.data(result, 'notification chat klobers', 200);
  }

}

module.exports = Chat;
