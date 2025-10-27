// Script to seed demo data for testing
// Run: bun run scripts/seed-demo-data.ts

const API_URL = 'http://localhost:3002'

async function seedData() {
  console.log('🌱 Seeding demo data...')

  // 1. Register demo users
  const users = [
    {
      email: 'admin@institution.edu',
      username: 'admin',
      password: 'admin123',
      fullName: 'John Admin',
      role: 'admin',
      department: 'Administration',
    },
    {
      email: 'staff@institution.edu',
      username: 'staff1',
      password: 'staff123',
      fullName: 'Jane Faculty',
      role: 'staff',
      department: 'Computer Science',
    },
    {
      email: 'student@institution.edu',
      username: 'student1',
      password: 'student123',
      fullName: 'Mike Student',
      role: 'student',
      department: 'Computer Science',
    },
  ]

  const createdUsers: any[] = []

  for (const user of users) {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })

      if (response.ok) {
        const data = await response.json()
        createdUsers.push({ ...user, id: data.id })
        console.log(`✅ Created user: ${user.email}`)
      }
    } catch (error) {
      console.log(`⚠️  User ${user.email} might already exist`)
    }
  }

  // 2. Login as admin to create notices
  const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@institution.edu',
      password: 'admin123',
    }),
  })

  if (!loginResponse.ok) {
    console.error('❌ Failed to login as admin')
    return
  }

  const cookies = loginResponse.headers.get('set-cookie')

  // 3. Create demo notices
  const notices = [
    {
      title: 'Mid-Term Examinations Schedule Released',
      content: 'The mid-term examination schedule for all departments has been released. Students are advised to check their respective department notice boards for detailed timetables. Exams will commence from November 15th, 2025.',
      category: 'exams',
      isPinned: true,
    },
    {
      title: 'Annual Tech Fest 2025 - Call for Participation',
      content: 'We are excited to announce our Annual Tech Fest 2025! Students are invited to participate in various competitions including coding challenges, hackathons, and project exhibitions. Registration opens next week.',
      category: 'events',
      isPinned: true,
    },
    {
      title: 'Winter Break Holiday Notice',
      content: 'The institution will remain closed for winter break from December 20th, 2025 to January 5th, 2026. Classes will resume on January 6th, 2026. Happy Holidays!',
      category: 'holidays',
      isPinned: false,
    },
    {
      title: 'Inter-College Basketball Tournament',
      content: 'Our college basketball team will be participating in the inter-college tournament this month. Show your support by attending the matches. Schedule will be shared soon.',
      category: 'sports',
      isPinned: false,
    },
    {
      title: 'Library Timings Extended During Exam Season',
      content: 'To support students during the examination period, library timings have been extended. The library will now be open from 7 AM to 11 PM on all weekdays.',
      category: 'general',
      isPinned: false,
    },
  ]

  for (const notice of notices) {
    try {
      const response = await fetch(`${API_URL}/api/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookies || '',
        },
        body: JSON.stringify(notice),
      })

      if (response.ok) {
        console.log(`✅ Created notice: ${notice.title}`)
      }
    } catch (error) {
      console.error(`❌ Failed to create notice: ${notice.title}`, error)
    }
  }

  console.log('🎉 Demo data seeding completed!')
  console.log('\n📝 Demo Credentials:')
  console.log('Admin: admin@institution.edu / admin123')
  console.log('Staff: staff@institution.edu / staff123')
  console.log('Student: student@institution.edu / student123')
}

seedData().catch(console.error)
