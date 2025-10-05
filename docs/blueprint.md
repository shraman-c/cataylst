# **App Name**: Catalyst

## Core Features:

- Data Upload: Upload student, teacher, room, and course data from CSV/Excel files.
- Timetable Generation: Use an AI-powered genetic algorithm to generate conflict-free timetables.
- Timetable Visualization: Display the generated timetable in a calendar view with drag-and-drop manual adjustments.
- Conflict Detection: Highlight timetable conflicts in real-time for manual correction.
- Personalized Portals: Provide teachers and students with personalized timetable views. Timetable results are generated through an LLM-powered reasoning tool that dynamically filters and arranges the user data into easy-to-digest timetable summaries. 
- Request Changes: Allow teachers and students to request timetable changes.
- Real-Time Updates: Provide real-time updates and notifications via Socket.IO.

## Style Guidelines:

- Primary color: Deep purple (#6750A4) to evoke intellect and innovation.
- Background color: Light gray (#F2F0F9) to provide a clean and modern backdrop.
- Accent color: Blue (#49A1F3) for interactive elements and highlights, enhancing usability.
- Body and headline font: 'Inter', a grotesque-style sans-serif for a modern, machined look, suitable for both headlines and body text.
- Use minimalist, clear icons to represent data types and actions.
- Implement a clean and responsive layout for admin, teacher, and student dashboards, ensuring usability across devices.
- Use subtle animations for generating timetables and real-time updates to provide visual feedback.