import { CollegeAdapter } from "@/infra/db/adapters"
import { colleges } from "@/infra/db/tables"
import { DB } from "@/infra/db/types"
import { cached } from "@/lib/cached"

const keys = {
    id: (id: string) => `college:id:${id}`,
    email: (email: string) => `college:email:${email}`,
    multiId: (...ids: string[]) => `college:ids:${ids.join(",")}`,
};

export const createCollege = (values: typeof colleges.$inferInsert, dbTx?: DB) => CollegeAdapter.create(values, dbTx)

export const getById = (id: string, dbTx?: DB) => cached(keys.id(id), () => CollegeAdapter.findById(id, dbTx))

export const getByEmail = (email: string, dbTx?: DB) => cached(keys.email(email), () => CollegeAdapter.findByEmail(email, dbTx))