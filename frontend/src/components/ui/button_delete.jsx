
const ButtonDelete = ({textOF_button,onClick}) => {
  return (
    <>
    <button onClick={onClick} className="ButtonDelete">{textOF_button}</button>
    </>
  );
};
export default ButtonDelete;