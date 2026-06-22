# Attendance Module Components

This directory contains refactored, production-grade components for the attendance management system. The monolithic 778-line page has been split into focused, reusable components with clear responsibilities.

## Component Structure

### 1. `page-header.tsx`
**Purpose:** Renders the page title, description, and conditional export button.
- Displays "كشف الحضور الأكاديمي الرقمي" heading
- Shows export button only when relevant data exists
- Switches export action based on view mode (course vs. student)

### 2. `attendance-filters.tsx`
**Purpose:** Centralized filter and search controls.
- View mode selector (course/student toggle)
- Department/specialization dropdown
- Academic level filter
- Course selector with filtering
- Student search input with debouncing
- **Fixes select overlap issue** by using proper `SelectContent` positioning and z-index management

### 3. `course-matrix-table.tsx`
**Purpose:** Displays attendance matrix for a selected course.
- Sticky header with course info
- Horizontal scroll for dates
- Sticky left columns (student ID and name) for easy reference while scrolling
- Interactive cells with dropdown menus for status changes
- Quick link to switch to student view
- Real-time update handling with loading state

### 4. `student-matrix-table.tsx`
**Purpose:** Displays attendance matrix for a selected student across courses.
- Sticky course names for easy reference
- Dynamic lecture columns (max length auto-calculated)
- Date information inline with status
- Interactive cells with dropdown menus
- Smart responsive height with scroll area

### 5. `student-selector.tsx`
**Purpose:** Sidebar component for browsing and selecting students.
- Scrollable list of search results
- Visual selection state (highlighted when selected)
- Displays student info (name, ID, specialization, level)
- Adapts to loading and empty states

### 6. `empty-states.tsx`
**Purpose:** Reusable empty state components for various scenarios.
- `SelectCourseEmptyState` - When no course is selected
- `NoStudentsEmptyState` - When course has no enrolled students
- `LoadingEmptyState` - Generic loading indicator
- `SelectStudentEmptyState` - When no student is selected in student view
- `StudentLoadingEmptyState` - Loading state for student data
- `NoStudentCoursesEmptyState` - When student is not enrolled in any courses

## Key Improvements

### Code Organization
- **Reduced complexity:** Main page reduced from 778 lines to 300 lines
- **Separation of concerns:** Each component has a single, clear responsibility
- **Reusability:** Components can be tested and reused independently
- **Maintainability:** Changes to specific features are localized to relevant components

### UI/UX Enhancements
- **Select dropdown fixes:** Proper z-index and positioning prevents overlapping
- **Better loading states:** Dedicated loading components for clarity
- **Responsive scrolling:** Sticky headers maintain context while scrolling
- **Consistent interaction patterns:** All cells use the same dropdown menu pattern
- **Visual feedback:** Loading states and disabled states clearly communicate status

### Performance
- **Component reusability:** Reduces bundle duplication
- **Prop-based rendering:** Easy to add memoization later if needed
- **Delegated state management:** Parent page controls state; components are pure presenters

## Integration

The refactored components integrate seamlessly with existing hooks:
- `useSpecializations()` - Department data
- `useCourses()` - Course listings
- `useStudents()` - Student search and filtering
- `useCourseMatrix()` - Course attendance matrix
- `useStudentMatrix()` - Student attendance across courses
- `useUpdateMatrixCell()` - Real-time cell updates

## Design System Compliance

All components follow the project's design principles:
- **Function over form:** Every element has a clear purpose
- **Academic rigor:** Professional, structured interface
- **High-density clarity:** Complex data without clutter
- **RTL support:** Full support for Arabic right-to-left layout
- **Accessibility:** Clear labels, keyboard navigation, high contrast

## Testing Notes

Each component can be tested independently:
- Pass mock data and callback functions
- Verify rendering and interactions
- Test loading and empty states
- Validate dropdown behaviors without overlaps
