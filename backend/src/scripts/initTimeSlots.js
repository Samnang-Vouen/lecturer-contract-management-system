/**
 * Time Slots Initialization Script
 *
 * This script ensures all required time slots are present in the database.
 * Run this once to set up or verify time slots for the schedule availability feature.
 *
 * Usage:
 *   node src/scripts/initTimeSlots.js
 */

import { TimeSlot } from '../model/timeSlot.model.js';
import sequelize from '../config/db.js';

const TIME_SLOTS = [
  { label: '07h:45-08h:00', order_index: 0 }, // National Anthem
  { label: '08h:00-09h:30', order_index: 1 }, // Session 1 (S1)
  { label: '09h:30-09h:50', order_index: 2 }, // Break
  { label: '09h:50-11h:30', order_index: 3 }, // Session 2 (S2)
  { label: '11h:30-12h:10', order_index: 4 }, // Lunch Break
  { label: '12h:10-13h:40', order_index: 5 }, // Session 3 (S3)
  { label: '13h:40-13h:50', order_index: 6 }, // Break
  { label: '13h:50-15h:20', order_index: 7 }, // Session 4 (S4)
  { label: '15h:20-15h:30', order_index: 8 }, // Break
  { label: '15h:30-17h:00', order_index: 9 }, // Session 5 (S5)
];

async function initializeTimeSlots() {
  try {
    console.log('Initializing time slots...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established');

    // Sync TimeSlot model
    await TimeSlot.sync();
    console.log('TimeSlot table ready\n');

    let created = 0;
    let existing = 0;

    for (const slot of TIME_SLOTS) {
      const [isCreated] = await TimeSlot.findOrCreate({
        where: { label: slot.label },
        defaults: slot,
      });

      if (isCreated) {
        console.log(`Created: ${slot.label} (order: ${slot.order_index})`);
        created++;
      } else {
        console.log(`Exists: ${slot.label}`);
        existing++;
      }
    }

    console.log(`\nSummary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Existing: ${existing}`);
    console.log(`   Total: ${TIME_SLOTS.length}`);

    console.log('\nTime slots initialization completed successfully!');

    // Display session mapping
    console.log('\nSession Mapping:');
    console.log('   S1 → 08h:00-09h:30 (1.5 hours)');
    console.log('   S2 → 09h:50-11h:30 (1.5 hours)');
    console.log('   S3 → 12h:10-13h:40 (1.5 hours)');
    console.log('   S4 → 13h:50-15h:20 (1.5 hours)');
    console.log('   S5 → 15h:30-17h:00 (1.5 hours)');
  } catch (error) {
    console.error('\nError initializing time slots:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\nDatabase connection closed');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeTimeSlots();
}

export { initializeTimeSlots, TIME_SLOTS };
