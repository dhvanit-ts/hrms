import { CollegeAdapter } from "@/infra/db/adapters";
import { DB } from "@/infra/db/types";
import { cached } from "@/lib/cached";
import collegeCacheKeys from "./college.cache-keys";

const CollegeRepo = {
  CachedRead: {
    findById: (id: string, dbTx?: DB) =>
      cached(collegeCacheKeys.id(id), () => CollegeAdapter.findById(id, dbTx)),

    findByEmailDomain: (emailDomain: string, dbTx?: DB) =>
      cached(collegeCacheKeys.emailDomain(emailDomain), () => CollegeAdapter.findByEmailDomain(emailDomain, dbTx)),

    findAll: (filters?: { city?: string; state?: string }, dbTx?: DB) =>
      cached(collegeCacheKeys.all(filters), () => CollegeAdapter.findAll(filters, dbTx))
  },

  Read: {
    findById: (id: string, dbTx?: DB) => CollegeAdapter.findById(id, dbTx),

    findByEmailDomain: (emailDomain: string, dbTx?: DB) => CollegeAdapter.findByEmailDomain(emailDomain, dbTx),

    findAll: (filters?: { city?: string; state?: string }, dbTx?: DB) => CollegeAdapter.findAll(filters, dbTx)
  },

  Write: {
    create: CollegeAdapter.create,
    updateById: CollegeAdapter.updateById,
    deleteById: CollegeAdapter.deleteById
  }
}

export default CollegeRepo