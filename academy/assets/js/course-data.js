// ============================================
// ISSA Academy
// Course Data
// ============================================

// -------------------------
// Courses
// -------------------------

export const courses = [

    {
        id: "excel",
        title: "Microsoft Excel Mastery",
        description: "Master Microsoft Excel from Beginner to Advanced level with real-world practical projects.",
        image: "assets/Images/excel-course.jpg",
        duration: "25 Hours",
        totalLessons: 38,
        rating: 4.9,
        students: 1240,
        certificate: true
    }

];

// -------------------------
// Modules
// -------------------------

export const modules = [

    {
        id: 1,
        courseId: "excel",
        title: "Excel Basics"
    },

    {
        id: 2,
        courseId: "excel",
        title: "Formatting"
    },

    {
        id: 3,
        courseId: "excel",
        title: "Formulas & Functions"
    }

];

// -------------------------
// Lessons
// -------------------------

export const lessons = [

    {
        id: 1,
        slug: "excel-001",
        courseId: "excel",
        moduleId: 1,
        title: "Introduction to Excel",
        duration: "10 Minutes",
        description: "Welcome to Microsoft Excel.",
        video: "assets/videos/demo.mp4",
        notes: "#",
        practice: "#"
    },

    {
        id: 2,
        slug: "excel-002",
        courseId: "excel",
        moduleId: 1,
        title: "Excel Interface",
        duration: "14 Minutes",
        description: "Learn the Excel interface.",
        video: "assets/videos/demo.mp4",
        notes: "#",
        practice: "#"
    },

    {
        id: 3,
        slug: "excel-003",
        courseId: "excel",
        moduleId: 1,
        title: "Creating Your First Workbook",
        duration: "12 Minutes",
        description: "Create your first workbook.",
        video: "assets/videos/demo.mp4",
        notes: "#",
        practice: "#"
    }

];