import ClosedButton from "../ui/closedButton";
import { Input } from 'antd';
const { TextArea } = Input;
import { Button } from 'antd';
import Calendariconsvg from "../ui/iconssvg/calendar_svg";
import { useState, useEffect } from 'react';
import axios from "axios";
import LoaderMain from "../ui/loader";

export default function OpenTaskRead({ closedAddtask, task, entertask }) {
    const [taskData, setTaskData] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const realtime = new Date();
    const onlyDate = realtime.toLocaleDateString();
    
    // Загружаем полные данные задачи и файлы
    useEffect(() => {
        const fetchTaskData = async () => {
            if (!task?.idtask) return;
            
            try {
                setLoading(true);
                
                // 1. Загружаем полные данные задачи
                const taskRes = await axios.get(`http://127.0.0.1:8000/api/tasks/${task.idtask}`);
                
                // 2. Загружаем файлы задачи
                try {
                    const filesRes = await axios.get(`http://127.0.0.1:8000/api/tasks/${task.idtask}/files`);
                    setFiles(filesRes.data || []);
                } catch {
                    console.log('Файлы не загружены или эндпоинт не реализован');
                    setFiles([]);
                }
                
                // Объединяем данные
                setTaskData({
                    ...taskRes.data,
                    TitleOFTasks: taskRes.data.task_name || task.TitleOFTasks,
                    DescriptionTask: taskRes.data.description || task.DescriptionTask,
                    orederhuman: taskRes.data.executor_name || task.orederhuman,
                    taskforpeoject: taskRes.data.project_name || task.taskforpeoject,
                    startDate: taskRes.data.start_date,
                    endDate: taskRes.data.end_date,
                    status: taskRes.data.status,
                    priority: taskRes.data.priority
                });
                
            } catch (err) {
                console.error('Ошибка загрузки данных задачи:', err);
                // Используем данные из пропса если API не работает
                setTaskData(task);
            } finally {
                setLoading(false);
            }
        };
        
        fetchTaskData();
    }, [task]);
    
    // Функция для открытия файла в браузере
    const openFile = (file) => {
        if (!file) {
            alert('Файл не доступен');
            return;
        }
        
        // Если у файла есть file_id (новый API), открываем через view endpoint
        if (file.file_id) {
            const fileUrl = `http://127.0.0.1:8000/api/files/${file.file_id}/view`;
            window.open(fileUrl, '_blank');
        } 
        // Если есть file_path и это уже полный URL
        else if (file.file_path && (file.file_path.startsWith('http://') || file.file_path.startsWith('https://'))) {
            window.open(file.file_path, '_blank');
        } 
        // Если есть file_path, но это относительный путь
        else if (file.file_path && file.file_path.startsWith('/')) {
            const fileUrl = `http://127.0.0.1:8000${file.file_path}`;
            window.open(fileUrl, '_blank');
        }
        // Если есть file_path, но без слеша
        else if (file.file_path) {
            const fileUrl = `http://127.0.0.1:8000/${file.file_path}`;
            window.open(fileUrl, '_blank');
        }
        // Устаревший формат - url вместо file_path
        else if (file.url) {
            window.open(file.url, '_blank');
        }
        else {
            alert(`Файл "${file.filename || file.name || 'Файл'}" не доступен`);
        }
    };
    
    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch {
            return dateString;
        }
    };
    
    const displayData = taskData || task;
    
    if (loading) {
        return (
            <div className="addtask_container addtaskalerttttt">
                <div className="Addtaskalert">
                    <div className="title_closed">
                        <p>Задача</p>
                        <button onClick={closedAddtask}> <ClosedButton/></button>
                    </div>
                    <div className="backgroundtask_white background_shadowdd" style={{ 
                        padding: '40px 20px', 
                        textAlign: 'center', 
                        color: '#666' 
                    }}>
                        <LoaderMain/>
                    </div>
                </div>
            </div>
        );
    }
    
    return(
        <>
        <div className="addtask_container addtaskalerttttt">
            <div className="Addtaskalert">
                <div className="title_closed">
                    <p>Задача</p>
                    <button onClick={closedAddtask}> <ClosedButton/></button>
                </div>
                {displayData &&(
                    <div className="backgroundtask_white background_shadowdd">
                        <div className="brothers">
                            <input 
                                className="inputtitileoftask" 
                                type="text" 
                                defaultValue={displayData.TitleOFTasks || 'Без названия'}
                                readOnly
                            />
                            <div className="linetitle"></div>
                        </div>
                        <div className="inputs_">
                            <div className="weiojfpiw">
                                <TextArea
                                    readOnly={true}
                                    className="textareakddkd"
                                    defaultValue={displayData.DescriptionTask || 'Нет описания'}
                                    autoSize={{ minRows: 6, maxRows: 5 }}
                                />
                            </div>
                            
                            <div className="files_ofprojectcustom">
                                <p>Файлы</p>
                                <div className="containerfilesprcustom">
                                    
                                    {files.length > 0 ? (
                                        files.map((file, index) => (
                                            <div 
                                                key={index} 
                                                className="blocklinkfile"
                                                onClick={() => openFile(file)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <p>{file.filename || file.name || 'Файл'}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="blocklinkfile">
                                                <p>нет файлов</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {files.length === 0 && (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        color: '#999', 
                                        marginTop: '10px',
                                        fontSize: '12px'
                                    }}>
                                        Файлы не прикреплены к задаче
                                    </div>
                                )}
                            </div>
                            
                            <div className="brothers_dropdown flex justify-between">
                                <div className="prjectstaff">
                                    <div className="erg">
                                        <p>сотрудник</p>
                                        <div className="staffchose">
                                            <p>{displayData.orederhuman || 'Не назначено'}</p>
                                        </div>
                                    </div>
                                    <div className="erg">
                                        <p>проект</p>
                                        <div className="staffchose">
                                            <p>{displayData.taskforpeoject || 'Без проекта'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="timecontainerpri">
                                <div className="blocktime fortaskopen">
                                    {formatDate(displayData.start_date || displayData.startDate || displayData.starttimeOFproject)}
                                    <Calendariconsvg/>
                                </div>
                                <div className="line"></div>
                                <div className="blocktime fortaskopen">
                                    {formatDate(displayData.end_date || displayData.endDate || displayData.TimeOFTask || displayData.endtimeOFproject)}
                                    <Calendariconsvg/>
                                </div>
                            </div>
                            
                            <div className="time_and_button qergeqrgwefwef">
                                <p>Дата создания: {onlyDate}</p>
                                {displayData.status !== 'completed' && (
                                    <Button onClick={entertask} type="primary">
                                        Выполненно
                                    </Button>
                                )}
                                {displayData.status === 'completed' && (
                                    <div style={{ 
                                        padding: '8px 16px', 
                                        backgroundColor: '#f6ffed', 
                                        borderRadius: '4px',
                                        color: '#52c41a',
                                        fontSize: '14px'
                                    }}>
                                        выполненно
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    )
}