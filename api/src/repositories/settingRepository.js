const db = require('../models');
const { serialize } = require('./repositoryUtils');

const Setting = db.settings;
const fields = ['key', 'site', 'email', 'stripe', 'updatedBy'];

const serializeSettings = (doc) => {
  const base = serialize(doc, fields, { preserveObjects: ['site', 'email', 'stripe'] });
  return base;
};

exports.getGlobal = async () => {
  const doc = await Setting.findOne({ key: 'global' }).lean();
  return serializeSettings(doc);
};

exports.upsertGlobal = async (data, userId) => {
  const doc = await Setting.findOneAndUpdate(
    { key: 'global' },
    { $set: { ...data, updatedBy: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return serializeSettings(doc);
};
