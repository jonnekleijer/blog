// @flow strict
import { useStaticQuery, graphql } from 'gatsby';

const useTopicsList = () => {
  const { allMarkdownRemark } = useStaticQuery(
    graphql`
      query TopicsListQuery {
        allMarkdownRemark(
          filter: { frontmatter: { template: { eq: "post" }, draft: { ne: true } } }
        ) {
          group(field: frontmatter___topics) {
            fieldValue
            totalCount
          }
        }
      }
    `
  );
  return allMarkdownRemark.group
    .sort((a, b) => b.totalCount - a.totalCount || a.fieldValue - b.fieldValue)
    .map((topic) => topic.fieldValue);
};

export default useTopicsList;
