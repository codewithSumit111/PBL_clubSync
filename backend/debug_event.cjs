require('dotenv').config();
const mongoose = require('mongoose');
const Club = require('./src/models/Club');

async function debug() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const club = await Club.findOne({ 'events._id': '69df274deddc33a5e3c1663a' });
    if (!club) {
        console.log('ERROR: No club found with event ID 69df274deddc33a5e3c1663a');
        process.exit(1);
    }
    
    const event = club.events.id('69df274deddc33a5e3c1663a');
    console.log('\n=== EVENT DETAILS ===');
    console.log(JSON.stringify(event, null, 2));
    
    console.log('\n=== CHECK-IN WINDOW ===');
    console.log('check_in:', JSON.stringify(event.check_in, null, 2));
    
    if (event.check_in) {
        const now = Date.now();
        const opensAt = event.check_in.opens_at ? new Date(event.check_in.opens_at).getTime() : null;
        const closesAt = event.check_in.closes_at ? new Date(event.check_in.closes_at).getTime() : null;
        
        console.log('\nNow:', new Date().toISOString());
        console.log('Opens at:', event.check_in.opens_at ? new Date(event.check_in.opens_at).toISOString() : 'null');
        console.log('Closes at:', event.check_in.closes_at ? new Date(event.check_in.closes_at).toISOString() : 'null');
        
        if (opensAt && now < opensAt - 5*60*1000) console.log('STATUS: Check-in NOT YET OPEN');
        else if (closesAt && now > closesAt + 10*60*1000) console.log('STATUS: Check-in CLOSED');
        else console.log('STATUS: Check-in OPEN');
    } else {
        console.log('No check-in window configured (always open)');
    }
    
    process.exit(0);
}

debug().catch(e => { console.error(e); process.exit(1); });
