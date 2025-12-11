import { Button } from 'antd';

function MainButton({ className,textbutton,onClick}) {
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
    </Button>
  ); 
}

export default MainButton;