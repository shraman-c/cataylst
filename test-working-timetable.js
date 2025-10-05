// Test with courses that have teachers available
import fetch from 'node-fetch';

async function testWithWorkingCourses() {
  try {
    console.log('Testing timetable generation with courses that have teachers...');
    
    // Get data from API
    const [studentsRes, teachersRes, coursesRes, roomsRes] = await Promise.all([
      fetch('http://localhost:9002/api/data/students'),
      fetch('http://localhost:9002/api/data/teachers'),
      fetch('http://localhost:9002/api/data/courses'),
      fetch('http://localhost:9002/api/data/rooms')
    ]);

    const students = await studentsRes.json();
    const teachers = await teachersRes.json();
    const courses = await coursesRes.json();
    const rooms = await roomsRes.json();
    
    // Filter to only courses that have teachers
    const coursesWithTeachers = courses.filter(course => {
      const hasTeacher = teachers.some(teacher => 
        teacher.subjects && teacher.subjects.includes(course.id)
      );
      console.log(`Course ${course.id} (${course.name}): ${hasTeacher ? 'HAS' : 'NO'} teachers`);
      return hasTeacher;
    });
    
    console.log(`\nFiltered to ${coursesWithTeachers.length} courses with teachers`);
    
    // Modify students to only take courses that have teachers
    const modifiedStudents = students.map(student => ({
      ...student,
      enrolledCourses: coursesWithTeachers.slice(0, 3).map(c => c.id), // Take first 3 courses
      electives: coursesWithTeachers.slice(0, 5).map(c => c.id) // Take first 5 courses
    }));
    
    console.log(`\nStudent courses updated. Sample enrolled courses: ${modifiedStudents[0].enrolledCourses}`);
    
    // Test timetable generation
    const response = await fetch('http://localhost:9002/api/generate-timetable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        students: modifiedStudents,
        teachers: teachers,
        courses: coursesWithTeachers,
        rooms: rooms,
        programs: [
          { 
            id: 'BTCSE', 
            name: 'BTech CSE',
            code: 'BTCSE',
            totalSemesters: 8,
            description: 'Bachelor of Technology in Computer Science and Engineering',
            isNEP: false
          }
        ]
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Timetable generation SUCCESS!');
      console.log(`Timetable slots generated: ${result.timetable ? result.timetable.length : 0}`);
      if (result.timetable && result.timetable.length > 0) {
        console.log('\nSample timetable slot:');
        console.log(JSON.stringify(result.timetable[0], null, 2));
      }
    } else {
      console.log('\n❌ Timetable generation failed:');
      console.log(`Status: ${response.status}`);
      console.log('Error:', result.error || result.message);
      if (result.validationErrors) {
        console.log('\nValidation errors:');
        result.validationErrors.forEach(error => {
          console.log(`- ${error.path}: ${error.message}`);
        });
      }
      if (result.details) {
        console.log('\nValidation details:');
        console.log(JSON.stringify(result.details, null, 2));
      }
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testWithWorkingCourses();