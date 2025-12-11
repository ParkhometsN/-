// Choosestuffadporject.jsx
import CheckboxAddProject from "./chekbox_add_project";

export default function Choosestuffadporject({
    NameStuffAddProject,
    PositionStuffAddProject,
    checked = false,       // выбран ли сотрудник
    onToggle = () => {}    // функция переключения
}) {
    const handleCardClick = () => {
        onToggle(!checked); // клик по карточке тоже переключает чекбокс
    };

    return (
        <div
            className={`bacground_ofstf background_shadowdd ${checked ? "selected_stuff_card" : ""}`}
            onClick={handleCardClick}
            style={{ cursor: "pointer" }}
        >
            <div className="infstuff">
                <div className="inftitleddddd">
                    <p className="titlechjtf">{NameStuffAddProject}</p>
                    <p className="titlechjtfffff">{PositionStuffAddProject}</p>
                </div>

                {/* Чекбокс — клик по нему НЕ вызывает клик по карточке */}
                <div onClick={(e) => e.stopPropagation()}>
                    <CheckboxAddProject
                        checked={checked}
                        onChange={(isChecked) => onToggle(isChecked)}
                    />
                </div>
            </div>
        </div>
    );
}