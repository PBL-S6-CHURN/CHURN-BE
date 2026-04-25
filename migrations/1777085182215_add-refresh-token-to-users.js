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
    pgm.addColumn("users", {
        refresh_token: {
            type: "TEXT",
            unique: true,
            nullable: true,
        },
        refresh_token_expires_at: {
            type: "TIMESTAMP",
            nullable: true,
        }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */

exports.down = (pgm) => {
    pgm.dropColumns("users", ["refresh_token", "refresh_token_expires_at"]);
};
