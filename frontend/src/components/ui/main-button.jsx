import { Button } from 'antd';

function Button_Dachbptar({ className,textbutton,onClick,icon}) {
  return (
    <Button
    type="primary"
    className={className}
    onClick={onClick}
    style={{
      fontSize: '19px',
      height: '45px',
      borderRadius: '0.5rem',
    }}
    >

    {textbutton}
    {icon}
    </Button>
  ); 
}

export default Button_Dachbptar;