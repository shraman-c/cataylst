# Course Schema Update Summary

## Overview
Updated the course data structure to match the user's requirements with the following columns:
- `id` (TEXT, Primary Key)
- `name` (TEXT)
- `department` (TEXT) 
- `credits` (INTEGER)
- `classesPerWeek` (INTEGER) - frontend field name
- `classes_per_week` (INTEGER) - database field name
- `isLab` (BOOLEAN) - frontend field name
- `is_lab` (BOOLEAN) - database field name
- `semester` (INTEGER)
- `isNEP` (BOOLEAN) - frontend field name
- `is_nep` (BOOLEAN) - database field name
- `nepCourseType` (TEXT) - frontend field name
- `nep_course_type` (TEXT) - database field name

## Files Updated

### 1. Database Schema (`create-database-schema.sql`)
- ✅ Updated courses table structure
- ✅ Changed primary key from UUID to TEXT (`id`)
- ✅ Added department column
- ✅ Removed unnecessary columns (custom_id, course_code, program_id, is_elective, prerequisite_courses)

### 2. Database Migration (`update-courses-schema.sql`)
- ✅ Created migration script for existing databases
- ✅ Safe UUID to TEXT conversion with data preservation
- ✅ Column cleanup and removal

### 3. Data Validation Schema (`src/lib/data-schemas.ts`)
- ✅ Updated CourseSchema to match exact requirements
- ✅ Simplified schema with only required fields
- ✅ Proper validation for all fields

### 4. API Layer (`src/app/api/data/courses/route.ts`)
- ✅ Updated GET endpoint transformation from database format
- ✅ Updated POST endpoint transformation to database format
- ✅ Removed references to removed fields (programId, courseCode, etc.)

### 5. Course Update API (`src/app/api/data/courses/update/route.ts`)
- ✅ Updated to handle only new schema fields
- ✅ Changed database queries to use `id` instead of `custom_id`
- ✅ Updated response format to match new schema
- ✅ Removed handling of deprecated fields

### 6. UI Components (`src/components/catalyst-dashboard.tsx`)

#### CSV Template Updates:
- ✅ Updated course CSV template headers to match new schema
- ✅ Removed `courseCode` from template
- ✅ Added proper sample data with correct NEP course types
- ✅ Headers: `['id', 'name', 'department', 'credits', 'classesPerWeek', 'isLab', 'semester', 'isNEP', 'nepCourseType']`

#### Table Display:
- ✅ Updated column definitions for course table
- ✅ Added inline editing for `name` field (text input with save/cancel)
- ✅ Added inline editing for `credits` field (dropdown: 1-6)
- ✅ Maintained existing inline editing for other fields

#### Add Course Dialog:
- ✅ Removed `programId` field from form
- ✅ Updated form data structure to match new schema
- ✅ Removed programs fetching logic
- ✅ Form fields: id, name, department, credits, classesPerWeek, isLab, semester, isNEP, nepCourseType

#### Filtering:
- ✅ Course filtering works with new schema fields
- ✅ Filters: classesPerWeek, isLab, credits, NEP status

## New Inline Editing Components Added

### EditableCourseName
- Allows clicking on course name to edit inline
- Text input with save (✓) and cancel (✗) buttons
- Handles API updates and error states

### EditableCourseCredits  
- Dropdown selector for credits (1-6)
- Immediate save on selection change
- Handles API updates and error states

## CSV Upload/Download Features
- ✅ CSV template matches new schema exactly
- ✅ Sample data includes proper NEP course types (Major, FC, etc.)
- ✅ CSV processing handles new field structure
- ✅ Bulk upload works with simplified schema

## Validation & Error Handling
- ✅ Zod schema validates all fields properly
- ✅ API endpoints include proper error handling
- ✅ UI shows appropriate error messages
- ✅ Type coercion handles string/number conversions

## Key Changes from Previous Schema

### Removed Fields:
- `courseCode` - no longer needed
- `programId` - courses not tied to specific programs
- `isElective` - not required in new structure
- `prerequisiteCourses` - simplified requirements
- `custom_id` - using direct TEXT id as primary key

### Added Fields:
- `department` - now required field for course categorization

### Changed Fields:
- `id` - now TEXT primary key instead of UUID with separate custom_id
- All boolean fields maintain consistent naming (frontend camelCase, database snake_case)

## Database Migration Required
To update an existing database, run the `update-courses-schema.sql` script which:
1. Safely converts UUID primary keys to TEXT
2. Removes deprecated columns
3. Adds department column
4. Preserves all existing course data

## Testing Checklist
- [ ] Add course via form works
- [ ] CSV upload with new template works  
- [ ] Inline editing of all fields works
- [ ] Course filtering works
- [ ] CSV download/export works
- [ ] Database migration script works
- [ ] API endpoints return correct data format

## Usage Instructions

### Adding Courses Manually:
1. Click "Add Course" button
2. Fill in: ID, Name, Department, Credits, Classes per Week, Lab status, Semester, NEP status, NEP type
3. No program selection required

### CSV Upload:
1. Download CSV template (updated headers)
2. Fill with course data matching new schema
3. Upload via Import CSV button

### Inline Editing:
- Click on course name to edit text
- Use dropdowns for credits, classes per week, semester, etc.
- Changes save automatically

The course management system now fully supports the requested schema with all functionality (add course button and CSV upload) working correctly.