// One-time script to fix test event check-in time
// Run: node fix-test-event.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clubsync';

async function fixTestEvent() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        const Club = require('./backend/src/models/Club');

        // Find all events and show them
        const clubs = await Club.find({}).select('club_name events');
        
        console.log('=== Available Events ===\n');
        
        let allEvents = [];
        clubs.forEach(club => {
            (club.events || []).forEach(event => {
                allEvents.push({
                    eventId: event._id.toString(),
                    title: event.title,
                    club: club.club_name,
                    opensAt: event.check_in?.opens_at || 'NOT SET',
                    closesAt: event.check_in?.closes_at || 'NOT SET'
                });
            });
        });

        if (allEvents.length === 0) {
            console.log('No events found! Create an event first.');
            process.exit(0);
        }

        allEvents.forEach((e, i) => {
            console.log(`${i + 1}. ${e.title} (${e.club})`);
            console.log(`   Event ID: ${e.eventId}`);
            console.log(`   Opens: ${e.opensAt}`);
            console.log(`   Closes: ${e.closesAt}`);
            console.log('');
        });

        // Get the first event and fix it
        const targetEvent = allEvents[0];
        const eventId = targetEvent.eventId;
        
        console.log(`\nFixing event: ${targetEvent.title}`);
        
        // Set opens_at to 2 minutes ago (within 5-min grace period)
        const newOpenTime = new Date(Date.now() - 2 * 60 * 1000);
        // Set closes_at to 2 hours from now
        const newCloseTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

        const result = await Club.updateOne(
            { 'events._id': eventId },
            { 
                $set: { 
                    'events.$.check_in.opens_at': newOpenTime,
                    'events.$.check_in.closes_at': newCloseTime
                } 
            }
        );

        if (result.modifiedCount > 0) {
            console.log('\n✅ SUCCESS! Event updated:');
            console.log(`   New opens_at: ${newOpenTime.toLocaleString()}`);
            console.log(`   New closes_at: ${newCloseTime.toLocaleString()}`);
            console.log('\n📝 Now go to your Club Dashboard and regenerate the QR code!');
            console.log('   The new QR will work immediately.\n');
        } else {
            console.log('\n⚠️ Event not found or not updated');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fixTestEvent();
