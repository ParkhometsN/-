export default function Addtaskprojectadlert ({titletaskpriject,descriptionaddtaskproject,timeaddtaskprojectalert}){
    return(
        <>
        <div className="bacgroundaddtaskpriject">
            <div className="containeraddtaskproject">
                <div className="maininfaddtaskproject">
                    <p className="addtaskprojectittle">{titletaskpriject}</p>
                    <p className="descriptionaddtaskalertproject">{descriptionaddtaskproject}</p>
                    <p className="timeaddtaskprojectalert">{timeaddtaskprojectalert}</p>
                </div>
            </div>
        </div>
        </>
    )
}