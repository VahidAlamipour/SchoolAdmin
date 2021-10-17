export interface IPlagiarismChecker {
  message: string;
  usageMessage: string;
  usageRatio: number;
  totalPages: number;
  pagesUsedCount: number;
  pagesLeftCount: number;
  contactEmail: string;
  info: any;
}
