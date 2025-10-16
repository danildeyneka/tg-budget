import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as unknown as {
  mongoDb?: MongoClient
}

export const mongoDb = globalForMongo.mongoDb ?? new MongoClient(process.env.MONGODB_URI!)

if (process.env.NODE_ENV !== 'production') {
  globalForMongo.mongoDb = mongoDb
}
