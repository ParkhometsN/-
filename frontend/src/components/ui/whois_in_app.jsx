export default function WhoisInApp ({NameUser,PositionUser}){

    return(
        <>
        <div className="NameOfUser"><p>{NameUser}</p></div>
        <div className="PositionUser"><p>{PositionUser}</p></div>
        </>
    );
}