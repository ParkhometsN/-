import AddNewStuff from "../Alerts/add_new_stuff";
import AreYoushore from "../Alerts/areyoushore";
import ChangeInformationStuff from "../Alerts/change_informationstuff";
import SuccessAlertGreen from "../Alerts/SuccessALertGreen";
import ButtonDefault from "../ui/button2";
import ButtonDelete from "../ui/button_delete";
import StuffButton from "./litleconponents/stuff_button";
import { useState, useEffect } from "react";
import axios from "axios";
import LoaderMain from "../ui/loader";

export default function Staff() {
    const [activeIndex, setActiveIndex] = useState(null);
    const [activeAlertStuff, setActiveAlertStuff] = useState(false);
    const [activeAreYouShore, setActiveAreYouShore] = useState(false);
    const [activeChangeInformationStuff, setActiveChangeInformationStuff] = useState(false);
    const [areYouSureDeleteStuff, setAreYouSureDeleteStuff] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    
    const [employees, setEmployees] = useState([]);
    const [tasksCount, setTasksCount] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

const loadAllData = async () => {
    try {
        setLoading(true);

        const empRes = await axios.get('http://127.0.0.1:8000/api/employees');
        const loadedEmployees = empRes.data;

        // Вариант 1: Используем эндпоинт для количества задач
        const tasksPromises = loadedEmployees.map(emp =>
            axios.get(`http://127.0.0.1:8000/api/employees/${emp.employee_id}/tasks/count`)
                .then(res => ({ id: emp.employee_id, count: res.data.count }))
                .catch(err => {
                    console.warn(`Задачи для ${emp.employee_id} не загрузились`, err);
                    return { id: emp.employee_id, count: 0 };
                })
        );

        const tasksResults = await Promise.all(tasksPromises);
        const tasksMap = {};
        tasksResults.forEach(item => {
            tasksMap[item.id] = item.count;
        });

        setEmployees(loadedEmployees);
        setTasksCount(tasksMap);
        setLoading(false);
    } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Не удалось загрузить сотрудников");
        setLoading(false);
    }
};

    useEffect(() => {
        loadAllData();
    }, []);

    const checkclick = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const getTaskCountText = (count) => {
        if (count === 0) return '0 задач';
        if (count === 1) return '1 задача';
        if (count >= 2 && count <= 4) return `${count} задачи`;
        return `${count} задач`;
    };

    const getPosition = (employee) => {
        return employee.position?.position_name || employee.specialization || 'Должность не указана';
    };

    const deleteEmployee = async () => {
        if (activeIndex === null) return;

        const employee = employees[activeIndex];

        try {
            await axios.delete(`http://127.0.0.1:8000/api/employees/${employee.employee_id}`);

            setEmployees(prev => prev.filter((_, i) => i !== activeIndex));
            setTasksCount(prev => {
                const newCount = { ...prev };
                delete newCount[employee.employee_id];
                return newCount;
            });

            setAreYouSureDeleteStuff(false);
            setActiveIndex(null);
            showSuccess("Сотрудник успешно удалён");
        } catch (err) {
            alert("Ошибка при удалении сотрудника");
            console.error(err);
        }
    };

    const addEmployee = async (newEmployeeData) => {
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/employees', {
                full_name: newEmployeeData.namestuff,
                email: newEmployeeData.email,
                specialization: newEmployeeData.fobtitle,
                phone: newEmployeeData.phone  // ДОБАВЛЕНО ОТПРАВКУ ТЕЛЕФОНА
            });

            const addedEmployee = response.data;
            setEmployees(prev => [...prev, addedEmployee]);
            setTasksCount(prev => ({ ...prev, [addedEmployee.employee_id]: 0 }));
            setActiveAlertStuff(false);
            showSuccess("Сотрудник успешно добавлен");
        } catch (err) {
            console.error("Ошибка добавления:", err);
        }
    };

    const showSuccess = (text = "Действие выполнено успешно") => {
        setShowSuccessAlert(text);
        setTimeout(() => setShowSuccessAlert(false), 2500);
    };

    if (loading) return <LoaderMain/>;
    if (error) return <div className="container_content_of_page">Ошибка: {error}</div>;

    return (
        <>
            <div className="alerts_stuff">
                {showSuccessAlert && (
                    <SuccessAlertGreen className='positionalerts' TextSuccessAlert={showSuccessAlert} />
                )}

                {areYouSureDeleteStuff && (
                    <AreYoushore
                        defaultbutton={() => setAreYouSureDeleteStuff(false)}
                        dangerbutton={deleteEmployee}
                        Defaultbuttontext='Нет'
                        dangerbuttontext='Да'
                        titleDangerAlert='Удалить сотрудника?'
                        descriptiondangeralert='Это действие нельзя отменить.'
                    />
                )}

                {activeChangeInformationStuff && (
                    <ChangeInformationStuff
                        closedAddtask={() => setActiveChangeInformationStuff(false)}
                        employee={employees[activeIndex]}
                        onUpdate={(updatedEmployee) => {
                            setEmployees(prev => prev.map((emp, i) => 
                                i === activeIndex ? updatedEmployee : emp
                            ));
                            showSuccess("Сотрудник успешно обновлён");
                        }}
                    />
                )}

                {activeAreYouShore && (
                    <AreYoushore
                        dangerbuttontext='Отмена'
                        Defaultbuttontext='Продолжить'
                        titleDangerAlert='Отменить добавление?'
                        descriptiondangeralert='Вы уверены, что хотите отменить создание сотрудника?'
                        dangerbutton={() => {
                            setActiveAreYouShore(false);
                            setActiveAlertStuff(false);
                        }}
                        defaultbutton={() => setActiveAreYouShore(false)}
                    />
                )}

                {activeAlertStuff && (
                    <AddNewStuff
                        closedAddtask={() => setActiveAlertStuff(false)}
                        onAddEmployee={addEmployee}
                    />
                )}
            </div>

            <div className="container_content_of_page">
                <div className="titile_stuff_page">
                    <p className="titlepage">Сотрудники</p>
                    <div className="count_stuff">{employees.length} человек</div>
                </div>
                <div className="line"></div>

                <div className="grid_oftitles_for_stuff">
                    <div className="jeft_tipe">
                        <p className="dwdwwd">Имя</p>
                        <p className="wefwefewf">Должность</p>
                        <p>Задачи</p>
                    </div>
                    <p className="wef">Дата приема</p>
                </div>

                <div className="stuff_list">
                    {employees.map((employee, index) => (
                        <StuffButton
                            key={employee.employee_id}
                            onClick={() => checkclick(index)}
                            isActive={activeIndex === index}
                            name={employee.full_name}
                            Job={getPosition(employee)}
                            taskscount={getTaskCountText(tasksCount[employee.employee_id] || 0)}
                            timegetjob={formatDate(employee.hire_date)}
                        />
                    ))}
                </div>

                <div className="buttons_for_stuff">
                    <div></div>
                    <div className="buttons">
                        {activeIndex === null ? (
                            <ButtonDefault
                                onClick={() => setActiveAlertStuff(true)}
                                textOF_button='Добавить сотрудника'
                            />
                        ) : (
                            <div className="get_buttons">
                                <ButtonDefault
                                    textOF_button='Редактировать'
                                    onClick={() => setActiveChangeInformationStuff(true)}
                                />
                                <ButtonDelete
                                    onClick={() => setAreYouSureDeleteStuff(true)}
                                    textOF_button='Удалить'
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}