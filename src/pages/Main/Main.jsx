import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import Loader from '../../components/Loader/Loader';

import styles from './Main.module.scss';

/* COMPONETS */
const Homepage = lazy(() => import('../HomePage/HomePage'));

export default function Index() {
  return (
    <Suspense fallback={<Loader />}>
      <div className={styles.container}>
        <Router>
          <Switch>
            <Route path="/">
              <Homepage />
            </Route>
          </Switch>
        </Router>
      </div>
    </Suspense>
  );
}
