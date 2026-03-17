import { CSVRow, ProcessedClassData, StudentRecord } from "./types";

export const processRawData = (rawData: CSVRow[]): ProcessedClassData => {
  const processStudent = (row: CSVRow): StudentRecord => ({
    givenName: row["Given Name"] || "Unknown",
    surname: row["Surname"] || "Student",
    utorid: row["UTORid"] || row["Person ID"] || "Missing UTORid",
    ...row,
  });

  const students = rawData
    .map(processStudent)
    .filter((s) => s.givenName !== "Unknown" && s.utorid !== "Missing UTORid");

  const firstRowCourseCode = rawData.length > 0 ? rawData[0]["Acad_act"] || "" : "";
  const extractedCourseCode = firstRowCourseCode
    ? firstRowCourseCode.split(",")[0].trim()
    : "Unknown Course";

  const primeTM = rawData.length > 0 ? rawData[0]["Prime TM"] || "" : "";
  const primeSNR = rawData.length > 0 ? rawData[0]["Prime SNR"] || "" : "";

  const extractedLectureSection =
    primeTM && primeSNR ? `${primeTM.trim()} ${primeSNR.trim()}` : "Unknown Section";

  return {
    courseCode: extractedCourseCode,
    lectureSection: extractedLectureSection,
    students:
      students.length > 0 ? students : [{ givenName: "ERROR", surname: "ERROR", utorid: "ERROR" }],
    tas: [],
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
