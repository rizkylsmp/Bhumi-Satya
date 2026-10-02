"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
        UPDATE users SET role = 'admin';
        ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin';
        ALTER TABLE users ALTER COLUMN role SET NOT NULL;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_admin_role_only;
        ALTER TABLE users ADD CONSTRAINT users_admin_role_only CHECK (role::text = 'admin');
      `, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_admin_role_only');
  },
};
