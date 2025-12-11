import ClosedButton from "../ui/closedButton";
import { Input } from 'antd';
import * as React from "react"
import { DownOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Dropdown, message, Space, Tooltip } from 'antd';
import { useState } from "react";
import ErrorAlertRED from "./ErrorAlertRED";

const realtime = new Date();
const onlyDate = realtime.toLocaleDateString();

export default function AddNewStuff({ closedAddtask, onAddEmployee }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: 'Выбор должности' // Начальное значение
    });
    const [erroractive,seterroractive] = useState(false)
    const items = [
        {
            label: 'Графический дизайнер',
            key: '1',
            icon: <UserOutlined />,
        },
        {
            label: 'Web-дизайнер',
            key: '2',
            icon: <UserOutlined />,
        },
        {
            label: 'UX/UI дизайнер',
            key: '3',
            icon: <UserOutlined />,
        },
        {
            label: 'Менеджер проекта',
            key: '4',
            icon: <UserOutlined />,
        },
        {
            label: 'Главный дизайнер',
            key: '5',
            icon: <UserOutlined />,
        },
        {
            label: 'Менеджер проекта',
            key: '6',
            icon: <UserOutlined />,
        },
        {
            label: 'Руководитель проекта',
            key: '7',
            icon: <UserOutlined />,
        },
        {
            label: 'Главный бухгалтер',
            key: '8',
            icon: <UserOutlined />,
        },
    ];

    // Обработчик выбора должности
    const handleMenuClick = (e) => {
        const selectedPosition = items.find(item => item.key === e.key)?.label;
        setFormData(prev => ({
            ...prev,
            position: selectedPosition
        }));
    };

    const menuProps = {
        items,
        onClick: handleMenuClick,
    };

    // Обработчик изменения полей ввода
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Обработчик отправки формы
    const handleSubmit = () => {
        // Проверяем заполнены ли все поля
        if (!formData.name || !formData.email || !formData.phone || formData.position === 'Выбор должности') {
            seterroractive(true)
            setTimeout(() => {
                seterroractive(false)
            }, 2000);
            return;
        }

        // Создаем объект нового сотрудника в нужном формате
        const newEmployee = {
            namestuff: formData.name,
            fobtitle: formData.position,
            taskstuffcount: '0 задач', // Новый сотрудник без задач
            dategetjob: onlyDate,
            email: formData.email,
            phone: formData.phone
        };

        // Вызываем функцию добавления из родительского компонента
        if (onAddEmployee) {
            onAddEmployee(newEmployee);
        }

        // Дополнение: Отправляем данные на бэкенд в правильном формате
        onAddEmployee({
            name: formData.name,
            position: formData.position,
            email: formData.email
        });

        // Закрываем модальное окно
        closedAddtask();
        
        // Оповещаем пользователя
        message.success('Сотрудник успешно добавлен!');
    };

    return(
        <>
        <div className="addStuff_container">
            {erroractive &&(
                <ErrorAlertRED className='positionalerts' TextErrorAlertRED='Заполните все поля!'/>
            )}
            <div className="AddStuffalert">
                <div className="title_closed_stuff">
                    <p>Добавить сотрудника</p>
                    <button onClick={closedAddtask}> <ClosedButton/></button>
                </div>
                <div className="change_container background_shadowdd">
                    {/* Поле ФИО */}
                    <Input 
                        placeholder="ФИО сотрудника" 
                        className="newinputtt"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    
                    <div className="contacts">
                        {/* Поле email */}
                        <Input 
                            type="email" 
                            placeholder="email" 
                            className="newinput"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                        {/* Поле телефона */}
                        <Input 
                            type="phone" 
                            placeholder="+7" 
                            className="newinput"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                    </div>
                    
                    {/* Выбор должности */}
                    <Dropdown menu={menuProps}>
                        <Button className="buttondropdown_custom">
                            <Space>
                                {formData.position}
                                <DownOutlined />
                            </Space>
                        </Button>
                    </Dropdown>
                    
                    <div className="desckjk">
                        <p>Вход для сотрудника осуществляется только через рабочую почту</p>
                    </div>
                    
                    <div className="time_and_button">
                        <p>{onlyDate}</p>
                        <Button type="primary" onClick={handleSubmit}>
                            сохранить
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}