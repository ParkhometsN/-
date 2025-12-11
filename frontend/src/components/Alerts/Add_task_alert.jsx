import ClosedButton from "../ui/closedButton";
import {useState, useEffect} from "react";
import { Input } from 'antd';
const { TextArea } = Input;
import { Button, Dropdown} from 'antd';
import Selectdeadline from "../ui/selectdedline";
import axios from "axios";
import LoaderMain from "../ui/loader";

export default function AddTaskAlert({closedAddtask, safetaskinlist}){
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [saving, setSaving] = useState(false);
    
    
    // Загрузка данных
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const realtime = new Date();
    const onlyDate = realtime.toLocaleDateString();

    // Загружаем сотрудников и проекты
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Получаем всех сотрудников
                const empRes = await axios.get('http://127.0.0.1:8000/api/employees');
                setEmployees(empRes.data);
                
                // Получаем все проекты
                const projRes = await axios.get('http://127.0.0.1:8000/api/projects');
                setProjects(projRes.data);
                
                setLoading(false);
            } catch (err) {
                console.error("Ошибка загрузки данных:", err);
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    // Формируем меню сотрудников
    const employeeItems = employees.map(employee => ({
        key: `employee_${employee.employee_id}`,
        label: employee.full_name,
        onClick: () => {
            setSelectedEmployee(employee.full_name);
            setSelectedEmployeeId(employee.employee_id);
        }
    }));

    // Формируем меню проектов
    const projectItems = projects.map(project => ({
        key: `project_${project.project_id}`,
        label: project.project_name,
        onClick: () => {
            setSelectedProject(project.project_name);
            setSelectedProjectId(project.project_id);
        }
    }));

    // Обработка выбора даты начала
    const handleStartDateChange = (dateString) => {
        setStartDate(dateString);
    };

    // Обработка выбора даты окончания
    const handleEndDateChange = (dateString) => {
        setEndDate(dateString);
    };

    // Обработка выбора файлов
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            console.log('Выбраны файлы:', files.map(f => f.name));
        }
    };

    // Удаление файла из списка
    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Загрузка файлов на сервер
    const uploadFiles = async (taskId) => {
        if (selectedFiles.length === 0) return;

        setUploadingFiles(true);
        try {
            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append('file', file);

                await axios.post(`http://127.0.0.1:8000/api/tasks/${taskId}/files`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }
            console.log("Все файлы успешно загружены");
        } catch (err) {
            console.error("Ошибка при загрузке файлов:", err);
            // Можно показать уведомление, но не прерывать создание задачи
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleSaveTask = async () => {
        if (!title.trim()) {
            alert("Введите название задачи");
            return;
        }
        
        if (!selectedEmployeeId) {
            alert("Выберите исполнителя");
            return;
        }
        
        if (!selectedProjectId) {
            alert("Выберите проект");
            return;
        }

        try {
            setSaving(true);
            
            // 1. Создаем задачу
            const taskData = {
                task_name: title,
                description: description || '',
                executor_id: selectedEmployeeId,
                project_id: selectedProjectId,
                start_date: startDate || new Date().toISOString().split('T')[0],
                end_date: endDate,
                status: 'active',
                priority: 'Средний'
            };

            console.log("Отправка задачи:", taskData);

            const response = await axios.post('http://127.0.0.1:8000/api/tasks', taskData);
            
            const createdTask = response.data;
            console.log("Задача создана:", createdTask);

            // 2. Загружаем файлы, если они есть
            if (selectedFiles.length > 0) {
                await uploadFiles(createdTask.task_id);
            }

            // 3. Закрываем окно и обновляем список
            safetaskinlist();
            closedAddtask();
            
        } catch (err) {
            console.error("Ошибка при сохранении задачи:", err);
            if (err.response && err.response.data) {
                alert(`Ошибка: ${err.response.data.detail || 'Не удалось создать задачу'}`);
            } else {
                alert("Ошибка при сохранении задачи");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="addtask_container addtaskalerttttt">
                <div className="Addtaskalert">
                    <div className="title_closed">
                        <p>Добавить задачу</p>
                        <button onClick={closedAddtask}> <ClosedButton/></button>
                    </div>
                    <div className="backgroundtask_white background_shadowdd" style={{padding: '20px', textAlign: 'center'}}>
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
                    <p>Добавить задачу</p>
                    <button onClick={closedAddtask}> <ClosedButton/></button>
                </div>
                <div className="backgroundtask_white background_shadowdd">
                    <div className="brothers">
                        <input 
                            className="inputtitileoftask" 
                            type="text" 
                            placeholder="Название задачи"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <div className="linetitle"></div>
                    </div>
                    <div className="inputs_">
                        <div className="iwoeijfoijq">
                            <div className="weiojfpiw">
                            <TextArea
                                className="textareakddkd"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Описание"
                                autoSize={{ minRows: 6, maxRows: 5 }}
                            />
                        </div>
                        
                        {/* Поле для выбора файлов */}
                        <div className="file-upload-section">
                            <input 
                                type="file" 
                                id="fileInput" 
                                multiple
                                style={{display: 'none'}}
                                onChange={handleFileSelect}
                            />
                            <Button 
                                onClick={() => document.getElementById('fileInput').click()} 
                                className="button_downloadddddd"
                            >
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                                        <path d="M7.74985 10.7493C7.74985 10.9483 7.82886 11.139 7.96952 11.2797C7.96952 11.2797 7.96952 11.2797 7.96952 11.2797C8.11017 11.4203 8.30093 11.4993 8.49985 11.4993C8.69876 11.4993 8.88952 11.4203 9.03018 11.2797C9.03018 11.2797 9.03018 11.2797 9.03018 11.2797C9.17083 11.139 9.24985 10.9483 9.24985 10.7493V5.05934L11.4698 7.27934C11.5385 7.35303 11.6213 7.41213 11.7133 7.45312C11.7133 7.45312 11.7133 7.45312 11.7133 7.45312C11.8053 7.49411 11.9046 7.51615 12.0053 7.51793C12.0053 7.51793 12.0053 7.51793 12.0053 7.51793C12.106 7.51971 12.2061 7.50118 12.2994 7.46346C12.2994 7.46346 12.2994 7.46346 12.2994 7.46346C12.3928 7.42574 12.4777 7.3696 12.5489 7.29838C12.5489 7.29838 12.5489 7.29838 12.5489 7.29838C12.6201 7.22716 12.6762 7.14233 12.714 7.04894C12.714 7.04894 12.714 7.04894 12.714 7.04894C12.7517 6.95555 12.7702 6.85552 12.7684 6.75482C12.7684 6.75482 12.7684 6.75482 12.7684 6.75482C12.7667 6.65411 12.7446 6.5548 12.7036 6.4628C12.7036 6.4628 12.7036 6.4628 12.7036 6.4628C12.6626 6.3708 12.6035 6.288 12.5298 6.21934L9.02985 2.71934C8.88922 2.57889 8.6986 2.5 8.49985 2.5C8.3011 2.5 8.11047 2.57889 7.96985 2.71934L4.46985 6.21934C4.33737 6.36151 4.26524 6.54956 4.26867 6.74386C4.26867 6.74386 4.26867 6.74386 4.26867 6.74386C4.2721 6.93816 4.35081 7.12355 4.48822 7.26096C4.48822 7.26096 4.48822 7.26096 4.48822 7.26096C4.62564 7.39838 4.81102 7.47709 5.00532 7.48052C5.00532 7.48052 5.00532 7.48052 5.00532 7.48052C5.19963 7.48394 5.38767 7.41182 5.52985 7.27934L7.74985 5.05934V10.7493Z" fill="#0051FF"/>
                                        <path d="M4 10.25C4 10.0511 3.92098 9.86032 3.78033 9.71967C3.78033 9.71967 3.78033 9.71967 3.78033 9.71967C3.63968 9.57902 3.44891 9.5 3.25 9.5C3.05109 9.5 2.86032 9.57902 2.71967 9.71967C2.71967 9.71967 2.71967 9.71967 2.71967 9.71967C2.57902 9.86032 2.5 10.0511 2.5 10.25V11.75C2.5 12.4793 2.78973 13.1788 3.30546 13.6945C3.30546 13.6945 3.30546 13.6945 3.30546 13.6945C3.82118 14.2103 4.52065 14.5 5.25 14.5H11.75C12.4793 14.5 13.1788 14.2103 13.6945 13.6945C13.6945 13.6945 13.6945 13.6945 13.6945 13.6945C14.2103 13.1788 14.5 12.4793 14.5 11.75V10.25C14.5 10.0511 14.421 9.86032 14.2803 9.71967C14.2803 9.71967 14.2803 9.71967 14.2803 9.71967C14.1397 9.57902 13.9489 9.5 13.75 9.5C13.5511 9.5 13.3603 9.57902 13.2197 9.71967C13.2197 9.71967 13.2197 9.71967 13.2197 9.71967C13.079 9.86032 13 10.0511 13 10.25V11.75C13 12.44 12.44 13 11.75 13H5.25C4.56 13 4 12.44 4 11.75V10.25Z" fill="#0051FF"/>
                                    </svg>
                                </span>
                                Выбрать файлы
                            </Button>

                            {selectedFiles.length > 0 && (
                                <div className="selected-files-list" style={{marginTop: '10px'}}>
                                    <p style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>
                                        Выбрано файлов: {selectedFiles.length}
                                    </p>
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '5px 10px',
                                            marginBottom: '5px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                            <Button 
                                                type="text" 
                                                size="small" 
                                                danger
                                                onClick={() => removeFile(index)}
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="brothers_dropdown flex justify-between">
                            <Dropdown 
                                menu={{ items: employeeItems }} 
                                placement="bottomLeft"
                                trigger={['click']}
                            >
                                <Button className="dropdownbuttonchoose">
                                    {selectedEmployee || 'Выбрать сотрудника'} 
                                    <svg className="svg_size" xmlns="http://www.w3.org/2000/svg" width="11" height="7" viewBox="0 0 11 7" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M0.775151 0.774947C0.950933 0.599384 1.18921 0.500773 1.43765 0.500773C1.68609 0.500773 1.92437 0.599384 2.10015 0.774947L5.50015 4.17495L8.90015 0.774947C8.98598 0.682839 9.08948 0.608961 9.20448 0.557721C9.31948 0.506481 9.44362 0.478929 9.5695 0.476708C9.69538 0.474487 9.82041 0.497643 9.93715 0.544794C10.0539 0.591945 10.1599 0.662126 10.2489 0.75115C10.338 0.840173 10.4082 0.946215 10.4553 1.06295C10.5025 1.17969 10.5256 1.30472 10.5234 1.4306C10.5212 1.55648 10.4936 1.68062 10.4424 1.79562C10.3911 1.91062 10.3173 2.01412 10.2252 2.09995L6.16265 6.16245C5.98687 6.33801 5.74859 6.43662 5.50015 6.43662C5.25171 6.43662 5.01343 6.33801 4.83765 6.16245L0.775151 2.09995C0.599588 1.92417 0.500977 1.68589 0.500977 1.43745C0.500977 1.18901 0.599588 0.950729 0.775151 0.774947Z" fill="#0051FF"/>
                                    </svg>
                                </Button>
                            </Dropdown>
                            
                            <Dropdown 
                                menu={{ items: projectItems }} 
                                placement="bottomRight"
                                trigger={['click']}
                            >
                                <Button className="dropdownbuttonchoose">
                                    {selectedProject || 'Выбрать проект'} 
                                    <svg className="svg_size" xmlns="http://www.w3.org/2000/svg" width="11" height="7" viewBox="0 0 11 7" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M0.775151 0.774947C0.950933 0.599384 1.18921 0.500773 1.43765 0.500773C1.68609 0.500773 1.92437 0.599384 2.10015 0.774947L5.50015 4.17495L8.90015 0.774947C8.98598 0.682839 9.08948 0.608961 9.20448 0.557721C9.31948 0.506481 9.44362 0.478929 9.5695 0.476708C9.69538 0.474487 9.82041 0.497643 9.93715 0.544794C10.0539 0.591945 10.1599 0.662126 10.2489 0.75115C10.338 0.840173 10.4082 0.946215 10.4553 1.06295C10.5025 1.17969 10.5256 1.30472 10.5234 1.4306C10.5212 1.55648 10.4936 1.68062 10.4424 1.79562C10.3911 1.91062 10.3173 2.01412 10.2252 2.09995L6.16265 6.16245C5.98687 6.33801 5.74859 6.43662 5.50015 6.43662C5.25171 6.43662 5.01343 6.33801 4.83765 6.16245L0.775151 2.09995C0.599588 1.92417 0.500977 1.68589 0.500977 1.43745C0.500977 1.18901 0.599588 0.950729 0.775151 0.774947Z" fill="#0051FF"/>
                                    </svg>
                                </Button>
                            </Dropdown>
                        </div>
                        
                        <Selectdeadline 
                            onStartDateChange={handleStartDateChange}
                            onEndDateChange={handleEndDateChange}
                        />
                        </div>
                        
                        <div className="time_and_button qergeqrg">
                            <p>Дата создания: {onlyDate}</p>
                            <Button 
                                onClick={handleSaveTask} 
                                type="primary"
                                loading={saving || uploadingFiles}
                                disabled={saving || uploadingFiles}
                            >
                                {saving ? 'Сохранение...' : 
                                 uploadingFiles ? 'Загрузка файлов...' : 
                                 'сохранить'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}