const commonHelper = require('all-in-one');
const commandHandler = require('../repositories/commands/command_handler');
const commandModel = require('../repositories/commands/command_model');
const wrapper = commonHelper.Wrapper;
const { ERROR:httpError, SUCCESS:http } = commonHelper;

const locationUpdate = async (data, callback) => {
  const payload = data;
  const validatePayload = commonHelper.isValidPayload(payload, commandModel.locationUpdate);
  const postRequest = async (result) => {
    return result.err ? result : commandHandler.locationUpdate(result.data);
  };
  const result = await postRequest(validatePayload);
  if (result.err){
    callback({
      success: false,
      message: 'upddate location failed.',
      statusCode: result.err.code || 500,
      body: result.err
    });
  }
  callback({
    success: true,
    message: 'Location received and processed.',
    statusCode: 200,
    body: 'ok'
  });
};

module.exports = {
  locationUpdate,
};
