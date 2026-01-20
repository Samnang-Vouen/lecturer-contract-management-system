#!/usr/bin/env node
import 'dotenv/config';
import bcrypt from 'bcrypt';
import sequelize from '../config/db.js';
import User from '../model/user.model.js';

async function main() {
  try {
    const email = (process.argv[2] || '').trim().toLowerCase();
    let provided = process.argv[3] || '';
    if (!email) {
      console.error('Usage: node src/scripts/resetPassword.js <email> [newPassword]');
      process.exit(1);
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error('User not found:', email);
      process.exit(2);
    }
    // Generate temp if not provided
    if (!provided) {
      const TEMP_LEN = 10;
      let tmp = '';
      while (tmp.length < TEMP_LEN) tmp += Math.random().toString(36).slice(2);
      provided = tmp.slice(0, TEMP_LEN);
    }
    if (provided.length < 6) {
      console.error('Password must be at least 6 characters');
      process.exit(3);
    }
    const hashed = await bcrypt.hash(provided, 10);
    await user.update({ password_hash: hashed });
    console.log('Password reset successfully');
    console.log('Email:', email);
    console.log('New password:', provided);
  } catch (e) {
    console.error('resetPassword script error:', e.message);
    process.exit(10);
  } finally {
    try {
      await sequelize.close();
    } catch {}
  }
}

main();
