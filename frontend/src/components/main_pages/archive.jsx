"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { DropdownMenuRadioGroupDemo } from "../ui/drmenu";
import MainInput from "../ui/input";
import { Row, Col } from 'antd';
import Copmleted from "./litleconponents/progress/completed";
import ProjectButton from "./litleconponents/project_button";
import LoaderMain from '../ui/loader';
import Archived from './litleconponents/progress/archived';

export default function Archive({ currentEmployee }) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentEmployee?.employee_id) {
            setLoading(false);
            return;
        }

        const fetch = async () => {
            try {
                setLoading(true);
                const res = await axios.get('http://127.0.0.1:8000/api/projects/archived', {
                    params: { manager_id: currentEmployee.employee_id }
                });
                setProjects(res.data);
            } catch (err) {
                console.error('Не удалось загрузить архив:', err);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [currentEmployee]);

    const filtered = projects
        .filter(p => 
            p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase()) ||
            p.client_name?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const da = new Date(a.end_date || a.created_date);
            const db = new Date(b.end_date || b.created_date);
            return sortBy === 'recent' ? db - da : da - db;
        });

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—';

    const countText = () => {
        const c = filtered.length;
        if (c === 1) return '1 проект';
        if (c > 1 && c < 5) return `${c} проекта`;
        return `${c} проектов`;
    };

    if (loading) return <LoaderMain/>;

    return (
        <div className="container_content_of_page">
            <div className="title_archive">
                <p className="titlepage">Архив</p>
                <p className="ccountproject">{countText()}</p>
            </div>

            <div className="input_search">
                <div className="filter flex gap-[2px]">
                    <DropdownMenuRadioGroupDemo onSortChange={setSortBy} />
                </div>
                <MainInput
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Поиск проекта"
                    newinput="newinput"
                />
            </div>

            <div className="data_base_of_priject_ready">
                <Row gutter={[16, 24]}>
                    {filtered.map((p) => (
                        <Col key={p.project_id} span={8}>
                            <ProjectButton
                                newmm="newmm"
                                TitleProject={p.project_name}
                                DescriptionProject={p.description || 'Нет описания'}
                                TimeOFproject={formatDate(p.end_date)}
                                orederhuman={p.client_name}
                                activepin={<Archived />}
                            />
                        </Col>
                    ))}
                </Row>

                {filtered.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', fontSize: '18px' }}>
                        Завершённых проектов не найдено
                    </div>
                )}
            </div>
        </div>
    );
}