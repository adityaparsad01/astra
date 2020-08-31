import CountUp from '../components/CountUp';
import useStickySWR from '../hooks/useStickySWR';
import styles from '../styles/home.module.scss';

import {CalendarIcon, NorthStarIcon} from '@primer/octicons-react';
import {
  format,
  formatISO,
  parseISO,
  differenceInDays,
  subDays,
  addDays,
} from 'date-fns';
import equal from 'fast-deep-equal';
import Head from 'next/head';
import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {useKey} from 'react-use';
import useKeyboardJs from 'react-use/lib/useKeyboardJs';
import useSWR from 'swr';

const API_BASE = 'https://api.jrmyphlmn.com/fitness';
const NEXT_API_BASE =
  process.env.NODE_ENV === 'production'
    ? 'https://fitness.jrmyphlmn.com/api'
    : 'http://localhost:3000/api';

const fetcher = (url) =>
  fetch(url)
    .then((response) => {
      return response.json();
    })
    .catch((error) => console.log(error));

const abbreviate = (name) => {
  return name.slice(0, 3);
};

const Home = ({initialData, initialMetaData}) => {
  const [date, setDate] = useState(
    formatISO(new Date(), {representation: 'date'})
  );
  const [isTimelineVisible, setIsTimelineVisible] = useState(false);
  const [timelineDelta, setTimelineDelta] = useState(0);
  const {data: meta} = useSWR(`${API_BASE}/meta.json`, fetcher, {
    ...{initialData: initialMetaData},
  });

  const {data: preData, mutate, isValidating} = useStickySWR(
    Object.keys(meta).includes(date)
      ? formatISO(new Date(), {representation: 'date'}) === date
        ? `${NEXT_API_BASE}/today`
        : `${API_BASE}/${date}.json`
      : null,
    fetcher,
    {
      ...{initialData},
    }
  );

  const data = useMemo(() => {
    if (equal(preData, {}) || !preData || !Object.keys(meta).includes(date)) {
      return {
        meals: {
          breakfast: {
            entries: [],
            total: {},
          },
          lunch: {
            entries: [],
            total: {},
          },
          dinner: {
            entries: [],
            total: {},
          },
          snacks: {
            entries: [],
            total: {},
          },
        },
        total: {calories: 1500, carbohydrates: 150, fat: 50, proteins: 113},
        water: 0,
        weight: 0,
      };
    } else return preData;
  }, [preData, date, meta]);

  const getDate = useCallback(
    (day, formatString) => {
      return differenceInDays(
        new Date(),
        subDays(addDays(new Date(), 3), day + timelineDelta)
      ) >= 0
        ? format(
            subDays(addDays(new Date(), 3), day + timelineDelta),
            formatString
          )
        : 'xx';
    },
    [timelineDelta]
  );

  const [leftWeek] = useKeyboardJs('shift + left');
  const [rightWeek] = useKeyboardJs('shift + right');

  useKey('ArrowLeft', () => {
    setTimelineDelta((delta) => delta + 1);
  });
  useKey('ArrowRight', () => {
    setTimelineDelta((delta) => delta - 1);
  });
  useKey('ArrowUp', () => {
    setTimelineDelta(0);
  });
  useKey('Escape', () => {
    setIsTimelineVisible(false);
  });
  useKey('t', () => {
    setIsTimelineVisible(true);
  });

  useEffect(() => {
    if (leftWeek) {
      isTimelineVisible ? setTimelineDelta((delta) => delta + 7) : null;
    } else if (rightWeek) {
      isTimelineVisible ? setTimelineDelta((delta) => delta - 7) : null;
    }
  }, [leftWeek, rightWeek, isTimelineVisible]);

  useEffect(() => {
    if (isTimelineVisible) {
      setDate(getDate(3, 'yyyy-LL-dd'));
    }
  }, [timelineDelta, getDate, isTimelineVisible]);

  useEffect(() => {
    mutate();
    // eslint-ignore-next-line
  }, [date, mutate]);

  return (
    <div className={styles.home}>
      <Head>
        <title>Astra</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {isValidating && (
        <div className={styles.loading}>
          <NorthStarIcon />
        </div>
      )}

      <h2 className={styles.heading}>{format(parseISO(date), 'dd LLL')}</h2>
      <p className={styles.subheading}>{`∆ ${
        meta[formatISO(subDays(new Date(date), 1), {representation: 'date'})]
          ?.weight || '?'
      }kg → ${meta[date]?.weight || '?'}kg`}</p>

      <div
        className={styles['timeline-icon']}
        onClick={() => {
          setIsTimelineVisible((value) => !value);
        }}
      >
        <CalendarIcon />
        <div className={styles.shortcut}>{isTimelineVisible ? 'ESC' : 'T'}</div>
      </div>

      {isTimelineVisible && (
        <React.Fragment>
          <div className={styles.month}>{getDate(3, 'LLL yyyy')}</div>

          <div className={styles.timeline}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div
                key={day}
                className={styles.day}
                onClick={() => {
                  getDate(day, 'dd') !== 'xx'
                    ? setTimelineDelta(timelineDelta + day - 3)
                    : null;
                }}
              >
                {getDate(day, 'dd')}
              </div>
            ))}
          </div>

          <div className={styles.controls}>
            <div
              className={styles.control}
              onClick={setTimelineDelta.bind(this, timelineDelta + 7 * 4)}
            >
              ⇧←
            </div>

            <div
              className={styles.control}
              onClick={setTimelineDelta.bind(this, timelineDelta + 7)}
            >
              ←
            </div>

            <div
              className={styles.control}
              onClick={setTimelineDelta.bind(this, 0)}
            >
              &nbsp;↑&nbsp;
            </div>

            <div
              className={styles.control}
              onClick={setTimelineDelta.bind(this, timelineDelta - 7)}
              disabled={true}
            >
              →
            </div>

            <div
              className={styles.control}
              onClick={setTimelineDelta.bind(this, timelineDelta - 7 * 4)}
            >
              ⇧→
            </div>
          </div>
        </React.Fragment>
      )}

      <div className={styles.summary}>
        <div className={styles.left}>
          <div className={styles.title}>water</div>
          <div className={styles.value}>
            <CountUp number={data.water || 0} unit={'ml'} />
          </div>
        </div>

        <div className={styles.right}>
          {Object.keys(data.total)
            .slice(0, 4)
            .map((nutrientName) => (
              <div key={nutrientName} className={styles.nutrient}>
                <div className={styles.title}>{abbreviate(nutrientName)}</div>
                <div className={styles.value}>
                  <CountUp
                    number={data.total[nutrientName]}
                    unit={nutrientName === 'calories' ? '' : 'g'}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className={styles.meals}>
        {Object.keys(data.meals).map((meal) => (
          <React.Fragment key={meal}>
            <h4
              className={
                data.meals[meal].entries.length > 0
                  ? styles['active-title']
                  : styles.title
              }
            >
              {meal}
            </h4>

            <div className={styles.entries}>
              {data.meals[meal].entries.map((entry, index) => (
                <div key={index} className={styles.entry}>
                  <div className={styles.left}>{entry.name}</div>

                  <div className={styles.right}>
                    {Object.keys(entry.total)
                      .slice(0, 4)
                      .map((nutrientName) => (
                        <div key={nutrientName} className={styles.nutrient}>
                          <CountUp
                            number={entry.total[nutrientName]}
                            unit={nutrientName === 'calories' ? '' : 'g'}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

Home.getInitialProps = async (context) => {
  const data = await fetcher(`${NEXT_API_BASE}/today`);
  const metaData = await fetcher(`${API_BASE}/meta.json`);
  return {initialData: data, initialMetaData: metaData};
};

export default Home;
