// Ambient declaration for runtime-only SheetJS import used by the dashboard export
// This avoids requiring @types/xlsx during development while still allowing dynamic import.
declare module 'xlsx';
