import mongoose from "mongoose";

const globalMongoose = globalThis.__mongooseCache || {
  conn: null,
  promise: null,
};

globalThis.__mongooseCache = globalMongoose;

export const closeMongo = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  globalMongoose.conn = null;
  globalMongoose.promise = null;
};

export const connectToDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI. Set it in the environment before starting the API.");
  }

  if (globalMongoose.conn) {
    return globalMongoose.conn;
  }

  if (!globalMongoose.promise) {
    globalMongoose.promise = mongoose.connect(mongoUri).then((connection) => connection);
  }

  try {
    globalMongoose.conn = await globalMongoose.promise;
  } catch (error) {
    globalMongoose.promise = null;
    throw error;
  }

  return globalMongoose.conn;
};
