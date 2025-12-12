import mongodb from "mongodb";
import { DB, DBTx } from "./types";

export const isClientSession = (db: DB): db is DBTx => {
  return db && db instanceof mongodb.ClientSession;
};

export const getValidSession = (dbTx?: DB) => {
  return dbTx && isClientSession(dbTx) ? dbTx : null;
};
