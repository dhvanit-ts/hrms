import db from ".";

export type DBClient = typeof db;
export type DBTx = Parameters<typeof db.transaction>[0] extends (
  arg: infer T
) => unknown
  ? T
  : never;

export type DB = DBClient | DBTx;
