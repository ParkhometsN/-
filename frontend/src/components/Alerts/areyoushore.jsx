import { Button} from 'antd';

export default function AreYoushore({dangerbutton,defaultbutton,titleDangerAlert,descriptiondangeralert,Defaultbuttontext,dangerbuttontext}){
    return(
        <>
        <div className="addtask_container areyushireoisition">
            <div className="AddStuffalertAreYpushore">
                <div className="title_closed_stuff">
                    <p>{titleDangerAlert}</p>
                </div>
                <div className="white_background_areyoushote background_shadowdd">
                    <p>{descriptiondangeralert}</p>
                    <div className="buttonsssss">
                        <Button className='dangerwhith'  onClick={defaultbutton}>{Defaultbuttontext}</Button>
                        <Button className='dangerwhith' onClick={dangerbutton} type="primary" danger>{dangerbuttontext}</Button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}
