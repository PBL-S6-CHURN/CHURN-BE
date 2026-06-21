/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
    pgm.alterColumn("predicts", "risk_score", {
        type: "float",
        notNull: true, // sesuaikan dengan constraint lama Anda
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
    pgm.alterColumn("predicts", "risk_score", {
        type: "int",
        notNull: true,
    });
};