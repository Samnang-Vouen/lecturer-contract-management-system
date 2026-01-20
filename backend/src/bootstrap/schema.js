// Schema bootstrapping moved from server.js for single-responsibility startup

export async function runSchemaBootstrapping(sequelize) {
  // Ensure Course_Mappings has dual theory/lab columns (non-destructive add-if-missing)
  try {
    const table = 'Course_Mappings';
    const addIfMissing = async (col, ddl) => {
      const [rows] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${col}'`);
      if (!rows.length) {
        console.log(`[schema] Adding missing column ${table}.${col}`);
        await sequelize.query(ddl);
      }
    };
    await addIfMissing(
      'theory_hours',
      'ALTER TABLE `Course_Mappings` ADD COLUMN `theory_hours` VARCHAR(10) NULL AFTER `type_hours`'
    );
    await addIfMissing(
      'theory_groups',
      'ALTER TABLE `Course_Mappings` ADD COLUMN `theory_groups` INT NULL DEFAULT 0 AFTER `theory_hours`'
    );
    await addIfMissing(
      'lab_hours',
      'ALTER TABLE `Course_Mappings` ADD COLUMN `lab_hours` VARCHAR(10) NULL AFTER `theory_groups`'
    );
    await addIfMissing(
      'lab_groups',
      'ALTER TABLE `Course_Mappings` ADD COLUMN `lab_groups` INT NULL DEFAULT 0 AFTER `lab_hours`'
    );
    await addIfMissing(
      'theory_15h_combined',
      'ALTER TABLE `Course_Mappings` ADD COLUMN `theory_15h_combined` TINYINT(1) NULL DEFAULT 0 AFTER `theory_groups`'
    );
  } catch (e) {
    console.warn('[schema] ensure Course_Mappings theory/lab columns failed:', e.message);
  }

  // Ensure new columns exist on legacy Teaching_Contracts table
  async function ensureTeachingContractColumns() {
    try {
      const table = 'Teaching_Contracts';
      const addIfMissing = async (col, ddl) => {
        const [rows] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${col}'`);
        if (!rows.length) {
          console.log(`[schema] Adding missing column ${table}.${col}`);
          await sequelize.query(ddl);
        }
      };
      // Period columns used by UI Period display
      await addIfMissing(
        'start_date',
        'ALTER TABLE `Teaching_Contracts` ADD COLUMN `start_date` DATE NULL AFTER `year_level`'
      );
      await addIfMissing(
        'end_date',
        'ALTER TABLE `Teaching_Contracts` ADD COLUMN `end_date` DATE NULL AFTER `start_date`'
      );
      await addIfMissing(
        'lecturer_signature_path',
        'ALTER TABLE `Teaching_Contracts` ADD COLUMN `lecturer_signature_path` VARCHAR(512) NULL AFTER `status`'
      );
      await addIfMissing(
        'management_signature_path',
        'ALTER TABLE `Teaching_Contracts` ADD COLUMN `management_signature_path` VARCHAR(512) NULL AFTER `lecturer_signature_path`'
      );
      await addIfMissing(
        'lecturer_signed_at',
        'ALTER TABLE `Teaching_Contracts` ADD COLUMN `lecturer_signed_at` DATETIME NULL AFTER `management_signature_path`'
      );
      await addIfMissing(
        'management_signed_at',
        'ALTER TABLE `Teaching_Contracts` ADD COLUMN `management_signed_at` DATETIME NULL AFTER `lecturer_signed_at`'
      );
      await addIfMissing(
        'pdf_path',
        'ALTER TABLE `Teaching_Contracts` ADD COLUMN `pdf_path` VARCHAR(512) NULL AFTER `management_signed_at`'
      );
      await addIfMissing(
        'items',
        'ALTER TABLE `Teaching_Contracts` ADD COLUMN `items` TEXT NULL AFTER `pdf_path`'
      );

      // Migrate legacy statuses to new WAITING_* values and update ENUM
      try {
        const [rows] = await sequelize.query(
          "SHOW COLUMNS FROM `Teaching_Contracts` LIKE 'status'"
        );
        const type = rows?.[0]?.Type || '';
        if (/enum\(/i.test(type)) {
          // Map legacy to new prior to altering enum
          console.log('[schema] Harmonizing Teaching_Contracts.status values');
          try {
            await sequelize.query(
              "UPDATE `Teaching_Contracts` SET `status`='WAITING_LECTURER' WHERE `status`='DRAFT'"
            );
          } catch {}
          try {
            await sequelize.query(
              "UPDATE `Teaching_Contracts` SET `status`='WAITING_MANAGEMENT' WHERE `status`='LECTURER_SIGNED'"
            );
          } catch {}
          try {
            await sequelize.query(
              "UPDATE `Teaching_Contracts` SET `status`='WAITING_LECTURER' WHERE `status`='MANAGEMENT_SIGNED'"
            );
          } catch {}
          // Now ensure enum is the new triplet
          await sequelize.query(
            "ALTER TABLE `Teaching_Contracts` MODIFY COLUMN `status` ENUM('WAITING_LECTURER','WAITING_MANAGEMENT','COMPLETED') NOT NULL DEFAULT 'WAITING_LECTURER'"
          );
        }
      } catch (e) {
        console.warn('[schema] migrate Teaching_Contracts.status failed:', e.message);
      }
    } catch (e) {
      console.error('[schema] ensureTeachingContractColumns failed:', e.message);
    }
  }
  await ensureTeachingContractColumns();

  // Ensure lecturer_profiles has title & gender columns (non-destructive add-if-missing)
  try {
    const table = 'lecturer_profiles';
    const addIfMissing = async (col, ddl) => {
      const [rows] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${col}'`);
      if (!rows.length) {
        console.log(`[schema] Adding missing column ${table}.${col}`);
        await sequelize.query(ddl);
      }
    };
    await addIfMissing(
      'title',
      "ALTER TABLE `lecturer_profiles` ADD COLUMN `title` ENUM('Mr','Ms','Mrs','Dr','Prof') NULL AFTER `employee_id`"
    );
    await addIfMissing(
      'gender',
      "ALTER TABLE `lecturer_profiles` ADD COLUMN `gender` ENUM('male','female','other') NULL AFTER `title`"
    );
  } catch (e) {
    console.warn('[schema] ensure lecturer_profiles title/gender failed:', e.message);
  }

  // Ensure contract_items table exists and is aligned with Teaching_Contracts (store Duties)
  try {
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

    // If table exists from older deployment, migrate column and FK
    try {
      const [colItem] = await sequelize.query("SHOW COLUMNS FROM `contract_items` LIKE 'item'");
      const [colDuties] = await sequelize.query("SHOW COLUMNS FROM `contract_items` LIKE 'duties'");
      if (colItem.length && !colDuties.length) {
        console.log('[schema] Renaming contract_items.item -> duties');
        await sequelize.query(
          'ALTER TABLE `contract_items` CHANGE COLUMN `item` `duties` TEXT NOT NULL'
        );
      }
    } catch (e) {
      console.warn('[schema] migrate contract_items item->duties failed:', e.message);
    }

    // Ensure FK references Teaching_Contracts (drop legacy FKs)
    try {
      const [fks] = await sequelize.query(`
          SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
          FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'contract_items'
            AND COLUMN_NAME = 'contract_id'
            AND REFERENCED_TABLE_NAME IS NOT NULL;
        `);
      for (const fk of fks) {
        const name = fk.CONSTRAINT_NAME;
        const ref = (fk.REFERENCED_TABLE_NAME || '').toString();
        if (ref.toLowerCase() !== 'teaching_contracts') {
          console.log(
            `[schema] Dropping legacy FK ${name} on contract_items.contract_id -> ${ref}`
          );
          try {
            await sequelize.query(`ALTER TABLE \`contract_items\` DROP FOREIGN KEY \`${name}\``);
          } catch (e) {
            console.warn(`[schema] drop FK ${name} failed:`, e.message);
          }
        }
      }
      const [fkConstraints] = await sequelize.query(`
          SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contract_items' AND CONSTRAINT_TYPE = 'FOREIGN KEY';
        `);
      for (const row of fkConstraints) {
        const name = row.CONSTRAINT_NAME;
        console.log(`[schema] Dropping FK ${name} on contract_items (safety cleanup)`);
        try {
          await sequelize.query(`ALTER TABLE \`contract_items\` DROP FOREIGN KEY \`${name}\``);
        } catch (e) {
          console.warn(`[schema] drop FK ${name} failed:`, e.message);
        }
      }
    } catch (e) {
      console.warn('[schema] inspect contract_items FKs failed:', e.message);
    }
    try {
      await sequelize.query(
        'ALTER TABLE `contract_items` DROP FOREIGN KEY `contract_items_ibfk_1`'
      );
    } catch {}
    try {
      await sequelize.query(
        'ALTER TABLE `contract_items` DROP FOREIGN KEY `contract_items_ibfk_2`'
      );
    } catch {}
    try {
      await sequelize.query(
        'ALTER TABLE `contract_items` DROP FOREIGN KEY `fk_contract_items_contract`'
      );
    } catch {}
    try {
      await sequelize.query(
        'ALTER TABLE `contract_items` DROP FOREIGN KEY `fk_contract_items_teaching_contracts`'
      );
    } catch {}
    try {
      await sequelize.query(
        'ALTER TABLE `contract_items` ADD CONSTRAINT `fk_contract_items_teaching_contracts` FOREIGN KEY (`contract_id`) REFERENCES `Teaching_Contracts`(`id`) ON DELETE CASCADE'
      );
    } catch (e) {
      console.warn('[schema] ensure contract_items FK to Teaching_Contracts failed:', e.message);
    }
  } catch (e) {
    console.warn('[schema] ensure contract_items table failed:', e.message);
  }

  // Ensure Candidates.status enum includes 'done' (attempt auto-alter for MySQL)
  try {
    const [rows] = await sequelize.query("SHOW COLUMNS FROM `Candidates` LIKE 'status'");
    const type = rows?.[0]?.Type || '';
    if (type && !/done/.test(type)) {
      console.log('[schema] Candidates.status missing value done; attempting to alter enum');
      await sequelize.query(
        "ALTER TABLE `Candidates` MODIFY COLUMN `status` ENUM('pending','interview','discussion','accepted','rejected','done') NOT NULL DEFAULT 'pending'"
      );
      console.log('[schema] Candidates.status enum altered to include done');
    }
  } catch (e) {
    console.warn('[schema] check Candidates.status failed:', e.message);
  }
}
