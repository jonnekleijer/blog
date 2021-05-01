// @flow strict
import React from 'react';
import { Link } from 'gatsby';
import styles from './Topics.module.scss';

type Props = {
  topics: string[],
  topicSlugs: string[]
};

const Topics = ({ topics, topicSlugs }: Props) => (
  <div className={styles['topics']}>
    <ul className={styles['topics__list']}>
      {topicSlugs && topicSlugs.map((slug, i) => (
        <li className={styles['topics__list-item']} key={topics[i]}>
          <Link to={slug} className={styles['topics__list-item-link']}>
            {topics[i]}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default Topics;
