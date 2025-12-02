export interface SyllabusEntry {
    id: string;
    docId: string;
    subjectCode: string;
    subjectName: string;
    credits?: string;
    prerequisites?: string;
    objectives?: string[];
    outcomes?: string[];
    topics: string[];
    marksCriteria?: Record<string, string>; // e.g., { "Internal": "40", "External": "60" }
    sourcePage: number;
}
