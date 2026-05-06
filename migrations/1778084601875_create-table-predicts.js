/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
// export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.createTable("predicts", {
        id: "id",
        customer_id: {
            type: "int",
            notNull: true,
            references: '"customers"(id)',
            onDelete: "CASCADE",
        },
        risk: {
            type: "varchar(10)",
            notNull: true
        },
        score: {
            type: "int",
            notNull: true
        },
        cause: {
            type: "TEXT",
            notNull: true
        },
        solution: {
            type: "TEXT",
            notNull: true
        },
        created_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
        updated_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("predicts");
};
