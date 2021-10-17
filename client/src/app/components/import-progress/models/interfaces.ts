export interface ImportItem {
  id?: any;
  mode: 'educator' | 'learner' | 'parent';
  progress: {
    isStopped?: boolean;
    value: number; // 0-100%
    lines: number; // total lines in doc
    errors: { line: number; name: string; description: string }[];
  };
  structure: {
    city: string;
    school: string;
    segment?: string;
    level?: string;
    class?: string;
  };
}
