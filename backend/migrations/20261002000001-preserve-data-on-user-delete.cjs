"use strict";

const sql = `
  DO $$
  DECLARE relation record;
  BEGIN
    FOR relation IN
      SELECT n.nspname AS schema_name, t.relname AS table_name,
             c.conname AS constraint_name, a.attname AS column_name
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = c.conkey[1]
      WHERE c.contype = 'f'
        AND c.confrelid = to_regclass(format('%I.users', current_schema()))
        AND n.nspname = current_schema()
        AND cardinality(c.conkey) = 1
    LOOP
      EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I DROP NOT NULL',
        relation.schema_name, relation.table_name, relation.column_name);
      EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
        relation.schema_name, relation.table_name, relation.constraint_name);
      EXECUTE format(
        'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.users(id_user) ON UPDATE CASCADE ON DELETE SET NULL',
        relation.schema_name, relation.table_name, relation.constraint_name,
        relation.column_name, relation.schema_name);
    END LOOP;
  END $$;
`;

module.exports = {
  sql,
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(sql, { transaction });
    });
  },
  async down() {
    throw new Error("Relasi aman tidak dapat dikembalikan ke CASCADE karena berisiko menghapus data pengguna.");
  },
};
