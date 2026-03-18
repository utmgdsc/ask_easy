import { StudentRecord } from "./types";

/**
 * Placeholder function to fetch existing students for a course from the database.
 * Replace with actual API call when backend is ready.
 */
export const get_students_info = async (courseCode: string): Promise<StudentRecord[]> => {
  console.log("Fetching students for course:", courseCode);
  // Simulated existing students in the database
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [
    { givenName: "Alice", surname: "Johnson", utorid: "johna01" },
    { givenName: "Bob", surname: "Smith", utorid: "smitb02" },
    { givenName: "Carol", surname: "Williams", utorid: "willc03" },
    { givenName: "David", surname: "Brown", utorid: "browd04" },
    { givenName: "Eve", surname: "Davis", utorid: "davie05" },
  ];
};

/**
 * Placeholder function to fetch existing TAs for a course from the database.
 * Replace with actual API call when backend is ready.
 */
export const get_ta_info = async (courseCode: string): Promise<string[]> => {
  console.log("Fetching TAs for course:", courseCode);
  // Simulated existing TAs in the database
  await new Promise((resolve) => setTimeout(resolve, 300));
  return ["jones01", "lee02", "park03"];
};
