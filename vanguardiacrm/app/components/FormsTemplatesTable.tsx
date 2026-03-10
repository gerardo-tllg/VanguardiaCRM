const formTemplates = [
  {
    id: "form_001",
    title: "Treatment Form",
    updatedAt: "Last updated: 11 months ago",
    questionCount: 8,
    submissionCount: 53,
  },
  {
    id: "form_002",
    title: "Personal Injury Document Upload",
    updatedAt: "Last updated: over 1 year ago",
    questionCount: 0,
    submissionCount: 0,
  },
  {
    id: "form_003",
    title: "Personal Injury Intake",
    updatedAt: "Last updated: over 1 year ago",
    questionCount: 1,
    submissionCount: 0,
  },
  {
    id: "form_004",
    title: "Maria Martinez-Medina Release",
    updatedAt: "Last updated: 9 months ago",
    questionCount: 0,
    submissionCount: 0,
  },
];

export default function FormsTemplatesTable() {
  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
      {formTemplates.map((form, index) => (
        <div
          key={form.id}
          className={`flex items-center justify-between gap-4 px-5 py-5 ${
            index !== formTemplates.length - 1 ? "border-b border-[#eeeeee]" : ""
          }`}
        >
          <div>
            <div className="text-2xl font-semibold text-[#2b2b2b]">{form.title}</div>
            <div className="mt-1 text-sm text-[#6b6b6b]">{form.updatedAt}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm text-[#6b6b6b]">
              {form.questionCount} Questions
            </div>
            <div className="rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm text-[#6b6b6b]">
              {form.submissionCount} Submissions
            </div>
          </div>
        </div>
      ))}

      <div className="border-t border-[#eeeeee] px-5 py-5">
        <button className="rounded-md border border-[#d9d9d9] bg-white px-4 py-2 text-sm font-medium text-[#6b6b6b] hover:bg-[#f7f7f7]">
          SHOW ARCHIVED FORMS
        </button>
      </div>
    </div>
  );
};