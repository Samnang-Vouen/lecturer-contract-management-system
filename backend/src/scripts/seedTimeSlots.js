import { TimeSlot } from '../model/timeSlot.model.js';

const timeSlotsData = [
  { label: '07h:45-08h:00', order_index: 1 },
  { label: '08h:00-09h:30', order_index: 2 },
  { label: '09h:30-09h:50', order_index: 3 },
  { label: '09h:50-11h:30', order_index: 4 },
  { label: '11h:30-12h:10', order_index: 5 },
  { label: '12h:10-13h:40', order_index: 6 },
  { label: '13h:40-13h:50', order_index: 7 },
  { label: '13h:50-15h:20', order_index: 8 },
  { label: '15h:20-15h:30', order_index: 9 },
  { label: '15h:30-17h:00', order_index: 10 },
  // Add more time slots here
];

export const seedTimeSlots = async () => {
  try {
    console.log('[seedTimeSlots] Syncing TimeSlot model...');
    await TimeSlot.sync();
    console.log('[seedTimeSlots] Model synced successfully');

    const existingCount = await TimeSlot.count();

    if (existingCount > 0) {
      console.log(`[seedTimeSlots] ${existingCount} time slots already exist, skipping seed`);
      return;
    }

    console.log('[seedTimeSlots] Seeding time slots...');

    await TimeSlot.bulkCreate(timeSlotsData, {
      ignoreDuplicates: true,
    });

    const totalCount = await TimeSlot.count();
    console.log(`[seedTimeSlots] Successfully seeded ${totalCount} time slots`);
  } catch (error) {
    console.error('[seedTimeSlots] Error seeding time slots:', error.message);
    // Don't fail the entire startup if time slots seeding fails
  }
};
