// @flow strict
import type { Node as ReactNode } from 'react';

export type RenderCallback = {
  // $FlowFixMe
  render: (data: any) => ReactNode;
}

export type Entry = {
  getIn: (string[]) => string;
}

export type WidgetFor = (string) => string;

export type PageContext = {
  topic: string,
  category: string,
  currentPage: number,
  prevPagePath: string,
  nextPagePath: string,
  hasPrevPage: boolean,
  hasNextPage: boolean
};

export type Node = {
  fields: {
    slug: string,
    categorySlug?: string,
    topicSlugs?: string[]
  },
  frontmatter: {
    date: string,
    description?: string,
    category?: string,
    topics?: string[],
    title: string,
    socialImage?: {
      publicURL: string
    }
  },
  html: string,
  id: string
};

export type Edge = {
  node: Node
};

export type Edges = Array<Edge>;

export type AllMarkdownRemark = {
  allMarkdownRemark: {
    edges: Edges,
  },
  group: {
    fieldValue: string,
    totalCount: number
  }[]
};

export type MarkdownRemark = Node;
