import ClosedButton from "../ui/closedButton";
import { Input } from 'antd';
import * as React from "react";
import { DownOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Dropdown, message, Space } from 'antd';
import { useState, useEffect } from "react"; 
import ErrorAlertRED from "./ErrorAlertRED";
import axios from "axios";

const realtime = new Date();
const onlyDate = realtime.toLocaleDateString();

export default function ChangeInformationStuff({ closedAddtask, employee, onUpdate }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: 'Выбор должности'
    });
    const [erroractive, seterroractive] = useState(false);

    useEffect(() => {
        if (employee) {
            console.log('Загруженные данные сотрудника:', employee); // Для отладки
            setFormData({
                name: employee.full_name || '',
                email: employee.email || '',
                phone: employee.contacts?.phone || '',
                position: employee.position?.position_name || employee.specialization || 'Выбор должности'
            });
        }
    }, [employee]);

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

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || formData.position === 'Выбор должности') {
            seterroractive(true);
            setTimeout(() => seterroractive(false), 2000);
            return;
        }

        // Валидация телефона (optional, только предупреждение)
        if (formData.phone && !formData.phone.match(/^\+?[0-9]{10,15}$/)) {
            message.warning('Некорректный номер телефона, но сохранение продолжается');
        }

        try {
            console.log('Отправляемые данные:', {
                full_name: formData.name,
                email: formData.email,
                specialization: formData.position,
                contacts: { phone: formData.phone }
            }); // Для отладки
            const response = await axios.put(`http://127.0.0.1:8000/api/employees/${employee.employee_id}`, {
                full_name: formData.name,
                email: formData.email,
                specialization: formData.position,
                contacts: { phone: formData.phone }
            });

            console.log('Ответ от сервера:', response.data); // Для отладки

            if (onUpdate) {
                onUpdate(response.data);
            }

            message.success('Сотрудник успешно обновлён!');
            closedAddtask();
        } catch (err) {
            console.error("Ошибка обновления:", err);
            if (err.response) {
                console.log("Status:", err.response.status);
                console.log("Data:", err.response.data);
            }
            message.error('Ошибка при обновлении сотрудника: ' + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <>
            <div className="addStuff_container">
                {erroractive && (
                    <ErrorAlertRED className='positionalerts' TextErrorAlertRED='Заполните все обязательные поля!' />
                )}
                <div className="AddStuffalert">
                    <div className="title_closed_stuff">
                        <p>Редактирование сотрудника</p>
                        <button onClick={closedAddtask}> <ClosedButton /> </button>
                    </div>
                    <div className="change_container background_shadowdd">
                        <Input 
                            placeholder="ФИО сотрудника" 
                            className="newinputtt"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                        <div className="contacts">
                            <Input 
                                type="email" 
                                placeholder="email" 
                                className="newinput"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                            <Input 
                                type="tel" 
                                placeholder="+7 (XXX) XXX-XX-XX" 
                                className="newinput"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                            />
                        </div>
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
                                Сохранить
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}