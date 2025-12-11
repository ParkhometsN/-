import React from 'react';
import { Steps } from 'antd';
const StepsOfProject = ({stepsproject}) => (
  <Steps
    className='customsteps'
    items={stepsproject}
  />
);
export default StepsOfProject;

