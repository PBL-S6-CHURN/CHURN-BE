exports.up = (pgm) => {
    pgm.createTable("alerts", {
        id: { type: "serial", primaryKey: true },
        customer_id: { 
            type: "int",
            references: '"customers"', // Opsional: jika ingin relasi ke tabel customer
            onDelete: 'CASCADE'
        },
        type: { 
            type: "varchar(100)", 
            comment: 'Contoh: Low NPS, High Tickets, Late Payment' 
        },
        severity: { 
            type: "varchar(20)", 
            notNull: true,
            comment: 'low, medium, high'
        },
        message: { 
            type: "text", 
            notNull: true 
        },
        // Kolom ini penting untuk menyimpan snapshot data saat alert terjadi
        data: { 
            type: "jsonb" 
        },
        is_read: { 
            type: "boolean", 
            notNull: true, 
            default: false 
        },
        created_at: {
            type: "timestamp", 
            default: pgm.func("current_timestamp")
        },
    });

    pgm.addConstraint('alerts', 'alert_severity_check', {
      check: "severity IN ('low', 'medium', 'high')"
    });
};