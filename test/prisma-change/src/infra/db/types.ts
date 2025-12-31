import prisma from "@/infra/db";

export type DBClient = typeof prisma;

export type DBTx = Parameters<typeof prisma.$transaction>[0] extends (
  arg: infer T
) => any
  ? T
  : never;

export type DB = DBClient | DBTx;
