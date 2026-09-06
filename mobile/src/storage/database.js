/**
 * SQLite Database Manager for Store Manager Mobile App.
 * Manages local SQLite connection, table schema creation, and database queries.
 * Compatible with react-native-sqlite-storage on Android and standard SQLite adapters.
 */

const DB_NAME = 'gkwhizwheel_staff.db';

let activeDbInstance = null;
let customDriver = null;

/**
 * Configure a custom SQLite driver (useful for tests or alternate platforms).
 * @param {object} driver
 */
export function setDatabaseDriver(driver) {
    customDriver = driver;
    activeDbInstance = null;
}

/**
 * Get or open the SQLite database instance.
 */
export async function getDatabase() {
    if (activeDbInstance) {
        return activeDbInstance;
    }

    if (customDriver) {
        activeDbInstance = await customDriver.open(DB_NAME);
        return activeDbInstance;
    }

    // Try react-native-sqlite-storage for React Native runtime
    try {
        const SQLite = require('react-native-sqlite-storage');
        SQLite.enablePromise(true);
        activeDbInstance = await SQLite.openDatabase({
            name: DB_NAME,
            location: 'default',
        });
        return activeDbInstance;
    } catch (err) {
        // Fallback for Node environment if node:sqlite is available
        try {
            const { DatabaseSync } = require('node:sqlite');
            const syncDb = new DatabaseSync(DB_NAME === ':memory:' ? ':memory:' : `./${DB_NAME}`);
            activeDbInstance = {
                executeSql: async (sql, params = []) => {
                    const cleanSql = sql.trim();
                    if (cleanSql.toUpperCase().startsWith('SELECT') || cleanSql.toUpperCase().startsWith('PRAGMA')) {
                        const stmt = syncDb.prepare(sql);
                        const rows = stmt.all(...params);
                        return [{
                            rows: {
                                length: rows.length,
                                item: (i) => rows[i],
                                raw: () => rows,
                            },
                        }];
                    } else {
                        const stmt = syncDb.prepare(sql);
                        const info = stmt.run(...params);
                        return [{
                            insertId: Number(info.lastInsertRowid),
                            rowsAffected: info.changes,
                            rows: { length: 0, item: () => null, raw: () => [] },
                        }];
                    }
                },
                close: async () => syncDb.close(),
            };
            return activeDbInstance;
        } catch {
            throw new Error(`Failed to initialize SQLite database: ${err.message}`);
        }
    }
}

/**
 * Execute a parameterized SQL statement against the active database.
 * @param {string} sql
 * @param {any[]} params
 * @returns {Promise<{ rows: any[], insertId?: number, rowsAffected?: number }>}
 */
export async function executeSql(sql, params = []) {
    const db = await getDatabase();

    // Standard react-native-sqlite-storage format returns [results]
    const results = await db.executeSql(sql, params);
    const result = Array.isArray(results) ? results[0] : results;

    const rows = [];
    if (result && result.rows) {
        if (typeof result.rows.raw === 'function') {
            rows.push(...result.rows.raw());
        } else if (typeof result.rows.item === 'function') {
            for (let i = 0; i < result.rows.length; i++) {
                rows.push(result.rows.item(i));
            }
        } else if (Array.isArray(result.rows)) {
            rows.push(...result.rows);
        }
    }

    return {
        rows,
        insertId: result?.insertId,
        rowsAffected: result?.rowsAffected ?? 0,
    };
}

/**
 * Initialize SQLite database tables and indexes for offline operations.
 */
export async function initDatabase() {
    await getDatabase();

    // 1. Create offline_actions table
    await executeSql(`
        CREATE TABLE IF NOT EXISTS offline_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idempotency_key TEXT UNIQUE NOT NULL,
            action_type TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            method TEXT NOT NULL DEFAULT 'POST',
            payload TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            retry_count INTEGER NOT NULL DEFAULT 0,
            error_message TEXT,
            created_at TEXT NOT NULL,
            synced_at TEXT
        );
    `);

    // 2. Create indexes for fast pending queue drain and status checks
    await executeSql(`
        CREATE INDEX IF NOT EXISTS idx_offline_actions_status
        ON offline_actions(status);
    `);

    await executeSql(`
        CREATE INDEX IF NOT EXISTS idx_offline_actions_created_at
        ON offline_actions(created_at);
    `);

    return true;
}

export default {
    getDatabase,
    setDatabaseDriver,
    executeSql,
    initDatabase,
};
