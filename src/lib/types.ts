import { z } from 'zod';
import type { CourseSchema, StudentSchema, TeacherSchema, RoomSchema, TimetableSlotSchema, ChangeRequestSchema, ProgramSchema, SectionSchema, SemesterTimetableGenerationSchema, MultiProgramTimetableGenerationSchema, DepartmentSchema, LabSchema } from './data-schemas';

export type Course = z.infer<typeof CourseSchema>;
export type Student = z.infer<typeof StudentSchema>;
export type Teacher = z.infer<typeof TeacherSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type TimetableSlot = z.infer<typeof TimetableSlotSchema>;
export type ChangeRequest = z.infer<typeof ChangeRequestSchema>;
export type Program = z.infer<typeof ProgramSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Department = z.infer<typeof DepartmentSchema>;
export type Lab = z.infer<typeof LabSchema>;
export type SemesterTimetableGeneration = z.infer<typeof SemesterTimetableGenerationSchema>;
export type MultiProgramTimetableGeneration = z.infer<typeof MultiProgramTimetableGenerationSchema>;

export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

// Schema for generate-timetable flow
export { GenerateTimetableInputSchema, GenerateTimetableOutputSchema } from './data-schemas';
export type { GenerateTimetableInput, GenerateTimetableOutput } from './data-schemas';
