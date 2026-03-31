import { CSVRow, ProcessedClassData, StudentRecord } from "./types";

export const processRawData = (rawData: CSVRow[]): ProcessedClassData => {
  const processStudent = (row: CSVRow): StudentRecord => {
    const givenName = (row["Given Name"] ?? "").trim();
    const surname = (row["Surname"] ?? "").trim();
    const preferredName = (row["Prefered Name"] ?? row["Preferred Name"] ?? "").trim();
    const utorid = (row["UTORid"] ?? row["Person ID"] ?? "").trim();

    const displayName = `${preferredName || givenName} ${surname}`.replace(/\s+/g, " ").trim();

    return {
      ...row,
      givenName: givenName || "Unknown",
      surname: surname || "Student",
      preferredName,
      displayName,
      utorid: utorid || "Missing UTORid",
    };
  };

  const students = rawData
    .map(processStudent)
    .filter((s) => s.givenName !== "Unknown" && s.utorid !== "Missing UTORid");

  const firstRowCourseCode = rawData.length > 0 ? rawData[0]["Acad_act"] || "" : "";
  const extractedCourseCode = firstRowCourseCode
    ? firstRowCourseCode.split(",")[0].trim()
    : "Unknown Course";

  return {
    courseCode: extractedCourseCode,
    students:
      students.length > 0
        ? students
        : [
            {
              givenName: "ERROR",
              surname: "ERROR",
              preferredName: "",
              displayName: "ERROR",
              utorid: "ERROR",
            },
          ],
  };
};

export const parseAndProcessCSV = (file: File): Promise<ProcessedClassData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        let lines = text.split("\n").filter((line) => line.trim() !== "");
        lines = lines.map((line) => line.replace(/\r/g, ""));

        if (lines.length > 0) {
          const headers = lines[0].split(",");
          const data: CSVRow[] = lines.slice(1).map((line) => {
            const values = line.split(",");
            const row: CSVRow = {};
            headers.forEach((headerElement, index) => {
              row[headerElement.trim()] = values[index]?.trim() || "";
            });
            return row;
          });

          const processed = processRawData(data);
          resolve(processed);
        } else {
          reject(new Error("CSV file is empty"));
        }
      } else {
        reject(new Error("Failed to read text from file"));
      }
    };
    reader.onerror = () => reject(new Error("File reading error"));
    reader.readAsText(file);
  });
};
