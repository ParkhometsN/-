// CheckboxAddProject.jsx
export default function CheckboxAddProject({ checked, onChange }) {
    return (
        <div className="check">
            <label>
                <input
                    type="checkbox"
                    className="input"
                    checked={checked || false}
                    onChange={(e) => onChange && onChange(e.target.checked)}
                />
                <span className="custom-checkbox"></span>
            </label>
        </div>
    );
}