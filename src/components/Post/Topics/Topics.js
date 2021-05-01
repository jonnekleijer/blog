// @flow strict
import React from 'react';
import { Link } from 'gatsby';
import kebabCase from 'lodash/kebabCase';
import styles from './Topics.module.scss';

type Props = {
  topics: string[]
};

const Topics = ({ topics }: Props) => (
  <div className={styles['topics']}>
    <ul className={styles['topics__list']}>
      {topics.map((topic) => (
        <li className={styles['topics__list-item']} key={topic}>
          <Link to={`/topic/${kebabCase(topic)}`} className={styles['topics__list-item-link']}>
            {topic}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default Topics;
