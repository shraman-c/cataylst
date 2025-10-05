// Test timetable generation API to see validation errors
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testTimetableGeneration() {
  try {
    console.log('Fetching data from APIs...');
    
    const [studentsRes, teachersRes, coursesRes, roomsRes, programsRes] = await Promise.all([
      fetch('http://localhost:9002/api/data/students'),
      fetch('http://localhost:9002/api/data/teachers'), 
      fetch('http://localhost:9002/api/data/courses'),
      fetch('http://localhost:9002/api/data/rooms'),
      fetch('http://localhost:9002/api/data/programs')
    ]);
    
    const students = await studentsRes.json();
    const teachers = await teachersRes.json();
    const courses = await coursesRes.json();
    const rooms = await roomsRes.json();
    const programs = await programsRes.json();
    
    console.log('Data fetched successfully:');
    console.log(`- Students: ${students.length}`);
    console.log(`- Teachers: ${teachers.length}`);
    console.log(`- Courses: ${courses.length}`);
    console.log(`- Rooms: ${rooms.length}`);
    console.log(`- Programs: ${programs.length}`);
    
    console.log('\\nSample data structures:');
    console.log('Student sample:', JSON.stringify(students[0], null, 2));
    console.log('Teacher sample:', JSON.stringify(teachers[0], null, 2));
    console.log('Course sample:', JSON.stringify(courses[0], null, 2));
    
    const payload = {
      students,
      teachers,
      courses,
      rooms,
      programs,
      generationMode: 'full-program'
    };
    
    console.log('\\nTesting timetable generation...');
    const response = await fetch('http://localhost:9002/api/generate-timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Validation failed:');
      console.error('Status:', response.status);
      console.error('Error:', result.error);
      if (result.issues) {
        console.error('Issues:', JSON.stringify(result.issues, null, 2));
      }
      if (result.details) {
        console.error('Details:', JSON.stringify(result.details, null, 2));
      }
    } else {
      console.log('✅ Timetable generation successful!');
      console.log('Result:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTimetableGeneration();