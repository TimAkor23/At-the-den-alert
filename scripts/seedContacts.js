const mongoose = require('mongoose');
require('dotenv').config();
const EmergencyContact = require('../models/EmergencyContact');

const publicContacts = [
  {
    name: 'Public Safety',
    relationship: 'other',  // Changed from 'security' to 'other' (valid enum)
    phone: '484-365-8139',
    email: 'lupublicsafetydepartment@lincoln.edu',
    isPrimary: false,
    notifyOnEmergency: true,
    isPublic: true,
    type: 'campus-security',
    organization: 'Lincoln University',
    priority: 1,
    notes: '24/7 Campus Security Dispatch'
  },
  {
    name: 'Health Services',
    relationship: 'doctor',  // Changed from 'medical' to 'doctor' (valid enum)
    phone: '484-365-6196',
    email: 'healthservices@lincoln.edu',
    isPrimary: false,
    notifyOnEmergency: true,
    isPublic: true,
    type: 'medical',
    organization: 'Student Health Services',
    priority: 2,
    notes: 'Hours: Mon: 8:30am-8pm | Tuesday - Friday 8:30am - 4:30pm | Every other Saturday 9:00 am - 2:00 pm'
  },
  {
    name: 'Title IX Office',
    relationship: 'other',
    phone: '484-365-0000',
    email: 'titleix@lincoln.edu',
    isPrimary: false,
    notifyOnEmergency: true,
    isPublic: true,
    type: 'student-safety',
    organization: 'Office of Title IX',
    priority: 4,
    notes: 'Designated university official with primary responsibility for coordinating the university’s compliance with Title IX.'
  },
  {
    name: 'Physical Plant',
    relationship: 'other',
    phone: '484-365-8061',
    email: 'facilities@lincoln.edu',
    isPrimary: false,
    notifyOnEmergency: true,
    isPublic: true,
    type: 'facilities',
    organization: 'Facilities Services',
    priority: 4,
    notes: 'For building emergencies (flooding, power outage, etc.)'
  }
];

async function seedPublicContacts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing public contacts
    await EmergencyContact.deleteMany({ isPublic: true });
    console.log('🗑️ Removed existing public contacts');

    // Insert new public contacts
    const inserted = await EmergencyContact.insertMany(publicContacts);
    console.log(`✅ Added ${inserted.length} public emergency contacts`);

    // Display the contacts
    console.log('\n📞 Public Emergency Contacts:');
    inserted.forEach(contact => {
      console.log(`  - ${contact.name}: ${contact.phone}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding public contacts:', error);
    process.exit(1);
  }
}

seedPublicContacts();