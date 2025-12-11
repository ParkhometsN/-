import { useState, useEffect } from "react";
import TaskButtonDahsboard from "./litleconponents/task_button";
import InProcess from "./litleconponents/progress/inprocess";
import Archived from "./litleconponents/progress/archived";
import Copmleted from "./litleconponents/progress/completed";
import Button_Dachbptar from "../ui/main-button";
import MainInput from "../ui/input";
import AddTaskAlert from "../Alerts/Add_task_alert";
import AddProjectAlert from "../Alerts/add_project";
import ProjectButton from "./litleconponents/project_button";
import Addtaskprojectadlert from "../ui/task_addproject";
import { Steps } from 'antd';
import { Row, Col } from 'antd';
import { Button, Input } from 'antd';
import SuccessAlertGreen from "../Alerts/SuccessALertGreen";
import Calendariconsvg from "../ui/iconssvg/calendar_svg";
import OpenTaskRead from "../Alerts/opentaskread";
import AreYoushore from "../Alerts/areyoushore";
import LoaderMain from '../ui/loader';
import axios from "axios";

const { TextArea } = Input;

export default function MainActive({ currentEmployee }) {
    const [active, setactive] = useState('activebutton1');
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [handleproject, sethandleproject] = useState(true);
    const [openwindowpriject, setopenwindowpriject] = useState(false);
    const [addtask, setAddTask] = useState(false);
    const [addprioject, setaddproject] = useState(false);
    const [actiuvesuccessalert, setactiuvesuccessalert] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [getalertaddtask, setgetalertaddtask] = useState(false);
    const [getopentask, setgetopentask] = useState(false);
    const [etnertaskread, setetnertaskread] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [projectFiles, setProjectFiles] = useState([]);
    const [projectLinks, setProjectLinks] = useState([]);
    const [projectEmployees, setProjectEmployees] = useState([]);
    const [projectStages, setProjectStages] = useState([]);
    const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);
    const [showPostponeConfirm, setShowPostponeConfirm] = useState(false);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    const [projectStatusToChange, setProjectStatusToChange] = useState(null);
    const [projectTasks, setProjectTasks] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);


    
    // Загрузка задач и проектов текущего сотрудника
useEffect(() => {
    if (!currentEmployee?.employee_id) {
        setLoading(false);
        return;
    }

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksRes, projectsRes] = await Promise.all([
                axios.get(`http://127.0.0.1:8000/api/employees/${currentEmployee.employee_id}/tasks`),
                axios.get(`http://127.0.0.1:8000/api/employees/${currentEmployee.employee_id}/projects`)
            ]);

            const formattedTasks = tasksRes.data.map(t => ({
                idtask: t.task_id,
                project_id: t.project_id,
                TitleOFTasks: t.task_name || 'Без названия',
                DescriptionTask: t.description || 'Нет описания',
                TimeOFTask: t.end_date ? new Date(t.end_date).toLocaleDateString('ru-RU') : '—',
                activepin: t.status, 
                orederhuman: t.executor_name || currentEmployee.full_name || 'Не назначено',
                taskforpeoject: t.project_name || 'Без проекта',
                startDate: t.start_date,
                endDate: t.end_date,
                priority: t.priority || 'Средний',
                status: t.status || 'active',
                executor_id: t.executor_id,
                start_date_formatted: t.start_date ? new Date(t.start_date).toLocaleDateString('ru-RU') : '—',
                end_date_formatted: t.end_date ? new Date(t.end_date).toLocaleDateString('ru-RU') : '—'
            }));
            setTasks(formattedTasks);

            const formattedProjects = projectsRes.data.map(p => ({
                idproject: p.project_id,
                TitleOFProject: p.project_name || 'Без названия',
                DescriptionTask: p.description || 'Нет описания',
                TimeOFTask: p.created_date ? new Date(p.created_date).toLocaleDateString('ru-RU') : '—',
                starttimeOFproject: p.start_date ? new Date(p.start_date).toLocaleDateString('ru-RU') : '—',
                endtimeOFproject: p.end_date ? new Date(p.end_date).toLocaleDateString('ru-RU') : '—',
                activepin: p.status,
                orederhuman: p.client_name || p.manager_name || 'Неизвестно',
                emailorderhuman: p.client_email || '',
                phoneorderhuman: p.client_phone || '',
                filesofproject: [] 
            }));
            setProjects(formattedProjects);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
}, [currentEmployee, refreshTrigger]);


 const loadProjectDetails = async (projectId) => {
    if (!projectId) return;
    
    setLoadingProjectDetails(true);
    try {
        // Загружаем ВСЕ данные проекта параллельно, включая задачи
        const [filesRes, linksRes, employeesRes, stagesRes, tasksRes] = await Promise.all([
            axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/files`),
            axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/links`),
            axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/employees`),
            axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/stages`),
            axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/tasks`)
        ]);

        setProjectFiles(filesRes.data || []);
        setProjectLinks(linksRes.data || []);
        setProjectEmployees(employeesRes.data || []);
        setProjectStages(stagesRes.data || []);
        
        // Форматируем задачи проекта в нужный формат
        const formattedProjectTasks = tasksRes.data.map(task => ({
            idtask: task.task_id,
            TitleOFTasks: task.task_name || 'Без названия',
            DescriptionTask: task.description || 'Нет описания',
            TimeOFTask: task.end_date ? new Date(task.end_date).toLocaleDateString('ru-RU') : '—',
            activepin: task.status || 'active',
            orederhuman: task.executor_name || 'Не назначено',
            taskforpeoject: task.project_name || 'Без проекта',
            startDate: task.start_date,
            endDate: task.end_date,
            priority: 'Средний', // по умолчанию
            status: task.status || 'active',
            executor_id: task.executor_id,
            start_date_formatted: task.start_date ? new Date(task.start_date).toLocaleDateString('ru-RU') : '—',
            end_date_formatted: task.end_date ? new Date(task.end_date).toLocaleDateString('ru-RU') : '—'
        }));
        
        setProjectTasks(formattedProjectTasks);
        
        // Устанавливаем текущий этап (если есть активный)
        const activeStageIndex = stagesRes.data.findIndex(stage => stage.status === 'active');
        if (activeStageIndex !== -1) {
            setCurrent(activeStageIndex);
        }
    } catch (err) {
        console.error('Ошибка загрузки деталей проекта:', err);
        // В случае ошибки - пустые массивы
        setProjectFiles([]);
        setProjectLinks([]);
        setProjectEmployees([]);
        setProjectStages([]);
        setProjectTasks([]);
    } finally {
        setLoadingProjectDetails(false);
    }
};

    // Функция для обновления статуса задачи
    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            await axios.put(`http://127.0.0.1:8000/api/tasks/${taskId}/status`, {
                status: newStatus
            });
            
            // Обновляем состояние задач
            setTasks(prevTasks => 
                prevTasks.map(task => 
                    task.idtask === taskId 
                        ? { ...task, activepin: newStatus, status: newStatus }
                        : task
                )
            );
            
            return true;
        } catch (err) {
            console.error('Ошибка обновления статуса:', err);
            return false;
        }
    };
    // Функция для откладывания проекта (открывает модалку)
const handlePostponeProject = () => {
    if (!selectedProjectId) return;
    setProjectStatusToChange('archived');
    setShowPostponeConfirm(true);
};

// Функция для завершения проекта (открывает модалку)
const handleCompleteProject = () => {
    if (!selectedProjectId) return;
    setProjectStatusToChange('completed');
    setShowCompleteConfirm(true);
};

const updateProjectStatus = async (projectId, newStatus) => {
    try {
        const _ = await axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/status`, {
            status: newStatus
        });
        
        // Обновляем состояние проектов
        setProjects(prevProjects => 
            prevProjects.map(project => 
                project.idproject === projectId 
                    ? { ...project, activepin: newStatus }
                    : project
            )
        );
        
        // Если мы в открытом проекте, обновляем выбранный проект
        if (selectedProjectId === projectId) {
            setProjects(prevProjects => {
                const updatedProjects = prevProjects.map(project => 
                    project.idproject === projectId 
                        ? { ...project, activepin: newStatus }
                        : project
                );
                
                // Обновляем выбранный проект
                const updatedProject = updatedProjects.find(p => p.idproject === projectId);
                if (updatedProject) {
                    // Обновляем selectedProject через обновление состояния
                    // Это вызовет перерендер компонента
                    loadProjectDetails(projectId);
                }
                
                return updatedProjects;
            });
        }
        
        // Показываем уведомление об успехе
        setactiuvesuccessalert(true);
        setTimeout(() => {
            setactiuvesuccessalert(false);
            // Если проект отложен или завершен, возвращаемся к списку проектов
            if (newStatus === 'archived' || newStatus === 'completed') {
                whatopen();
            }
        }, 1500);
        
        return true;
    } catch (err) {
        console.error('Ошибка обновления статуса проекта:', err);
        alert('Ошибка при обновлении статуса проекта');
        return false;
    }
};

    // Функция подтверждения изменения статуса
    const confirmStatusChange = async () => {
        if (!selectedProjectId || !projectStatusToChange) return;
        
        const success = await updateProjectStatus(selectedProjectId, projectStatusToChange);
        
        // Закрываем модалку
        setShowPostponeConfirm(false);
        setShowCompleteConfirm(false);
        setProjectStatusToChange(null);
        
        return success;
    };

    // Функция отмены изменения статуса
    const cancelStatusChange = () => {
        setShowPostponeConfirm(false);
        setShowCompleteConfirm(false);
        setProjectStatusToChange(null);
    };
    const HandleButtonActive = (buttonactive) => setactive(buttonactive);

    const getPinFilter = () => {
        if (active === 'activebutton2') return item => item.activepin === 'completed';
        if (active === 'activebutton3') return item => item.activepin === 'active';
        return () => true;
    };

    const pinFilter = getPinFilter();
    const filteredTasks = tasks.filter(task => 
        task.TitleOFTasks.toLowerCase().includes(search.toLowerCase()) && pinFilter(task)
    );
    const filteredProjects = projects.filter(project => 
        project.TitleOFProject.toLowerCase().includes(search.toLowerCase()) && pinFilter(project)
    );

    const clickproject = (project) => {
        sethandleproject(false);
        setopenwindowpriject(true);
        setSelectedProjectId(project.idproject);
        loadProjectDetails(project.idproject);
    };

    const openprojectread = (task) => {
        setgetopentask(true);
        setSelectedTaskId(task.idtask);
    };

    const selectedOpenTask = tasks.find(t => t.idtask === selectedTaskId);
    const selectedProject = projects.find(p => p.idproject === selectedProjectId);

    const whatopen = () => {
        sethandleproject(true);
        setopenwindowpriject(false);
        setShowPostponeConfirm(false);
        setShowCompleteConfirm(false);
        setProjectStatusToChange(null);
    };

    const Savetask = () => {
        setAddTask(false);
        setactiuvesuccessalert(true);
        setTimeout(() => setactiuvesuccessalert(false), 1000);
    };

    const [current, setCurrent] = useState(0);
    const onChange = (value) => setCurrent(value);

    function ChekActive(pin) {
        if (pin === "active") return <InProcess />;
        if (pin === "completed") return <Copmleted />;
        if (pin === "archived") return <Archived />;
        return null;
    }

    const closeentertask = async () => {
        if (selectedTaskId) {
            const success = await updateTaskStatus(selectedTaskId, 'completed');
            if (success) {
                setgetopentask(false);
                setetnertaskread(false);
                setactiuvesuccessalert(true);
                setTimeout(() => setactiuvesuccessalert(false), 1000);
            } else {
                alert('Ошибка при обновлении статуса задачи');
            }
        }
    };

    if (loading) return <LoaderMain/>;
    return (
        <>
            <div className="alerts">
                {getopentask && selectedOpenTask &&(
                    <OpenTaskRead
                        closedAddtask={() => setgetopentask(false)}
                        task={{
                            idtask: selectedOpenTask.idtask,
                            TitleOFTasks: selectedOpenTask.TitleOFTasks || 'Без названия',
                            DescriptionTask: selectedOpenTask.DescriptionTask || 'Нет описания',
                            TimeOFTask: selectedOpenTask.TimeOFTask || '—',
                            activepin: selectedOpenTask.activepin || 'active',
                            orederhuman: selectedOpenTask.orederhuman || currentEmployee?.full_name || 'Не назначено',
                            taskforpeoject: selectedOpenTask.taskforpeoject || 'Без проекта',
                            startDate: selectedOpenTask.startDate,
                            endDate: selectedOpenTask.endDate,
                            priority: selectedOpenTask.priority || 'Средний',
                            status: selectedOpenTask.status || 'active',
                            executor_id: selectedOpenTask.executor_id || currentEmployee?.employee_id,
                            project_id: selectedOpenTask.project_id || null
                        }}
                        entertask={() => setetnertaskread(true)}
                    />
                )}
                {etnertaskread && (
                    <AreYoushore
                        defaultbutton={() => setetnertaskread(false)}
                        Defaultbuttontext = 'Нет'
                        dangerbuttontext = "Да"
                        titleDangerAlert = "Выполнение задачи"
                        descriptiondangeralert = "Вы уверены что хотите завершить задачу? "
                        dangerbutton = {() => closeentertask()}
                    />
                )}
                {actiuvesuccessalert && (
                    <SuccessAlertGreen
                        TextSuccessAlert='Ваша задача сохранилась успешно'
                        className='positionalerts'
                    />
                )}
                {addtask && (
                    <AddTaskAlert
                        closedAddtask={() => setAddTask(false)}
                        safetaskinlist={() => Savetask()}
                    />
                )}
                {addprioject && (
                    <AddProjectAlert
                        closedAddproject={() => setaddproject(false)}
                        onProjectCreated={() => {
                            setRefreshTrigger(prev => prev + 1);
                            setactiuvesuccessalert(true);
                            setTimeout(() => setactiuvesuccessalert(false), 2500);
                        }}
                    />
                )}
                {getalertaddtask && (
                <AddTaskAlert
                    closedAddtask = {() => setgetalertaddtask(false)}
                />
                )}
                {showPostponeConfirm && (
                    <AreYoushore
                        defaultbutton={cancelStatusChange}
                        Defaultbuttontext='Нет'
                        dangerbuttontext="Да"
                        titleDangerAlert="Отложить проект"
                        descriptiondangeralert="Проект будет перемещен в архив."
                        dangerbutton={confirmStatusChange}
                    />
                )}
                {showCompleteConfirm && (
                <AreYoushore
                    defaultbutton={cancelStatusChange}
                    Defaultbuttontext='Нет'
                    dangerbuttontext="Да"
                    titleDangerAlert="Завершить проект"
                    descriptiondangeralert="Проект будет помечен как выполненный."
                    dangerbutton={confirmStatusChange}
                />
            )}
            </div>
            {openwindowpriject && (
                <>
                    <div className="openproject">
                        <div className="title_block openprojectblcokwerf">
                            <Button
                             color="default"
                             variant="link"
                             style={{backgroundColor: '#F7F7F7'}}
                             onClick={whatopen}
                             > 
                             <span className="svgparameters"><svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                                            </svg>
                             </span>Назад</Button>
                            <p className="titlepage">проекты</p>
                        </div>
                        {selectedProject && (
                             <div className="mainwindowproject background_shadowdd">
                                <div className="contentofopenproject">
                                    <div className="maininformationpr">
                                        <div className="leftblockofpr wrbl">
                                            <div className="titleinfofpr ">
                                                <div className="titleproject"><h1>{selectedProject.TitleOFProject}</h1></div>
                                                <div className="activepin">{ChekActive(selectedProject.activepin)}</div>
                                            </div>
                                            <TextArea
                                                value={selectedProject.DescriptionTask}
                                                autoSize={{ minRows: 7.1, maxRows: 7.5 }}
                                            />
                                            <div className="titleinpit">
                                                <p>Контактная информация</p>
                                                <Input value={selectedProject.orederhuman} />
                                                <div className="contactsform">
                                                    <Input type="email" value={selectedProject.emailorderhuman} />
                                                    <Input type="phone" value={selectedProject.phoneorderhuman} />
                                                </div>
                                            </div>
                                            <div className="filesand_linkspr">
                                                <div className="files_ofproject">
                                                    <p>Файлы проекта</p>
                                                    <div className="containerfilespr">
                                                        {loadingProjectDetails ? (
                                                            <p>Загрузка файлов...</p>
                                                        ) : projectFiles.length > 0 ? (
                                                            projectFiles.map((file, index) => (
                                                                <div 
                                                                    key={index} 
                                                                    className="blocklinkfile"
                                                                    onClick={() => window.open(
                                                                        `http://127.0.0.1:8000/api/files/${file.file_id}/view`,
                                                                        '_blank'
                                                                    )}
                                                                    style={{ cursor: 'pointer' }}
                                                                    title={`${file.filename} (${(file.size / 1024).toFixed(1)} KB)`}
                                                                >
                                                                    <p>{file.filename}</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p>Нет файлов</p>
                                                        )}
                                                    </div>  
                                                </div>
                                                <div className="files_ofproject">
                                                    <p>Ссылки проекта</p>
                                                    <div className="containerfilespr">
                                                        {loadingProjectDetails ? (
                                                            <p>Загрузка ссылок...</p>
                                                        ) : projectLinks.length > 0 ? (
                                                            projectLinks.map((link, index) => (
                                                                <a
                                                                    key={index}
                                                                    className="blocklinkfile"
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                                                >
                                                                    <p>{link.title}</p>
                                                                </a>
                                                            ))
                                                        ) : (
                                                            <p>Нет ссылок</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rightblockpfpr wrbl">
                                            <div className="container_maininffjijiqiepfro">
                                                <div className="choosepeople bacgroundaddprojectrit rebgiuriuo">
                                                    <div className="titleofhuman"><p>Сотрудники</p></div>
                                                    <div className="containeroflist">
                                                        {loadingProjectDetails ? (
                                                            <p>Загрузка сотрудников...</p>
                                                        ) : projectEmployees.length > 0 ? (
                                                            projectEmployees.map((employee, index) => (
                                                                <div key={index} className="bbhabwd">
                                                                    <div style={{ fontWeight: 'bold' }}>{employee.full_name}</div>
                                                                    <div style={{ fontSize: '12px', color: '#0051FF' }}>
                                                                        {employee.position || 'Должность не указана'}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p>Нет сотрудников</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="addtaskproject bacgroundaddprojectrit rebgiuriuo">
                                                    <div className="titleofhuman"><p>Задачи</p></div>
                                                    <div className="containeroflist buttoncontainercc">
                                                        {projectTasks.length > 0 ? (
                                                            projectTasks.map((task, index) => (
                                                                <Addtaskprojectadlert
                                                                    key={index}
                                                                    titletaskpriject={task.TitleOFTasks}
                                                                    descriptionaddtaskproject={task.DescriptionTask}
                                                                    timeaddtaskprojectalert={task.TimeOFTask}
                                                                />
                                                            ))
                                                        ) : (
                                                            <p>Нет задач</p>
                                                        )}
                                                    </div>
                                                    <Button_Dachbptar
                                                        onClick={() => setgetalertaddtask(true)}
                                                        textbutton={'Добавить задачу'}
                                                        className='add_task_mainButtin addprojectalert'
                                                         icon={<svg xmlns="http://www.w3.org/2000/svg" width="27" height="28" viewBox="0 0 27 28" fill="none">
                                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.0627 4.5498C4.43612 4.5498 3.83521 4.79871 3.39216 5.24177C2.9491 5.68482 2.7002 6.28573 2.7002 6.9123V21.0873C2.7002 22.3914 3.7586 23.4498 5.0627 23.4498H21.9377C22.5643 23.4498 23.1652 23.2009 23.6082 22.7578C24.0513 22.3148 24.3002 21.7139 24.3002 21.0873V9.6123C24.3002 8.98573 24.0513 8.38482 23.6082 7.94177C23.1652 7.49871 22.5643 7.2498 21.9377 7.2498H15.4091C15.3647 7.24988 15.3208 7.24122 15.2798 7.22431C15.2388 7.2074 15.2015 7.18258 15.1701 7.15125L13.2612 5.24235C12.8184 4.79923 12.2178 4.55012 11.5913 4.5498H5.0627ZM13.5002 11.2998C13.7687 11.2998 14.0263 11.4065 14.2161 11.5964C14.406 11.7862 14.5127 12.0438 14.5127 12.3123V14.3373H16.5377C16.8062 14.3373 17.0638 14.444 17.2536 14.6339C17.4435 14.8237 17.5502 15.0813 17.5502 15.3498C17.5502 15.6183 17.4435 15.8759 17.2536 16.0658C17.0638 16.2556 16.8062 16.3623 16.5377 16.3623H14.5127V18.3873C14.5127 18.6558 14.406 18.9134 14.2161 19.1033C14.0263 19.2931 13.7687 19.3998 13.5002 19.3998C13.2317 19.3998 12.9741 19.2931 12.7843 19.1033C12.5944 18.9134 12.4877 18.6558 12.4877 18.3873V16.3623H10.4627C10.1942 16.3623 9.93663 16.2556 9.74675 16.0658C9.55687 15.8759 9.4502 15.6183 9.4502 15.3498C9.4502 15.0813 9.55687 14.8237 9.74675 14.6339C9.93663 14.444 10.1942 14.3373 10.4627 14.3373H12.4877V12.3123C12.4877 12.0438 12.5944 11.7862 12.7843 11.5964C12.9741 11.4065 13.2317 11.2998 13.5002 11.2998Z" fill="white"/>
                                                                </svg>}
                                                    />
                                                </div>
                                            </div>
                                            <div className="addsteps">
                                                {loadingProjectDetails ? (
                                                    <p>Загрузка этапов...</p>
                                                ) : projectStages.length > 0 ? (
                                                    <Steps
                                                        current={current}
                                                        className='customsteps'
                                                        onChange={onChange}
                                                        items={projectStages.map((stage) => ({
                                                            title: stage.stage_name,
                                                            description: stage.description || '',
                                                            status: stage.status === 'completed' ? 'finish' : 
                                                                stage.status === 'active' ? 'process' : 'wait'
                                                        }))}
                                                    />
                                                ) : (
                                                    <p>Этапы проекта не добавлены</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="downofusepr">
                                        <div className="timeblock">
                                            <p>Временной интервал</p>
                                            <div className="timecontainerpri">
                                                <div className="blocktime">{selectedProject.starttimeOFproject}<Calendariconsvg/></div>
                                                <div className="line"></div>
                                                <div className="blocktime">{selectedProject.endtimeOFproject}<Calendariconsvg/></div>
                                            </div>
                                            
                                        </div>
                                        <div className="buttonsblockuseproject">
                                            <Button onClick={handlePostponeProject}>Отложить</Button>
                                            <Button 
                                                className="cutsondfeultbuttonhover" 
                                                onClick={handleCompleteProject}
                                            >
                                                Завершить проект
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
            {handleproject && (
                <>
                <div className="title_block">
                    <p className="titlepage">Проекты</p>
                </div>
                <div className="main_active_block">
                    <div className="left">
                        <div className="active_button_contquner">
                            <button className={`button_active_dash ${active === 'activebutton1' ? 'active' : ''}`} onClick={() => HandleButtonActive('activebutton1')}>
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12.1791 1.82905C12.3011 1.89696 12.3969 2.00378 12.4511 2.13247C12.5053 2.26115 12.5149 2.40429 12.4783 2.53905L10.8183 8.62488H16.875C16.9968 8.62489 17.1159 8.66049 17.2177 8.7273C17.3196 8.79411 17.3997 8.88922 17.4482 9.00094C17.4967 9.11267 17.5115 9.23613 17.4908 9.35616C17.4701 9.47618 17.4148 9.58754 17.3316 9.67655L8.58163 19.0515C8.48632 19.1539 8.35946 19.2213 8.22132 19.243C8.08318 19.2647 7.94174 19.2395 7.81964 19.1713C7.69754 19.1032 7.60182 18.996 7.54779 18.8671C7.49376 18.7381 7.48455 18.5947 7.52163 18.4599L9.18163 12.3749H3.12496C3.00316 12.3749 2.88402 12.3393 2.78217 12.2725C2.68033 12.2057 2.60023 12.1105 2.55172 11.9988C2.5032 11.8871 2.48839 11.7636 2.5091 11.6436C2.52981 11.5236 2.58514 11.4122 2.66829 11.3232L11.4183 1.94822C11.5136 1.84625 11.6403 1.77913 11.7782 1.75753C11.9161 1.73593 12.0572 1.76111 12.1791 1.82905Z" fill="#787878" />
                                    </svg>
                                </span>
                                Все
                            </button>
                            <button className={`button_active_dash ${active === 'activebutton2' ? 'active' : ''}`} onClick={() => HandleButtonActive('activebutton2')}>
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M2 3.5C1.73478 3.5 1.48043 3.60536 1.29289 3.79289C1.10536 3.98043 1 4.23478 1 4.5V5.5C1 5.76522 1.10536 6.01957 1.29289 6.20711C1.48043 6.39464 1.73478 6.5 2 6.5H18C18.2652 6.5 18.5196 6.39464 18.7071 6.20711C18.8946 6.01957 19 5.76522 19 5.5V4.5C19 4.23478 18.8946 3.98043 18.7071 3.79289C18.5196 3.60536 18.2652 3.5 18 3.5H2ZM2 8H18L17.189 15.71C17.1371 16.2015 16.905 16.6564 16.5376 16.987C16.1701 17.3175 15.6933 17.5003 15.199 17.5H4.802C4.30774 17.5003 3.8309 17.3175 3.46343 16.987C3.09596 16.6564 2.8639 16.2015 2.812 15.71L2 8ZM10 9.5C10.1989 9.5 10.3897 9.57902 10.5303 9.71967C10.671 9.86032 10.75 10.0511 10.75 10.25V12.796L11.693 11.748C11.7583 11.6725 11.8379 11.6107 11.9274 11.5664C12.0168 11.522 12.1142 11.496 12.2138 11.4898C12.3134 11.4836 12.4133 11.4973 12.5075 11.5302C12.6017 11.563 12.6885 11.6144 12.7626 11.6812C12.8368 11.748 12.8968 11.829 12.9393 11.9193C12.9817 12.0096 13.0057 12.1075 13.0099 12.2073C13.014 12.307 12.9982 12.4066 12.9634 12.5001C12.9285 12.5936 12.8754 12.6793 12.807 12.752L10.557 15.252C10.4867 15.33 10.4008 15.3923 10.3048 15.435C10.2089 15.4777 10.105 15.4998 10 15.4998C9.89499 15.4998 9.79114 15.4777 9.69519 15.435C9.59924 15.3923 9.51332 15.33 9.443 15.252L7.193 12.752C7.12464 12.6793 7.07148 12.5936 7.03664 12.5001C7.00181 12.4066 6.98599 12.307 6.99012 12.2073C6.99425 12.1075 7.01825 12.0096 7.06071 11.9193C7.10316 11.829 7.16322 11.748 7.23737 11.6812C7.31151 11.6144 7.39825 11.563 7.4925 11.5302C7.58674 11.4973 7.6866 11.4836 7.78622 11.4898C7.88584 11.496 7.98322 11.522 8.07265 11.5664C8.16207 11.6107 8.24174 11.6725 8.307 11.748L9.25 12.796V10.25C9.25 10.0511 9.32902 9.86032 9.46967 9.71967C9.61032 9.57902 9.80109 9.5 10 9.5Z" fill="black" />
                                    </svg>
                                </span>
                            готовые
                            </button>
                            <button className={`button_active_dash ${active === 'activebutton3' ? 'active' : ''}`} onClick={() => HandleButtonActive('activebutton3')}>
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
                                        <path d="M2 3.5C1.73478 3.5 1.48043 3.60536 1.29289 3.79289C1.10536 3.98043 1 4.23478 1 4.5V5.5C1 5.76522 1.10536 6.01957 1.29289 6.20711C1.48043 6.39464 1.73478 6.5 2 6.5H18C18.2652 6.5 18.5196 6.39464 18.7071 6.20711C18.8946 6.01957 19 5.76522 19 5.5V4.5C19 4.23478 18.8946 3.98043 18.7071 3.79289C18.5196 3.60536 18.2652 3.5 18 3.5H2Z" fill="black" />
                                        <path fillRule="evenodd" clipRule="evenodd" d="M2 8H18L17.189 15.71C17.1371 16.2015 16.905 16.6564 16.5376 16.987C16.1701 17.3175 15.6933 17.5003 15.199 17.5H4.802C4.30774 17.5003 3.8309 17.3175 3.46343 16.987C3.09596 16.6564 2.8639 16.2015 2.812 15.71L2 8ZM7 11.5C7 11.2348 7.10536 10.9804 7.29289 10.7929C7.48043 10.6054 7.73478 10.5 8 10.5H12C12.2652 10.5 12.5196 10.6054 12.7071 10.7929C12.8946 10.9804 13 11.2348 13 11.5C13 11.7652 12.8946 12.0196 12.7071 12.2071C12.5196 12.3946 12.2652 12.5 12 12.5H8C7.73478 12.5 7.48043 12.3946 7.29289 12.2071C7.10536 12.0196 7 11.7652 7 11.5Z" fill="black" />
                                    </svg>
                                </span>
                                В процессе
                            </button>
                        </div>
                        <div className="tasks background_shadow">
                            <div className="tasks_container">
                                <div className="tastks_content">
                                    {filteredTasks.map((taskopen, index) => (
                                        <TaskButtonDahsboard
                                            key={index}
                                            clicktask={() => openprojectread(taskopen)}
                                            TitleOFTasks={taskopen.TitleOFTasks}
                                            DescriptionTask={taskopen.DescriptionTask}
                                            TimeOFTask={taskopen.TimeOFTask}
                                            activepin={ChekActive(taskopen.activepin)}
                                        />
                                    ))}
                                </div>
                                <Button_Dachbptar
                                    onClick={() => setAddTask(true)}
                                    textbutton={'Добавить задачу'}
                                    className='add_task_mainButtin'
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="27" height="28" viewBox="0 0 27 28" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M5.0627 4.5498C4.43612 4.5498 3.83521 4.79871 3.39216 5.24177C2.9491 5.68482 2.7002 6.28573 2.7002 6.9123V21.0873C2.7002 22.3914 3.7586 23.4498 5.0627 23.4498H21.9377C22.5643 23.4498 23.1652 23.2009 23.6082 22.7578C24.0513 22.3148 24.3002 21.7139 24.3002 21.0873V9.6123C24.3002 8.98573 24.0513 8.38482 23.6082 7.94177C23.1652 7.49871 22.5643 7.2498 21.9377 7.2498H15.4091C15.3647 7.24988 15.3208 7.24122 15.2798 7.22431C15.2388 7.2074 15.2015 7.18258 15.1701 7.15125L13.2612 5.24235C12.8184 4.79923 12.2178 4.55012 11.5913 4.5498H5.0627ZM13.5002 11.2998C13.7687 11.2998 14.0263 11.4065 14.2161 11.5964C14.406 11.7862 14.5127 12.0438 14.5127 12.3123V14.3373H16.5377C16.8062 14.3373 17.0638 14.444 17.2536 14.6339C17.4435 14.8237 17.5502 15.0813 17.5502 15.3498C17.5502 15.6183 17.4435 15.8759 17.2536 16.0658C17.0638 16.2556 16.8062 16.3623 16.5377 16.3623H14.5127V18.3873C14.5127 18.6558 14.406 18.9134 14.2161 19.1033C14.0263 19.2931 13.7687 19.3998 13.5002 19.3998C13.2317 19.3998 12.9741 19.2931 12.7843 19.1033C12.5944 18.9134 12.4877 18.6558 12.4877 18.3873V16.3623H10.4627C10.1942 16.3623 9.93663 16.2556 9.74675 16.0658C9.55687 15.8759 9.4502 15.6183 9.4502 15.3498C9.4502 15.0813 9.55687 14.8237 9.74675 14.6339C9.93663 14.444 10.1942 14.3373 10.4627 14.3373H12.4877V12.3123C12.4877 12.0438 12.5944 11.7862 12.7843 11.5964C12.9741 11.4065 13.2317 11.2998 13.5002 11.2998Z" fill="white" />
                                    </svg>}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="projects">
                        <div className="prpject_container">
                            <div className="project_content">
                                <div className="button_input_project">
                                    <Button_Dachbptar
                                        onClick={() => setaddproject(true)}
                                        textbutton={'Добавить проект'}
                                        className='add_project_mainButtin'
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="27" height="28" viewBox="0 0 27 28" fill="none">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M5.0627 4.5498C4.43612 4.5498 3.83521 4.79871 3.39216 5.24177C2.9491 5.68482 2.7002 6.28573 2.7002 6.9123V21.0873C2.7002 22.3914 3.7586 23.4498 5.0627 23.4498H21.9377C22.5643 23.4498 23.1652 23.2009 23.6082 22.7578C24.0513 22.3148 24.3002 21.7139 24.3002 21.0873V9.6123C24.3002 8.98573 24.0513 8.38482 23.6082 7.94177C23.1652 7.49871 22.5643 7.2498 21.9377 7.2498H15.4091C15.3647 7.24988 15.3208 7.24122 15.2798 7.22431C15.2388 7.2074 15.2015 7.18258 15.1701 7.15125L13.2612 5.24235C12.8184 4.79923 12.2178 4.55012 11.5913 4.5498H5.0627ZM13.5002 11.2998C13.7687 11.2998 14.0263 11.4065 14.2161 11.5964C14.406 11.7862 14.5127 12.0438 14.5127 12.3123V14.3373H16.5377C16.8062 14.3373 17.0638 14.444 17.2536 14.6339C17.4435 14.8237 17.5502 15.0813 17.5502 15.3498C17.5502 15.6183 17.4435 15.8759 17.2536 16.0658C17.0638 16.2556 16.8062 16.3623 16.5377 16.3623H14.5127V18.3873C14.5127 18.6558 14.406 18.9134 14.2161 19.1033C14.0263 19.2931 13.7687 19.3998 13.5002 19.3998C13.2317 19.3998 12.9741 19.2931 12.7843 19.1033C12.5944 18.9134 12.4877 18.6558 12.4877 18.3873V16.3623H10.4627C10.1942 16.3623 9.93663 16.2556 9.74675 16.0658C9.55687 15.8759 9.4502 15.6183 9.4502 15.3498C9.4502 15.0813 9.55687 14.8237 9.74675 14.6339C9.93663 14.444 10.1942 14.3373 10.4627 14.3373H12.4877V12.3123C12.4877 12.0438 12.5944 11.7862 12.7843 11.5964C12.9741 11.4065 13.2317 11.2998 13.5002 11.2998Z" fill="white" />
                                        </svg>}
                                    />
                                    <MainInput
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <g clipPath="url(#clip0_84_655)">
                                                <path d="M14.3533 13.6467L11.9133 11.2067C12.8306 10.1246 13.3339 8.75191 13.3333 7.33333C13.3333 4.02184 10.6448 1.33333 7.33333 1.33333C4.02184 1.33333 1.33333 4.02184 1.33333 7.33333C1.33333 10.6448 4.02184 13.3333 7.33333 13.3333C8.81 13.3333 10.16 12.7973 11.2053 11.9133L13.6453 14.3533C13.7387 14.4476 13.8659 14.5007 13.9987 14.5007C14.1314 14.5007 14.2586 14.4476 14.352 14.3533C14.4463 14.26 14.4995 14.1329 14.4997 14.0003C14.5 13.8676 14.4473 13.7403 14.3533 13.6467ZM2.33333 7.33333C2.33333 4.57667 4.57667 2.33333 7.33333 2.33333C10.09 2.33333 12.3333 4.57667 12.3333 7.33333C12.3333 10.09 10.09 12.3333 7.33333 12.3333C4.57667 12.3333 2.33333 10.09 2.33333 7.33333Z" fill="#0051FF" />
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_84_655">
                                                    <rect width="16" height="16" fill="white" />
                                                </clipPath>
                                            </defs>
                                        </svg>
                                        }
                                        placeholder='Поиск проекта'
                                        onChange={(e) => setSearch(e.target.value)}
                                        value={search}
                                    />
                                </div>
                                <div className="project_items_button ">
                                    <div className="grid_projectitems">
                                        <Row gutter={[16, 16]}>
                                            {filteredProjects.map((task, index) => (
                                                <Col key={task.idproject} span={12}>
                                                    <ProjectButton
                                                        key={index}
                                                        onclick={() => clickproject(task)}
                                                        TitleProject={task.TitleOFProject}
                                                        DescriptionProject={task.DescriptionTask}
                                                        TimeOFproject={task.TimeOFTask}
                                                        orederhuman={task.orederhuman}
                                                        activepin={ChekActive(task.activepin)}
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </>
            )}
        </>
    )
}