// @flow strict
import React from 'react';
import { Link } from 'gatsby';
import kebabCase from 'lodash/kebabCase';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Page from '../components/Page';
import { useSiteMetadata, useTopicsList } from '../hooks';

const TopicsListTemplate = () => {
  const { title, subtitle } = useSiteMetadata();
  const topics = useTopicsList();

  return (
    <Layout title={`Topics - ${title}`} description={subtitle}>
      <Sidebar />
      <Page title="Topics">
        <ul>
          {topics.map((topic) => (
            <li key={topic.fieldValue}>
              <Link to={`/topic/${kebabCase(topic.fieldValue)}/`}>
                {topic.fieldValue} ({topic.totalCount})
              </Link>
            </li>
          ))}
        </ul>
      </Page>
    </Layout>
  );
};

export default TopicsListTemplate;
