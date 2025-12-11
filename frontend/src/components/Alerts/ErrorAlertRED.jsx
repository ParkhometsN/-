import { Alert } from 'antd';
const ErrorAlertRED = ({TextErrorAlertRED,className}) => (
  <>
    <Alert
     className={className}
      message={TextErrorAlertRED}
       type="error" showIcon />
  </>
);
export default ErrorAlertRED;