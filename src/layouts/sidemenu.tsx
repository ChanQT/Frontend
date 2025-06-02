import logo from '../assets/NEWlogo.png';
import { Link } from 'react-router-dom';

function Sidemenu() {
    return (
        <>
            <aside className="app-sidebar" id="sidebar">
                <div className="main-sidebar-header">
                    <a href="/" className="holder-logo"></a>
                </div>
                <div className="main-sidebar" id="sidebar-scroll">
                    <nav className="main-menu-container nav nav-pills flex-col sub-open">
                        <div className="slide-left" id="slide-left"></div>
                        <ul className="main-menu">
                            <li>
                                <a href="">
                                    <center>
                                        <img src={logo} className="transparent-shadow" style={{ maxHeight: '150px' }} />
                                    </center>
                                </a>
                            </li>
                            <li>
                                <hr className="mt-1" />
                            </li>

                            {/* Dashboard Menu Item */}
                            <li className="slide">
                                <Link to="/dashboard" className="side-menu__item">
                                    <i className="w-6 h-4 side-menu__icon bi bi-grid-1x2-fill" style={{ color: "black" }}></i>
                                    <span className="side-menu__label" style={{ color: "black" }}>
                                        Dashboard
                                    </span>
                                </Link>
                            </li>

                            {/* Manage Rooms Menu Item */}
                            <li className="slide">
                                <Link to="/rooms information" className="side-menu__item">
                                    <i className="w-6 h-4 side-menu__icon bi bi-house-gear-fill" style={{ color: "black" }}></i>
                                    <span className="side-menu__label" style={{ color: "black" }}>
                                        Manage Rooms
                                    </span>
                                </Link>
                            </li>

                            {/* Manage Tenants Menu Item */}
                            <li className="slide">
                                <Link to="/tenants information" className="side-menu__item">
                                    <i className="w-6 h-4 side-menu__icon bi bi-people-fill" style={{ color: "black" }}></i>
                                    <span className="side-menu__label" style={{ color: "black" }}>
                                        Manage Tenants
                                    </span>
                                </Link>
                            </li>

                           

                            {/* Payments History Menu Item */}
                            <li className="slide">
                                <Link to="/history information" className="side-menu__item">
                                    <i className="w-6 h-4 side-menu__icon bi bi-clock-history" style={{ color: "black" }}></i>
                                    <span className="side-menu__label" style={{ color: "black" }}>
                                        Payments History
                                    </span>
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>
        </>
    );
}

export default Sidemenu;