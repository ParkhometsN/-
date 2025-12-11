import React, { useState, useEffect } from 'react';
import MainButton from './ui/main_button.jsx';
import MainInput from './ui/input';
import ErrorAlertRed from './Alerts/ErrorAlertRED.jsx';
import SuccessAlertGreen from './Alerts/SuccessALertGreen.jsx';
import axios from "axios";

export default function EnterAppDSW({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [allEmployees, setAllEmployees] = useState([]); // Теперь храним всех сотрудников
  const [alert, setAlert] = useState({
    visible: false,
    type: '',
    message: '',
  });

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/employees').then(r => {
      const employees = r.data;
      setAllEmployees(employees);
      console.log('Загружены сотрудники:', employees);
    }).catch(error => {
      console.error('Ошибка при загрузке пользователей:', error);
    });
  }, []);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setAlert({ visible: false, type: '', message: '' }); 
  };

  const handleLogin = () => {
    if (!isValidEmail(email)) {
      setAlert({
        visible: true,
        type: 'error',
        message: 'Введите корректный email!',
      });
      return;
    }

    // Находим сотрудника по email
    const currentEmployee = allEmployees.find(employee => employee.email === email);
    
    if (currentEmployee) {
      setAlert({
        visible: true,
        type: 'success',
        message: 'Вход выполнен успешно!',
      });
      setTimeout(() => {
        if (onLoginSuccess) {
          // Передаем данные сотрудника при успешном входе
          onLoginSuccess(currentEmployee);
        }
      }, 500); 
    } else {
      setAlert({
        visible: true,
        type: 'error',
        message: 'Неверный email. Попробуйте снова.',
      });
    }
    setTimeout(() => {
      setAlert({ visible: false, type: '', message: '' });
    }, 3000);
  };

  return (
    <>
        {alert.visible && alert.type === 'success' && (
            <SuccessAlertGreen
             TextSuccessAlert={alert.message}
             className='positionalerts' />
        )}
        {alert.visible && alert.type === 'error' && (
            <ErrorAlertRed 
            TextErrorAlertRED={alert.message}
            className='positionalerts' />
        )}
      <div className="text-3xl">
        <p>Вход</p>
      </div>
      <MainInput
        value={email}
        onChange={handleEmailChange}
        placeholder="example@gmail.com"
      />
      <MainButton
        className="max-w-[542px] w-full"
        textbutton={"Вход"}
        type='submit'
        onClick={handleLogin}
      />
    </>
  );
}