'use strict';

module.exports = {
  markdownRemark: {
    id: 'test-123',
    html: '<p>test</p>',
    fields: {
      topicSlugs: [
        '/test_0',
        '/test_1'
      ]
    },
    frontmatter: {
      date: '2016-09-01',
      description: 'test',
      title: 'test',
      topics: [
        'test_0',
        'test_1'
      ]
    }
  }
};
