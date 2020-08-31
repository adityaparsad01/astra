import React from 'react';
import {useSpring, animated, config} from 'react-spring';

const CountUp = ({number, unit}) => {
  const spring = useSpring({
    number: number || 0,
    from: {number: number},
    config: {...config.stiff, clamp: true},
  });

  return (
    <animated.div>
      {spring.number.interpolate((number) => `${Math.ceil(number)}${unit}`)}
    </animated.div>
  );
};

export default CountUp;
