export type MergeData = {
  FirstName?: string | null;
  LastName?: string | null;
  Company?: string | null;
  Title?: string | null;
  JobTitle?: string | null;
};

export const MERGE_TAGS = [
  { tag: "{{FirstName}}", label: "First Name" },
  { tag: "{{LastName}}", label: "Last Name" },
  { tag: "{{Company}}", label: "Company" },
  { tag: "{{Title}}", label: "Title" },
  { tag: "{{JobTitle}}", label: "Job Title" },
];

export function replaceMergeTags(template: string, data: MergeData): string {
  return template
    .replace(/\{\{FirstName\}\}/g, data.FirstName ?? "")
    .replace(/\{\{LastName\}\}/g, data.LastName ?? "")
    .replace(/\{\{Company\}\}/g, data.Company ?? "")
    .replace(/\{\{Title\}\}/g, data.Title ?? "")
    .replace(/\{\{JobTitle\}\}/g, data.JobTitle ?? data.Title ?? "");
}
