// Script to create a pending notice from staff for testing approval workflow

const API_URL = 'http://localhost:3002'

async function createPendingNotice() {
  console.log('📝 Creating pending notice from staff...')

  // Login as staff
  const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'staff@institution.edu',
      password: 'staff123',
    }),
  })

  if (!loginResponse.ok) {
    console.error('❌ Failed to login as staff')
    return
  }

  const cookies = loginResponse.headers.get('set-cookie')

  // Create a notice (will be pending approval since it's from staff)
  const notice = {
    title: 'Guest Lecture on Machine Learning - Pending Approval',
    content: 'We are pleased to announce a guest lecture on Machine Learning and Artificial Intelligence by Dr. Sarah Johnson from MIT. The lecture will cover recent advancements in deep learning, neural networks, and practical applications in industry. All students and faculty members are invited to attend this informative session. Date: November 10, 2025. Time: 2:00 PM - 4:00 PM. Venue: Main Auditorium.',
    category: 'events',
    isPinned: false,
    department: 'Computer Science',
  }

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
      const data = await response.json()
      console.log('✅ Created pending notice:', notice.title)
      console.log('Notice ID:', data.id)
      console.log('\n🔔 This notice is now pending admin approval!')
      console.log('📋 To approve:')
      console.log('   1. Login as admin (admin@institution.edu / admin123)')
      console.log('   2. Go to "Pending Approvals" in the sidebar')
      console.log('   3. Click "Approve" button')
    } else {
      const error = await response.json()
      console.error('❌ Failed to create notice:', error)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createPendingNotice().catch(console.error)
