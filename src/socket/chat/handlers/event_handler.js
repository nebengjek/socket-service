const validator = require('../../../helpers/utils/validator');
const commandHandler = require('../repositories/commands/command_handler');
const commandModel = require('../repositories/commands/command_model');
const wrapper = require('../../../helpers/utils/wrapper');
const { SUCCESS:http, ERROR:httpError} = require('../../../helpers/http-status/status_code');

const connectionManager = async (event, res) => {
  const payload = event.queryStringParameters;
  payload.event = event.requestContext;
  const validatePayload = validator.isValidPayload(payload, commandModel.connections);
  const getData = async (result) => {
    if (result.err) {
      return result;
    }
    return commandHandler.connectionManager(result.data);
  };
  const result = await getData(validatePayload);
  if (result.err){
    return {
      statusCode: 500,
      body: result.err
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(result.data)
  };
};

const defaultMessage = async (event, res) => {
  return {
    statusCode: 400,
    body: 'Unrecognized WebSocket action.'
  }
};

module.exports = {
  connectionManager,
  defaultMessage
};
