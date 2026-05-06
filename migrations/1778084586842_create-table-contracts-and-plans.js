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
    pgm.createTable("contracts", {
        id: "id",
        contract_name: {
            type: "varchar(8)",
            notNull: true
        },
    });

    pgm.createTable("plans", {
        id: "id",
        plan_name: {
            type: "varchar(12)",
            notNull: true
        },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("contracts");
    pgm.dropTable("plans");
};
