const dotenv = require('dotenv');
dotenv.config();

const { DB_USER, DB_PASSWORD, HOST, DB_PORT, DB_NAME } = process.env;

module.exports = {
  url: `mongodb://${DB_USER}:${DB_PASSWORD}@${HOST}:${DB_PORT}/${DB_NAME}`,
};
