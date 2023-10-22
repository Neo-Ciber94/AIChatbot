import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

export const sqliteDatabase = new Database("./data/my_data.db");

export const db: BetterSQLite3Database = drizzle(sqliteDatabase);
