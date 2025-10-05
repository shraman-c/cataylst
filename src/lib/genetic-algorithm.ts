
import { Course, Room, Student, Teacher, TimetableSlot, Day, Program } from './types';

// Updated time slots to match Python script logic
const timeSlots = ["09:30", "10:30", "11:30", "12:30", "14:30", "15:30", "16:30", "17:30"];
const allTimeSlotsWithLunch = ["09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30"];
const LUNCH_SLOT = "13:30";
const days: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Genetic Algorithm Configuration
const POPULATION_SIZE = 50;
const MAX_GENERATIONS = 100;
const MUTATION_RATE = 0.15; // Increased slightly for more exploration
const ELITISM_RATE = 0.1; 
const FITNESS_THRESHOLD = 1.0; 

// Semester-wise generation configuration
interface SemesterGenerationConfig {
  programId?: string;
  semester?: number;
  section?: string;
  generationMode: 'single-semester' | 'multi-semester' | 'full-program';
  includeElectives?: boolean;
}

// --- HELPER FUNCTIONS ---

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const getCourseDuration = (course: Course): number => {
    if (course.isLab) return 2;
    return 1;
};

// Filter out electives that have no students allocated to them
const filterElectivesWithStudents = (
    courses: Course[],
    students: Student[]
): Course[] => {
    return courses.filter(course => {
        // If it's not an elective course (OEC - Open Elective Courses), include it
        if (course.nepCourseType !== 'OEC') {
            return true;
        }
        
        // For electives, check if any student is allocated to this course
        const hasStudents = students.some(student => {
            // Check both electives and enrolledCourses arrays
            const electiveMatch = (student.electives || []).some(e => 
                String(e).trim().toLowerCase() === course.id.trim().toLowerCase()
            );
            const enrolledMatch = (student.enrolledCourses || []).some(e => 
                String(e).trim().toLowerCase() === course.id.trim().toLowerCase()
            );
            return electiveMatch || enrolledMatch;
        });
        
        return hasStudents;
    });
};

// Filter courses by semester and program
const filterCoursesByContext = (
    courses: Course[], 
    config: SemesterGenerationConfig
): Course[] => {
    return courses.filter(course => {
        // If specific semester is specified
        if (config.semester) {
            const matchesSemester = course.semester === config.semester;
            const includeElective = config.includeElectives || course.nepCourseType !== 'OEC';
            return matchesSemester && includeElective;
        }
        
        // For full-program mode, include all courses
        if (config.generationMode === 'full-program') {
            const includeElective = config.includeElectives || course.nepCourseType !== 'OEC';
            return includeElective;
        }
        
        return true;
    });
};

// Filter students by program and semester
const filterStudentsByContext = (
    students: Student[], 
    config: SemesterGenerationConfig
): Student[] => {
    return students.filter(student => {
        if (config.programId && config.semester) {
            return student.programId === config.programId && 
                   student.currentSemester === config.semester;
        }
        if (config.programId) {
            return student.programId === config.programId;
        }
        return true;
    });
};

// Check if a specific time slot for a given duration is valid (doesn't conflict with lunch)
const isSlotValidForStart = (startTime: string, duration: number): boolean => {
    const startIndex = allTimeSlotsWithLunch.indexOf(startTime);
    if (startIndex === -1) return false;

    // Check if any part of the class falls into the lunch break
    for (let i = 0; i < duration; i++) {
        const currentIndex = startIndex + i;
        if (currentIndex >= allTimeSlotsWithLunch.length || allTimeSlotsWithLunch[currentIndex] === LUNCH_SLOT) {
            return false;
        }
    }
    return true;
};

const isTimeAvailable = (teacher: Teacher, day: Day, time: string) => {
    if (!teacher.availability || !teacher.availability[day]) return false;
    const classTime = parseTime(time);
    const availabilityRanges = teacher.availability[day];

    return availabilityRanges.some(range => {
        try {
            const [start, end] = range.split('-').map(parseTime);
            return classTime >= start && classTime < end;
        } catch (e) {
            return false; // Invalid range format
        }
    });
};

// Teacher priority system - higher number = higher priority for assignment (lower seniority)
// HOD/Dean should get classes last, Assistant Professors should get classes first
const getTeacherPriority = (teacher: Teacher): number => {
    const designation = (teacher as any).designation || 'Assistant Professor';
    switch (designation) {
        case 'Dean': return 1;           // Lowest priority (highest seniority)
        case 'HOD': return 2;            // Second lowest priority  
        case 'Professor': return 3;      // Middle priority
        case 'Associate Professor': return 4;  // Second highest priority
        case 'Assistant Professor': return 5;  // Highest priority (lowest seniority)
        default: return 5; // Default to Assistant Professor priority
    }
};

// Sort teachers by priority for assignment (highest priority first)
const sortTeachersByPriority = (teachers: Teacher[]): Teacher[] => {
    return [...teachers].sort((a, b) => getTeacherPriority(b) - getTeacherPriority(a));
};

// --- CORE GENETIC ALGORITHM LOGIC ---

/**
 * Creates a single random timetable slot (a gene).
 */
const createRandomSlot = (
    course: Course, 
    teachers: Teacher[], 
    rooms: Room[], 
    students: Student[], 
    config: SemesterGenerationConfig
): Omit<TimetableSlot, 'id' | '_id'> => {
    // Normalize IDs to avoid mismatches from trailing spaces or case differences
    const normalizedCourseId = String(course.id).trim().toUpperCase();
    const suitableTeachers = teachers.filter(t => (t.subjects || []).some(sub => String(sub).trim().toUpperCase() === normalizedCourseId));
    const studentCountForCourse = students.filter(s => (s.electives || []).some(e => String(e).trim().toUpperCase() === normalizedCourseId) || (s.enrolledCourses || []).some(e => String(e).trim().toUpperCase() === normalizedCourseId)).length;
    const suitableRooms = rooms.filter(r => r.isLab === course.isLab && r.capacity >= studentCountForCourse);
    const duration = getCourseDuration(course);

    if (suitableTeachers.length === 0) throw new Error(`No suitable teacher found for course ${course.name} (${course.id})`);
    if (suitableRooms.length === 0) throw new Error(`No suitable room with capacity >= ${studentCountForCourse} found for course ${course.name} (${course.id}) - isLab: ${course.isLab}`);

    // Sort teachers by priority (Assistant Professor first, Dean/HOD last)
    const prioritizedTeachers = sortTeachersByPriority(suitableTeachers);
    
    let day: Day, timeStart: string, teacher: Teacher;
    let attempts = 0;
    let teacherIndex = 0;

    // Try to find a valid slot, prioritizing lower-seniority teachers first
    do {
        day = getRandomElement(days);
        timeStart = getRandomElement(timeSlots); // Only choose from schedulable slots
        
        // Try teachers in priority order (Assistant Prof first, then Associate, etc.)
        teacher = prioritizedTeachers[teacherIndex % prioritizedTeachers.length];
        
        // If current teacher doesn't work, try next in priority order
        if (!isTimeAvailable(teacher, day, timeStart) || !isSlotValidForStart(timeStart, duration)) {
            teacherIndex++;
            // If we've tried all teachers, reset and try different time/day
            if (teacherIndex >= prioritizedTeachers.length) {
                teacherIndex = 0;
                attempts++;
            }
        } else {
            break; // Found a valid combination
        }
    } while (attempts < 100);
    
    if (attempts >= 100) {
       // Fallback: choose any valid combination if priority-based selection fails
       day = getRandomElement(days);
       timeStart = getRandomElement(timeSlots.filter(ts => isSlotValidForStart(ts, duration)));
       teacher = getRandomElement(suitableTeachers);
    }
    
    const room = getRandomElement(suitableRooms);
    
    const startIndex = allTimeSlotsWithLunch.indexOf(timeStart);
    const timeEnd = allTimeSlotsWithLunch[startIndex + duration -1]; // This will be the start of the next slot, so effective end time.
    const [endHourStr, endMinuteStr] = timeEnd.split(':');
    const endHour = parseInt(endHourStr, 10) + 1;
    const finalTimeEnd = `${String(endHour).padStart(2, '0')}:${endMinuteStr}`;

    return {
        day,
        timeStart,
        timeEnd: finalTimeEnd,
        courseId: course.id,
        teacherId: teacher.id,
        roomId: room.id,
        semester: course.semester,
        programId: config.programId || "default", // Use config programId or default
        section: config.section || "A",
    };
};

/**
 * Creates a complete timetable (a chromosome) by scheduling all required classes.
 */
const createTimetable = (
    courses: Course[], 
    teachers: Teacher[], 
    rooms: Room[], 
    students: Student[], 
    config: SemesterGenerationConfig
): Omit<TimetableSlot, 'id' | '_id'>[] => {
    const timetable: Omit<TimetableSlot, 'id' | '_id'>[] = [];
    courses.forEach(course => {
        for (let i = 0; i < course.classesPerWeek; i++) {
            timetable.push(createRandomSlot(course, teachers, rooms, students, config));
        }
    });
    return timetable;
};

/**
 * Calculates the fitness of a timetable. The higher the score, the better.
 * A score of 1.0 means a perfect timetable with no conflicts.
 */
const calculateFitness = (timetable: Omit<TimetableSlot, 'id' | '_id'>[], students: Student[], rooms: Room[], teachers: Teacher[], courses: Course[]): number => {
    let conflicts = 0;
    let hierarchyBonus = 0;
    const scheduleMap: { [key: string]: number } = {};
    const teacherWorkload: { [key: string]: number } = {};

    timetable.forEach(slot => {
    const teacher = teachers.find(t => t.id === slot.teacherId);
    const room = rooms.find(r => r.id === slot.roomId);
    const course = courses.find(c => String(c.id).trim().toUpperCase() === String(slot.courseId).trim().toUpperCase());
        const duration = course ? getCourseDuration(course) : 1;

        // Track teacher workload for hierarchy bonus calculation
        if (teacher) {
            teacherWorkload[teacher.id] = (teacherWorkload[teacher.id] || 0) + 1;
        }

        // Hard Constraint Checks
        // 1. Teacher availability
        if (teacher && !isTimeAvailable(teacher, slot.day, slot.timeStart)) {
            conflicts++;
        }
        if (!isSlotValidForStart(slot.timeStart, duration)) {
            conflicts++;
        }

        // 2. Room capacity
    const studentCountForCourse = students.filter(s => (s.electives || []).some(e => String(e).trim().toUpperCase() === String(slot.courseId).trim().toUpperCase())).length;
        if(room && room.capacity < studentCountForCourse) {
             conflicts++;
        }
        
        // 3. Overlap checks for multi-hour slots
        const startIndex = allTimeSlotsWithLunch.indexOf(slot.timeStart);
        for(let i = 0; i < duration; i++) {
            const currentTimeSlot = allTimeSlotsWithLunch[startIndex + i];
            const teacherKey = `t-${slot.teacherId}-${slot.day}-${currentTimeSlot}`;
            const roomKey = `r-${slot.roomId}-${slot.day}-${currentTimeSlot}`;

            scheduleMap[teacherKey] = (scheduleMap[teacherKey] || 0) + 1;
            scheduleMap[roomKey] = (scheduleMap[roomKey] || 0) + 1;

            const courseStudents = students.filter(s => s.electives.includes(slot.courseId));
            courseStudents.forEach(student => {
                const studentKey = `s-${student.id}-${slot.day}-${currentTimeSlot}`;
                scheduleMap[studentKey] = (scheduleMap[studentKey] || 0) + 1;
            });
        }
    });

    Object.values(scheduleMap).forEach(count => {
        if (count > 1) {
            conflicts += (count - 1); // Penalize for each overlap
        }
    });

    // Calculate hierarchy bonus: prefer distributing workload to lower-seniority teachers
    Object.entries(teacherWorkload).forEach(([teacherId, workload]) => {
        const teacher = teachers.find(t => t.id === teacherId);
        if (teacher) {
            const priority = getTeacherPriority(teacher);
            // Give small bonus for using lower-seniority teachers more
            // Priority 5 (Assistant Prof) gets more bonus than Priority 1 (Dean)
            hierarchyBonus += (priority / 5) * workload * 0.1;
        }
    });

    // Calculate base fitness and add hierarchy bonus
    const baseFitness = 1 / (1 + conflicts);
    return baseFitness + (hierarchyBonus * 0.01); // Small bonus to not overwhelm conflict penalties
};


/**
 * Selects two timetables from the population for crossover using tournament selection.
 */
const selectParents = (population: Omit<TimetableSlot, 'id' | '_id'>[][], fitnessScores: number[]): [Omit<TimetableSlot, 'id' | '_id'>[], Omit<TimetableSlot, 'id' | '_id'>[]] => {
    const tournamentSize = 5;
    const getParent = (): Omit<TimetableSlot, 'id' | '_id'>[] => {
        let bestIndex = -1;
        let bestFitness = -1;
        for (let i = 0; i < tournamentSize; i++) {
            const randomIndex = Math.floor(Math.random() * population.length);
            if (fitnessScores[randomIndex] > bestFitness) {
                bestFitness = fitnessScores[randomIndex];
                bestIndex = randomIndex;
            }
        }
        return population[bestIndex];
    };
    return [getParent(), getParent()];
};

/**
 * Combines two parent timetables to create one child timetable (crossover).
 */
const crossover = (parent1: Omit<TimetableSlot, 'id' | '_id'>[], parent2: Omit<TimetableSlot, 'id' | '_id'>[]): Omit<TimetableSlot, 'id' | '_id'>[] => {
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    const child = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
    return child.map(slot => ({ ...slot }));
};

/**
 * Randomly alters a single gene (slot) in a timetable (chromosome).
 */
const mutate = (timetable: Omit<TimetableSlot, 'id' | '_id'>[], courses: Course[], teachers: Teacher[], rooms: Room[], students: Student[], config: SemesterGenerationConfig): Omit<TimetableSlot, 'id' | '_id'>[] => {
    if (Math.random() > MUTATION_RATE) return timetable;
    
    if(timetable.length === 0) return timetable;

    const mutationIndex = Math.floor(Math.random() * timetable.length);
    const originalSlot = timetable[mutationIndex];
    const course = courses.find(c => c.id === originalSlot.courseId);

    if (course) {
        timetable[mutationIndex] = createRandomSlot(course, teachers, rooms, students, config);
    }
    return timetable;
};


// --- MAIN EXPORTED FUNCTION ---

export const runGeneticAlgorithm = (students: Student[], teachers: Teacher[], courses: Course[], rooms: Room[], config: SemesterGenerationConfig): { bestTimetable: TimetableSlot[], bestScore: number, generations: number } => {
    // Pre-computation/validation
    if (courses.length === 0) {
        throw new Error("Cannot generate timetable with 0 courses.");
    }

    // Filter out electives that have no students allocated to them
    const filteredCourses = filterElectivesWithStudents(courses, students);
    console.log(`Filtered out ${courses.length - filteredCourses.length} elective courses with no enrolled students`);
    
    // Apply context-based filtering (semester, program, etc.)
    const contextFilteredCourses = filterCoursesByContext(filteredCourses, config);
    
    if (contextFilteredCourses.length === 0) {
        throw new Error("No courses available after filtering.");
    }

    let population = Array(POPULATION_SIZE).fill(null).map(() => createTimetable(contextFilteredCourses, teachers, rooms, students, config));
    let bestTimetable: Omit<TimetableSlot, 'id' | '_id'>[] = [];
    let bestScore = -1;
    let lastBestGen = 0;

    for (let generation = 0; generation < MAX_GENERATIONS; generation++) {
        const fitnessScores = population.map(timetable => calculateFitness(timetable, students, rooms, teachers, contextFilteredCourses));

        let generationBestScore = -1;
        let generationBestIndex = -1;
        for (let i = 0; i < population.length; i++) {
            if (fitnessScores[i] > generationBestScore) {
                generationBestScore = fitnessScores[i];
                generationBestIndex = i;
            }
        }

        if (generationBestScore > bestScore) {
            bestScore = generationBestScore;
            bestTimetable = JSON.parse(JSON.stringify(population[generationBestIndex]));
            lastBestGen = generation;
        }

        if (bestScore >= FITNESS_THRESHOLD) {
            console.log(`Stopping early at generation ${generation + 1} with perfect score ${bestScore}`);
            // Add unique IDs to the final timetable
            const finalTimetable = bestTimetable.map((slot, index) => ({
                ...slot,
                id: `${slot.courseId}-${index}-${Date.now()}`
            })) as TimetableSlot[];
            return { bestTimetable: finalTimetable, bestScore, generations: generation + 1 };
        }

        // Stop if no improvement for a while
        if (generation - lastBestGen > 20) {
             console.log(`Stopping due to no improvement for 20 generations. Best score: ${bestScore}`);
             break;
        }

        const newPopulation: Omit<TimetableSlot, 'id' | '_id'>[][] = [];

        const eliteSize = Math.floor(POPULATION_SIZE * ELITISM_RATE);
        const sortedIndices = fitnessScores.map((score, index) => ({score, index})).sort((a, b) => b.score - a.score);
        for(let i=0; i<eliteSize; i++) {
            newPopulation.push(population[sortedIndices[i].index]);
        }

        while (newPopulation.length < POPULATION_SIZE) {
            const [parent1, parent2] = selectParents(population, fitnessScores);
            let child = crossover(parent1, parent2);
            child = mutate(child, contextFilteredCourses, teachers, rooms, students, config);
            newPopulation.push(child);
        }

        population = newPopulation;
         console.log(`Generation ${generation + 1}: Best Score = ${bestScore.toFixed(4)}`);
    }

    console.log(`Finished ${MAX_GENERATIONS} generations. Final Best Score: ${bestScore}`);
    
    const finalTimetable = bestTimetable.map((slot, index) => ({
        ...slot,
        id: `${slot.courseId}-${index}-${Date.now()}`
    })) as TimetableSlot[];
    
    return { bestTimetable: finalTimetable, bestScore, generations: MAX_GENERATIONS };
};
