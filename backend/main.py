from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import psycopg2
import os
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, field_validator
from datetime import date, datetime
import json
from fastapi import UploadFile, File
from fastapi.responses import FileResponse
import time

load_dotenv()

app = FastAPI(title="Employee Management API", version="1.0")

# CORS настройки
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://design-sowftware-education.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ──────────────────────── Pydantic модели ────────────────────────
class Department(BaseModel):
    department_id: int
    department_name: str
    function_description: Optional[str] = None

class Position(BaseModel):
    position_id: int
    position_name: str

class Employee(BaseModel):
    employee_id: int
    user_id: Optional[int] = None
    full_name: str
    specialization: Optional[str] = None
    contacts: Optional[Dict[str, Any]] = None
    hire_date: Optional[date] = None
    department: Optional[Department] = None
    position: Optional[Position] = None
    email: Optional[str] = None

class Task(BaseModel):
    task_id: int
    task_name: str
    description: Optional[str] = None
    project_name: Optional[str] = None
    stage_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    priority: str
    time_spent: int
    progress: int

# Модель для проектов
class Project(BaseModel):
    project_id: int
    project_name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    manager_name: Optional[str] = None
    created_date: Optional[date] = None
    
    @field_validator('created_date')
    @classmethod
    def validate_created_date(cls, value):
        """Валидируем created_date, чтобы убрать время из datetime"""
        if isinstance(value, datetime):
            return value.date()
        return value
    
    class Config:
        from_attributes = True

# Модель для задач (расширенная)
class TaskDetail(BaseModel):
    task_id: int
    task_name: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    executor_id: Optional[int] = None
    executor_name: Optional[str] = None

# ──────────────────────── Подключение к БД ────────────────────────
def get_db_connection():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise HTTPException(status_code=500, detail="DATABASE_URL not found")
    conn = psycopg2.connect(db_url + ("&" if "?" in db_url else "?") + "client_encoding=utf8")
    conn.set_client_encoding('UTF8')
    return conn

def decode_value(value):
    if isinstance(value, str):
        try: 
            return value.encode('latin1').decode('utf-8')
        except: 
            return value
    elif isinstance(value, dict):
        return {decode_value(k): decode_value(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [decode_value(item) for item in value]
    return value

# Функция для конвертации datetime в date
def convert_to_date(value):
    """Конвертирует различные типы в date, удаляя время"""
    if value is None:
        return None
    elif isinstance(value, datetime):
        return value.date()  # Берем только дату
    elif isinstance(value, date):
        return value  # Уже date
    elif isinstance(value, str):
        # Пробуем разные форматы
        try:
            # Сначала пробуем парсить как datetime
            for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d'):
                try:
                    dt = datetime.strptime(value, fmt)
                    return dt.date()
                except ValueError:
                    continue
        except:
            pass
    # Если не смогли преобразовать, возвращаем как есть
    return value

# ──────────────────────── Основные функции ────────────────────────
def get_all_employees() -> List[Employee]:
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT e."Код сотрудника", e."ФИО", e."Специализация", e."Email", e."Дата приёма",
               e."Контакты", p."Код должности", p."Наименование должности"
        FROM "Сотрудники" e
        LEFT JOIN "Должности" p ON e."Код должности" = p."Код должности"
        ORDER BY e."ФИО"
        '''
        cur.execute(query)
        rows = cur.fetchall()
        employees = []
        for row in rows:
            contacts_data = row[5] if row[5] else None
            if isinstance(contacts_data, str):
                try:
                    contacts_data = json.loads(contacts_data)
                except:
                    contacts_data = None
            employees.append(Employee(
                employee_id=row[0],
                full_name=decode_value(row[1]),
                specialization=decode_value(row[2]) if row[2] else None,
                email=decode_value(row[3]) if row[3] else None,
                hire_date=convert_to_date(row[4]),
                contacts=decode_value(contacts_data),
                position=Position(position_id=row[6], position_name=decode_value(row[7])) if row[6] else None
            ))
        return employees
    finally:
        cur.close()
        conn.close()

# Функция для получения задач конкретного сотрудника
def get_employee_tasks(employee_id: int) -> List[TaskDetail]:
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT 
            t."Код задачи",
            t."Название задачи",
            t."Описание",
            t."Код проекта",
            p."Название проекта",
            t."Дата начала",
            t."Дата окончания",
            t."Статус",
            t."Исполнитель",
            e."ФИО" as executor_name
        FROM "Задачи" t
        LEFT JOIN "Проекты" p ON t."Код проекта" = p."Код проекта"
        LEFT JOIN "Сотрудники" e ON t."Исполнитель" = e."Код сотрудника"
        WHERE t."Исполнитель" = %s
        ORDER BY t."Дата создания" DESC
        '''
        
        cur.execute(query, (employee_id,))
        rows = cur.fetchall()
        
        tasks = []
        for row in rows:
            tasks.append(TaskDetail(
                task_id=row[0],
                task_name=decode_value(row[1]) if row[1] else 'Без названия',
                description=decode_value(row[2]) if row[2] else None,
                project_id=row[3],
                project_name=decode_value(row[4]) if row[4] else None,
                start_date=convert_to_date(row[5]),
                end_date=convert_to_date(row[6]),
                status=decode_value(row[7]) if row[7] else 'active',
                executor_id=row[8],
                executor_name=decode_value(row[9]) if row[9] else None
            ))
        return tasks
    except Exception as e:
        print(f"Ошибка при загрузке задач сотрудника: {e}")
        return []
    finally:
        cur.close()
        conn.close()

# Функция для получения количества задач сотрудника
def get_employee_tasks_count(employee_id: int) -> int:
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM "Задачи" WHERE "Исполнитель" = %s', (employee_id,))
        count = cur.fetchone()[0]
        return count
    except:
        return 0
    finally:
        cur.close()
        conn.close()

# Функция для получения проектов конкретного сотрудника
def get_employee_projects(employee_id: int) -> List[Project]:
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT DISTINCT
            p."Код проекта",
            p."Название проекта",
            p."Описание",
            p."Дата начала",
            p."Дата окончания",
            p."Статус",
            COALESCE(c."ФИО", c."Компания", '—') as client_name,
            c."Email" as client_email,
            c."Телефон" as client_phone,
            COALESCE(m."ФИО", '—') as manager_name,
            p."Дата создания"
        FROM "Проекты" p
        LEFT JOIN "Клиенты" c ON p."Код клиента" = c."Код клиента"
        LEFT JOIN "Сотрудники" m ON p."Менеджер проекта" = m."Код сотрудника"
        WHERE p."Код проекта" IN (
            SELECT DISTINCT "Код проекта" 
            FROM "Задачи" 
            WHERE "Исполнитель" = %s
        ) OR p."Менеджер проекта" = %s
        ORDER BY p."Дата создания" DESC
        '''
        cur.execute(query, (employee_id, employee_id))
        rows = cur.fetchall()
        
        projects = []
        for row in rows:
            projects.append(Project(
                project_id=row[0],
                project_name=decode_value(row[1]) if row[1] else 'Без названия',
                description=decode_value(row[2]) if row[2] else None,
                start_date=convert_to_date(row[3]),
                end_date=convert_to_date(row[4]),
                status=decode_value(row[5]) if row[5] else 'active',
                client_name=decode_value(row[6]) if row[6] else None,
                client_email=decode_value(row[7]) if row[7] else None,
                client_phone=decode_value(row[8]) if row[8] else None,
                manager_name=decode_value(row[9]) if row[9] else None,
                created_date=convert_to_date(row[10])
            ))
        return projects
    except Exception as e:
        print(f"Ошибка при загрузке проектов сотрудника: {e}")
        return []
    finally:
        cur.close()
        conn.close()

# Функция для получения всех проектов
def get_all_projects() -> List[Project]:
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT 
            p."Код проекта",
            p."Название проекта",
            p."Описание",
            p."Дата начала",
            p."Дата окончания",
            p."Статус",
            COALESCE(c."ФИО", c."Компания", '—') as client_name,
            c."Email" as client_email,
            c."Телефон" as client_phone,
            COALESCE(e."ФИО", '—') as manager_name,
            p."Дата создания"
        FROM "Проекты" p
        LEFT JOIN "Клиенты" c ON p."Код клиента" = c."Код клиента"
        LEFT JOIN "Сотрудники" e ON p."Менеджер проекта" = e."Код сотрудника"
        ORDER BY p."Дата создания" DESC
        '''
        cur.execute(query)
        rows = cur.fetchall()
        
        projects = []
        for row in rows:
            projects.append(Project(
                project_id=row[0],
                project_name=decode_value(row[1]) if row[1] else 'Без названия',
                description=decode_value(row[2]) if row[2] else None,
                start_date=convert_to_date(row[3]),
                end_date=convert_to_date(row[4]),
                status=decode_value(row[5]) if row[5] else 'unknown',
                client_name=decode_value(row[6]) if row[6] else None,
                client_email=decode_value(row[7]) if row[7] else None,
                client_phone=decode_value(row[8]) if row[8] else None,
                manager_name=decode_value(row[9]) if row[9] else None,
                created_date=convert_to_date(row[10])
            ))
        return projects
    except Exception as e:
        print(f"Ошибка при загрузке проектов: {e}")
        return []
    finally:
        cur.close()
        conn.close()

# Функция для получения архивных проектов
def get_archived_projects() -> List[Project]:
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        query = '''
        SELECT 
            p."Код проекта",
            p."Название проекта",
            p."Описание",
            p."Дата начала",
            p."Дата окончания",
            p."Статус"::text,
            COALESCE(c."ФИО", c."Компания", '—') as client_name,
            c."Email" as client_email,
            c."Телефон" as client_phone,
            COALESCE(e."ФИО", '—') as manager_name,
            p."Дата создания"
        FROM "Проекты" p
        LEFT JOIN "Клиенты" c ON p."Код клиента" = c."Код клиента"
        LEFT JOIN "Сотрудники" e ON p."Менеджер проекта" = e."Код сотрудника"
        WHERE p."Статус" = 'archived'
        ORDER BY p."Дата создания" DESC
        '''
        
        cur.execute(query)
        rows = cur.fetchall()
        
        projects = []
        for row in rows:
            projects.append(Project(
                project_id=row[0],
                project_name=decode_value(row[1]) if row[1] else 'Без названия',
                description=decode_value(row[2]) if row[2] else None,
                start_date=convert_to_date(row[3]),
                end_date=convert_to_date(row[4]),
                status=decode_value(row[5]) if row[5] else 'unknown',
                client_name=decode_value(row[6]) if row[6] else None,
                client_email=decode_value(row[7]) if row[7] else None,
                client_phone=decode_value(row[8]) if row[8] else None,
                manager_name=decode_value(row[9]) if row[9] else None,
                created_date=convert_to_date(row[10])
            ))
        return projects
    except Exception as e:
        print(f"Ошибка при загрузке архивных проектов: {e}")
        return []
    finally:
        cur.close()
        conn.close()

# ──────────────────────── ЭНДПОИНТЫ ────────────────────────
@app.get("/api/employees", response_model=List[Employee])
async def get_employees():
    return get_all_employees()

@app.get("/api/employees/{employee_id}/tasks", response_model=List[TaskDetail])
async def get_employee_tasks_endpoint(employee_id: int):
    return get_employee_tasks(employee_id)

@app.get("/api/employees/{employee_id}/projects", response_model=List[Project])
async def get_employee_projects_endpoint(employee_id: int):
    return get_employee_projects(employee_id)

@app.get("/api/employees/{employee_id}/tasks/count")
async def get_tasks_count(employee_id: int):
    count = get_employee_tasks_count(employee_id)
    return {"count": count}

# Эндпоинты для проектов
@app.get("/api/projects", response_model=List[Project])
async def get_projects():
    return get_all_projects()

@app.get("/api/projects/archived", response_model=List[Project])
async def get_archived_projects_endpoint():
    return get_archived_projects()

# ──────────────────────── Сотрудники ────────────────────────
class CreateEmployeeRequest(BaseModel):
    full_name: str
    specialization: str
    email: Optional[str] = None
    phone: Optional[str] = None

@app.post("/api/employees", response_model=Employee, status_code=201)
async def create_employee(data: CreateEmployeeRequest):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        contacts_data = {}
        if data.phone:
            contacts_data['phone'] = data.phone
        
        query = '''
        INSERT INTO "Сотрудники" ("ФИО", "Специализация", "Email", "Дата приёма", "Контакты")
        VALUES (%s, %s, %s, %s, %s) RETURNING "Код сотрудника"
        '''
        contacts_json = json.dumps(contacts_data)
        
        cur.execute(query, (data.full_name, data.specialization, data.email, date.today(), contacts_json))
        new_id = cur.fetchone()[0]
        conn.commit()

        employees = get_all_employees()
        new_employee = next(e for e in employees if e.employee_id == new_id)
        return new_employee

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка добавления: {str(e)}")
    finally:
        cur.close()
        conn.close()

class UpdateEmployeeRequest(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    email: Optional[str] = None
    contacts: Optional[Dict[str, Any]] = None

@app.put("/api/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: int, data: UpdateEmployeeRequest):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        updates = []
        params = []

        if data.full_name is not None:
            updates.append('"ФИО" = %s')
            params.append(data.full_name)
        
        if data.specialization is not None:
            updates.append('"Специализация" = %s')
            params.append(data.specialization)
        
        if data.email is not None:
            updates.append('"Email" = %s')
            params.append(data.email)
        
        if data.contacts is not None:
            updates.append('"Контакты" = %s')
            params.append(json.dumps(data.contacts))

        if not updates:
            raise HTTPException(status_code=400, detail="Нет данных для обновления")

        query = f'''
        UPDATE "Сотрудники"
        SET {', '.join(updates)}
        WHERE "Код сотрудника" = %s
        RETURNING "Код сотрудника"
        '''
        params.append(employee_id)
        cur.execute(query, params)
        updated_id = cur.fetchone()
        if not updated_id:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        conn.commit()

        employees = get_all_employees()
        updated_employee = next(e for e in employees if e.employee_id == employee_id)
        return updated_employee

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка обновления: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.delete("/api/employees/{employee_id}", status_code=204)
async def delete_employee(employee_id: int):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute('DELETE FROM "Сотрудники" WHERE "Код сотрудника" = %s', (employee_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        conn.commit()
        return JSONResponse(status_code=204, content=None)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Ошибка удаления")
    finally:
        cur.close()
        conn.close()

# ──────────────────────── Задачи ────────────────────────
class CreateTaskRequest(BaseModel):
    task_name: str
    description: Optional[str] = None
    executor_id: int
    project_id: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = 'active'
    priority: str = 'Средний'

@app.post("/api/tasks", response_model=TaskDetail, status_code=201)
async def create_task(task_data: CreateTaskRequest):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        print(f"Получены данные для создания задачи: {task_data}")
        
        # Проверяем существование сотрудника
        cur.execute('SELECT "Код сотрудника" FROM "Сотрудники" WHERE "Код сотрудника" = %s', (task_data.executor_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Проверяем существование проекта
        cur.execute('SELECT "Код проекта" FROM "Проекты" WHERE "Код проекта" = %s', (task_data.project_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Проект не найден")
        
        # Подготавливаем значения
        description_value = task_data.description if task_data.description else None
        start_date_value = task_data.start_date if task_data.start_date else date.today()
        end_date_value = task_data.end_date
        
        # Создаем задачу
        query = '''
        INSERT INTO "Задачи" (
            "Название задачи", 
            "Описание", 
            "Код проекта", 
            "Исполнитель", 
            "Создатель",
            "Дата начала", 
            "Дата окончания", 
            "Статус", 
            "Приоритет",
            "Дата создания"
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        RETURNING "Код задачи"
        '''
        
        # Исполнитель также является создателем задачи
        creator_id = task_data.executor_id
        
        cur.execute(query, (
            task_data.task_name,
            description_value,
            task_data.project_id,
            task_data.executor_id,
            creator_id,
            start_date_value,
            end_date_value,
            task_data.status,
            task_data.priority
        ))
        
        new_task_id = cur.fetchone()[0]
        conn.commit()
        
        print(f"Задача создана с ID: {new_task_id}")
        
        # Получаем созданную задачу
        cur.execute('''
        SELECT 
            t."Код задачи",
            t."Название задачи",
            t."Описание",
            t."Код проекта",
            p."Название проекта",
            t."Дата начала",
            t."Дата окончания",
            t."Статус",
            t."Исполнитель",
            e."ФИО" as executor_name
        FROM "Задачи" t
        LEFT JOIN "Проекты" p ON t."Код проекта" = p."Код проекта"
        LEFT JOIN "Сотрудники" e ON t."Исполнитель" = e."Код сотрудника"
        WHERE t."Код задачи" = %s
        ''', (new_task_id,))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=500, detail="Не удалось получить созданную задачу")
        
        task = TaskDetail(
            task_id=row[0],
            task_name=decode_value(row[1]) if row[1] else 'Без названия',
            description=decode_value(row[2]) if row[2] else None,
            project_id=row[3],
            project_name=decode_value(row[4]) if row[4] else None,
            start_date=convert_to_date(row[5]),
            end_date=convert_to_date(row[6]),
            status=decode_value(row[7]) if row[7] else 'active',
            executor_id=row[8],
            executor_name=decode_value(row[9]) if row[9] else None
        )
        
        return task
        
    except Exception as e:
        conn.rollback()
        print(f"Ошибка при создании задачи: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка создания задачи: {str(e)}")
    finally:
        cur.close()
        conn.close()

# ──────────────────────── Файлы и материалы ────────────────────────
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/tasks/{task_id}/files")
async def upload_task_file(
    task_id: int,
    file: UploadFile = File(...),
    current_user_id: int = 1
):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Проверяем существование задачи
        cur.execute('SELECT "Код задачи" FROM "Задачи" WHERE "Код задачи" = %s', (task_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Задача не найден")
        
        # Сохраняем файл
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{task_id}_{int(time.time())}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        file_size = os.path.getsize(file_path)
        
        # Сохраняем информацию о файле
        query = '''
        INSERT INTO "Файлы" (
            "Название файла",
            "Путь к файлу",
            "Размер",
            "Тип файла",
            "Код пользователя"
        )
        VALUES (%s, %s, %s, %s, %s)
        RETURNING "Код файла"
        '''
        
        cur.execute(query, (
            file.filename,
            file_path,
            file_size,
            file.content_type,
            current_user_id
        ))
        
        file_id = cur.fetchone()[0]
        
        # Связываем файл с задачей
        link_query = '''
        INSERT INTO "Файлы задач" ("Код задачи", "Код файла")
        VALUES (%s, %s)
        '''
        
        cur.execute(link_query, (task_id, file_id))
        
        conn.commit()
        
        return {
            "message": "Файл успешно загружен",
            "file_id": file_id,
            "filename": file.filename,
            "file_path": f"/api/files/{file_id}/view",
            "size": file_size
        }
        
    except Exception as e:
        conn.rollback()
        print(f"Ошибка при загрузке файла: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.get("/api/tasks/{task_id}/files")
async def get_task_files(task_id: int):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        cur.execute('SELECT "Код задачи" FROM "Задачи" WHERE "Код задачи" = %s', (task_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Задача не найден")
        
        query = '''
        SELECT 
            f."Код файла",
            f."Название файла",
            f."Путь к файлу",
            f."Размер",
            f."Тип файла",
            f."Дата загрузки"
        FROM "Файлы" f
        INNER JOIN "Файлы задач" ft ON f."Код файла" = ft."Код файла"
        WHERE ft."Код задачи" = %s
        ORDER BY f."Дата загрузки" DESC
        '''
        
        cur.execute(query, (task_id,))
        rows = cur.fetchall()
        
        files = []
        for row in rows:
            file_type = decode_value(row[4]) if row[4] else None
            files.append({
                "file_id": row[0],
                "filename": decode_value(row[1]),
                "file_path": f"/api/files/{row[0]}/view",
                "size": row[3],
                "file_type": file_type,
                "upload_date": convert_to_date(row[5]),
                "can_preview": file_type and file_type.split('/')[0] in ['image', 'text', 'application/pdf', 'video', 'audio']
            })
        
        return files
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файлов: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.get("/api/files/{file_id}/view")
async def view_file_inline(file_id: int):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Получаем информацию о файле
        query = '''
        SELECT 
            "Название файла", 
            "Путь к файлу", 
            "Тип файла"
        FROM "Файлы"
        WHERE "Код файла" = %s
        '''
        
        cur.execute(query, (file_id,))
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Файл не найден")
        
        filename, file_path, content_type = row
        
        # Проверяем существование файла
        if not os.path.exists(file_path):
            filename_only = os.path.basename(file_path)
            alternative_path = os.path.join(UPLOAD_DIR, filename_only)
            
            if not os.path.exists(alternative_path):
                raise HTTPException(status_code=404, detail="Файл не найден на сервере")
            
            file_path = alternative_path
        
        # Определяем, можно ли файл открыть в браузере
        viewable_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
            'application/pdf',
            'text/plain', 'text/html', 'text/css', 'text/javascript',
            'application/json',
            'video/mp4', 'video/webm', 'video/ogg',
            'audio/mpeg', 'audio/ogg', 'audio/wav',
        ]
        
        if content_type and content_type in viewable_types:
            return FileResponse(
                file_path,
                media_type=content_type,
                filename=filename,
                headers={"Content-Disposition": f"inline; filename=\"{filename}\""}
            )
        else:
            return FileResponse(
                file_path,
                media_type=content_type or "application/octet-stream",
                filename=filename,
                headers={"Content-Disposition": f"inline; filename=\"{filename}\""}
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")
    finally:
        cur.close()
        conn.close()

# ──────────────────────── Обновление статуса задачи ────────────────────────
class UpdateTaskStatusRequest(BaseModel):
    status: str

@app.put("/api/tasks/{task_id}/status")
async def update_task_status(task_id: int, data: UpdateTaskStatusRequest):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Проверяем существование задачи
        cur.execute('SELECT "Код задачи" FROM "Задачи" WHERE "Код задачи" = %s', (task_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Задача не найден")
        
        # Обновляем статус
        query = '''
        UPDATE "Задачи"
        SET "Статус" = %s
        WHERE "Код задачи" = %s
        '''
        
        cur.execute(query, (data.status, task_id))
        conn.commit()
        
        return {"message": "Статус задачи обновлен", "task_id": task_id, "status": data.status}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка обновления статуса: {str(e)}")
    finally:
        cur.close()
        conn.close()

# ──────────────────────── Создание проекта ────────────────────────
class CreateProjectRequest(BaseModel):
    project_name: str
    description: Optional[str] = None
    client_name: str
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    start_date: date
    end_date: date
    status: str = 'active'
    manager_id: int
    budget: Optional[float] = 0.00

@app.post("/api/projects", response_model=Project, status_code=201)
async def create_project(project_data: CreateProjectRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # === 1. Поиск существующего клиента по ФИО и Email ===
        cur.execute('''
            SELECT "Код клиента" FROM "Клиенты" 
            WHERE "ФИО" = %s AND "Email" = %s
        ''', (project_data.client_name, project_data.client_email or ''))
        
        row = cur.fetchone()
        if row:
            client_id = row[0]
        else:
            # === 2. Если клиент не найден, создаем нового ===
            cur.execute('''
                INSERT INTO "Клиенты" ("ФИО", "Email", "Телефон", "Компания") 
                VALUES (%s, %s, %s, %s) 
                RETURNING "Код клиента"
            ''', (
                project_data.client_name, 
                project_data.client_email or None,
                project_data.client_phone or None,
                None  # Компания может быть NULL
            ))
            client_id = cur.fetchone()[0]

        # === 3. Подготовка контактной информации как JSONB ===
        contact_info = {}
        if project_data.client_email:
            contact_info["email"] = project_data.client_email
        if project_data.client_phone:
            contact_info["phone"] = project_data.client_phone
        if project_data.client_name:
            contact_info["client_name"] = project_data.client_name

        # === 4. Создание проекта ===
        query = '''
        INSERT INTO "Проекты" (
            "Название проекта", 
            "Описание", 
            "Код клиента", 
            "Контактная информация",
            "Дата начала", 
            "Дата окончания", 
            "Статус", 
            "Бюджет",
            "Менеджер проекта",
            "Дата создания"
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        RETURNING "Код проекта"
        '''
        
        cur.execute(query, (
            project_data.project_name,
            project_data.description or None,
            client_id,
            json.dumps(contact_info) if contact_info else None,
            project_data.start_date,
            project_data.end_date,
            project_data.status or 'active',
            project_data.budget or 0.00,
            project_data.manager_id
        ))
        
        new_project_id = cur.fetchone()[0]
        conn.commit()

        # === 5. Возвращаем созданный проект ===
        cur.execute('''
            SELECT 
                p."Код проекта", 
                p."Название проекта", 
                p."Описание",
                p."Дата начала", 
                p."Дата окончания", 
                p."Статус",
                COALESCE(c."ФИО", c."Компания", 'Не указан') as client_name,
                c."Email" as client_email, 
                c."Телефон" as client_phone,
                COALESCE(e."ФИО", 'Не назначен') as manager_name,
                p."Дата создания"
            FROM "Проекты" p
            LEFT JOIN "Клиенты" c ON p."Код клиента" = c."Код клиента"
            LEFT JOIN "Сотрудники" e ON p."Менеджер проекта" = e."Код сотрудника"
            WHERE p."Код проекта" = %s
        ''', (new_project_id,))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=500, detail="Проект не найден после создания")
        
        project = Project(
            project_id=row[0],
            project_name=row[1] if row[1] else 'Без названия',
            description=row[2] if row[2] else None,
            start_date=convert_to_date(row[3]),
            end_date=convert_to_date(row[4]),
            status=row[5] if row[5] else 'active',
            client_name=row[6] if row[6] else None,
            client_email=row[7] if row[7] else None,
            client_phone=row[8] if row[8] else None,
            manager_name=row[9] if row[9] else None,
            created_date=convert_to_date(row[10])
        )
        
        return project
        
    except Exception as e:
        conn.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Ошибка при создании проекта: {str(e)}")
        print(f"Детали: {error_details}")
        raise HTTPException(status_code=500, detail=f"Ошибка при создании проекта: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ──────────────────────── Дополнительные эндпоинты ────────────────────────
@app.post("/api/projects/{project_id}/files")
async def upload_project_file(
    project_id: int,
    file: UploadFile = File(...),
    current_user_id: int = 1
):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Проверяем существование проекта
        cur.execute('SELECT "Код проекта" FROM "Проекты" WHERE "Код проекта" = %s', (project_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Проект не найден")
        
        # Сохраняем файл
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"project_{project_id}_{int(time.time())}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        file_size = os.path.getsize(file_path)
        
        # Сохраняем информацию о файле
        query = '''
        INSERT INTO "Файлы" (
            "Название файла",
            "Путь к файлу",
            "Размер",
            "Тип файла",
            "Код пользователя"
        )
        VALUES (%s, %s, %s, %s, %s)
        RETURNING "Код файла"
        '''
        
        cur.execute(query, (
            file.filename,
            file_path,
            file_size,
            file.content_type,
            current_user_id
        ))
        
        file_id = cur.fetchone()[0]
        
        # Связываем файл с проектом
        link_query = '''
        INSERT INTO "Файлы проекта" ("Код проекта", "Код файла")
        VALUES (%s, %s)
        '''
        
        cur.execute(link_query, (project_id, file_id))
        
        conn.commit()
        
        return {
            "message": "Файл успешно загружен",
            "file_id": file_id,
            "filename": file.filename,
            "file_path": f"/api/files/{file_id}/view",
            "size": file_size
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.post("/api/projects/{project_id}/materials")
async def add_project_material(
    project_id: int,
    material: dict
):
    print(f"=== ДОБАВЛЕНИЕ МАТЕРИАЛА ===")
    print(f"Проект ID: {project_id}")
    print(f"Полученные данные: {material}")
    print(f"Тип данных: {type(material)}")
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Проверяем существование проекта
        cur.execute('SELECT "Код проекта" FROM "Проекты" WHERE "Код проекта" = %s', (project_id,))
        project_row = cur.fetchone()
        print(f"Проект найден: {project_row}")
        
        if not project_row:
            raise HTTPException(status_code=404, detail="Проект не найден")
        
        # Валидируем данные
        title = material.get('title', 'Ссылка')
        url = material.get('url', '')
        link_type = material.get('type', 'link')
        description = material.get('description', '')
        
        print(f"Обработанные данные:")
        print(f"  - Title: {title}")
        print(f"  - URL: {url}")
        print(f"  - Type: {link_type}")
        print(f"  - Description: {description}")
        
        # Проверяем обязательные поля
        if not url:
            raise HTTPException(status_code=400, detail="URL обязателен")
        
        # Форматируем URL если нужно
        if url and not (url.startswith('http://') or url.startswith('https://')):
            url = 'https://' + url
            print(f"URL отформатирован: {url}")
        
        # Добавляем ссылку
        query = '''
        INSERT INTO "Ссылки проекта" (
            "Код проекта",
            "Название",
            "URL",
            "Тип",
            "Описание"
        )
        VALUES (%s, %s, %s, %s, %s)
        RETURNING "Код ссылки"
        '''
        
        print(f"Выполняем SQL запрос...")
        
        cur.execute(query, (
            project_id,
            title,
            url,
            link_type,
            description
        ))
        
        material_id = cur.fetchone()[0]
        conn.commit()
        
        print(f"Материал добавлен успешно! ID: {material_id}")
        
        return {
            "message": "Материал добавлен",
            "material_id": material_id,
            "title": title,
            "url": url
        }
        
    except Exception as e:
        conn.rollback()
        print(f"ОШИБКА при добавлении материала: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка добавления материала: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.post("/api/projects/{project_id}/employees")
async def add_project_employee(
    project_id: int,
    data: dict
):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        print(f"Добавление сотрудника к проекту {project_id}")
        print(f"Полученные данные: {data}")
        
        # Проверяем существование проекта
        cur.execute('SELECT "Код проекта" FROM "Проекты" WHERE "Код проекта" = %s', (project_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Проект не найден")
        
        # Проверяем существование сотрудника
        employee_id = data.get('employee_id')
        if not employee_id:
            raise HTTPException(status_code=400, detail="employee_id обязателен")
        
        # Преобразуем employee_id в int
        try:
            employee_id = int(employee_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="employee_id должен быть числом")
        
        cur.execute('SELECT "Код сотрудника" FROM "Сотрудники" WHERE "Код сотрудника" = %s', (employee_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Проверяем, не добавлен ли уже сотрудник к проекту
        cur.execute('''
            SELECT "Код участника" FROM "Участники проекта" 
            WHERE "Код проекта" = %s AND "Код сотрудника" = %s
        ''', (project_id, employee_id))
        
        if cur.fetchone():
            return {
                "message": "Сотрудник уже добавлен к проекту",
                "already_exists": True
            }
        
        # Добавляем участника проекта (без ON CONFLICT, так как нет уникального ограничения)
        query = '''
        INSERT INTO "Участники проекта" (
            "Код проекта",
            "Код сотрудника",
            "Роль в проекте",
            "Дата присоединения"
        )
        VALUES (%s, %s, %s, CURRENT_DATE)
        RETURNING "Код участника"
        '''
        
        role = data.get('role', 'Участник проекта')
        print(f"Добавляем сотрудника {employee_id} к проекту {project_id} с ролью '{role}'")
        
        cur.execute(query, (
            project_id,
            employee_id,
            role
        ))
        
        member_id = cur.fetchone()[0]
        conn.commit()
        
        print(f"Сотрудник успешно добавлен. ID участника: {member_id}")
        
        return {
            "message": "Сотрудник добавлен к проекту",
            "member_id": member_id,
            "already_exists": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Ошибка добавления сотрудника к проекту {project_id}: {str(e)}")
        print(f"Данные: {data}")
        print(f"Детали: {error_details}")
        raise HTTPException(status_code=500, detail=f"Ошибка добавления сотрудника: {str(e)}")
    finally:
        cur.close()
        conn.close()

# ──────────────────────── Вспомогательные эндпоинты ────────────────────────
@app.get("/api/employees/all", response_model=List[Employee])
async def get_all_employees_endpoint():
    return get_all_employees()

@app.get("/api/tasks/templates")
async def get_task_templates():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        query = '''
        SELECT DISTINCT
            "Название задачи",
            "Описание",
            "Приоритет",
            "Затраченное время"
        FROM "Задачи"
        WHERE "Код проекта" IS NULL
        ORDER BY "Название задачи"
        LIMIT 20
        '''
        
        cur.execute(query)
        rows = cur.fetchall()
        
        templates = []
        for row in rows:
            templates.append({
                "task_name": decode_value(row[0]),
                "description": decode_value(row[1]) if row[1] else None,
                "priority": decode_value(row[2]) if row[2] else 'Средний',
                "time_spent": row[3] or 0
            })
        
        return templates
    except Exception as e:
        print(f"Ошибка при загрузке шаблонов задач: {e}")
        return []
    finally:
        cur.close()
        conn.close()

# Добавьте эту модель в бэкенд
class CreateProjectStageRequest(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 1
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = 'active'

# Добавьте этот эндпоинт в бэкенд
@app.post("/api/projects/{project_id}/stages", status_code=201)
async def create_project_stage(
    project_id: int,
    stage_data: CreateProjectStageRequest
):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Проверяем существование проекта
        cur.execute('SELECT "Код проекта" FROM "Проекты" WHERE "Код проекта" = %s', (project_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Проект не найден")
        
        # Создаем этап
        query = '''
        INSERT INTO "Этапы проекта" (
            "Код проекта",
            "Название этапа",
            "Описание",
            "Порядковый номер",
            "Дата начала",
            "Дата окончания",
            "Статус"
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING "Код этапа"
        '''
        
        cur.execute(query, (
            project_id,
            stage_data.title,
            stage_data.description,
            stage_data.order,
            stage_data.start_date,
            stage_data.end_date,
            stage_data.status
        ))
        
        stage_id = cur.fetchone()[0]
        conn.commit()
        
        return {
            "message": "Этап проекта создан",
            "stage_id": stage_id
        }
        
    except Exception as e:
        conn.rollback()
        print(f"Ошибка при создании этапа проекта: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания этапа: {str(e)}")
    finally:
        cur.close()
        conn.close()
    

# Модели
class ProjectDetail(BaseModel):
    project_id: int
    project_name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    manager_name: Optional[str] = None
    created_date: Optional[date] = None
    budget: Optional[float] = 0.00
    contact_info: Optional[Dict] = None

class ProjectFile(BaseModel):
    file_id: int
    filename: str
    file_path: str
    file_type: Optional[str] = None
    size: int
    upload_date: Optional[date] = None

class ProjectLink(BaseModel):
    link_id: int
    title: str
    url: str
    link_type: str
    description: Optional[str] = None

class ProjectEmployee(BaseModel):
    employee_id: int
    full_name: str
    position: Optional[str] = None
    role: str
    join_date: Optional[date] = None

# Эндпоинт для получения деталей проекта
@app.get("/api/projects/{project_id}", response_model=ProjectDetail)
async def get_project_details(project_id: int):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT 
            p."Код проекта", 
            p."Название проекта", 
            p."Описание",
            p."Дата начала", 
            p."Дата окончания", 
            p."Статус",
            p."Бюджет",
            p."Контактная информация",
            COALESCE(c."ФИО", c."Компания", 'Не указан') as client_name,
            c."Email" as client_email, 
            c."Телефон" as client_phone,
            COALESCE(e."ФИО", 'Не назначен') as manager_name,
            p."Дата создания"
        FROM "Проекты" p
        LEFT JOIN "Клиенты" c ON p."Код клиента" = c."Код клиента"
        LEFT JOIN "Сотрудники" e ON p."Менеджер проекта" = e."Код сотрудника"
        WHERE p."Код проекта" = %s
        '''
        
        cur.execute(query, (project_id,))
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Проект не найден")
        
        # Парсим JSON контактной информации
        contact_info = None
        if row[8]:
            try:
                contact_info = json.loads(row[8])
            except:
                contact_info = {"raw": row[8]}
        
        project = ProjectDetail(
            project_id=row[0],
            project_name=row[1],
            description=row[2],
            start_date=convert_to_date(row[3]),
            end_date=convert_to_date(row[4]),
            status=row[5],
            budget=row[6],
            contact_info=contact_info,
            client_name=row[9],
            client_email=row[10],
            client_phone=row[11],
            manager_name=row[12],
            created_date=convert_to_date(row[13])
        )
        
        return project
        
    except Exception as e:
        print(f"Ошибка при загрузке проекта: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки проекта: {str(e)}")
    finally:
        cur.close()
        conn.close()

# Эндпоинт для получения файлов проекта
@app.get("/api/projects/{project_id}/files", response_model=List[ProjectFile])
async def get_project_files(project_id: int):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT 
            f."Код файла",
            f."Название файла",
            f."Путь к файлу",
            f."Тип файла",
            f."Размер",
            f."Дата загрузки"
        FROM "Файлы" f
        INNER JOIN "Файлы проекта" fp ON f."Код файла" = fp."Код файла"
        WHERE fp."Код проекта" = %s
        ORDER BY f."Дата загрузки" DESC
        '''
        
        cur.execute(query, (project_id,))
        rows = cur.fetchall()
        
        files = []
        for row in rows:
            files.append(ProjectFile(
                file_id=row[0],
                filename=decode_value(row[1]),
                file_path=row[2],
                file_type=row[3],
                size=row[4],
                upload_date=convert_to_date(row[5])
            ))
        
        return files
        
    except Exception as e:
        print(f"Ошибка при загрузке файлов проекта: {str(e)}")
        return []
    finally:
        cur.close()
        conn.close()

# Эндпоинт для получения ссылок проекта
@app.get("/api/projects/{project_id}/links", response_model=List[ProjectLink])
async def get_project_links(project_id: int):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT 
            "Код ссылки",
            "Название",
            "URL",
            "Тип",
            "Описание"
        FROM "Ссылки проекта"
        WHERE "Код проекта" = %s
        ORDER BY "Код ссылки"
        '''
        
        cur.execute(query, (project_id,))
        rows = cur.fetchall()
        
        links = []
        for row in rows:
            links.append(ProjectLink(
                link_id=row[0],
                title=decode_value(row[1]),
                url=row[2],
                link_type=row[3],
                description=decode_value(row[4]) if row[4] else None
            ))
        
        return links
        
    except Exception as e:
        print(f"Ошибка при загрузке ссылок проекта: {str(e)}")
        return []
    finally:
        cur.close()
        conn.close()

# Эндпоинт для получения сотрудников проекта
@app.get("/api/projects/{project_id}/employees", response_model=List[ProjectEmployee])
async def get_project_employees(project_id: int):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT 
            e."Код сотрудника",
            e."ФИО",
            p."Наименование должности",
            up."Роль в проекте",
            up."Дата присоединения"
        FROM "Участники проекта" up
        INNER JOIN "Сотрудники" e ON up."Код сотрудника" = e."Код сотрудника"
        LEFT JOIN "Должности" p ON e."Код должности" = p."Код должности"
        WHERE up."Код проекта" = %s
        ORDER BY e."ФИО"
        '''
        
        cur.execute(query, (project_id,))
        rows = cur.fetchall()
        
        employees = []
        for row in rows:
            employees.append(ProjectEmployee(
                employee_id=row[0],
                full_name=decode_value(row[1]),
                position=decode_value(row[2]) if row[2] else None,
                role=decode_value(row[3]),
                join_date=convert_to_date(row[4])
            ))
        
        return employees
        
    except Exception as e:
        print(f"Ошибка при загрузке сотрудников проекта: {str(e)}")
        return []
    finally:
        cur.close()
        conn.close()

# Эндпоинт для обновления статуса проекта
class UpdateProjectStatusRequest(BaseModel):
    status: str

@app.put("/api/projects/{project_id}/status")
async def update_project_status(project_id: int, data: UpdateProjectStatusRequest):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Проверяем существование проекта
        cur.execute('SELECT "Код проекта" FROM "Проекты" WHERE "Код проекта" = %s', (project_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Проект не найден")
        
        # Обновляем статус
        query = '''
        UPDATE "Проекты"
        SET "Статус" = %s
        WHERE "Код проекта" = %s
        RETURNING "Код проекта"
        '''
        
        cur.execute(query, (data.status, project_id))
        conn.commit()
        
        return {"message": "Статус проекта обновлен", "project_id": project_id, "status": data.status}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка обновления статуса: {str(e)}")
    finally:
        cur.close()
        conn.close()

# В Pydantic моделях добавьте:
class ProjectStage(BaseModel):
    stage_id: int
    stage_name: str
    description: Optional[str] = None
    order: int
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str

# Добавьте в эндпоинты:
@app.get("/api/projects/{project_id}/stages", response_model=List[ProjectStage])
async def get_project_stages(project_id: int):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT 
            "Код этапа",
            "Название этапа",
            "Описание",
            "Порядковый номер",
            "Дата начала",
            "Дата окончания",
            "Статус"
        FROM "Этапы проекта"
        WHERE "Код проекта" = %s
        ORDER BY "Порядковый номер"
        '''
        
        cur.execute(query, (project_id,))
        rows = cur.fetchall()
        
        stages = []
        for row in rows:
            stages.append(ProjectStage(
                stage_id=row[0],
                stage_name=decode_value(row[1]),
                description=decode_value(row[2]) if row[2] else None,
                order=row[3],
                start_date=convert_to_date(row[4]),
                end_date=convert_to_date(row[5]),
                status=decode_value(row[6]) if row[6] else 'active'
            ))
        
        return stages
    except Exception as e:
        print(f"Ошибка при загрузке этапов проекта: {str(e)}")
        return []
    finally:
        cur.close()
        conn.close()
@app.get("/api/projects/{project_id}/tasks", response_model=List[TaskDetail])
async def get_project_tasks(project_id: int):
    """Получить все задачи конкретного проекта"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        query = '''
        SELECT 
            t."Код задачи",
            t."Название задачи",
            t."Описание",
            t."Код проекта",
            p."Название проекта",
            t."Дата начала",
            t."Дата окончания",
            t."Статус",
            t."Исполнитель",
            e."ФИО" as executor_name
        FROM "Задачи" t
        LEFT JOIN "Проекты" p ON t."Код проекта" = p."Код проекта"
        LEFT JOIN "Сотрудники" e ON t."Исполнитель" = e."Код сотрудника"
        WHERE t."Код проекта" = %s
        ORDER BY t."Дата создания" DESC
        '''
        
        cur.execute(query, (project_id,))
        rows = cur.fetchall()
        
        tasks = []
        for row in rows:
            tasks.append(TaskDetail(
                task_id=row[0],
                task_name=decode_value(row[1]) if row[1] else 'Без названия',
                description=decode_value(row[2]) if row[2] else None,
                project_id=row[3],
                project_name=decode_value(row[4]) if row[4] else None,
                start_date=convert_to_date(row[5]),
                end_date=convert_to_date(row[6]),
                status=decode_value(row[7]) if row[7] else 'active',
                executor_id=row[8],
                executor_name=decode_value(row[9]) if row[9] else None
            ))
        return tasks
    except Exception as e:
        print(f"Ошибка при загрузке задач проекта: {e}")
        return []
    finally:
        cur.close()
        conn.close()


@app.get("/api/projects/stages/templates")
async def get_project_stage_templates():
    return [
        {"title": "Начало проекта", "description": "Инициализация проекта"},
        {"title": "Планирование", "description": "Составление плана работ"},
        {"title": "Дизайн", "description": "Разработка дизайн-концепции"},
        {"title": "Разработка", "description": "Разработка и кодирование"},
        {"title": "Тестирование", "description": "Тестирование продукта"},
        {"title": "Внедрение", "description": "Развертывание проекта"},
        {"title": "Завершение", "description": "Финальные работы и документация"}
    ]

# Домашняя страница
@app.get("/")
async def home():
    return {"message": "API сотрудников и проектов работает! CORS настроен."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)