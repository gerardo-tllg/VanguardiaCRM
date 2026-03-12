export type LeadNoteRecord = {
  id: string;
  created_at: string;
  lead_id: string;
  author_email: string | null;
  body: string;
};