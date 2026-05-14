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
    pgm.createTable("customers", {
        id: "id",
        customer_id: {
            type: "varchar(10)",
            notNull: true
        },
        plan_id: {
            type: "int",
            references: '"plans"(id)',
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
        },
        contract_id: {
            type: "int",
            references: '"contracts"(id)',
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
        },
        last_login_days_ago: {
            type: "int",
            default: 0
        },
        feature_adoption_pct: {
            type: "float",
            default: 0
        },
        support_ticket_last_90d: {
            type: "int",
            default: 0
        },
        tenure_months: {
            type: "int",
            default: 0
        },
        monthly_usage_hrs: {
            type: "float",
            default: 0
        },
        nps_score: {
            type: "float",
            default: 0
        },
        payment_delay_count: {
            type: "int",
            default: 0
        },
        created_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("current_timestamp"),
        }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable("customers");
};
