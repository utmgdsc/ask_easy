import { CSVRow, ProcessedClassData, StudentRecord } from "./types";

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } // escaped quote
        else inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else if (ch === "\r") {
        /* skip */
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

const findHeader = (headers: string[], name: string): string =>
  headers.find((h) => h.toLowerCase() === name.toLowerCase()) ?? name;

export const processRawData = (rawData: CSVRow[], headers: string[] = []): ProcessedClassData => {
  const utoridKey = findHeader(headers, "UTORid");
  const personIdKey = findHeader(headers, "Person ID");
  const givenKey = findHeader(headers, "Given Name");
  const surnameKey = findHeader(headers, "Surname");
  const acadKey = findHeader(headers, "Acad_act");

  const isLoginLike = (s: string) => /[a-zA-Z]/.test(s);

  const processStudent = (row: CSVRow): StudentRecord => {
    const rawUtorid = row[utoridKey] || "";
    const rawPersonId = row[personIdKey] || "";
    const utorid = rawUtorid || (isLoginLike(rawPersonId) ? rawPersonId : "") || "Missing UTORid";

    return {
      givenName: row[givenKey] || "Unknown",
      surname: row[surnameKey] || "Student",
      utorid,
      ...row,
    };
  };

  const students = rawData
    .map(processStudent)
    .filter((s) => s.givenName !== "Unknown" && s.utorid !== "Missing UTORid");

  const firstRowCourseCode = rawData.length > 0 ? rawData[0][acadKey] || "" : "";
  const extractedCourseCode = firstRowCourseCode
    ? firstRowCourseCode.split(",")[0].trim()
    : "Unknown Course";

  return {
    courseCode: extractedCourseCode,
    students:
      students.length > 0 ? students : [{ givenName: "ERROR", surname: "ERROR", utorid: "ERROR" }],
  };
};

export const parseAndProcessCSV = (file: File): Promise<ProcessedClassData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target?.result as string;
      if (text) {
        // Strip UTF-8 BOM if present (common in Excel exports)
        if (text.startsWith("\uFEFF")) text = text.slice(1);

        const lines = text.split("\n").filter((line) => line.trim() !== "");

        if (lines.length > 0) {
          const headers = splitCsvLine(lines[0]);
          const data: CSVRow[] = lines.slice(1).map((line) => {
            const values = splitCsvLine(line);
            const row: CSVRow = {};
            headers.forEach((header, index) => {
              row[header] = values[index] ?? "";
            });
            return row;
          });

          const processed = processRawData(data, headers);
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
