import dotenv from 'dotenv';
import sequelize from '../config/db.js';
import { User, TeachingContract, TeachingContractCourse, ContractItem } from '../model/index.js';

dotenv.config();

async function ensureContractItemsSchema() {
  // Ensure contract_items exists and has duties column referencing Teaching_Contracts
  const ensureTable = async (name, ddl) => {
    const [rows] = await sequelize.query(`SHOW TABLES LIKE '${name}'`);
    if (!rows.length) {
      console.log(`[schema] Creating table ${name}`);
      await sequelize.query(ddl);
    }
  };
  await ensureTable(
    'contract_items',
    `
    CREATE TABLE contract_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contract_id INT UNSIGNED NOT NULL,
      duties TEXT NOT NULL,
      CONSTRAINT fk_contract_items_contract FOREIGN KEY (contract_id) REFERENCES Teaching_Contracts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `
  );
  // Migrate item -> duties if needed
  const [colItem] = await sequelize.query("SHOW COLUMNS FROM `contract_items` LIKE 'item'");
  const [colDuties] = await sequelize.query("SHOW COLUMNS FROM `contract_items` LIKE 'duties'");
  if (colItem.length && !colDuties.length) {
    console.log('[schema] Renaming contract_items.item -> duties');
    await sequelize.query(
      'ALTER TABLE `contract_items` CHANGE COLUMN `item` `duties` TEXT NOT NULL'
    );
  }
  // Ensure FK points to Teaching_Contracts
  try {
    await sequelize.query(
      'ALTER TABLE `contract_items` DROP FOREIGN KEY `fk_contract_items_contract`'
    );
  } catch {}
  try {
    await sequelize.query(
      'ALTER TABLE `contract_items` ADD CONSTRAINT `fk_contract_items_contract` FOREIGN KEY (`contract_id`) REFERENCES `Teaching_Contracts`(`id`) ON DELETE CASCADE'
    );
  } catch {}
}

async function main() {
  await ensureContractItemsSchema();
  // Pick users
  let creator = await User.findOne();
  if (!creator) throw new Error('No users found in the database to use as creator/lecturer');
  let lecturer = await User.findOne({ where: {} });
  if (!lecturer) lecturer = creator;

  const academic_year = '2024-2025';
  const term = '1';
  const start_date = new Date().toISOString().slice(0, 10);
  const end_date = null;
  const items = ['Prepare syllabus', 'Teach 12 sessions', 'Grade assignments'];

  // Create contract
  const contract = await TeachingContract.create({
    lecturer_user_id: lecturer.id,
    academic_year,
    term,
    year_level: 'Year 2',
    start_date,
    end_date,
    created_by: creator.id,
    items, // JSON column also filled for backward-compat
  });

  // Add one course row (minimal required)
  await TeachingContractCourse.create({
    contract_id: contract.id,
    course_id: null,
    class_id: null,
    course_name: 'Sample Course',
    year_level: 'Year 2',
    term,
    academic_year,
    hours: 30,
  });

  // Persist duties relationally
  const rows = items.map((text) => ({ contract_id: contract.id, duties: text }));
  await ContractItem.bulkCreate(rows);

  console.log(`[seed] TeachingContract id=${contract.id} created with ${items.length} duties`);
}

main()
  .then(() => {
    console.log('[seed] done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[seed] failed:', err.message);
    process.exit(1);
  });
