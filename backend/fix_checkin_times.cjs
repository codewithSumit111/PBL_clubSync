// Fix existing events whose check-in times were stored as UTC instead of IST
// This subtracts 5h30m from opens_at and closes_at to correct the timezone
require('dotenv').config();
const mongoose = require('mongoose');
const Club = require('./src/models/Club');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

async function fixCheckInTimes() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const clubs = await Club.find({ 'events.check_in': { $exists: true } });
    let fixed = 0;

    for (const club of clubs) {
        let clubModified = false;

        for (const event of club.events) {
            if (!event.check_in) continue;

            const opensAt = event.check_in.opens_at;
            const closesAt = event.check_in.closes_at;

            if (opensAt) {
                const oldTime = new Date(opensAt);
                const newTime = new Date(oldTime.getTime() - IST_OFFSET_MS);
                console.log(`  [${event.title}] opens_at: ${oldTime.toISOString()} -> ${newTime.toISOString()}`);
                event.check_in.opens_at = newTime;
                clubModified = true;
            }

            if (closesAt) {
                const oldTime = new Date(closesAt);
                const newTime = new Date(oldTime.getTime() - IST_OFFSET_MS);
                console.log(`  [${event.title}] closes_at: ${oldTime.toISOString()} -> ${newTime.toISOString()}`);
                event.check_in.closes_at = newTime;
                clubModified = true;
            }

            if (clubModified) fixed++;
        }

        if (clubModified) {
            await club.save();
            console.log(`  Saved club: ${club.club_name}`);
        }
    }

    console.log(`\nDone. Fixed ${fixed} event(s).`);
    process.exit(0);
}

fixCheckInTimes().catch(e => { console.error(e); process.exit(1); });
