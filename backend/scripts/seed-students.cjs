/**
 * seed-students.cjs
 * ─────────────────────────────────────────────
 * Sheet 2 (Append1) = MASTER list of ALL 922 students
 * Sheet 1 (club_allotment) = supplementary club info for ~872 of them
 *
 * Name formats differ between sheets:
 *   Sheet 1: "Deepak Dafne" (first last)
 *   Sheet 2: "Dafne Deepak Radhakrishna" (last first middle)
 * So we match using word-set overlap instead of exact match.
 *
 * Usage:  node backend/scripts/seed-students.cjs
 * ─────────────────────────────────────────────
 */

const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Student = require('../src/models/Student');
const Club = require('../src/models/Club');

// ── Config ──────────────────────────────────
const EXCEL_PATH = path.join(__dirname, '..', '..', 'Book1.xlsx');
const DEFAULT_PASSWORD_PREFIX = 'ClubSync@';
const PLACEHOLDER_EMAIL_DOMAIN = 'clubsync.temp';
const BCRYPT_ROUNDS = 10;

// ── Fuzzy name matching ─────────────────────
function nameWords(name) {
    return (name || '').trim().toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
}

/**
 * Match Sheet1 name to a Sheet2 name.
 * Strategy: all words from the shorter name must appear in the longer name.
 * This handles "Deepak Dafne" matching "Dafne Deepak Radhakrishna".
 */
function namesMatch(name1Words, name2Words) {
    const shorter = name1Words.length <= name2Words.length ? name1Words : name2Words;
    const longer = name1Words.length <= name2Words.length ? name2Words : name1Words;

    // All words in shorter must exist in longer
    let matchCount = 0;
    for (const w of shorter) {
        if (w.length < 2) continue; // skip single-char words
        if (longer.includes(w)) matchCount++;
    }

    const significantWords = shorter.filter(w => w.length >= 2).length;
    // Require all significant words to match
    return significantWords > 0 && matchCount === significantWords;
}

// ── Main ────────────────────────────────────
async function main() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   ClubSync — Student Data Seed Script    ║');
    console.log('║        (Fuzzy Name Matching v2)          ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // 1. Connect
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI not set in .env');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 2. Cleanup previous import
    console.log('🧹 Cleaning up previous import...');
    const deleteResult = await Student.deleteMany({
        email: { $regex: /@clubsync\.temp$/i }
    });
    console.log(`   Deleted ${deleteResult.deletedCount} previously imported students`);

    const clubDeleteResult = await Club.deleteMany({
        email: { $regex: /@clubsync\.temp$/i }
    });
    console.log(`   Deleted ${clubDeleteResult.deletedCount} auto-created clubs\n`);

    // 3. Read Excel
    console.log(`📖 Reading Excel...`);
    const wb = XLSX.readFile(EXCEL_PATH);

    const sheet1Data = XLSX.utils.sheet_to_json(wb.Sheets['club_allotment']);
    const sheet2Data = XLSX.utils.sheet_to_json(wb.Sheets['Append1']);
    console.log(`   Sheet 1 "club_allotment": ${sheet1Data.length} rows (club info)`);
    console.log(`   Sheet 2 "Append1": ${sheet2Data.length} rows (master list)\n`);

    // 4. Pre-process Sheet 1 for fuzzy matching
    //    Each entry: { words, roll_no, division, mobile_no, primary_club, originalName }
    const sheet1Entries = sheet1Data.map(row => ({
        words: nameWords(row.name),
        originalName: (row.name || '').trim(),
        roll_no: String(row['Roll No.'] || '').trim(),
        division: String(row['Division'] || '').trim(),
        mobile_no: String(row['Mobile No.'] || '').trim(),
        primary_club: String(row['primary_club'] || '').trim(),
        matched: false,
    }));

    // 5. Merge: iterate Sheet 2 (master), fuzzy-find match in Sheet 1
    const mergedStudents = [];
    let withClub = 0;
    let withoutClub = 0;
    let fuzzyMatched = 0;

    for (const row of sheet2Data) {
        const name = (row.name || '').trim();
        if (!name) continue;

        const s2Words = nameWords(name);
        const prn = String(row['PRN'] || '').trim();
        const examSeat = String(row['Exam Seat Number'] || '').trim();
        const department = String(row['department'] || '').trim() || 'Unknown';

        // Find best match in Sheet 1
        let bestMatch = null;
        for (const s1 of sheet1Entries) {
            if (s1.matched) continue; // already used
            if (namesMatch(s1.words, s2Words)) {
                bestMatch = s1;
                break;
            }
        }

        if (bestMatch) {
            bestMatch.matched = true;
            fuzzyMatched++;
        }

        const rollNo = bestMatch ? bestMatch.roll_no : prn;
        const clubName = bestMatch ? bestMatch.primary_club : '';

        if (!rollNo) continue;

        if (clubName) {
            withClub++;
        } else {
            withoutClub++;
        }

        mergedStudents.push({
            name,
            roll_no: rollNo,
            division: bestMatch ? bestMatch.division : '',
            mobile_no: bestMatch ? bestMatch.mobile_no : '',
            primary_club_name: clubName,
            department,
            exam_seat_no: examSeat,
            prn,
        });
    }

    // Check unmatched Sheet 1 entries
    const unmatchedS1 = sheet1Entries.filter(e => !e.matched);

    console.log(`📊 Merged: ${mergedStudents.length} students`);
    console.log(`   ├─ Fuzzy matched with Sheet 1: ${fuzzyMatched}`);
    console.log(`   ├─ With primary club: ${withClub}`);
    console.log(`   ├─ Without club: ${withoutClub}`);
    console.log(`   └─ Sheet 1 unmatched (not in Sheet 2): ${unmatchedS1.length}`);
    if (unmatchedS1.length > 0 && unmatchedS1.length <= 10) {
        unmatchedS1.forEach(e => console.log(`      ⚠️  ${e.originalName} (${e.roll_no})`));
    }
    console.log('');

    // 6. Ensure clubs exist
    const uniqueClubNames = [...new Set(
        mergedStudents.map(s => s.primary_club_name).filter(Boolean)
    )];

    console.log(`🏛️  Ensuring ${uniqueClubNames.length} clubs exist...`);
    const clubMap = new Map();

    for (const clubName of uniqueClubNames) {
        let club = await Club.findOne({ club_name: clubName });
        if (!club) {
            const clubEmail = clubName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');

            const hashedPw = await bcrypt.hash('ClubSync@club123', BCRYPT_ROUNDS);

            club = new Club({
                club_name: clubName,
                description: `${clubName} — auto-created during student import.`,
                email: `${clubEmail}@clubsync.temp`,
                password: hashedPw,
                category: 'Other',
            });
            await club.save();
            console.log(`   ✨ Created: ${clubName}`);
        } else {
            console.log(`   ✓  Exists: ${clubName}`);
        }
        clubMap.set(clubName, club._id);
    }
    console.log('');

    // 7. Insert students
    console.log('👥 Inserting students...');
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const s of mergedStudents) {
        try {
            const exists = await Student.findOne({ roll_no: s.roll_no.toUpperCase() });
            if (exists) {
                skipped++;
                continue;
            }

            const email = `${String(s.roll_no).toLowerCase()}@${PLACEHOLDER_EMAIL_DOMAIN}`;
            const hashedPassword = await bcrypt.hash(
                `${DEFAULT_PASSWORD_PREFIX}${s.roll_no}`, BCRYPT_ROUNDS
            );

            const clubId = s.primary_club_name ? clubMap.get(s.primary_club_name) : null;

            const studentDoc = new Student({
                name: s.name,
                email,
                password: hashedPassword,
                roll_no: s.roll_no,
                department: s.department,
                year: 1,
                division: s.division,
                mobile_no: s.mobile_no,
                exam_seat_no: s.exam_seat_no,
                prn: s.prn,
                primary_club_id: clubId || null,
                registered_clubs: clubId
                    ? [{
                        club: clubId,
                        status: 'Approved',
                        membership_role: 'member',
                        appliedAt: new Date(),
                    }]
                    : [],
            });

            await studentDoc.save();

            if (clubId) {
                await Club.findByIdAndUpdate(clubId, {
                    $addToSet: { registered_students: studentDoc._id },
                });
            }

            created++;
            if (created % 100 === 0) {
                console.log(`   ... ${created} created`);
            }
        } catch (err) {
            errors++;
            if (errors <= 5) {
                console.error(`   ❌ "${s.name}" (${s.roll_no}): ${err.message}`);
            }
        }
    }

    // 8. Update club analytics
    console.log('\n📈 Updating club analytics...');
    for (const [, clubId] of clubMap.entries()) {
        const count = await Student.countDocuments({
            'registered_clubs.club': clubId,
            'registered_clubs.status': 'Approved',
        });
        await Club.findByIdAndUpdate(clubId, {
            'analytics.total_members': count,
        });
    }

    // 9. Summary
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║              Import Summary              ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  ✅ Created:  ${String(created).padStart(4)}                       ║`);
    console.log(`║  ⏭️  Skipped:  ${String(skipped).padStart(4)}  (already existed)    ║`);
    console.log(`║  ❌ Errors:   ${String(errors).padStart(4)}                       ║`);
    console.log(`║  🏛️  Clubs:    ${String(clubMap.size).padStart(4)}                       ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('\n🔑 Default password: ClubSync@<roll_no>');
    console.log('📧 Placeholder email: <roll_no>@clubsync.temp\n');

    await mongoose.disconnect();
    console.log('🔌 Done!');
}

main().catch(err => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
});
