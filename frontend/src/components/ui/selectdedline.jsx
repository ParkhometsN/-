import { SelectTime } from "./SelectTime";
import { Button } from 'antd';
import { useState } from 'react';

export default function Selectdeadline({ onStartDateChange, onEndDateChange }) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // Обработка выбора даты начала
    const handleStartDateChange = (date) => {
        setStartDate(date);
        if (onStartDateChange) {
            onStartDateChange(date ? date.toISOString().split('T')[0] : null);
        }
    };

    // Обработка выбора даты окончания
    const handleEndDateChange = (date) => {
        setEndDate(date);
        if (onEndDateChange) {
            onEndDateChange(date ? date.toISOString().split('T')[0] : null);
        }
    };

    // Обработка кнопки "сегодня" - устанавливаем обе даты на сегодня
    const handleTodayClick = () => {
        const today = new Date();
        
        // Устанавливаем обе даты
        handleStartDateChange(today);
        handleEndDateChange(today);
    };


    return (
        <div className="container_selectdeadline">
            <div className="buttons-row" >
                <Button 
                    className="customselecttimedd" 
                    type="primary"
                    onClick={handleTodayClick}
                >
                    сегодня
                </Button>
            </div>
            
            <div className="selectjfuwefi" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    
                    <SelectTime 
                        onDateChange={handleStartDateChange}
                        value={startDate}
                        placeholder="Дата начала"
                    />
                </div>
                
                <span className="linesecltf"></span>
            
                <div style={{ flex: 1 }}>
                    <SelectTime 
                        onDateChange={handleEndDateChange}
                        value={endDate}
                        placeholder="Дата окончания"
                    />
                </div>
            </div>
        </div>
    )
}