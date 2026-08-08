const dotenv = require('dotenv');
const dns = require('dns');
dotenv.config();

const configuredDns = dns.getServers();
const onlyLoopback = configuredDns.every(
  (s) => s === '127.0.0.1' || s === '::1',
);
if (onlyLoopback) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const { MONGODB_URI, DB_USER, DB_PASSWORD, HOST, DB_PORT, DB_NAME } = process.env;

module.exports = {
  url:
    MONGODB_URI ||
    `mongodb://${DB_USER}:${DB_PASSWORD}@${HOST}:${DB_PORT}/${DB_NAME}`,
};
