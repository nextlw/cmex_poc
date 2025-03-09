import { ReactNode } from 'react';

export interface DocFile {
  id: string;
  title: string;
  path: string;
  preview: string;
  section: string;
  category: string;
}

export interface DocSection {
  id: string;
  title: string;
  files: DocFile[];
}

export interface DocCategory {
  id: string;
  title: string;
  sections: DocSection[];
}

export interface DocTreeItem {
  id: string;
  label: string;
  type: 'category' | 'section' | 'file';
  children?: DocTreeItem[];
  path?: string;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export interface ConfigPageProps {
  children?: ReactNode;
}

export interface DocViewerProps {
  filePath: string;
  onBack: () => void;
}

export interface DocListProps {
  selectedCategory: string;
  onDocSelect: (path: string) => void;
}

export interface DocSidebarProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string) => void;
} 