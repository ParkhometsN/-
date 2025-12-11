import React from 'react';
import { Alert } from 'antd';
const SuccessAlertGreen = ({TextSuccessAlert,className}) => (
  <>
    <Alert
      className={className}
     message={TextSuccessAlert}
      type="success"
      showIcon />
  </>
);
export default SuccessAlertGreen;