export interface UploadedPaper {
  paper_id: string;
  filename: string;
  status: string;
  size_bytes?: number;
}

export interface UploadResponse {
  project_id: string;
  paper_count: number;
  papers: UploadedPaper[];
  status: string;
}
