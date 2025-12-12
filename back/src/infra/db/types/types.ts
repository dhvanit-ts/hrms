import mongoose, { ClientSession } from "mongoose";
export type DBClient = typeof mongoose;

export type DBTx = ClientSession;

export type DB = DBClient | DBTx;
