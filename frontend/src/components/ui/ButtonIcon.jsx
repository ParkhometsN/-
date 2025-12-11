function NavButton({textbutton,onClick,url,exitstyle}) {
    return(
        <>
        <button
        className={`NavButton qoperignri ${exitstyle}`}
        onClick={onClick}
        >
        {url}
        <p>{textbutton}</p>

        </button>
        </>
    )
}

export default NavButton;