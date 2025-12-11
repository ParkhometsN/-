export default function ProjectButton({onclick,TitleProject,orederhuman,TimeOFproject,DescriptionProject,activepin,newmm}){
    return(
        <>
        <div onClick={onclick} className="projectbutton background_shadowdd ">
            <p className="title_ofproject">{TitleProject}</p>
            <div className="time_order">

                <p className={`orederhuman ${newmm}`}>Зказчик: {orederhuman}</p>
                <p className="TimeOFproject">до - {TimeOFproject}</p>
            </div>
            <p className="DescriptionProject">{DescriptionProject}</p>
            <div className="down_information_projecvt">
                <p className="task_count">13 задач</p>
                <p className="activepin">{activepin}</p>
            </div>
        </div>
        </>
    )
}