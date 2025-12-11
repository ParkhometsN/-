import ClosedButton from "../ui/closedButton";
import { Input, DatePicker, Select, Space, Button, message, Spin } from 'antd';
const { TextArea } = Input;
const { RangePicker } = DatePicker;

import React, { useState, useEffect } from "react";
import StepsOfProject from "../ui/getstepsproject";
import Choosestuffadporject from "../ui/cardofstuf";
import axios from "axios";

const API = "http://127.0.0.1:8000";

const { Option } = Select;

export default function AddProjectAlert({ closedAddproject, onProjectCreated }) {
    const [projectName, setProjectName] = useState("");
    const [description, setDescription] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [dateRange, setDateRange] = useState([]);

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [links, setLinks] = useState([]);
    const [linkInput, setLinkInput] = useState("");

    const [stepsProject, setStepsProject] = useState([{ title: 'Начало проекта' }]);
    const [inputStep, setInputStep] = useState('');

    const [managerId, setManagerId] = useState(null);
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    // Загрузка сотрудников
    const [employees, setEmployees] = useState([]);
    const [tasksCount, setTasksCount] = useState({});
    const [employeesLoading, setEmployeesLoading] = useState(true);
    
    // Состояние загрузки при сохранении
    const [saving, setSaving] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState(false);

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                setEmployeesLoading(true);
                const empRes = await axios.get(`${API}/api/employees`);
                const loaded = empRes.data;

                const tasksPromises = loaded.map(emp =>
                    axios.get(`${API}/api/employees/${emp.employee_id}/tasks/count`)
                        .then(r => ({ id: emp.employee_id, count: r.data.count }))
                        .catch(() => ({ id: emp.employee_id, count: 0 }))
                );

                const results = await Promise.all(tasksPromises);
                const map = {};
                results.forEach(x => map[x.id] = x.count);

                setEmployees(loaded);
                setTasksCount(map);
            } catch  {
                message.error("Не удалось загрузить сотрудников");
            } finally {
                setEmployeesLoading(false);
            }
        };
        loadEmployees();
    }, []);

    const openFileDialog = () => document.getElementById('fileInput').click();

    const handleFileSelect = (e) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const addStep = () => {
        if (inputStep.trim()) {
            setStepsProject(prev => [...prev, { title: inputStep }]);
            setInputStep('');
        }
    };

        const addLink = () => {
            if (linkInput.trim()) {
                let url = linkInput.trim();
                
                // Проверяем, есть ли протокол в ссылке
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url; // Добавляем https:// если его нет
                }
                
                setLinks(prev => [...prev, url]);
                setLinkInput('');
            }
        };

    const getTaskText = (count) => {
        if (count === 0) return '0 задач';
        if (count === 1) return '1 задача';
        if (count >= 2 && count <= 4) return `${count} задачи`;
        return `${count} задач`;
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '—';
    const getPosition = (emp) => emp.position?.position_name || emp.specialization || 'Должность не указана';

    // === СОХРАНЕНИЕ ПРОЕКТА ===
    // Обновите функцию handleSubmit в AddProjectAlert:

const handleSubmit = async () => {
    if (!projectName || !clientName || !managerId || dateRange.length !== 2) {
        message.error("Заполните все обязательные поля");
        return;
    }

    setSaving(true);

    const data = {
        project_name: projectName,
        description: description || null,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        start_date: dateRange[0].format("YYYY-MM-DD"),
        end_date: dateRange[1].format("YYYY-MM-DD"),
        manager_id: managerId,
    };

    try {
        console.log("Начинаем создание проекта...");
        
        // 1. Создаём проект
        const projRes = await axios.post(`${API}/api/projects`, data);
        const projectId = projRes.data.project_id;
        console.log("Проект создан, ID:", projectId);

        // 2. Участники (если выбраны)
        if (selectedEmployees.length > 0) {
            const employeePromises = selectedEmployees.map(empId => 
                axios.post(`${API}/api/projects/${projectId}/employees`, { 
                    employee_id: empId 
                }).catch(err => {
                    console.log(`Сотрудник ${empId} не добавлен:`, err.message);
                    return null;
                })
            );
            await Promise.all(employeePromises);
            console.log("Сотрудники обработаны");
        }

        // 3. Файлы (если есть) - проверяем эндпоинт
        if (selectedFiles.length > 0) {
            setUploadingFiles(true);
            try {
                for (const file of selectedFiles) {
                    const fd = new FormData();
                    fd.append("file", file);
                    await axios.post(`${API}/api/projects/${projectId}/files`, fd, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    })
                    .then(() => console.log("Файл загружен:", file.name))
                    .catch(err => {
                        console.log("Ошибка загрузки файла:", err.response?.data || err.message);
                        message.warning(`Файл ${file.name} не загружен: ${err.response?.data?.detail || 'неизвестная ошибка'}`);
                    });
                }
            } finally {
                setUploadingFiles(false);
            }
        }

        // 4. Ссылки (если есть) - ДОБАВЛЯЕМ СОХРАНЕНИЕ
        // 4. Ссылки (если есть) - ДОБАВЛЯЕМ СОХРАНЕНИЕ
        if (links.length > 0) {
            console.log("Добавляем ссылки проекта:", links);
            
            for (let i = 0; i < links.length; i++) {
                try {
                    console.log(`Добавляем ссылку ${i+1}: ${links[i]}`);
                    
                    // Проверяем формат URL
                    let url = links[i];
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                        console.log(`URL отформатирован: ${url}`);
                    }
                    
                    const response = await axios.post(`${API}/api/projects/${projectId}/materials`, {
                        title: `Ссылка ${i + 1}`,
                        url: url,
                        type: 'link',
                        description: 'Добавлена при создании проекта'
                    });
                    
                    console.log(`Ссылка ${i+1} добавлена успешно:`, response.data);
                    
                } catch (err) {
                    console.error(`Ошибка добавления ссылки ${i+1}:`, {
                        url: links[i],
                        error: err.response?.data || err.message,
                        status: err.response?.status
                    });
                    
                    // Показываем предупреждение, но не прерываем создание проекта
                    message.warning(`Ссылка "${links[i]}" не добавлена: ${err.response?.data?.detail || 'неизвестная ошибка'}`);
                }
            }
            console.log("Ссылки обработаны");
        }

        // 5. Этапы (если есть) - ДОБАВЛЯЕМ СОХРАНЕНИЕ
        if (stepsProject.length > 0) {
            console.log("Добавляем этапы проекта:", stepsProject);
            const stagePromises = stepsProject.map((step, index) => 
                axios.post(`${API}/api/projects/${projectId}/stages`, {
                    title: step.title,
                    description: step.description || '',
                    order: index + 1,
                    status: 'active'
                }).catch(err => {
                    console.log("Этап не добавлен:", err.response?.data || err.message);
                    return null;
                })
            );
            await Promise.all(stagePromises);
            console.log("Этапы обработаны");
        }

        // ВСЁ УСПЕШНО!
        console.log("Проект полностью создан!");
        
        closedAddproject();
        message.success("Проект успешно создан!");
        
        if (onProjectCreated) {
            onProjectCreated();
        }
        
    } catch (err) {
        console.error("Ошибка при создании проекта:", err);
        
        if (err.response) {
            console.error("Данные ответа:", err.response.data);
            console.error("Статус:", err.response.status);
            message.error(`Ошибка создания проекта: ${err.response.data?.detail || err.message}`);
        } else {
            message.error("Ошибка создания проекта. Проверьте консоль для деталей.");
        }
    } finally {
        setSaving(false);
    }
};

    return (
        <div className="addtask_container projectadd">
            <div className="Addprojectalert">
                <div className="title_closed">
                    <p>Добавить проект</p>
                    <button 
                        onClick={closedAddproject} 
                        disabled={saving || uploadingFiles}
                    >
                        <ClosedButton />
                    </button>
                </div>

                <div className="backgroundprojecvt_white background_shadowdd contentsett">
                    <div className="container_ofblockdd">
                        {/* ЛЕВАЯ ЧАСТЬ */}
                        <div className="left_content border">
                            <div className="brothers">
                                <input 
                                    className="inputtitileoftask" 
                                    type="text" 
                                    placeholder="Название проекта"
                                    value={projectName} 
                                    onChange={e => setProjectName(e.target.value)}
                                    disabled={saving || uploadingFiles}
                                />
                                <div className="linetitle"></div>
                            </div>

                            <TextArea 
                                placeholder="Описание" 
                                autoSize={{ minRows: 4, maxRows: 5 }}
                                value={description} 
                                onChange={e => setDescription(e.target.value)}
                                disabled={saving || uploadingFiles}
                            />

                            <div className="titleinpit">
                                <p>Контактная информация</p>
                                <Input 
                                    placeholder="ФИО клиента" 
                                    value={clientName} 
                                    onChange={e => setClientName(e.target.value)}
                                    disabled={saving || uploadingFiles}
                                />
                                <div className="contactsform">
                                    <Input 
                                        type="email" 
                                        placeholder="email" 
                                        value={clientEmail} 
                                        onChange={e => setClientEmail(e.target.value)}
                                        disabled={saving || uploadingFiles}
                                    />
                                    <Input 
                                        placeholder="+7" 
                                        value={clientPhone} 
                                        onChange={e => setClientPhone(e.target.value)}
                                        disabled={saving || uploadingFiles}
                                    />
                                </div>
                            </div>

                            <div className="titleinpit">
                                <p>Файлы проекта</p>
                                <input 
                                    type="file" 
                                    id="fileInput" 
                                    multiple 
                                    style={{display: 'none'}} 
                                    onChange={handleFileSelect}
                                    disabled={saving || uploadingFiles}
                                />
                                <div className="filesdownload">
                                    <Button 
                                        onClick={openFileDialog} 
                                        className="button_downloadddddd"
                                        disabled={saving || uploadingFiles}
                                    >
                                        Загрузить файлы
                                    </Button>
                                    <p className="disabled">
                                        {selectedFiles.length > 0 ? selectedFiles.map(f => f.name).join(", ") : "Файлы не выбраны"}
                                    </p>
                                </div>
                            </div>

                            <div className="sectime">
                                <p>Временной интервал</p>
                                <RangePicker 
                                    format="DD.MM.YYYY" 
                                    onChange={setDateRange} 
                                    style={{width: "100%"}}
                                    disabled={saving || uploadingFiles}
                                />
                            </div>

                            <div className="materialforproject">
                                <Space.Compact style={{width: "100%"}}>
                                    <Input 
                                        placeholder="Ссылки на материалы" 
                                        value={linkInput} 
                                        onChange={e => setLinkInput(e.target.value)} 
                                        onPressEnter={addLink}
                                        disabled={saving || uploadingFiles}
                                    />
                                    <Button 
                                        type="primary" 
                                        onClick={addLink}
                                        disabled={saving || uploadingFiles}
                                    >
                                        Добавить
                                    </Button>
                                </Space.Compact>
                                {links.length > 0 ? links.map((l,i) => <div key={i}>• {l}</div>) : <p className="disabled">Нет добавленных ссылок</p>}
                            </div>
                        </div>

                        {/* ПРАВАЯ ЧАСТЬ */}
                        <div className="right_content border">
                            <div className="titleinpit" style={{marginBottom: 20}}>
                                <p>Менеджер проекта</p>
                                <Select 
                                    style={{width: "100%"}} 
                                    placeholder="Выберите менеджера" 
                                    value={managerId} 
                                    onChange={setManagerId}
                                    disabled={saving || uploadingFiles}
                                >
                                    {employees.map(emp => (
                                        <Option key={emp.employee_id} value={emp.employee_id}>
                                            {emp.full_name} ({getPosition(emp)})
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            <div className="choosepeople bacgroundaddprojectrit">
                                <div className="titleofhuman"><p>Сотрудники</p></div>
                                {employeesLoading ? (
                                    <div style={{textAlign: "center", padding: 40}}><Spin /></div>
                                ) : (
                                    <div className="containeroflist">
                                        {employees.map(emp => (
                                            <Choosestuffadporject
                                                key={emp.employee_id}
                                                NameStuffAddProject={emp.full_name}
                                                PositionStuffAddProject={getPosition(emp)}
                                                taskstuffcount={getTaskText(tasksCount[emp.employee_id] || 0)}
                                                dategetjob={formatDate(emp.hire_date)}
                                                checked={selectedEmployees.includes(emp.employee_id)}
                                                onToggle={(checked) => {
                                                    if (!saving && !uploadingFiles) {
                                                        if (checked) {
                                                            setSelectedEmployees(prev => [...prev, emp.employee_id]);
                                                        } else {
                                                            setSelectedEmployees(prev => prev.filter(id => id !== emp.employee_id));
                                                        }
                                                    }
                                                }}
                                                disabled={saving || uploadingFiles}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="setstepsss">
                                <div className="addsteps">
                                    <StepsOfProject stepsproject={stepsProject} />
                                </div>
                                <div className="enterstep">
                                    <Input 
                                        value={inputStep} 
                                        onChange={e => setInputStep(e.target.value)} 
                                        placeholder="Добавить шаг"
                                        disabled={saving || uploadingFiles}
                                    />
                                    <Button 
                                        onClick={addStep} 
                                        type="primary"
                                        disabled={saving || uploadingFiles}
                                    >
                                        Добавить
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="use_form">
                        <p className="ijewf">{new Date().toLocaleDateString('ru-RU')}</p>
                        <Button 
                            type="primary" 
                            size="large" 
                            onClick={handleSubmit}
                            loading={saving || uploadingFiles}
                            disabled={saving || uploadingFiles}
                        >
                            {saving ? 'Создание проекта...' : 
                             uploadingFiles ? 'Загрузка файлов...' : 
                             'Сохранить'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}