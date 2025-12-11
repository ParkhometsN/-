// ui/navButton.jsx
function NavButtonWithoutIcon({ textbutton, onClick, className, isActive }) {
    return (
        <button
            className={`${className} ${isActive ? 'activestate_navigaton' : ''}`}
            onClick={onClick}
        >
            {textbutton}
        </button>
    );
}

export default NavButtonWithoutIcon;