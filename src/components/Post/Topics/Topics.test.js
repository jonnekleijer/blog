// @flow strict
import React from 'react';
import renderer from 'react-test-renderer';
import Topics from './Topics';

describe('Topics', () => {
  it('renders correctly', () => {
    const props = {
      topics: [
        'test_0',
        'test_1'
      ],
      topicSlugs: [
        '/test_0',
        '/test_1'
      ]
    };

    const tree = renderer.create(<Topics {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
