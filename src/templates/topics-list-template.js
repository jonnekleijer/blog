// @flow strict
import React from 'react';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Page from '../components/Page';
import Topics from '../components/Post/Topics';
import { useSiteMetadata, useTopicsList } from '../hooks';

const TopicsListTemplate = () => {
  const { title, subtitle } = useSiteMetadata();
  const topics = useTopicsList();

  return (
    <Layout title={`Topics - ${title}`} description={subtitle}>
      <Sidebar />
      <Page title="Topics">
      <Topics topics={topics} />
      </Page>
    </Layout>
  );
};

export default TopicsListTemplate;
