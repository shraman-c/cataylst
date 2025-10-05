// Test bulk upload functionality for all endpoints
import fs from 'fs';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:9002';

// Helper to read and parse CSV
function csvToJson(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    data.push(obj);
  }
  
  return data;
}

async function testBulkUpload(endpoint, csvFile) {
  console.log(`\n🔄 Testing ${endpoint} bulk upload...`);
  
  try {
    // Read CSV file
    const csvData = fs.readFileSync(csvFile, 'utf-8');
    const jsonData = csvToJson(csvData);
    
    console.log(`📄 Loaded ${jsonData.length} records from ${csvFile}`);
    console.log(`📋 Sample record:`, JSON.stringify(jsonData[0], null, 2));
    
    // Send to API
    const response = await fetch(`${BASE_URL}/api/data/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: jsonData }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${endpoint} upload SUCCESS!`);
      console.log(`📊 Imported: ${result.importedCount} records`);
    } else {
      console.log(`❌ ${endpoint} upload FAILED:`, result.error);
      if (result.validationErrors) {
        console.log('Validation errors:', result.validationErrors);
      }
    }
  } catch (error) {
    console.log(`❌ ${endpoint} upload ERROR:`, error.message);
  }
}

async function testAllUploads() {
  console.log('🚀 Starting bulk upload tests...\n');
  
  const tests = [
    { endpoint: 'programs', file: 'sample-programs.csv' },
    { endpoint: 'students', file: 'sample-students.csv' },
    { endpoint: 'courses', file: 'sample-courses.csv' },
    { endpoint: 'teachers', file: 'sample-teachers.csv' },
    { endpoint: 'rooms', file: 'sample-rooms.csv' }
  ];
  
  for (const test of tests) {
    await testBulkUpload(test.endpoint, test.file);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 All bulk upload tests completed!');
  
  // Test data retrieval
  console.log('\n📥 Testing data retrieval...');
  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}/api/data/${test.endpoint}`);
      const data = await response.json();
      console.log(`✅ ${test.endpoint}: ${data.length} records retrieved`);
    } catch (error) {
      console.log(`❌ ${test.endpoint}: Error retrieving data`);
    }
  }
}

testAllUploads().catch(console.error);